import { describe, expect, it } from 'vitest'
import { ATTRS, Game, SUBJECTS, isEatEgg, matchAttr, matchSubject } from './engine.ts'

describe('suggested questions', () => {
  it('solves every subject by always asking the best suggestion', () => {
    for (const subject of SUBJECTS) {
      const game = new Game({ secretId: subject.id, seed: 1 })
      let guard = 0
      while (game.candidates.length > 1 && guard < 80) {
        const next = game.suggest(1)[0]
        expect(next, subject.name).toBeDefined()
        game.ask(next!.key)
        guard++
      }
      expect(
        game.candidates.map((candidate) => candidate.name),
        subject.name,
      ).toEqual([subject.name])
    }
  })

  it('offers the same first suggestions for a seeded game', () => {
    const game = new Game({ secretId: 0, seed: 1 })
    expect(game.suggest(5).map((attr) => attr.key)).toEqual([
      'person',
      'big',
      'human',
      'fictional',
      'na',
    ])
  })
})

describe('negation and opposite wording', () => {
  it('flips explicit negation and opposite keywords, and ignores negation inside a phrase', () => {
    expect(matchAttr('is it alive')).toMatchObject({
      attr: { key: 'alive' },
      inverse: false,
    })
    expect(matchAttr('is it not alive')).toMatchObject({
      attr: { key: 'alive' },
      inverse: true,
    })
    expect(matchAttr("isn't it alive")).toMatchObject({
      attr: { key: 'alive' },
      inverse: true,
    })
    expect(matchAttr('is he dead')).toMatchObject({
      attr: { key: 'alive' },
      inverse: true,
    })
    expect(matchAttr('is it not dead')).toMatchObject({
      attr: { key: 'alive' },
      inverse: false,
    })
    expect(matchAttr('can it not fly')).toMatchObject({
      attr: { key: 'fly' },
      inverse: true,
    })
    expect(matchAttr('never alive')).toMatchObject({
      attr: { key: 'alive' },
      inverse: true,
    })
    expect(matchAttr('is it not real')).toMatchObject({
      attr: { key: 'fictional' },
      inverse: false,
    })
  })

  it('shows the inverted answer and still eliminates from the trait itself', () => {
    const game = new Game({ secretId: 0, seed: 1 })
    const dead = game.askText('is he dead')
    expect(dead).toMatchObject({
      type: 'q',
      attr: 'alive',
      inverse: true,
      answer: 'yes',
      label: 'Yes',
    })
    expect(game.questions).toBe(1)
    expect(game.candidates.every((candidate) => (candidate.v.alive ?? 0) <= 0.5)).toBe(
      true,
    )
  })
})

describe('eat easter egg', () => {
  it.each([
    'what should I eat',
    'where should I eat',
    "I'm hungry",
    'I am hungry',
    'makan apa',
    'apa nak makan',
  ])('triggers for %s', (text) => {
    expect(isEatEgg(text)).toBe(true)
  })

  it.each([
    'Can you eat it?',
    'Does it eat meat?',
    'is it edible',
    'is it something you eat',
    'what does it eat',
    'is it hungry',
    'should i eat pizza',
  ])('does not trigger for %s', (text) => {
    expect(isEatEgg(text)).toBe(false)
  })

  it('does not count the egg as a question', () => {
    const game = new Game({ secretId: 110, seed: 1 })
    expect(game.askText('what should I eat')).toEqual({
      type: 'eat',
      q: 'what should I eat',
    })
    expect(game.askText('Can you eat it?')).toMatchObject({
      type: 'q',
      attr: 'food',
      answer: 'no',
    })
    expect(game.questions).toBe(1)
    expect(game.history).toHaveLength(1)
  })
})

describe('guess matching', () => {
  it('matches names, aliases, articles, plurals, and small typos', () => {
    expect(matchSubject('Pikachu')).toMatchObject({
      subject: { name: 'Pikachu' },
      exact: true,
    })
    expect(matchSubject('pokemon')).toMatchObject({
      subject: { name: 'Pikachu' },
      exact: true,
    })
    expect(matchSubject('einstein')).toMatchObject({
      subject: { name: 'Albert Einstein' },
      exact: true,
    })
    expect(matchSubject('the moon')).toMatchObject({
      subject: { name: 'The Moon' },
      exact: true,
    })
    expect(matchSubject('moon')).toMatchObject({
      subject: { name: 'The Moon' },
      exact: true,
    })
    expect(matchSubject('kl')).toMatchObject({
      subject: { name: 'Kuala Lumpur' },
      exact: true,
    })
    expect(matchSubject('pikachuu')).toMatchObject({
      subject: { name: 'Pikachu' },
      exact: false,
    })
    expect(matchSubject('dogs')).toMatchObject({
      subject: { name: 'Dog' },
      exact: true,
    })
    expect(matchSubject('is it pikachu')).toMatchObject({
      subject: { name: 'Pikachu' },
      exact: true,
    })
    expect(matchSubject('i think its harry potter')).toMatchObject({
      subject: { name: 'Harry Potter' },
      exact: true,
    })
    expect(matchSubject('usa')).toMatchObject({
      subject: { name: 'United States' },
      exact: true,
    })
    expect(matchSubject('spiderman')).toMatchObject({
      subject: { name: 'Spider-Man' },
      exact: true,
    })
  })

  it('rejects unknown names and tiny typos of very short names', () => {
    expect(matchSubject('xyzzyplugh')).toBeNull()
    expect(matchSubject('pika')).toBeNull()
    expect(matchSubject('km')).toBeNull()
  })

  it('treats "is it <name>" as a guess and "is it <trait>" as a question', () => {
    const game = new Game({ secretId: 110, seed: 1 })
    expect(game.askText('is it pikachu')).toMatchObject({
      type: 'guessRedirect',
      subject: { name: 'Pikachu' },
    })
    expect(game.questions).toBe(0)
    expect(game.askText('is it an orange')).toMatchObject({
      type: 'guessRedirect',
      subject: { name: 'Orange' },
    })
    expect(game.askText('is it orange')).toMatchObject({
      type: 'q',
      attr: 'orange',
      q: 'Is it mainly orange?',
    })
    expect(game.questions).toBe(1)
  })

  it('counts a real guess and ignores an unknown one', () => {
    const game = new Game({ secretId: 110, seed: 1 })
    expect(game.guess('Charizard')).toMatchObject({ type: 'unknownGuess' })
    expect(game.guesses).toBe(0)
    const wrong = game.guess('Mario')
    expect(wrong).toMatchObject({
      type: 'g',
      answer: 'wrong',
      subject: { name: 'Mario' },
    })
    expect(game.guesses).toBe(1)
    expect(game.candidates.some((candidate) => candidate.name === 'Mario')).toBe(false)
    expect(game.guess('Pikachu')).toMatchObject({
      answer: 'correct',
      label: 'Correct!',
    })
    expect(game.won).toBe(true)
    expect(game.over).toBe(true)
    expect(game.guesses).toBe(2)
  })
})

describe('questions that do not count', () => {
  it('does not count a repeated trait', () => {
    const game = new Game({ secretId: 0, seed: 1 })
    game.ask('alive')
    const again = game.askText('is it alive')
    expect(again).toMatchObject({ repeat: true, attr: 'alive' })
    expect(game.questions).toBe(1)
    expect(game.history).toHaveLength(1)
  })

  it('records an unanswerable question without counting it', () => {
    const game = new Game({ secretId: 0, seed: 1 })
    const result = game.askText('what is the airspeed of an unladen swallow')
    expect(result).toMatchObject({ answer: 'cant', label: 'Cannot answer' })
    expect(game.questions).toBe(0)
    expect(game.history).toHaveLength(1)
    if (result.type === 'q') expect(result.related?.length).toBeGreaterThan(0)
  })
})

describe('saved games', () => {
  it('restores the secret, asked traits, and wrong guesses', () => {
    const game = new Game({ secretId: 110, seed: 4 })
    game.ask('yellow')
    game.guess('Mario')
    game.history[0]!.sound = 'Hor..'
    const restored = Game.fromJSON(game.toJSON())
    expect(restored.secret.name).toBe('Pikachu')
    expect(restored.questions).toBe(1)
    expect(restored.guesses).toBe(1)
    expect(restored.asked).toEqual(['yellow'])
    expect(restored.candidates.some((candidate) => candidate.name === 'Mario')).toBe(
      false,
    )
    expect(restored.history[0]?.sound).toBe('Hor..')
    expect(restored.candidates).toHaveLength(game.candidates.length)
  })
})

describe('database', () => {
  it('loads 270 subjects and 114 traits', () => {
    expect(SUBJECTS).toHaveLength(270)
    expect(ATTRS).toHaveLength(114)
    expect(new Set(SUBJECTS.map((subject) => subject.name)).size).toBe(270)
  })
})
