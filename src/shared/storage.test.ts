import { beforeEach, describe, expect, it } from 'vitest'
import { createGameStorage } from '@/shared/storage.ts'

describe('createGameStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('keeps each game slug in its own key space', () => {
    const akinator = createGameStorage('reverse-akinator')
    const light = createGameStorage('wheres-my-light')

    akinator.set('progress', 'question-4')
    light.set('progress', 'room-2')

    expect(akinator.get('progress')).toBe('question-4')
    expect(light.get('progress')).toBe('room-2')
    expect(localStorage.getItem('eb-fun:reverse-akinator:progress')).toBe('question-4')
    expect(localStorage.getItem('eb-fun:wheres-my-light:progress')).toBe('room-2')
  })

  it('encodes keys so a slug boundary cannot collide', () => {
    const storage = createGameStorage('reverse-akinator')
    storage.set('level 1', 'done')

    expect(storage.get('level 1')).toBe('done')
    expect(localStorage.getItem('eb-fun:reverse-akinator:level%201')).toBe('done')
  })

  it('returns null for a missing key and removes only that key', () => {
    const storage = createGameStorage('wheres-my-light')
    expect(storage.get('missing')).toBeNull()

    storage.set('a', '1')
    storage.set('b', '2')
    storage.remove('a')

    expect(storage.get('a')).toBeNull()
    expect(storage.get('b')).toBe('2')
  })

  it('rejects an empty key or a slug that is not kebab-case', () => {
    expect(() => createGameStorage('Not A Slug')).toThrow(/kebab-case/)
    expect(() => createGameStorage('wheres-my-light').set('', 'x')).toThrow(/empty/)
  })
})
