import './title.css'

/** Plain-text name. Keep this identical to the text rendered by `GameTitle`. */
export const gameTitle = 'Play StaySEAN'

export function GameTitle() {
  return (
    <>
      Play Stay<span className="reverse-akinator-accent">SEAN</span>
    </>
  )
}
