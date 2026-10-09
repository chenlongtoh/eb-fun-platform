import { Suspense } from 'react'
import { useParams } from 'react-router'
import type { GameManifest } from '@/contract/game.ts'
import { getGameBySlug } from '@/platform/registry.ts'
import { useDocumentTitle } from '@/platform/useDocumentTitle.ts'
import { NotFoundPage } from '@/platform/pages/NotFoundPage.tsx'

export function GamePage() {
  const { slug = '' } = useParams()
  const game = getGameBySlug(slug)

  if (!game) {
    return <NotFoundPage message={`No game is registered for “${slug}”.`} />
  }

  return <LoadedGame game={game} />
}

function LoadedGame({ game }: { game: GameManifest }) {
  useDocumentTitle(game.title)
  const Game = game.component

  return (
    <Suspense fallback={<p className="game-loading">Loading…</p>}>
      <Game />
    </Suspense>
  )
}
