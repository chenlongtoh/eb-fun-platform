import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import Game from './Game.tsx'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/games/reverse-akinator?secret=Pikachu')
})

describe('ask and guess controls', () => {
  it('submits a typed question with Enter and refocuses the field', async () => {
    const user = userEvent.setup()
    render(<Game />)

    const ask = screen.getByRole('textbox', { name: 'Ask a question' })
    await user.type(ask, 'Can it fly?{Enter}')

    expect(document.querySelector('form')).toBeNull()
    expect(ask).toHaveValue('')
    expect(ask).toHaveFocus()
    expect(screen.getByText('Can it fly?')).toBeInTheDocument()
    expect(screen.getAllByText('No').length).toBeGreaterThan(0)
    expect(screen.getByText('Question').parentElement).toHaveTextContent('Question 1')
  })

  it('submits a guess with Enter and can win the round', async () => {
    const user = userEvent.setup()
    render(<Game />)

    const guess = screen.getByRole('combobox', { name: 'Make a guess' })
    await user.type(guess, 'Pikachu{Enter}')

    expect(guess).toHaveValue('')
    expect(guess).toHaveFocus()
    expect(screen.getAllByText('Correct!').length).toBeGreaterThan(0)
    expect(
      await screen.findByRole('heading', { name: 'You found it!' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Solved with 0 questions and 1 guess/)).toBeInTheDocument()
  })

  it('submits from the Ask and Guess buttons', async () => {
    const user = userEvent.setup()
    render(<Game />)

    const ask = screen.getByRole('textbox', { name: 'Ask a question' })
    await user.type(ask, 'Is it yellow?')
    await user.click(screen.getByRole('button', { name: 'Ask' }))

    expect(ask).toHaveValue('')
    expect(ask).toHaveFocus()
    expect(screen.getByText('Is it mainly yellow?')).toBeInTheDocument()
    expect(screen.getAllByText('Yes').length).toBeGreaterThan(0)

    const guess = screen.getByRole('combobox', { name: 'Make a guess' })
    await user.type(guess, 'Mario')
    await user.click(screen.getByRole('button', { name: 'Guess' }))

    expect(guess).toHaveValue('')
    expect(guess).toHaveFocus()
    expect(screen.getAllByText('Wrong').length).toBeGreaterThan(0)
    expect(screen.getByText('Guesses').parentElement).toHaveTextContent('Guesses 1')
  })

  it('asks a suggested question from its button', async () => {
    const user = userEvent.setup()
    render(<Game />)

    const suggestion = document.querySelector('button.chip')
    expect(suggestion).toBeInstanceOf(HTMLButtonElement)
    const label = suggestion?.textContent ?? ''
    await user.click(suggestion as HTMLButtonElement)

    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getByText('Question').parentElement).toHaveTextContent('Question 1')
  })

  it('ignores Enter while an IME composition is open', async () => {
    const user = userEvent.setup()
    render(<Game />)
    const ask = screen.getByRole('textbox', { name: 'Ask a question' })
    await user.type(ask, 'Can it fly?')

    fireEvent.keyDown(ask, { key: 'Enter', isComposing: true })

    expect(ask).toHaveValue('Can it fly?')
    expect(screen.queryByText('Can it fly?')).not.toBeInTheDocument()
    expect(screen.getByText('Question').parentElement).toHaveTextContent('Question 0')

    fireEvent.keyDown(ask, { key: 'Enter', isComposing: false })

    expect(ask).toHaveValue('')
    expect(ask).toHaveFocus()
    expect(screen.getByText('Can it fly?')).toBeInTheDocument()
  })

  it('shows typed text as text, including characters that would be markup', async () => {
    const user = userEvent.setup()
    render(<Game />)
    const ask = screen.getByRole('textbox', { name: 'Ask a question' })
    const hostile = '<img src=x onerror=alert(1)>'
    await user.type(ask, `${hostile}{Enter}`)

    expect(screen.getByText(hostile)).toBeInTheDocument()
    expect(document.querySelector('img[src="x"]')).toBeNull()
    expect(screen.getByText('Question').parentElement).toHaveTextContent('Question 0')
  })
})
