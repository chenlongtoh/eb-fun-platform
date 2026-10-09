import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist'
const assetsDir = join(dist, 'assets')
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const entryMatch = html.match(/assets\/(index-[^"']+\.js)/)

if (!entryMatch) {
  throw new Error('Could not find the lobby entry chunk in dist/index.html')
}

const entryName = entryMatch[1]
const entryPath = join(assetsDir, entryName)
const entrySource = readFileSync(entryPath, 'utf8')
const entrySize = statSync(entryPath).size
const files = readdirSync(assetsDir)
const pngs = files.filter((name) => name.endsWith('.png'))

if (pngs.length !== 1) {
  throw new Error(`Expected one built PNG asset, found: ${pngs.join(', ') || '(none)'}`)
}

const pngName = pngs[0]
const pngSize = statSync(join(assetsDir, pngName)).size

if (pngSize < 1_000_000 || pngSize > 1_200_000) {
  throw new Error(`Expected scene.png to stay about 1 MB, got ${pngSize} bytes`)
}

if (entrySize > 500_000) {
  throw new Error(
    `Lobby entry chunk is ${entrySize} bytes; a game asset may be inlined`,
  )
}

if (entrySource.includes(pngName)) {
  throw new Error(`Lobby entry ${entryName} references ${pngName}`)
}

const gameChunks = files.filter((name) => name.endsWith('.js') && name !== entryName)
const holders = gameChunks.filter((name) =>
  readFileSync(join(assetsDir, name), 'utf8').includes(pngName),
)

if (holders.length === 0) {
  throw new Error(`No lazy game chunk references ${pngName}`)
}

console.log(
  `Lazy asset check passed: ${pngName} (${pngSize} bytes) is referenced by ${holders.join(', ')}, not ${entryName}.`,
)
