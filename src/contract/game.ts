import type { ComponentType } from 'react'

/**
 * Plug-in contract for one mini game.
 *
 * Each game folder (`src/games/<slug>/`) exports a single `manifest`
 * satisfying this interface. The shell reads manifests only from
 * `src/platform/registry.ts`.
 */
export interface GameManifest {
  /**
   * URL segment under `/games/<slug>`.
   * Lowercase kebab-case, unique, and identical to the game folder name.
   */
  slug: string
  /** Lobby card title and game page heading. */
  title: string
  /** One or two sentences shown on the lobby card. */
  description: string
  /**
   * Lobby thumbnail URL.
   * Import an SVG or PNG from the game folder so Vite can serve it.
   */
  thumbnail: string
  /** Root component rendered at `/games/<slug>`. Takes no required props. */
  component: ComponentType
}
