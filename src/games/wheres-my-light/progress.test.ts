import { beforeEach, describe, expect, it } from 'vitest'
import { loadProgress, saveProgress } from './progress.ts'

describe('progress', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts at level 1', () => {
    expect(loadProgress()).toEqual({ current: 1, highest: 1 })
  })

  it('round-trips the current and highest level', () => {
    saveProgress({ current: 3, highest: 5 })
    expect(loadProgress()).toEqual({ current: 3, highest: 5 })
    expect(localStorage.getItem('eb-fun:wheres-my-light:progress')).toContain(
      '"current":3',
    )
  })

  it('ignores corrupt saves and keeps the highest at least the current level', () => {
    localStorage.setItem('eb-fun:wheres-my-light:progress', '{')
    expect(loadProgress()).toEqual({ current: 1, highest: 1 })

    saveProgress({ current: 4, highest: 2 })
    expect(loadProgress()).toEqual({ current: 4, highest: 4 })
  })
})
