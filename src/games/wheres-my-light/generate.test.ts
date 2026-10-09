import { describe, expect, it } from 'vitest'
import {
  difficultyFor,
  generateLevel,
  solutionHitsCat,
  zeroHeadsHitCat,
} from './generate.ts'
import { canPlaceHead } from './placement.ts'

describe('generateLevel', () => {
  it('repeats a level for the same seed', () => {
    expect(generateLevel(5, 3)).toEqual(generateLevel(5, 3))
  })

  it('changes the maze when the seed changes', () => {
    const first = generateLevel(1, 4)
    const second = generateLevel(2, 4)
    expect(first.cat).not.toEqual(second.cat)
  })

  it('solves with the stored heads and not with zero heads', () => {
    const levels = [1, 2, 3, 5, 8]
    for (const level of levels) {
      for (let seed = 0; seed < 12; seed += 1) {
        const generated = generateLevel(seed, level)
        expect(solutionHitsCat(generated), `seed ${seed} level ${level}`).toBe(true)
        expect(zeroHeadsHitCat(generated), `seed ${seed} level ${level}`).toBe(false)
        expect(generated.solution.length).toBeGreaterThanOrEqual(1)
        expect(generated.headCount).toBeGreaterThanOrEqual(generated.solution.length)
        generated.solution.forEach((head, index) => {
          expect(
            canPlaceHead(generated, generated.solution, head.x, head.y, index),
          ).toBe(true)
        })
      }
    }
  })

  it('raises the maze size, wall count, and required bounces while spares fall', () => {
    const easy = generateLevel(3, 1)
    const mid = generateLevel(3, 3)
    const hard = generateLevel(3, 8)

    expect(difficultyFor(8).bounces).toBeGreaterThan(difficultyFor(1).bounces)
    expect(difficultyFor(1).spares).toBeGreaterThan(difficultyFor(8).spares)
    expect(hard.cols * hard.rows).toBeGreaterThan(easy.cols * easy.rows)
    expect(hard.walls.length).toBeGreaterThan(easy.walls.length)
    expect(hard.solution.length).toBeGreaterThan(easy.solution.length)
    expect(mid.solution.length).toBeGreaterThanOrEqual(easy.solution.length)
    expect(hard.headCount - hard.solution.length).toBeLessThan(
      easy.headCount - easy.solution.length,
    )
  })
})
