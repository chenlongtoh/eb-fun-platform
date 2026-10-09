import { describe, expect, it } from 'vitest'
import { traceBeam } from './beam.ts'
import { normalize, reflect, sub } from './geometry.ts'
import type { Circle, Vec, Wall } from './types.ts'

const east: Vec = { x: 1, y: 0 }

function directionBetween(from: Vec, to: Vec): Vec {
  const step = normalize(sub(to, from))
  if (!step) throw new Error('zero direction')
  return step
}

describe('traceBeam', () => {
  it('travels in a straight line until the segment cap', () => {
    const traced = traceBeam(
      { x: 0, y: 0 },
      east,
      [],
      [],
      { x: 20, y: 20, r: 0.2 },
      {
        maxSegmentLength: 3,
      },
    )

    expect(traced.hitCat).toBe(false)
    expect(traced.end).toBe('length')
    expect(traced.bounces).toBe(0)
    expect(traced.points).toHaveLength(2)
    expect(traced.points[1]).toEqual({ x: 3, y: 0 })
  })

  it('hits a cat sitting on the ray', () => {
    const cat: Circle = { x: 5, y: 0, r: 0.5 }
    const traced = traceBeam({ x: 0, y: 0 }, east, [], [], cat)

    expect(traced.hitCat).toBe(true)
    expect(traced.end).toBe('cat')
    expect(traced.points[1]?.x).toBeCloseTo(4.5, 6)
    expect(traced.points[1]?.y).toBeCloseTo(0, 6)
  })

  it('stops at a wall and does not reach a cat or head behind it', () => {
    const wall: Wall = { x1: 2, y1: -1, x2: 2, y2: 1 }
    const head: Circle = { x: 4, y: 0, r: 0.4 }
    const cat: Circle = { x: 6, y: 0, r: 0.4 }
    const traced = traceBeam({ x: 0, y: 0 }, east, [wall], [head], cat)

    expect(traced.hitCat).toBe(false)
    expect(traced.end).toBe('wall')
    expect(traced.bounces).toBe(0)
    expect(traced.points).toHaveLength(2)
    expect(traced.points[1]).toEqual({ x: 2, y: 0 })
  })

  it('reverses when the ray hits the center of a circle', () => {
    const traced = traceBeam(
      { x: -2, y: 0 },
      east,
      [],
      [{ x: 0, y: 0, r: 1 }],
      {
        x: 0,
        y: 8,
        r: 0.2,
      },
      { maxSegmentLength: 4 },
    )

    expect(traced.bounces).toBe(1)
    expect(traced.points[1]?.x).toBeCloseTo(-1, 6)
    expect(traced.points[1]?.y).toBeCloseTo(0, 6)
    const outgoing = directionBetween(traced.points[1]!, traced.points[2]!)
    expect(outgoing.x).toBeCloseTo(-1, 5)
    expect(outgoing.y).toBeCloseTo(0, 5)
  })

  it('reflects an off-center hit about the surface normal', () => {
    const head: Circle = { x: 0, y: 0, r: 1 }
    const incoming: Vec = { x: 1, y: 0 }
    const traced = traceBeam(
      { x: -2, y: 0.5 },
      incoming,
      [],
      [head],
      { x: 0, y: 8, r: 0.1 },
      {
        maxSegmentLength: 4,
      },
    )

    const hit = traced.points[1]
    expect(hit?.x).toBeCloseTo(-Math.sqrt(3) / 2, 5)
    expect(hit?.y).toBeCloseTo(0.5, 5)

    const normal = normalize(sub(hit!, head))
    expect(normal).not.toBeNull()
    const expected = reflect(incoming, normal!)
    const outgoing = directionBetween(hit!, traced.points[2]!)
    expect(outgoing.x).toBeCloseTo(expected.x, 5)
    expect(outgoing.y).toBeCloseTo(expected.y, 5)
    expect(outgoing.x).toBeCloseTo(-0.5, 5)
    expect(outgoing.y).toBeCloseTo(Math.sqrt(3) / 2, 5)
    expect(
      Math.hypot(outgoing.x - incoming.x, outgoing.y - incoming.y),
    ).toBeGreaterThan(0.5)
  })

  it('stops after the bounce cap instead of reflecting forever', () => {
    const heads: Circle[] = [
      { x: 3, y: 0, r: 1 },
      { x: -3, y: 0, r: 1 },
    ]
    const traced = traceBeam(
      { x: 0, y: 0 },
      east,
      [],
      heads,
      { x: 0, y: 6, r: 0.2 },
      {
        maxBounces: 2,
        maxSegmentLength: 20,
      },
    )

    expect(traced.hitCat).toBe(false)
    expect(traced.end).toBe('bounce-cap')
    expect(traced.bounces).toBe(2)
    expect(traced.points).toHaveLength(4)
    expect(traced.points[1]?.x).toBeCloseTo(2, 5)
    expect(traced.points[2]?.x).toBeCloseTo(-2, 5)
    expect(traced.points[3]?.x).toBeCloseTo(2, 5)
  })
})
