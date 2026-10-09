import type { Circle, Vec, Wall } from './types.ts'

export function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function sub(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scale(a: Vec, amount: number): Vec {
  return { x: a.x * amount, y: a.y * amount }
}

export function dot(a: Vec, b: Vec): number {
  return a.x * b.x + a.y * b.y
}

export function cross(a: Vec, b: Vec): number {
  return a.x * b.y - a.y * b.x
}

export function length(a: Vec): number {
  return Math.hypot(a.x, a.y)
}

export function normalize(a: Vec): Vec | null {
  const magnitude = length(a)
  if (magnitude < 1e-12) return null
  return { x: a.x / magnitude, y: a.y / magnitude }
}

/**
 * Reflect direction `d` about a unit normal `n`.
 * r = d - 2 (d · n) n
 */
export function reflect(direction: Vec, normal: Vec): Vec {
  const amount = 2 * dot(direction, normal)
  return {
    x: direction.x - amount * normal.x,
    y: direction.y - amount * normal.y,
  }
}

const HIT_EPSILON = 1e-6

/** Smallest t > 0 where the ray meets the segment, or null. */
export function raySegmentT(origin: Vec, direction: Vec, wall: Wall): number | null {
  const spanX = wall.x2 - wall.x1
  const spanY = wall.y2 - wall.y1
  const denom = cross(direction, { x: spanX, y: spanY })
  if (Math.abs(denom) < 1e-12) return null

  const offsetX = wall.x1 - origin.x
  const offsetY = wall.y1 - origin.y
  const t = (offsetX * spanY - offsetY * spanX) / denom
  const u = (offsetX * direction.y - offsetY * direction.x) / denom
  if (t > HIT_EPSILON && u >= -1e-8 && u <= 1 + 1e-8) return t
  return null
}

/** Smallest t > 0 where the ray meets the circle, or null. */
export function rayCircleT(origin: Vec, direction: Vec, circle: Circle): number | null {
  const offsetX = origin.x - circle.x
  const offsetY = origin.y - circle.y
  const a = dot(direction, direction)
  if (a < 1e-12) return null

  const b = 2 * (offsetX * direction.x + offsetY * direction.y)
  const c = offsetX * offsetX + offsetY * offsetY - circle.r * circle.r
  const discriminant = b * b - 4 * a * c
  if (discriminant < 0) return null

  const root = Math.sqrt(discriminant)
  const nearer = (-b - root) / (2 * a)
  const farther = (-b + root) / (2 * a)
  if (nearer > HIT_EPSILON) return nearer
  if (farther > HIT_EPSILON) return farther
  return null
}

export function distanceToSegment(point: Vec, wall: Wall): number {
  const spanX = wall.x2 - wall.x1
  const spanY = wall.y2 - wall.y1
  const spanLength = spanX * spanX + spanY * spanY
  if (spanLength < 1e-12) return Math.hypot(point.x - wall.x1, point.y - wall.y1)

  const raw = ((point.x - wall.x1) * spanX + (point.y - wall.y1) * spanY) / spanLength
  const t = Math.min(1, Math.max(0, raw))
  return Math.hypot(point.x - (wall.x1 + t * spanX), point.y - (wall.y1 + t * spanY))
}

export function circleHitsWall(
  circle: Circle,
  walls: readonly Wall[],
  gap = 0,
): boolean {
  return walls.some((wall) => distanceToSegment(circle, wall) < circle.r + gap)
}
