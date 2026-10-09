import type { GameManifest } from '@/contract/game.ts'
import { manifest as reverseAkinator } from '@/games/reverse-akinator/index.ts'
import { manifest as wheresMyLight } from '@/games/wheres-my-light/index.ts'

/**
 * Single registration point for games.
 *
 * Lobby order follows this array. To add a game, import its `manifest`
 * and append it here. This file is the only module allowed to import
 * from `src/games/`.
 */
export const games: readonly GameManifest[] = [reverseAkinator, wheresMyLight]

export function getGameBySlug(slug: string): GameManifest | undefined {
  return games.find((game) => game.slug === slug)
}

export function gamePath(slug: string): string {
  return `/games/${slug}`
}
