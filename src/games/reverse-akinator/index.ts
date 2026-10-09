import type { GameManifest } from '@/contract/game.ts'
import thumbnail from './thumbnail.svg'
import { Game } from './Game.tsx'

export const manifest: GameManifest = {
  slug: 'reverse-akinator',
  title: 'Reverse Akinator',
  description:
    'Someone has a character in mind. This time, you are the one asking the questions.',
  thumbnail,
  component: Game,
}
