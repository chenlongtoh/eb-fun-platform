import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { BaldHead } from './art.tsx'
import { Board } from './Board.tsx'
import { generateLevel, traceLevel } from './generate.ts'
import { canPlaceHead, nearestPlace } from './placement.ts'
import { loadProgress, saveProgress, type Progress } from './progress.ts'
import './styles.css'
import type { Circle, DragState, HeadToken, Level, PlacedHead } from './types.ts'
import { headVariantLabel } from './variants.ts'

function createTray(level: Level): HeadToken[] {
  return Array.from({ length: level.headCount }, (_, index) => ({
    id: index + 1,
    variant: (index + level.level) % 5,
  }))
}

function clientToBoard(svg: SVGSVGElement, clientX: number, clientY: number) {
  const matrix = svg.getScreenCTM()
  if (!matrix) return null
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  const mapped = point.matrixTransform(matrix.inverse())
  return { x: mapped.x, y: mapped.y }
}

function pointerOverBoard(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): boolean {
  const rect = svg.getBoundingClientRect()
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  )
}

export default function Game() {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const placedRef = useRef<PlacedHead[]>([])
  const levelRef = useRef<Level | null>(null)

  const [progress, setProgress] = useState<Progress>(loadProgress)
  const levelNumber = progress.current
  const level = useMemo(() => generateLevel(levelNumber, levelNumber), [levelNumber])
  const [seenLevel, setSeenLevel] = useState(level.level)
  const [placed, setPlaced] = useState<PlacedHead[]>([])
  const [tray, setTray] = useState<HeadToken[]>(() => createTray(level))
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [armedId, setArmedId] = useState<number | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [note, setNote] = useState<string | null>(null)

  if (seenLevel !== level.level) {
    setSeenLevel(level.level)
    setPlaced([])
    setTray(createTray(level))
    setSelectedId(null)
    setArmedId(null)
    setDrag(null)
    setNote(null)
  }

  const beamHeads: Circle[] = placed
    .filter((head) => !(drag?.lifted && head.id === drag.token.id))
    .map((head) => ({ x: head.x, y: head.y, r: level.headRadius }))
  if (drag?.lifted && drag.valid) {
    beamHeads.push({ x: drag.x, y: drag.y, r: level.headRadius })
  }

  const beam = traceLevel(level, beamHeads)
  const lighting = beam.hitCat && !drag?.lifted

  if (lighting && progress.highest <= level.level) {
    setProgress((current) =>
      current.highest > current.current
        ? current
        : { ...current, highest: current.current + 1 },
    )
  }

  useEffect(() => {
    placedRef.current = placed
    levelRef.current = level
  })

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const current = dragRef.current
      const board = svgRef.current
      const puzzle = levelRef.current
      if (!current || !board || !puzzle) return

      const moved =
        current.lifted ||
        Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 5
      let lifted = current.lifted
      if (moved && !current.lifted) {
        lifted = true
        if (current.source === 'tray') {
          setTray((list) => list.filter((item) => item.id !== current.token.id))
        } else {
          setPlaced((list) => list.filter((item) => item.id !== current.token.id))
        }
      }

      const overBoard = pointerOverBoard(board, event.clientX, event.clientY)
      const world = clientToBoard(board, event.clientX, event.clientY)
      const others = placedRef.current.filter((head) => head.id !== current.token.id)
      const spot =
        lifted && overBoard && world
          ? nearestPlace(puzzle, others, world.x, world.y)
          : null
      const next: DragState = {
        ...current,
        lifted,
        overBoard,
        valid: Boolean(spot),
        x: spot?.x ?? world?.x ?? current.x,
        y: spot?.y ?? world?.y ?? current.y,
        clientX: event.clientX,
        clientY: event.clientY,
      }
      dragRef.current = next
      setDrag(next)
    }

    function onUp(event: PointerEvent) {
      const current = dragRef.current
      const board = svgRef.current
      const puzzle = levelRef.current
      if (!current || !board || !puzzle) return
      dragRef.current = null
      setDrag(null)

      if (!current.lifted) {
        if (current.source === 'board') setSelectedId(current.token.id)
        else setArmedId(current.token.id)
        return
      }

      const overBoard = pointerOverBoard(board, event.clientX, event.clientY)
      const world = clientToBoard(board, event.clientX, event.clientY)
      const others = placedRef.current.filter((head) => head.id !== current.token.id)
      const spot =
        world && overBoard ? nearestPlace(puzzle, others, world.x, world.y) : null
      if (spot) {
        setPlaced((list) => [
          ...list.filter((head) => head.id !== current.token.id),
          { ...current.token, x: spot.x, y: spot.y },
        ])
        setSelectedId(current.token.id)
        setArmedId(null)
        setNote(null)
        return
      }

      if (current.source === 'board' && current.home && overBoard) {
        setPlaced((list) => [
          ...list.filter((head) => head.id !== current.token.id),
          { ...current.token, x: current.home!.x, y: current.home!.y },
        ])
        setSelectedId(current.token.id)
        setNote('Walls block that spot. The head stayed where it was.')
        return
      }

      setTray((list) =>
        list.some((item) => item.id === current.token.id)
          ? list
          : [...list, current.token],
      )
      setPlaced((list) => list.filter((head) => head.id !== current.token.id))
      setSelectedId(null)
      setNote('Walls block that spot. Drop the head in an open corridor.')
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  function beginDrag(
    event: ReactPointerEvent,
    token: HeadToken,
    source: 'tray' | 'board',
    home: { x: number; y: number } | null,
  ) {
    if (lighting) return
    event.preventDefault()
    event.stopPropagation()
    const next: DragState = {
      token,
      source,
      home,
      x: home?.x ?? 0,
      y: home?.y ?? 0,
      valid: false,
      overBoard: false,
      clientX: event.clientX,
      clientY: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      lifted: false,
    }
    dragRef.current = next
    setDrag(next)
    setNote(null)
    if (source === 'board') setSelectedId(token.id)
  }

  const nudge = useCallback(
    (dx: number, dy: number) => {
      if (lighting || selectedId === null) return
      setPlaced((list) =>
        list.map((head, index) => {
          if (head.id !== selectedId) return head
          const x = head.x + dx
          const y = head.y + dy
          if (!canPlaceHead(level, list, x, y, index)) return head
          return { ...head, x, y }
        }),
      )
    },
    [level, lighting, selectedId],
  )

  const pickUp = useCallback(
    (id: number) => {
      if (lighting) return
      const head = placed.find((item) => item.id === id)
      if (!head) return
      setPlaced((list) => list.filter((item) => item.id !== id))
      setTray((list) => [...list, { id: head.id, variant: head.variant }])
      setSelectedId(null)
    },
    [lighting, placed],
  )

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (selectedId === null || lighting) return
      const step = event.shiftKey ? 0.015 : 0.045
      const deltas: Record<string, { x: number; y: number } | undefined> = {
        ArrowUp: { x: 0, y: -step },
        ArrowDown: { x: 0, y: step },
        ArrowLeft: { x: -step, y: 0 },
        ArrowRight: { x: step, y: 0 },
      }
      const delta = deltas[event.key]
      if (delta) {
        event.preventDefault()
        nudge(delta.x, delta.y)
        return
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        pickUp(selectedId)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lighting, nudge, pickUp, selectedId])

  function restart() {
    dragRef.current = null
    setDrag(null)
    setSelectedId(null)
    setArmedId(null)
    setNote(null)
    setPlaced([])
    setTray(createTray(level))
  }

  function placeArmed(event: ReactPointerEvent<SVGRectElement>) {
    const token = tray.find((item) => item.id === armedId)
    const board = svgRef.current
    if (!token || !board || lighting) {
      setSelectedId(null)
      setArmedId(null)
      return
    }
    const world = clientToBoard(board, event.clientX, event.clientY)
    const spot = world ? nearestPlace(level, placed, world.x, world.y) : null
    if (!spot) {
      setNote('Walls block that spot. Click an open corridor.')
      return
    }
    setTray((list) => list.filter((item) => item.id !== token.id))
    setPlaced((list) => [...list, { ...token, x: spot.x, y: spot.y }])
    setSelectedId(token.id)
    setArmedId(null)
    setNote(null)
  }

  function goForward() {
    dragRef.current = null
    setProgress((current) => {
      const next = current.current + 1
      return { current: next, highest: Math.max(current.highest, next) }
    })
  }

  function goBack() {
    dragRef.current = null
    setProgress((current) => ({
      ...current,
      current: Math.max(1, current.current - 1),
    }))
  }

  const selected = placed.some((head) => head.id === selectedId)
  const ghost = drag?.lifted && !drag.overBoard ? drag : null

  return (
    <section className="wml">
      <header className="wml-hero">
        <div>
          <p className="wml-kicker">Mini game</p>
          <h1>Where&apos;s My Light?</h1>
          <p className="wml-help">
            Drag a bald head into the maze, or select one and click a corridor. Nudge it
            so the beam glances off the curve of the scalp and lands on the cat. Extra
            heads can stay in the tray.
          </p>
        </div>
        <div className="wml-pills">
          <span className="wml-pill">Level {level.level}</span>
          <span className="wml-pill">Best {progress.highest}</span>
        </div>
      </header>

      <div className={drag?.lifted ? 'wml-stage is-dragging' : 'wml-stage'}>
        <Board
          level={level}
          beam={beam}
          heads={placed}
          drag={drag}
          selectedId={selectedId}
          svgRef={svgRef}
          onFloorPointerDown={(event) => {
            if (armedId === null) {
              setSelectedId(null)
              return
            }
            placeArmed(event)
          }}
          onHeadPointerDown={(event, head) =>
            beginDrag(event, head, 'board', { x: head.x, y: head.y })
          }
        />
        {lighting ? (
          <div className="wml-win">
            <div>
              <h2>The cat is lit</h2>
              <p>That shiny scalp sent the beam home.</p>
            </div>
            <button type="button" className="wml-button primary" onClick={goForward}>
              Next level
            </button>
          </div>
        ) : null}
      </div>

      <div className="wml-bar">
        <div
          className={drag?.lifted ? 'wml-tray is-hot' : 'wml-tray'}
          aria-label="Heads to place"
        >
          {tray.length === 0 ? (
            <p className="wml-tray-empty">All heads are on the board.</p>
          ) : (
            tray.map((token) => (
              <button
                key={token.id}
                type="button"
                className={token.id === armedId ? 'wml-token is-armed' : 'wml-token'}
                draggable={false}
                aria-label={`${headVariantLabel(token.variant)}. Drag it onto the maze.`}
                onPointerDown={(event) => beginDrag(event, token, 'tray', null)}
              >
                <svg viewBox="-1.15 -1.15 2.3 2.3" aria-hidden="true">
                  <BaldHead variant={token.variant} />
                </svg>
              </button>
            ))
          )}
        </div>

        <div className="wml-actions">
          <div className="wml-nudge" aria-label="Nudge the selected head">
            <button
              type="button"
              className="wml-button icon"
              aria-label="Nudge up"
              disabled={!selected || lighting}
              onClick={() => nudge(0, -0.045)}
            >
              ↑
            </button>
            <button
              type="button"
              className="wml-button icon"
              aria-label="Nudge left"
              disabled={!selected || lighting}
              onClick={() => nudge(-0.045, 0)}
            >
              ←
            </button>
            <button
              type="button"
              className="wml-button icon"
              aria-label="Nudge down"
              disabled={!selected || lighting}
              onClick={() => nudge(0, 0.045)}
            >
              ↓
            </button>
            <button
              type="button"
              className="wml-button icon"
              aria-label="Nudge right"
              disabled={!selected || lighting}
              onClick={() => nudge(0.045, 0)}
            >
              →
            </button>
          </div>
          <button
            type="button"
            className="wml-button"
            disabled={!selected || lighting}
            onClick={() => {
              if (selectedId !== null) pickUp(selectedId)
            }}
          >
            Pick up
          </button>
          <button type="button" className="wml-button" onClick={restart}>
            Restart level
          </button>
          {progress.current > 1 ? (
            <button type="button" className="wml-button" onClick={goBack}>
              Previous level
            </button>
          ) : null}
          {progress.current < progress.highest && !lighting ? (
            <button type="button" className="wml-button" onClick={goForward}>
              Next level
            </button>
          ) : null}
        </div>
      </div>

      <p className="wml-status" role="status">
        {note && !beam.hitCat
          ? note
          : beam.hitCat
            ? 'The beam touches the cat.'
            : `${beam.bounces} ${beam.bounces === 1 ? 'bounce' : 'bounces'} so far. Arrow keys nudge the selected head.`}
      </p>

      {ghost ? (
        <div className="wml-ghost" style={{ left: ghost.clientX, top: ghost.clientY }}>
          <svg viewBox="-1.15 -1.15 2.3 2.3" aria-hidden="true">
            <BaldHead variant={ghost.token.variant} />
          </svg>
        </div>
      ) : null}
    </section>
  )
}
