# Adding a game

Each game is a folder under `src/games/<slug>/` that exports a manifest. The lobby and the `/games/<slug>` route read that manifest from one registry file. Games do not import each other.

Copy `src/games/reverse-akinator/` as the starting shape. The steps below use a new slug, `example-game`.

## 1. Create the folder

```text
src/games/example-game/
  index.ts          exports manifest
  Game.tsx          the page rendered at /games/example-game
  thumbnail.svg     lobby image (any SVG or PNG is fine)
```

The folder name is the slug: lowercase words separated by hyphens, matching `[a-z0-9]+(-[a-z0-9]+)*`.

`Game.tsx`:

```tsx
export function Game() {
  return (
    <section className="game-stub">
      <p className="eyebrow">Mini game</p>
      <h1>Example Game</h1>
      <p className="coming-soon">Coming soon.</p>
    </section>
  )
}
```

Replace that stub with the real game. You can add more files beside it (`logic.ts`, `Game.test.tsx`, `styles.css`). Import them with a relative path and a `.ts` or `.tsx` extension.

`index.ts`:

```ts
import type { GameManifest } from '@/contract/game.ts'
import thumbnail from './thumbnail.svg'
import { Game } from './Game.tsx'

export const manifest: GameManifest = {
  slug: 'example-game',
  title: 'Example Game',
  description: 'One or two sentences for the lobby card.',
  thumbnail,
  component: Game,
}
```

`slug` must be exactly the folder name. The export name must be `manifest`.

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

| Field         | Type            | Role                                                                       |
| ------------- | --------------- | -------------------------------------------------------------------------- |
| `slug`        | `string`        | Path segment in `/games/<slug>`. Same as the folder name.                  |
| `title`       | `string`        | Lobby card title.                                                          |
| `description` | `string`        | Short lobby description.                                                   |
| `thumbnail`   | `string`        | Image URL. Import the file from the game folder so the card can render it. |
| `component`   | `ComponentType` | React component for the game route. It receives no required props.         |

The shell already supplies the header, the platform name, and **Back to lobby**. The component only renders the game itself.

A thumbnail can be a simple placeholder. The lobby card shows `title`, `description`, and `thumbnail`. An empty `alt` is already set on the card image because the title sits next to it.

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
- Swap `thumbnail.svg` for real art when you have it.

You do not need to touch the other game.

## Seeded RNG

```ts
import { createRng, randomInt } from '@/shared/rng.ts'

const rng = createRng(42)
const value = rng()
const sides = randomInt(rng, 1, 6)
```

Same seed, same sequence. `rng()` is a float in `[0, 1)`. `randomInt` includes both ends.
