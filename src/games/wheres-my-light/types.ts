export interface Vec {
  x: number
  y: number
}

export interface Wall {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface Circle {
  x: number
  y: number
  r: number
}

export interface LightSource {
  x: number
  y: number
  dx: number
  dy: number
}

export interface Level {
  seed: number
  level: number
  cols: number
  rows: number
  walls: Wall[]
  light: LightSource
  cat: Circle
  headRadius: number
  /** Heads handed to the player, including any spare decoys. */
  headCount: number
  /** Placements that bounce the beam onto the cat. */
  solution: Circle[]
}

export interface TraceOptions {
  /** Reflections to perform before a later head stops the beam. */
  maxBounces?: number
  /** Longest distance a single segment may travel. */
  maxSegmentLength?: number
}

export type TraceEnd = 'cat' | 'wall' | 'length' | 'bounce-cap'

export interface TraceResult {
  points: Vec[]
  hitCat: boolean
  /** Reflections that were actually applied. */
  bounces: number
  end: TraceEnd
}

export interface Difficulty {
  cols: number
  rows: number
  bounces: number
  spares: number
  sealChance: number
}

export interface HeadToken {
  id: number
  variant: number
}

export interface PlacedHead extends HeadToken {
  x: number
  y: number
}

export interface DragState {
  token: HeadToken
  source: 'tray' | 'board'
  home: { x: number; y: number } | null
  x: number
  y: number
  valid: boolean
  overBoard: boolean
  clientX: number
  clientY: number
  startX: number
  startY: number
  lifted: boolean
}
