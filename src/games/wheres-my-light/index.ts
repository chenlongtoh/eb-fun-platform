import { lazy } from 'react'
import type { GameManifest } from '@/contract/game.ts'
import thumbnail from './assets/thumbnail.svg'

export const manifest: GameManifest = {
  slug: 'wheres-my-light',
  title: "Where's My Light?",
  description: 'The light went missing. Search the dark and bring it back.',
  thumbnail,
  component: lazy(() => import('./Game.tsx')),
}
