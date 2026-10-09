import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const fixtureRoot = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/lazy-asset')
const outDir = mkdtempSync(join(tmpdir(), 'eb-fun-lazy-asset-'))

try {
  await build({
    root: fixtureRoot,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      assetsInlineLimit: 0,
    },
  })

  const assetsDir = join(outDir, 'assets')
  const files = readdirSync(assetsDir)
  const markerName = files.find((name) => name.endsWith('.svg'))
  const html = readFileSync(join(outDir, 'index.html'), 'utf8')
  const entryMatch = html.match(/assets\/([^"']+\.js)/)

  if (!markerName) {
    throw new Error(`Fixture build did not emit an svg asset: ${files.join(', ')}`)
  }
  if (!entryMatch) {
    throw new Error('Fixture build did not emit an entry chunk')
  }

  const entryName = entryMatch[1]
  const entrySource = readFileSync(join(assetsDir, entryName), 'utf8')
  if (entrySource.includes(markerName)) {
    throw new Error(`Entry chunk ${entryName} references ${markerName}`)
  }
  if (!entrySource.includes('import(')) {
    throw new Error(
      `Entry chunk ${entryName} does not dynamically import the asset module`,
    )
  }

  const holders = files.filter(
    (name) =>
      name.endsWith('.js') &&
      name !== entryName &&
      readFileSync(join(assetsDir, name), 'utf8').includes(markerName),
  )
  if (holders.length === 0) {
    throw new Error(`No lazy chunk references ${markerName}`)
  }

  console.log(
    `Lazy asset check passed: ${markerName} is referenced by ${holders.join(', ')}, not ${entryName}.`,
  )
} finally {
  rmSync(outDir, { recursive: true, force: true })
}
