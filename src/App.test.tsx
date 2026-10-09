import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '@/App.tsx'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('platform shell', () => {
  it('lists both games and opens each coming-soon page', async () => {
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
    expect(screen.getByText('Coming soon.')).toBeInTheDocument()
    expect(document.title).toBe('Play StaySEAN · EB Fun Platform')
    expect(document.querySelector('.reverse-akinator-accent')).toHaveTextContent('SEAN')

    await user.click(screen.getByRole('link', { name: 'Back to lobby' }))
    await user.click(screen.getByRole('link', { name: /Where's My Light\?/ }))

    expect(
      await screen.findByRole('heading', { name: "Where's My Light?" }),
    ).toBeInTheDocument()
    expect(screen.getByText('Coming soon.')).toBeInTheDocument()
  })

  it('explains when a game slug is not registered', () => {
    renderAt('/games/missing-game')

    expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument()
    expect(screen.getByText(/missing-game/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to lobby' })).toBeInTheDocument()
  })
})
