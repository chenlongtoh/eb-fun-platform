import { GameTitle, gameTitle } from './Title.tsx'

export default function Game() {
  return (
    <section className="game-stub">
      <p className="eyebrow">Mini game</p>
      <h1 aria-label={gameTitle}>
        <GameTitle />
      </h1>
      <p className="coming-soon">Coming soon.</p>
    </section>
  )
}
