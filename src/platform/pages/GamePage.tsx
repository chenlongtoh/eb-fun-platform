import { useParams } from 'react-router'
import { getGameBySlug } from '@/platform/registry.ts'
import { NotFoundPage } from '@/platform/pages/NotFoundPage.tsx'

export function GamePage() {
  const { slug = '' } = useParams()
  const game = getGameBySlug(slug)

  if (!game) {
    return <NotFoundPage message={`No game is registered for “${slug}”.`} />
  }

  const Game = game.component
  return <Game />
}
