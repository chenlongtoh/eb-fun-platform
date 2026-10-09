# EB Fun Platform

A browser lobby for mini games. The shell lists every registered game and routes to it. Each game lives in its own folder and plugs in through a manifest, so teams can build games without editing each other.

Package manager: **pnpm**. Runtime: **Node.js 22+**.

## Quick start

```sh
pnpm install
pnpm dev
```

Open http://localhost:5173. The lobby lists the starter games. Each card links to `/games/<slug>`.

## Scripts

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `pnpm dev`          | Start the Vite dev server           |
| `pnpm test`         | Run Vitest once                     |
| `pnpm test:watch`   | Run Vitest in watch mode            |
| `pnpm lint`         | Lint with oxlint                    |
| `pnpm format`       | Format with Prettier                |
| `pnpm format:check` | Check formatting without writing    |
| `pnpm typecheck`    | Type-check the app and Vite config  |
| `pnpm build`        | Type-check and build for production |
| `pnpm preview`      | Serve the production build          |

## Layout

```text
src/
  contract/game.ts          GameManifest, the plug-in contract
  platform/registry.ts      The only file that registers games
  platform/layout/          Shared header and page chrome
  platform/pages/           Lobby, game route, not-found page
  games/<slug>/             One folder per game
  games/<slug>/assets/      That game's images and other static files
  shared/                   Utilities any game may import (RNG, namespaced saves)
```

Starter games:

- `src/games/reverse-akinator/` — Play StaySEAN (`reverse-akinator`)
- `src/games/wheres-my-light/` — Where's My Light?

Both are coming-soon stubs. Replace the files inside a folder to build that game. Leave the other folder alone.

## Plug-in contract

A game exports a `manifest` from `src/games/<slug>/index.ts`:

```ts
interface GameManifest {
  slug: string
  title: string
  titleNode?: ReactNode
  description: string
  thumbnail: string
  component: LazyExoticComponent<ComponentType>
}
```

The shell imports those manifests only in `src/platform/registry.ts`. Each manifest lazy-loads its game component, so a game's assets are not part of the lobby bundle. Images live in that game's `assets/` folder and are imported through Vite. `title` is the plain name used for the document title and accessibility. Set `titleNode` when part of that name needs its own styling. Shared helpers, including a seeded RNG and `createGameStorage(slug)`, live in `src/shared/`.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/adding-a-game.md](docs/adding-a-game.md) for the rules and the exact steps to add a game.

## CI

GitHub Actions (`.github/workflows/ci.yml`) installs dependencies, then lints, checks formatting, type-checks, tests, and builds.
