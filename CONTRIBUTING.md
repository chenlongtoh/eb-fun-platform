# Contributing

EB Fun Platform is a shell plus independently owned games. Build a game inside `src/games/<slug>/` and register it once. Do not import another game, and do not edit another team's folder.

Use **pnpm** and **Node.js 22+**.

## Run it locally

```sh
pnpm install
pnpm dev
```

The app is at http://localhost:5173.

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `pnpm dev`          | Dev server with hot reload                      |
| `pnpm test`         | Vitest, including registry and ownership checks |
| `pnpm test:watch`   | Vitest in watch mode                            |
| `pnpm lint`         | oxlint                                          |
| `pnpm format`       | Prettier write                                  |
| `pnpm format:check` | Prettier check                                  |
| `pnpm typecheck`    | `tsc -b`                                        |
| `pnpm build`        | Type-check and production build                 |

Put a game's tests next to its source as `*.test.ts` or `*.test.tsx`. Vitest collects them with the rest of the suite. Open `/games/<slug>` to play only your game.

## Folder ownership

| Path                              | Who edits it                                                                |
| --------------------------------- | --------------------------------------------------------------------------- |
| `src/games/<slug>/`               | The team building that game                                                 |
| `src/platform/registry.ts`        | Anyone adding or removing a game (one import and one array entry)           |
| `src/platform/` (everything else) | Shell changes only. Games do not import this folder                         |
| `src/contract/game.ts`            | The manifest contract. Change it only when every game should change with it |
| `src/shared/`                     | Helpers more than one game needs                                            |

Rules:

- A game may import files inside its own folder, `@/shared/...`, `@/contract/game.ts`, and third-party packages.
- A game must not import another game, `src/platform/`, or the app shell.
- Only `src/platform/registry.ts` may import from `src/games/`.
- The manifest `slug` must match the folder name.
- Keep the slug stable once a game is linked. Other people will bookmark `/games/<slug>`.

`src/platform/ownership.test.ts` fails the build when an import breaks these rules. `src/platform/registry.test.ts` fails when a game folder is missing from the registry, or when a slug does not match its folder.

## Manifest

`src/contract/game.ts`:

```ts
export interface GameManifest {
  slug: string
  title: string
  description: string
  thumbnail: string
  component: ComponentType
}
```

| Field         | Meaning                                                            |
| ------------- | ------------------------------------------------------------------ |
| `slug`        | Lowercase kebab-case URL segment. Must equal the folder name.      |
| `title`       | Card title and the name players see.                               |
| `description` | One or two sentences on the lobby card.                            |
| `thumbnail`   | Image URL for the card. Import an SVG or PNG from the game folder. |
| `component`   | React component rendered at `/games/<slug>`. No required props.    |

Each game's `index.ts` exports that object as `manifest`.

This project type-checks with `verbatimModuleSyntax` and `allowImportingTsExtensions`. Use `import type` for types, and include the extension on relative and `@/` imports (`./Game.tsx`, `@/contract/game.ts`). Package imports such as `react` stay extensionless.

## Add or replace a game

Full walkthrough, including a copy-paste folder template: [docs/adding-a-game.md](docs/adding-a-game.md).

Short version:

1. Add `src/games/<slug>/` with `index.ts`, `Game.tsx`, and a thumbnail.
2. Export `manifest` from `index.ts`.
3. Import that manifest in `src/platform/registry.ts` and append it to `games`. Lobby order is the array order.
4. Run `pnpm dev` and open `/games/<slug>`.
5. Run `pnpm test` before you push.

The starter folders `reverse-akinator` and `wheres-my-light` are stubs. Replace the files inside the folder you own. Leave the other stub alone, and keep the existing slug.

## Shared RNG

`src/shared/rng.ts` exposes a seeded generator so a game can replay the same sequence:

```ts
import { createRng, randomInt } from '@/shared/rng.ts'

const rng = createRng(1234)
const roll = randomInt(rng, 1, 6)
```

`createRng(seed)` returns floats in `[0, 1)`. `randomInt(rng, min, max)` is inclusive. Add new shared helpers only when a second game needs them. Until then, keep the code in the game folder.

## Pull requests

CI installs with `pnpm install --frozen-lockfile`, then runs lint, format check, type-check, test, and build. A game PR should touch that game's folder plus the registry line that mounts it. Do not reformat or refactor unrelated games.
