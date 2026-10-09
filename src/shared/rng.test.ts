import { describe, expect, it } from 'vitest'
import { createRng, randomInt } from '@/shared/rng.ts'

describe('createRng', () => {
  it('repeats the same sequence for the same seed', () => {
    const first = createRng(42)
    const second = createRng(42)
    const sequence = [first(), first(), first()]

    expect([second(), second(), second()]).toEqual(sequence)
    expect(sequence.every((value) => value >= 0 && value < 1)).toBe(true)
  })

  it('diverges when the seed changes', () => {
    expect(createRng(1)()).not.toBe(createRng(2)())
  })

  it('keeps a stable sequence for seed 1', () => {
    const rng = createRng(1)

    expect(rng()).toBeCloseTo(0.627073940588161, 12)
    expect(rng()).toBeCloseTo(0.002735721180215, 12)
    expect(rng()).toBeCloseTo(0.527447039959952, 12)
  })
})

describe('randomInt', () => {
  it('returns integers inside the inclusive range', () => {
    const rng = createRng(7)

    for (let i = 0; i < 40; i += 1) {
      const value = randomInt(rng, 2, 5)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(2)
      expect(value).toBeLessThanOrEqual(5)
    }
  })

  it('repeats for the same seed', () => {
    const draw = () => {
      const rng = createRng(11)
      return [randomInt(rng, 1, 6), randomInt(rng, 1, 6), randomInt(rng, 1, 6)]
    }

    expect(draw()).toEqual(draw())
  })
})
