import type { ComponentType, LazyExoticComponent, ReactNode } from 'react'

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
  /**
   * Plain-text name. The shell uses this for the document title and as the
   * accessible name of the lobby card. It is also the visible title when
   * `titleNode` is omitted.
   */
  title: string
  /**
   * Optional styled title for the lobby card and other visible headings.
   * Its text content must match `title`. Omit it when the plain string is enough.
   */
  titleNode?: ReactNode
  /** One or two sentences shown on the lobby card. */
  description: string
  /**
   * Lobby thumbnail URL.
   * Import a small image from `assets/` so Vite can serve it.
   * Keep this import in the manifest module. It ships with the lobby.
   */
  thumbnail: string
  /**
   * Root component rendered at `/games/<slug>`. Takes no required props.
   * Must be `lazy(() => import('./Game.tsx'))` so the game module and its
   * assets load only when the route opens.
   */
  component: LazyExoticComponent<ComponentType>
}
