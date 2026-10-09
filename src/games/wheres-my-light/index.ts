import type { GameManifest } from '@/contract/game.ts'
import thumbnail from './thumbnail.svg'
import { Game } from './Game.tsx'

export const manifest: GameManifest = {
  slug: 'wheres-my-light',
  title: "Where's My Light?",
  description: 'The light went missing. Search the dark and bring it back.',
  thumbnail,
  component: Game,
}
