# Adding a game

Each game is a folder under `src/games/<slug>/` that exports a manifest. The lobby and the `/games/<slug>` route read that manifest from one registry file. Games do not import each other.

Copy `src/games/reverse-akinator/` as the starting shape. The steps below use a new slug, `example-game`.

## 1. Create the folder

```text
src/games/example-game/
  index.ts                 exports manifest (loaded with the lobby)
  Game.tsx                 default export, loaded with React.lazy
  assets/thumbnail.svg     small lobby image, imported by index.ts
  assets/                  other images and files, imported by Game.tsx
```

The folder name is the slug: lowercase words separated by hyphens, matching `[a-z0-9]+(-[a-z0-9]+)*`.

`Game.tsx` must default-export the component. `React.lazy` reads that default export:

```tsx
import scene from './assets/scene.png'

export default function Game() {
  return (
    <section className="game-stub">
      <p className="eyebrow">Mini game</p>
      <h1>Example Game</h1>
      <p className="coming-soon">Coming soon.</p>
      <img src={scene} alt="Placeholder scene" />
    </section>
  )
}
```

Replace that stub with the real game. You can add more files beside it (`logic.ts`, `Game.test.tsx`, `styles.css`). Import them with a relative path and a `.ts` or `.tsx` extension. Import images from `assets/` the same way (`import scene from './assets/scene.png'`). Vite copies the file into the build and gives you a URL. Do not put asset paths in `public/` and do not link them by hand.

`index.ts` must not statically import `Game.tsx`. A static import would pull the game, and every file it imports, into the lobby bundle.

```ts
import { lazy } from 'react'
import type { GameManifest } from '@/contract/game.ts'
import thumbnail from './assets/thumbnail.svg'

export const manifest: GameManifest = {
  slug: 'example-game',
  title: 'Example Game',
  description: 'One or two sentences for the lobby card.',
  thumbnail,
  component: lazy(() => import('./Game.tsx')),
}
```

`slug` must be exactly the folder name. The export name must be `manifest`.

The shell wraps `component` in `Suspense`. You do not render your own route or header.

## 2. Register it

`src/platform/registry.ts` is the only file that imports games. Add one import and one array entry. Array order is lobby order.

```ts
import { manifest as exampleGame } from '@/games/example-game/index.ts'

export const games: readonly GameManifest[] = [
  reverseAkinator,
  wheresMyLight,
  exampleGame,
]
```

Do not import `@/games/example-game/index.ts` from anywhere else. Pages ask the registry for a game with `getGameBySlug`.

## 3. What a game is allowed to import

Allowed:

- Relative files inside `src/games/example-game/`
- `@/contract/game.ts` for the `GameManifest` type
- `@/shared/...` for platform helpers such as the seeded RNG
- Packages from `package.json` (`react`, and anything you add for this game)

Not allowed:

- Any other folder under `src/games/`
- `src/platform/` (layout, pages, registry, brand)
- `src/App.tsx`

If two games need the same helper, move that helper into `src/shared/` and import it from both. Do not reach into a sibling game.

Type imports use `import type`. Relative and `@/` imports include the file extension, because TypeScript is configured with `verbatimModuleSyntax` and `allowImportingTsExtensions`.

## 4. Manifest fields

Defined in `src/contract/game.ts`:

| Field         | Type                                 | Role                                                                                                |
| ------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `slug`        | `string`                             | Path segment in `/games/<slug>`. Same as the folder name.                                           |
| `title`       | `string`                             | Plain-text name. Document title and accessible name. Shown on the card when `titleNode` is omitted. |
| `titleNode`   | `ReactNode` (optional)               | Styled name for the lobby card. Text content must equal `title`.                                    |
| `description` | `string`                             | Short lobby description.                                                                            |
| `thumbnail`   | `string`                             | Small image URL imported from `assets/` by `index.ts`. It ships with the lobby.                     |
| `component`   | `LazyExoticComponent<ComponentType>` | `lazy(() => import('./Game.tsx'))`. Loaded only when the player opens the game. No props.           |

The shell already supplies the header, the platform name, and **Back to lobby**. The component only renders the game itself. On a game route the shell sets `document.title` from `title`, not from `titleNode`.

### Styled names

Keep `title` as a plain string even when the visible name styles one part of it. `src/games/reverse-akinator/` is the example: the string is `Play StaySEAN`, and `titleNode` bolds **SEAN** in gold.

```tsx
export function GameTitle() {
  return (
    <>
      Play Stay<span className="reverse-akinator-accent">SEAN</span>
    </>
  )
}
```

```ts
import { createElement } from 'react'
import { GameTitle } from './Title.tsx'

title: 'Play StaySEAN',
titleNode: createElement(GameTitle),
```

Put that component in the game folder and import it from `index.ts`, so the style ships with the lobby card. Render the same component inside the game's own heading. Give the heading `aria-label={title}` so the accessible name stays the plain string. Import the stylesheet from the title component, not from `Game.tsx`, or the card will be unstyled until the game chunk loads.

A thumbnail can be a simple placeholder. The lobby card shows `title`, `description`, and `thumbnail`. An empty `alt` is already set on the card image because the title sits next to it.

### Assets and lazy loading

Keep every static file for the game inside `src/games/<slug>/assets/`. Import it from game code so the bundler fingerprints it.

| Import it from | Loads when                    | Use it for                                        |
| -------------- | ----------------------------- | ------------------------------------------------- |
| `index.ts`     | The lobby loads               | The thumbnail only                                |
| `Game.tsx`     | Someone opens `/games/<slug>` | Art, audio, and other files the game itself needs |

`src/games/wheres-my-light/assets/scene.png` is about 1 MB. It is imported by `Game.tsx`, not by `index.ts`. `pnpm build` runs `scripts/verify-lazy-assets.mjs`, which fails if that PNG is missing, is no longer about 1 MB, or is referenced by the lobby entry chunk.

## 5. Run and test

From the repo root:

```sh
pnpm install
pnpm dev
```

Open http://localhost:5173 to see the card, then http://localhost:5173/games/example-game for the game.

```sh
pnpm test
pnpm lint
pnpm typecheck
```

A test file named `src/games/example-game/Game.test.tsx` is picked up automatically. Test your game's rules there. The platform tests already check that the folder is registered, that `slug` matches the folder, and that imports stay inside the allowed roots.

## Replacing a stub

`reverse-akinator` and `wheres-my-light` are placeholders. To build one of them:

- Edit only that folder, plus the existing line in `src/platform/registry.ts` if the title, description, or component export needs a wiring change.
- Keep the folder name and `slug` the same.
- Replace `Game.tsx` with the real game. The coming-soon markup is not a shared component.
- Swap `assets/thumbnail.svg` for real card art when you have it. Put heavier files in `assets/` and import them from `Game.tsx`.

You do not need to touch the other game.

## Seeded RNG

```ts
import { createRng, randomInt } from '@/shared/rng.ts'

const rng = createRng(42)
const value = rng()
const sides = randomInt(rng, 1, 6)
```

Same seed, same sequence. `rng()` is a float in `[0, 1)`. `randomInt` includes both ends.

## Saves

```ts
import { createGameStorage } from '@/shared/storage.ts'

const saves = createGameStorage('example-game')
saves.set('progress', JSON.stringify({ level: 2 }))
const raw = saves.get('progress')
saves.remove('progress')
```

`createGameStorage` writes localStorage keys as `eb-fun:<slug>:<encodeURIComponent(key)>`. Use the manifest slug. Another game using the same key name gets a different storage entry. Values are strings. `get` returns `null` when the key is absent.
