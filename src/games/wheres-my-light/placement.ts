import { circleHitsWall } from './geometry.ts'
import type { Level } from './types.ts'

const WALL_GAP = 0.012
const LIGHT_CLEARANCE = 0.18
const CAT_CLEARANCE = 0.04
const HEAD_CLEARANCE = 0.03

export function canPlaceHead(
  level: Level,
  heads: readonly { x: number; y: number }[],
  x: number,
  y: number,
  ignoreIndex = -1,
): boolean {
  if (x < 0 || y < 0 || x >= level.cols || y >= level.rows) return false

  const radius = level.headRadius
  if (circleHitsWall({ x, y, r: radius }, level.walls, WALL_GAP)) return false
  if (Math.hypot(x - level.light.x, y - level.light.y) < radius + LIGHT_CLEARANCE) {
    return false
  }
  if (
    Math.hypot(x - level.cat.x, y - level.cat.y) <
    radius + level.cat.r + CAT_CLEARANCE
  ) {
    return false
  }

  for (let index = 0; index < heads.length; index += 1) {
    if (index === ignoreIndex) continue
    const other = heads[index]
    if (!other) continue
    if (Math.hypot(x - other.x, y - other.y) < radius * 2 + HEAD_CLEARANCE) return false
  }

  return true
}

/** Exact point when it is legal, otherwise a nearby open point, or null. */
export function nearestPlace(
  level: Level,
  heads: readonly { x: number; y: number }[],
  x: number,
  y: number,
  ignoreIndex = -1,
): { x: number; y: number } | null {
  if (canPlaceHead(level, heads, x, y, ignoreIndex)) return { x, y }

  for (let radius = 0.06; radius <= 0.75; radius += 0.06) {
    const steps = 12
    for (let step = 0; step < steps; step += 1) {
      const angle = (step / steps) * Math.PI * 2
      const nextX = x + Math.cos(angle) * radius
      const nextY = y + Math.sin(angle) * radius
      if (canPlaceHead(level, heads, nextX, nextY, ignoreIndex)) {
        return { x: nextX, y: nextY }
      }
    }
  }

  return null
}
