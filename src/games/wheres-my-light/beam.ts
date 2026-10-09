import { add, normalize, rayCircleT, raySegmentT, reflect, scale } from './geometry.ts'
import type { Circle, TraceOptions, TraceResult, Vec, Wall } from './types.ts'

export const DEFAULT_MAX_BOUNCES = 12
export const DEFAULT_MAX_SEGMENT = 64
const SURFACE_OFFSET = 2e-4

/**
 * Cast a ray through continuous space.
 * Walls stop the beam. A head reflects it about the outward normal at the
 * exact hit point, so an off-center strike leaves at a different angle than
 * a dead-center one. The cat is a target circle.
 */
export function traceBeam(
  origin: Vec,
  direction: Vec,
  walls: readonly Wall[],
  heads: readonly Circle[],
  cat: Circle,
  options: TraceOptions = {},
): TraceResult {
  const maxBounces = options.maxBounces ?? DEFAULT_MAX_BOUNCES
  const maxSegment = options.maxSegmentLength ?? DEFAULT_MAX_SEGMENT
  const initial = normalize(direction)
  const points = [{ x: origin.x, y: origin.y }]

  if (!initial) {
    return { points, hitCat: false, bounces: 0, end: 'length' }
  }

  let position = { x: origin.x, y: origin.y }
  let dir = initial
  let bounces = 0
  let skipHead = -1

  for (let guard = 0; guard <= maxBounces; guard += 1) {
    let bestT = Number.POSITIVE_INFINITY
    let kind: 'wall' | 'head' | 'cat' | 'length' = 'length'
    let headIndex = -1
    let normal: Vec | null = null

    for (const wall of walls) {
      const t = raySegmentT(position, dir, wall)
      if (t !== null && t <= maxSegment && t < bestT) {
        bestT = t
        kind = 'wall'
        headIndex = -1
        normal = null
      }
    }

    heads.forEach((head, index) => {
      if (index === skipHead || head.r <= 0) return
      const t = rayCircleT(position, dir, head)
      if (t !== null && t <= maxSegment && t < bestT) {
        bestT = t
        kind = 'head'
        headIndex = index
        const hit = add(position, scale(dir, t))
        normal = normalize({ x: hit.x - head.x, y: hit.y - head.y })
      }
    })

    if (cat.r > 0) {
      const t = rayCircleT(position, dir, cat)
      if (t !== null && t <= maxSegment && t < bestT) {
        bestT = t
        kind = 'cat'
        headIndex = -1
        normal = null
      }
    }

    if (kind === 'length') {
      points.push(add(position, scale(dir, maxSegment)))
      return { points, hitCat: false, bounces, end: 'length' }
    }

    const hit = add(position, scale(dir, bestT))
    points.push(hit)

    if (kind === 'cat') return { points, hitCat: true, bounces, end: 'cat' }
    if (kind === 'wall') return { points, hitCat: false, bounces, end: 'wall' }
    if (!normal || bounces >= maxBounces) {
      return { points, hitCat: false, bounces, end: 'bounce-cap' }
    }

    const reflected = normalize(reflect(dir, normal))
    if (!reflected) {
      return { points, hitCat: false, bounces, end: 'bounce-cap' }
    }

    dir = reflected
    bounces += 1
    position = add(hit, scale(dir, SURFACE_OFFSET))
    skipHead = headIndex
  }

  return { points, hitCat: false, bounces, end: 'bounce-cap' }
}
