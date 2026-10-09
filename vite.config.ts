import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

// Local dev and the default production build stay at `/`.
// The Pages workflow sets PAGES_BASE_PATH=/eb-fun-platform/.
function pagesBasePath(): string {
  const value = process.env.PAGES_BASE_PATH?.trim()
  if (!value || value === '/') return '/'
  if (!value.startsWith('/')) {
    throw new Error(
      `PAGES_BASE_PATH must be an absolute path starting with /, received ${JSON.stringify(value)}`,
    )
  }
  return value.endsWith('/') ? value : `${value}/`
}

// GitHub Pages has no rewrite rule. A copy of the app shell at 404.html
// is what a direct load or refresh of /games/<slug> receives.
function spaFallback(): Plugin {
  let outDir = ''
  let copyFallback = false

  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    configResolved(config) {
      copyFallback = config.base !== '/' && config.base !== './'
      outDir = config.build.outDir
    },
    closeBundle() {
      if (!copyFallback) return
      const indexFile = resolve(outDir, 'index.html')
      if (!existsSync(indexFile)) {
        throw new Error(`Cannot write 404.html; missing ${indexFile}`)
      }
      copyFileSync(indexFile, resolve(outDir, '404.html'))
    },
  }
}

export default defineConfig({
  base: pagesBasePath(),
  plugins: [react(), spaFallback()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
