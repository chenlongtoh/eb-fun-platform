import { lazy } from 'react'
import type { GameManifest } from '@/contract/game.ts'
import thumbnail from './assets/thumbnail.svg'

export const manifest: GameManifest = {
  slug: 'wheres-my-light',
  title: "Where's My Light?",
  description:
    'Bounce a beam off shiny bald heads and steer it through the maze until it finds the cat.',
  thumbnail,
  component: lazy(() => import('./Game.tsx')),
}
