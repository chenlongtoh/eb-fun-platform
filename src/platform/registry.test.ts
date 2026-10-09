import { describe, expect, it } from 'vitest'
import type { GameManifest } from '@/contract/game.ts'
import { gamePath, games, getGameBySlug } from '@/platform/registry.ts'

const modules = import.meta.glob('../games/*/index.ts', {
  eager: true,
}) as Record<string, { manifest: GameManifest }>

describe('game registry', () => {
  it('registers exactly the game folders, with matching slugs', () => {
    const fromFolders = Object.entries(modules).map(([path, mod]) => {
      const folder = path.split('/').at(-2)
      return { folder, manifest: mod.manifest }
    })

    expect(fromFolders.length).toBeGreaterThan(0)

    for (const { folder, manifest } of fromFolders) {
      expect(manifest.slug).toBe(folder)
      expect(manifest.title.trim().length).toBeGreaterThan(0)
      expect(manifest.description.trim().length).toBeGreaterThan(0)
      expect(manifest.thumbnail.length).toBeGreaterThan(0)
      expect(typeof manifest.component).toBe('function')
    }

    expect(games.map((game) => game.slug).sort()).toEqual(
      fromFolders.map((entry) => entry.folder).sort(),
    )
  })

  it('lists the two starter games in lobby order', () => {
    expect(games.map((game) => game.slug)).toEqual([
      'reverse-akinator',
      'wheres-my-light',
    ])
    expect(games.map((game) => game.title)).toEqual([
      'Reverse Akinator',
      "Where's My Light?",
    ])
  })

  it('looks up a game by slug and builds its path', () => {
    expect(getGameBySlug('reverse-akinator')?.title).toBe('Reverse Akinator')
    expect(getGameBySlug('missing')).toBeUndefined()
    expect(gamePath('wheres-my-light')).toBe('/games/wheres-my-light')
  })
})
