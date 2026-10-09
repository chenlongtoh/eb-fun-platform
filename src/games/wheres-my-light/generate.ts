import { createRng, randomInt } from '@/shared/rng.ts'
import { traceBeam } from './beam.ts'
import { normalize, sub } from './geometry.ts'
import {
  carveRemainder,
  cellKey,
  fullMaze,
  mazeToWalls,
  openBetween,
  passageKey,
  sealPassages,
  shuffle,
  type Cell,
} from './maze.ts'
import { canPlaceHead } from './placement.ts'
import type { Circle, Difficulty, Level, Vec } from './types.ts'

export const HEAD_RADIUS = 0.22
export const CAT_RADIUS = 0.34

const DIRS: readonly Vec[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
]

const PATTERNS: readonly [Vec, Vec][] = [
  [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ],
  [
    { x: 1, y: 0 },
    { x: 0, y: -1 },
  ],
  [
    { x: -1, y: 0 },
    { x: 0, y: 1 },
  ],
  [
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ],
  [
    { x: 0, y: 1 },
    { x: 1, y: 0 },
  ],
  [
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ],
  [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
  ],
  [
    { x: 0, y: -1 },
    { x: -1, y: 0 },
  ],
]

interface Route {
  cells: Cell[]
  corners: number[]
}

const cache = new Map<string, Level>()

export function difficultyFor(level: number): Difficulty {
  const n = Math.max(1, Math.floor(level))
  const cols = Math.min(4 + n, 13)
  const rows = cols
  const bounces = Math.min(1 + Math.floor((n - 1) / 2), 4)
  const spares = n <= 1 ? 2 : n <= 3 ? 1 : 0
  const sealChance = Math.min(0.12 * (n - 1), 0.72)
  return { cols, rows, bounces, spares, sealChance }
}

export function traceLevel(level: Level, heads: readonly Circle[]) {
  return traceBeam(
    { x: level.light.x, y: level.light.y },
    { x: level.light.dx, y: level.light.dy },
    level.walls,
    heads,
    level.cat,
  )
}

export function solutionHitsCat(level: Level): boolean {
  const traced = traceLevel(level, level.solution)
  return traced.hitCat && traced.bounces === level.solution.length
}

export function zeroHeadsHitCat(level: Level): boolean {
  return traceLevel(level, []).hitCat
}

/**
 * Build a reproducible maze whose stored head placements bounce the beam
 * onto the cat, and whose empty board does not.
 */
export function generateLevel(seed: number, level: number): Level {
  const key = `${seed >>> 0}:${Math.max(1, Math.floor(level))}`
  const cached = cache.get(key)
  if (cached) return cached

  const created = createLevel(seed >>> 0, Math.max(1, Math.floor(level)))
  cache.set(key, created)
  return created
}

function createLevel(seed: number, level: number): Level {
  const difficulty = difficultyFor(level)

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const rng = createRng(mixSeed(seed, level, attempt))
    for (let walk = 0; walk < 24; walk += 1) {
      const route = tryWalk(rng, difficulty.cols, difficulty.rows, difficulty.bounces)
      if (!route) continue
      const built = realize(rng, difficulty, route, seed, level)
      if (built) return built
    }
  }

  const rescued = rescueLevel(seed, level, difficulty)
  if (rescued) return rescued

  throw new Error(
    `Could not generate Where's My Light level ${level} from seed ${seed}`,
  )
}

function mixSeed(seed: number, level: number, attempt: number): number {
  let mixed =
    (Math.imul(seed, 0x9e3779b1) ^
      Math.imul(level, 0x85ebca6b) ^
      Math.imul(attempt + 1, 0xc2b2ae35)) >>>
    0
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x7feb352d)
  mixed = Math.imul(mixed ^ (mixed >>> 15), 0x846ca68b)
  return (mixed ^ (mixed >>> 16)) >>> 0
}

function tryWalk(
  rng: () => number,
  cols: number,
  rows: number,
  bounces: number,
): Route | null {
  const start = {
    x: randomInt(rng, 0, cols - 1),
    y: randomInt(rng, 0, rows - 1),
  }

  for (const direction of shuffle(rng, DIRS)) {
    const route = walkDirection(rng, cols, rows, bounces, start, direction)
    if (route) return route
  }
  return null
}

function walkDirection(
  rng: () => number,
  cols: number,
  rows: number,
  bounces: number,
  start: Cell,
  startDir: Vec,
): Route | null {
  const visited = new Set<string>([cellKey(start)])
  const cells = [start]
  const corners: number[] = []
  let position = start
  let direction = startDir

  for (let bounce = 0; bounce < bounces; bounce += 1) {
    const ahead = straightCells(position, direction, visited, cols, rows, 5)
    const options: { index: number; turns: Vec[] }[] = []

    for (let index = 0; index < ahead.length; index += 1) {
      const cell = ahead[index]
      if (!cell) continue
      const turns = sideSteps(cell, direction, visited, cols, rows)
      if (turns.length > 0) options.push({ index, turns })
    }

    if (options.length === 0) return null
    const pool = options.slice(Math.floor(options.length / 2))
    const choice = pool[randomInt(rng, 0, pool.length - 1)]
    if (!choice) return null

    for (let index = 0; index <= choice.index; index += 1) {
      const cell = ahead[index]
      if (!cell) return null
      cells.push(cell)
      visited.add(cellKey(cell))
    }

    corners.push(cells.length - 1)
    const corner = ahead[choice.index]
    const turn = choice.turns[randomInt(rng, 0, choice.turns.length - 1)]
    if (!corner || !turn) return null
    const next = { x: corner.x + turn.x, y: corner.y + turn.y }
    cells.push(next)
    visited.add(cellKey(next))
    position = next
    direction = turn
  }

  const tail = straightCells(position, direction, visited, cols, rows, 5)
  if (tail.length === 0) return null
  const last = randomInt(rng, 0, tail.length - 1)
  for (let index = 0; index <= last; index += 1) {
    const cell = tail[index]
    if (!cell) return null
    cells.push(cell)
    visited.add(cellKey(cell))
  }

  return { cells, corners }
}

function straightCells(
  position: Cell,
  direction: Vec,
  visited: ReadonlySet<string>,
  cols: number,
  rows: number,
  limit: number,
): Cell[] {
  const cells: Cell[] = []
  let cursor = position

  while (cells.length < limit) {
    const next = { x: cursor.x + direction.x, y: cursor.y + direction.y }
    if (next.x < 0 || next.y < 0 || next.x >= cols || next.y >= rows) break
    if (visited.has(cellKey(next))) break
    cells.push(next)
    cursor = next
  }

  return cells
}

function sideSteps(
  cell: Cell,
  direction: Vec,
  visited: ReadonlySet<string>,
  cols: number,
  rows: number,
): Vec[] {
  const turns = [
    { x: -direction.y, y: direction.x },
    { x: direction.y, y: -direction.x },
  ]
  return turns.filter((turn) => {
    const next = { x: cell.x + turn.x, y: cell.y + turn.y }
    return (
      next.x >= 0 &&
      next.y >= 0 &&
      next.x < cols &&
      next.y < rows &&
      !visited.has(cellKey(next))
    )
  })
}

function compactRoute(first: Vec, second: Vec, bounces: number): Route {
  const cells: Cell[] = [{ x: 0, y: 0 }]
  const corners: number[] = []
  let direction = first

  for (let bounce = 0; bounce < bounces; bounce += 1) {
    const previous = cells[cells.length - 1]
    if (!previous) break
    const corner = { x: previous.x + direction.x, y: previous.y + direction.y }
    cells.push(corner)
    corners.push(cells.length - 1)
    direction = bounce % 2 === 0 ? second : first
    cells.push({ x: corner.x + direction.x, y: corner.y + direction.y })
  }

  const last = cells[cells.length - 1]
  if (last) cells.push({ x: last.x + direction.x, y: last.y + direction.y })
  return { cells, corners }
}

function shiftRoute(
  route: Route,
  cols: number,
  rows: number,
  rng: () => number,
): Route | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const cell of route.cells) {
    minX = Math.min(minX, cell.x)
    minY = Math.min(minY, cell.y)
    maxX = Math.max(maxX, cell.x)
    maxY = Math.max(maxY, cell.y)
  }

  const spanX = maxX - minX
  const spanY = maxY - minY
  if (spanX >= cols || spanY >= rows) return null

  const offsetX = randomInt(rng, 0, cols - spanX - 1) - minX
  const offsetY = randomInt(rng, 0, rows - spanY - 1) - minY
  return {
    corners: route.corners,
    cells: route.cells.map((cell) => ({ x: cell.x + offsetX, y: cell.y + offsetY })),
  }
}

function rescueLevel(
  seed: number,
  level: number,
  difficulty: Difficulty,
): Level | null {
  const gentle = { ...difficulty, sealChance: 0 }
  const patterns = shuffle(createRng(mixSeed(seed, level, 900)), PATTERNS)

  for (let index = 0; index < patterns.length; index += 1) {
    const pattern = patterns[index]
    if (!pattern) continue
    const rng = createRng(mixSeed(seed, level, 1000 + index))
    const shifted = shiftRoute(
      compactRoute(pattern[0], pattern[1], difficulty.bounces),
      difficulty.cols,
      difficulty.rows,
      rng,
    )
    if (!shifted) continue
    const built = realize(rng, gentle, shifted, seed, level)
    if (built) return built
  }

  return null
}

function realize(
  rng: () => number,
  difficulty: Difficulty,
  route: Route,
  seed: number,
  levelNumber: number,
): Level | null {
  if (route.cells.length < 4 || route.corners.length !== difficulty.bounces) return null

  const maze = fullMaze(difficulty.cols, difficulty.rows)
  const keep = new Set<string>()

  for (let index = 0; index < route.cells.length - 1; index += 1) {
    const from = route.cells[index]
    const to = route.cells[index + 1]
    if (!from || !to) return null
    const key = passageKey(from, to)
    if (!key) return null
    keep.add(key)
    openBetween(maze, from, to)
  }

  carveRemainder(rng, maze, route.cells)
  sealPassages(rng, maze, keep, difficulty.sealChance)

  const start = route.cells[0]
  const second = route.cells[1]
  if (!start || !second) return null
  const lightDir = sub(second, start)

  const solution: Circle[] = []
  for (const cornerIndex of route.corners) {
    const previous = route.cells[cornerIndex - 1]
    const cell = route.cells[cornerIndex]
    const next = route.cells[cornerIndex + 1]
    if (!previous || !cell || !next) return null

    const incoming = normalize(sub(cell, previous))
    const outgoing = normalize(sub(next, cell))
    if (!incoming || !outgoing) return null
    const normal = normalize(sub(outgoing, incoming))
    if (!normal) return null

    solution.push({
      x: cell.x + 0.5 - normal.x * HEAD_RADIUS,
      y: cell.y + 0.5 - normal.y * HEAD_RADIUS,
      r: HEAD_RADIUS,
    })
  }

  const catCell = route.cells[route.cells.length - 1]
  if (!catCell) return null

  const level: Level = {
    seed,
    level: levelNumber,
    cols: difficulty.cols,
    rows: difficulty.rows,
    walls: mazeToWalls(maze),
    light: {
      x: start.x + 0.5,
      y: start.y + 0.5,
      dx: lightDir.x,
      dy: lightDir.y,
    },
    cat: { x: catCell.x + 0.5, y: catCell.y + 0.5, r: CAT_RADIUS },
    headRadius: HEAD_RADIUS,
    headCount: solution.length + difficulty.spares,
    solution,
  }

  return levelIsValid(level) ? level : null
}

function levelIsValid(level: Level): boolean {
  if (level.solution.length < 1) return false
  if (!solutionHitsCat(level)) return false
  if (zeroHeadsHitCat(level)) return false

  return level.solution.every((head, index) =>
    canPlaceHead(level, level.solution, head.x, head.y, index),
  )
}
