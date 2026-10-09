import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import Game from './Game.tsx'
import { generateLevel } from './generate.ts'
import { saveProgress } from './progress.ts'

describe('Where’s My Light', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts a fresh level with every head in the tray', () => {
    render(<Game />)
    const level = generateLevel(1, 1)

    expect(
      screen.getByRole('heading', { name: "Where's My Light?" }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restart level' })).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: /Drag it onto the maze/ }),
    ).toHaveLength(level.headCount)
    expect(screen.queryByText('Coming soon.')).not.toBeInTheDocument()
  })

  it('remembers progress and moves between unlocked levels', async () => {
    saveProgress({ current: 2, highest: 4 })
    const user = userEvent.setup()
    render(<Game />)

    expect(screen.getByText('Level 2')).toBeInTheDocument()
    expect(screen.getByText('Best 4')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next level' }))
    expect(screen.getByText('Level 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous level' }))
    expect(screen.getByText('Level 2')).toBeInTheDocument()
    expect(screen.getByText('Best 4')).toBeInTheDocument()
  })
})
