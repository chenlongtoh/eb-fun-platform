import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '@/App.tsx'
import { routerBasename } from '@/platform/basename.ts'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('platform shell', () => {
  it('lists both games and opens each one', async () => {
    const user = userEvent.setup()
    renderAt('/')

    expect(screen.getByRole('link', { name: 'EB Fun Platform' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pick a game' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Play StaySEAN/ })).toBeInTheDocument()
    expect(document.querySelector('.reverse-akinator-accent')).toHaveTextContent('SEAN')
    expect(document.title).toBe('EB Fun Platform')
    expect(screen.getByRole('link', { name: /Where's My Light\?/ })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Back to lobby' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Play StaySEAN/ }))

    expect(
      await screen.findByRole('heading', { name: 'Play StaySEAN' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Summon the Genie/ })).toBeInTheDocument()
    expect(screen.queryByText('Coming soon.')).not.toBeInTheDocument()
    expect(document.title).toBe('Play StaySEAN · EB Fun Platform')
    expect(document.querySelector('.reverse-akinator-accent')).toHaveTextContent('SEAN')

    await user.click(screen.getByRole('link', { name: 'Back to lobby' }))
    await user.click(screen.getByRole('link', { name: /Where's My Light\?/ }))

    expect(
      await screen.findByRole('heading', { name: "Where's My Light?" }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restart level' })).toBeInTheDocument()
    expect(screen.queryByText('Coming soon.')).not.toBeInTheDocument()
  })

  it('uses the Vite base as the router basename', async () => {
    expect(routerBasename('/')).toBeUndefined()
    expect(routerBasename('')).toBeUndefined()
    expect(routerBasename('/eb-fun-platform/')).toBe('/eb-fun-platform')
    expect(routerBasename('/eb-fun-platform')).toBe('/eb-fun-platform')

    const basename = routerBasename('/eb-fun-platform/')
    const { unmount } = render(
      <MemoryRouter basename={basename} initialEntries={[`${basename}/`]}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Pick a game' })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Back to lobby' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Where's My Light\?/ })).toHaveAttribute(
      'href',
      '/eb-fun-platform/games/wheres-my-light',
    )

    unmount()
    render(
      <MemoryRouter
        basename={basename}
        initialEntries={[`${basename}/games/reverse-akinator`]}
      >
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Play StaySEAN' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to lobby' })).toHaveAttribute(
      'href',
      '/eb-fun-platform',
    )
  })

  it('explains when a game slug is not registered', () => {
    renderAt('/games/missing-game')

    expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument()
    expect(screen.getByText(/missing-game/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to lobby' })).toBeInTheDocument()
  })
})
