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
  titleNode?: ReactNode
  description: string
  thumbnail: string
  component: LazyExoticComponent<ComponentType>
}
```

| Field         | Meaning                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| `slug`        | Lowercase kebab-case URL segment. Must equal the folder name.                                               |
| `title`       | Plain-text name. Used for the document title, the card's accessible name, and the visible title by default. |
| `titleNode`   | Optional styled name. Its text must match `title`. The lobby renders this instead of `title` when set.      |
| `description` | One or two sentences on the lobby card.                                                                     |
| `thumbnail`   | Image URL for the card. Import a small file from `assets/`. It ships with the lobby.                        |
| `component`   | `lazy(() => import('./Game.tsx'))`. Do not statically import `Game.tsx` into the manifest.                  |

Each game's `index.ts` exports that object as `manifest`.

This project type-checks with `verbatimModuleSyntax` and `allowImportingTsExtensions`. Use `import type` for types, and include the extension on relative and `@/` imports (`./Game.tsx`, `@/contract/game.ts`). Package imports such as `react` stay extensionless.

## Add or replace a game

Full walkthrough, including a copy-paste folder template: [docs/adding-a-game.md](docs/adding-a-game.md).

Short version:

1. Add `src/games/<slug>/` with `index.ts`, `Game.tsx`, and `assets/` for images.
2. Export `manifest` from `index.ts`, with `component: lazy(() => import('./Game.tsx'))`.
3. Import that manifest in `src/platform/registry.ts` and append it to `games`. Lobby order is the array order.
4. Run `pnpm dev` and open `/games/<slug>`.
5. Run `pnpm test` and `pnpm build` before you push. The build checks that the large game image is not in the lobby chunk.

The starter folders `reverse-akinator` and `wheres-my-light` are stubs. Replace the files inside the folder you own. Leave the other stub alone, and keep the existing slug.

## Shared RNG

`src/shared/rng.ts` exposes a seeded generator so a game can replay the same sequence:

```ts
import { createRng, randomInt } from '@/shared/rng.ts'

const rng = createRng(1234)
const roll = randomInt(rng, 1, 6)
```

`createRng(seed)` returns floats in `[0, 1)`. `randomInt(rng, min, max)` is inclusive.

## Saves

`createGameStorage(slug)` in `src/shared/storage.ts` prefixes localStorage keys so two games can both use `progress` without overwriting each other. Pass the manifest slug:

```ts
import { createGameStorage } from '@/shared/storage.ts'

const saves = createGameStorage('example-game')
saves.set('progress', JSON.stringify({ level: 2 }))
const raw = saves.get('progress')
saves.remove('progress')
```

Stored keys look like `eb-fun:example-game:progress`. The key is URI-encoded. Values are strings. The slug must be lowercase kebab-case.

## Static assets

Put images and other files in `src/games/<slug>/assets/` and import them. Vite emits a URL for each import.

- Import the lobby thumbnail from `index.ts`. Keep it small. That module loads with the lobby.
- Import everything else from `Game.tsx` (or a module only `Game.tsx` imports). `React.lazy` loads that module when the player opens `/games/<slug>`, so those files are not downloaded with the lobby.

`src/games/wheres-my-light/assets/scene.png` is about 1 MB and is imported only by that game's `Game.tsx`. `pnpm build` fails if the lobby entry chunk references it.

Add new shared helpers only when a second game needs them. Until then, keep the code in the game folder.

## Pull requests

CI installs with `pnpm install --frozen-lockfile`, then runs lint, format check, type-check, test, and build. A game PR should touch that game's folder plus the registry line that mounts it. Do not reformat or refactor unrelated games.
