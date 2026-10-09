import { createGameStorage } from '@/shared/storage.ts'

const saves = createGameStorage('wheres-my-light')
const PROGRESS_KEY = 'progress'

export interface Progress {
  current: number
  highest: number
}

function positiveLevel(value: unknown, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(1, Math.floor(numeric))
}

export function loadProgress(): Progress {
  try {
    const raw = saves.get(PROGRESS_KEY)
    if (!raw) return { current: 1, highest: 1 }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { current: 1, highest: 1 }
    const record = parsed as { current?: unknown; highest?: unknown }
    const current = positiveLevel(record.current, 1)
    const highest = Math.max(current, positiveLevel(record.highest, current))
    return { current, highest }
  } catch {
    return { current: 1, highest: 1 }
  }
}

export function saveProgress(progress: Progress): void {
  try {
    saves.set(
      PROGRESS_KEY,
      JSON.stringify({ current: progress.current, highest: progress.highest }),
    )
  } catch {
    // A full quota or private mode should not take the puzzle down.
  }
}
