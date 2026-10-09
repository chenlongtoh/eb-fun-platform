import { useId, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { BaldHead, Cat, Lamp } from './art.tsx'
import type { DragState, Level, PlacedHead, TraceResult, Vec } from './types.ts'

interface BoardProps {
  level: Level
  beam: TraceResult
  heads: readonly PlacedHead[]
  drag: DragState | null
  selectedId: number | null
  svgRef: RefObject<SVGSVGElement | null>
  onFloorPointerDown: (event: ReactPointerEvent<SVGRectElement>) => void
  onHeadPointerDown: (event: ReactPointerEvent<SVGGElement>, head: PlacedHead) => void
}

function polyline(points: readonly Vec[]): string {
  return points.map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`).join(' ')
}

export function Board({
  level,
  beam,
  heads,
  drag,
  selectedId,
  svgRef,
  onFloorPointerDown,
  onHeadPointerDown,
}: BoardProps) {
  const uid = useId().replace(/:/g, '')
  const pad = 0.2
  const points = polyline(beam.points)
  const angle = (Math.atan2(level.light.dy, level.light.dx) * 180) / Math.PI
  const preview =
    drag?.lifted && drag.overBoard
      ? { x: drag.x, y: drag.y, variant: drag.token.variant, valid: drag.valid }
      : null

  return (
    <svg
      ref={svgRef}
      viewBox={`${-pad} ${-pad} ${level.cols + pad * 2} ${level.rows + pad * 2}`}
      preserveAspectRatio="xMidYMid meet"
      role="application"
      aria-label={
        beam.hitCat
          ? 'The beam reaches the cat'
          : 'Maze. Drag bald heads to aim the beam.'
      }
    >
      <defs>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#ffb15a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffb15a" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-beam`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.04" />
        </filter>
      </defs>

      <rect
        x={-pad}
        y={-pad}
        width={level.cols + pad * 2}
        height={level.rows + pad * 2}
        fill="#121722"
        onPointerDown={onFloorPointerDown}
      />

      {Array.from({ length: level.rows }, (_, y) =>
        Array.from({ length: level.cols }, (_, x) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="1"
            height="1"
            fill={(x + y) % 2 === 0 ? '#1a2230' : '#202838'}
            pointerEvents="none"
          />
        )),
      )}

      <g pointerEvents="none">
        <circle
          cx={level.light.x}
          cy={level.light.y}
          r="1.35"
          fill={`url(#${uid}-glow)`}
        />
        <polyline
          points={points}
          fill="none"
          stroke="#ffb347"
          strokeWidth="0.16"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${uid}-beam)`}
          opacity="0.9"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#ffe7a8"
          strokeWidth="0.07"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          className="wml-beam-core"
          points={points}
          fill="none"
          stroke="#fffaf0"
          strokeWidth="0.025"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <g transform={`translate(${level.cat.x} ${level.cat.y}) scale(${level.cat.r})`}>
          <Cat lit={beam.hitCat} />
        </g>

        {heads.map((head) => (
          <ellipse
            key={`shadow-${head.id}`}
            cx={head.x}
            cy={head.y + level.headRadius * 0.82}
            rx={level.headRadius * 0.72}
            ry={level.headRadius * 0.22}
            fill="#05070c"
            opacity="0.35"
          />
        ))}
      </g>

      {heads.map((head) => {
        const selected = head.id === selectedId
        return (
          <g
            key={head.id}
            className="wml-head"
            transform={`translate(${head.x} ${head.y}) scale(${level.headRadius})`}
            onPointerDown={(event) => onHeadPointerDown(event, head)}
          >
            {selected ? (
              <circle r="1.18" fill="none" stroke="#ffe7a3" strokeWidth="0.08" />
            ) : null}
            <circle r="1.35" fill="transparent" />
            <BaldHead variant={head.variant} />
          </g>
        )
      })}

      {preview ? (
        <g
          pointerEvents="none"
          transform={`translate(${preview.x} ${preview.y}) scale(${level.headRadius})`}
        >
          <circle
            r="1.18"
            fill="none"
            stroke={preview.valid ? '#ffe7a3' : '#ff5d3a'}
            strokeWidth="0.09"
          />
          <BaldHead variant={preview.variant} />
        </g>
      ) : null}

      <g pointerEvents="none" strokeLinecap="round">
        {level.walls.map((wall, index) => (
          <line
            key={`shade-${index}`}
            x1={wall.x1}
            y1={wall.y1}
            x2={wall.x2}
            y2={wall.y2}
            stroke="#07090e"
            strokeWidth="0.16"
          />
        ))}
        {level.walls.map((wall, index) => (
          <line
            key={`wall-${index}`}
            x1={wall.x1}
            y1={wall.y1}
            x2={wall.x2}
            y2={wall.y2}
            stroke="#f4ecdf"
            strokeWidth="0.075"
          />
        ))}
        <g transform={`translate(${level.light.x} ${level.light.y}) rotate(${angle})`}>
          <Lamp />
        </g>
      </g>
    </svg>
  )
}
