/// <reference types="node" />

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const srcDir = join(root, 'src')
const gamesDir = join(srcDir, 'games')
const sharedDir = join(srcDir, 'shared')
const contractDir = join(srcDir, 'contract')
const registryFile = join(srcDir, 'platform', 'registry.ts')

function walk(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...walk(full))
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full)
    }
  }
  return files
}

function isInside(parent: string, child: string): boolean {
  const rel = relative(parent, child)
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))
}

function specifiers(source: string): string[] {
  const found: string[] = []
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const value = match[1]
      if (value) found.push(value)
    }
  }
  return found
}

function resolveSpecifier(fromFile: string, spec: string): string | null {
  const bare = spec.split('?')[0]?.split('#')[0] ?? spec
  if (bare.startsWith('@/')) {
    return join(srcDir, bare.slice(2))
  }
  if (bare.startsWith('.')) {
    return resolve(dirname(fromFile), bare)
  }
  return null
}

describe('game folder ownership', () => {
  const gameFolders = readdirSync(gamesDir).filter((name) =>
    statSync(join(gamesDir, name)).isDirectory(),
  )

  it('lets a game import only itself, shared utilities, and the contract', () => {
    const violations: string[] = []

    for (const slug of gameFolders) {
      const gameDir = join(gamesDir, slug)
      for (const file of walk(gameDir)) {
        for (const spec of specifiers(readFileSync(file, 'utf8'))) {
          const resolved = resolveSpecifier(file, spec)
          if (!resolved) continue
          const allowed =
            isInside(gameDir, resolved) ||
            isInside(sharedDir, resolved) ||
            isInside(contractDir, resolved)
          if (!allowed) {
            violations.push(`${relative(root, file)} imports ${spec}`)
          }
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('imports game modules only from the registry', () => {
    const violations: string[] = []

    for (const file of walk(srcDir)) {
      if (file === registryFile || isInside(gamesDir, file)) continue
      for (const spec of specifiers(readFileSync(file, 'utf8'))) {
        const resolved = resolveSpecifier(file, spec)
        if (resolved && isInside(gamesDir, resolved)) {
          violations.push(`${relative(root, file)} imports ${spec}`)
        }
      }
    }

    expect(violations).toEqual([])
  })
})
