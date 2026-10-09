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
