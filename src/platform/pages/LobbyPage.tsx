import { Link } from 'react-router'
import { gamePath, games } from '@/platform/registry.ts'

export function LobbyPage() {
  const countLabel = games.length === 1 ? '1 game' : `${games.length} games`

  return (
    <section className="lobby">
      <div className="lobby-intro">
        <h1>Pick a game</h1>
        <p>{countLabel} in the lobby. Choose one to play.</p>
      </div>
      {games.length === 0 ? (
        <p className="empty-lobby">No games are registered yet.</p>
      ) : (
        <ul className="game-grid">
          {games.map((game) => (
            <li key={game.slug}>
              <Link className="game-card" to={gamePath(game.slug)}>
                <img className="game-card-thumb" src={game.thumbnail} alt="" />
                <div className="game-card-body">
                  <h2>{game.title}</h2>
                  <p>{game.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
