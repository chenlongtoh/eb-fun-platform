import { randomInt } from '@/shared/rng.ts'
import type { Wall } from './types.ts'

export interface Cell {
  x: number
  y: number
}

export interface Maze {
  cols: number
  rows: number
  /** Horizontal wall on the top edge of cell (x, y). y runs 0..rows. */
  hWalls: boolean[][]
  /** Vertical wall on the left edge of cell (x, y). x runs 0..cols. */
  vWalls: boolean[][]
}

export function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`
}

export function inBounds(maze: Pick<Maze, 'cols' | 'rows'>, cell: Cell): boolean {
  return cell.x >= 0 && cell.y >= 0 && cell.x < maze.cols && cell.y < maze.rows
}

export function fullMaze(cols: number, rows: number): Maze {
  return {
    cols,
    rows,
    hWalls: Array.from({ length: rows + 1 }, () => Array<boolean>(cols).fill(true)),
    vWalls: Array.from({ length: rows }, () => Array<boolean>(cols + 1).fill(true)),
  }
}

export function passageKey(a: Cell, b: Cell): string | null {
  if (a.y === b.y && Math.abs(a.x - b.x) === 1) {
    return `v:${a.y}:${Math.max(a.x, b.x)}`
  }
  if (a.x === b.x && Math.abs(a.y - b.y) === 1) {
    return `h:${Math.max(a.y, b.y)}:${a.x}`
  }
  return null
}

export function openBetween(maze: Maze, a: Cell, b: Cell): void {
  if (a.x === b.x && b.y === a.y + 1) maze.hWalls[b.y]![a.x] = false
  else if (a.x === b.x && b.y === a.y - 1) maze.hWalls[a.y]![a.x] = false
  else if (a.y === b.y && b.x === a.x + 1) maze.vWalls[a.y]![b.x] = false
  else if (a.y === b.y && b.x === a.x - 1) maze.vWalls[a.y]![a.x] = false
}

export function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const copy = items.slice()
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(rng, 0, index)
    const current = copy[index]
    copy[index] = copy[swapIndex] as T
    copy[swapIndex] = current as T
  }
  return copy
}

/** Grow a perfect maze around the cells that are already connected. */
export function carveRemainder(
  rng: () => number,
  maze: Maze,
  seeds: readonly Cell[],
): void {
  const visited = new Set(seeds.map(cellKey))
  const stack = shuffle(rng, seeds)
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ]

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    if (!current) break

    const choices: Cell[] = []
    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y }
      if (!inBounds(maze, next) || visited.has(cellKey(next))) continue
      choices.push(next)
    }

    if (choices.length === 0) {
      stack.pop()
      continue
    }

    const next = choices[randomInt(rng, 0, choices.length - 1)]
    if (!next) break
    openBetween(maze, current, next)
    visited.add(cellKey(next))
    stack.push(next)
  }
}

/** Close passages the solution beam does not travel, adding walls on harder levels. */
export function sealPassages(
  rng: () => number,
  maze: Maze,
  keep: ReadonlySet<string>,
  chance: number,
): void {
  if (chance <= 0) return

  for (let y = 0; y < maze.rows; y += 1) {
    for (let x = 0; x < maze.cols; x += 1) {
      if (x + 1 < maze.cols) {
        const key = `v:${y}:${x + 1}`
        const row = maze.vWalls[y]
        if (row && !row[x + 1] && !keep.has(key) && rng() < chance) row[x + 1] = true
      }
      if (y + 1 < maze.rows) {
        const key = `h:${y + 1}:${x}`
        const row = maze.hWalls[y + 1]
        if (row && !row[x] && !keep.has(key) && rng() < chance) row[x] = true
      }
    }
  }
}

export function mazeToWalls(maze: Maze): Wall[] {
  const walls: Wall[] = []

  for (let y = 0; y <= maze.rows; y += 1) {
    const row = maze.hWalls[y]
    if (!row) continue
    for (let x = 0; x < maze.cols; x += 1) {
      if (row[x]) walls.push({ x1: x, y1: y, x2: x + 1, y2: y })
    }
  }

  for (let y = 0; y < maze.rows; y += 1) {
    const row = maze.vWalls[y]
    if (!row) continue
    for (let x = 0; x <= maze.cols; x += 1) {
      if (row[x]) walls.push({ x1: x, y1: y, x2: x, y2: y + 1 })
    }
  }

  return walls
}
