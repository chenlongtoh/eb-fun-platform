/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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
      expect(manifest.component.$$typeof).toBe(Symbol.for('react.lazy'))
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
      'Play StaySEAN',
      "Where's My Light?",
    ])
    expect(games[0]?.titleNode).toBeDefined()
    expect(games[1]?.titleNode).toBeUndefined()
  })

  it('lazy-loads game modules and keeps the large asset out of the manifest', () => {
    const root = process.cwd()

    for (const game of games) {
      const indexSource = readFileSync(
        join(root, 'src/games', game.slug, 'index.ts'),
        'utf8',
      )
      expect(indexSource).toMatch(/lazy\(\(\) => import\('\.\/Game\.tsx'\)\)/)
      expect(indexSource).not.toMatch(/from\s+['"]\.\/Game/)
      expect(indexSource).not.toMatch(/\.png['"]/)
    }

    const gameSource = readFileSync(
      join(root, 'src/games/wheres-my-light/Game.tsx'),
      'utf8',
    )
    expect(gameSource).toMatch(/from\s+['"]\.\/assets\/scene\.png['"]/)
  })

  it('looks up a game by slug and builds its path', () => {
    expect(getGameBySlug('reverse-akinator')?.title).toBe('Play StaySEAN')
    expect(getGameBySlug('missing')).toBeUndefined()
    expect(gamePath('wheres-my-light')).toBe('/games/wheres-my-light')
  })
})
