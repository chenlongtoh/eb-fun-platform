import scene from './assets/scene.png'

export default function Game() {
  return (
    <section className="game-stub">
      <p className="eyebrow">Mini game</p>
      <h1>Where&apos;s My Light?</h1>
      <p className="coming-soon">Coming soon.</p>
      <img className="game-asset" src={scene} alt="Placeholder scene" />
    </section>
  )
}
