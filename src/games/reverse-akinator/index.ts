import { createElement, lazy } from 'react'
import type { GameManifest } from '@/contract/game.ts'
import thumbnail from './assets/thumbnail.svg'
import { GameTitle, gameTitle } from './Title.tsx'

export const manifest: GameManifest = {
  slug: 'reverse-akinator',
  title: gameTitle,
  titleNode: createElement(GameTitle),
  description:
    'Someone has a character in mind. This time, you are the one asking the questions.',
  thumbnail,
  component: lazy(() => import('./Game.tsx')),
}
