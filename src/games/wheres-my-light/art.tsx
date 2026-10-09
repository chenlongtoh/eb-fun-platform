import { useId } from 'react'
import { HEAD_LOOKS } from './variants.ts'

function Eye({
  cx,
  cy,
  px,
  py,
  r = 0.22,
}: {
  cx: number
  cy: number
  px: number
  py: number
  r?: number
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fffdf8" />
      <circle cx={cx + px} cy={cy + py} r={r * 0.48} fill="#1c1915" />
      <circle
        cx={cx + px - r * 0.16}
        cy={cy + py - r * 0.18}
        r={r * 0.16}
        fill="#fff"
      />
    </g>
  )
}

function Expression({ variant }: { variant: number }) {
  const index = variant % HEAD_LOOKS.length

  if (index === 1) {
    return (
      <g>
        <Eye cx={-0.28} cy={-0.08} px={-0.07} py={0.02} />
        <Eye cx={0.3} cy={-0.12} px={-0.06} py={0.04} r={0.2} />
        <path d="M-0.38 0.28 Q0 0.78 0.4 0.26 Q0 0.46 -0.38 0.28 Z" fill="#3a241c" />
        <rect x="-0.16" y="0.34" width="0.12" height="0.12" rx="0.02" fill="#fff" />
        <rect x="0.05" y="0.34" width="0.12" height="0.12" rx="0.02" fill="#fff" />
      </g>
    )
  }

  if (index === 2) {
    return (
      <g>
        <path
          d="M-0.48 -0.34 Q-0.28 -0.48 -0.08 -0.3"
          fill="none"
          stroke="#3a241c"
          strokeWidth="0.045"
          strokeLinecap="round"
        />
        <Eye cx={-0.28} cy={-0.02} px={0.07} py={-0.02} />
        <Eye cx={0.3} cy={-0.16} px={-0.02} py={0.08} r={0.18} />
        <path
          d="M-0.22 0.4 Q0.12 0.46 0.36 0.28"
          fill="none"
          stroke="#3a241c"
          strokeWidth="0.055"
          strokeLinecap="round"
        />
      </g>
    )
  }

  if (index === 3) {
    return (
      <g>
        <path
          d="M-0.48 -0.08 Q-0.28 0.08 -0.08 -0.06"
          fill="none"
          stroke="#3a241c"
          strokeWidth="0.07"
          strokeLinecap="round"
        />
        <Eye cx={0.3} cy={-0.1} px={0.02} py={0.05} />
        <path d="M-0.16 0.32 H0.2 Q0.12 0.62 -0.16 0.46 Z" fill="#3a241c" />
        <rect x="-0.1" y="0.32" width="0.1" height="0.16" rx="0.02" fill="#fff" />
        <rect x="0.04" y="0.32" width="0.1" height="0.16" rx="0.02" fill="#fff" />
      </g>
    )
  }

  if (index === 4) {
    return (
      <g>
        <Eye cx={-0.28} cy={-0.08} px={0.06} py={-0.06} />
        <Eye cx={0.3} cy={-0.08} px={-0.07} py={0.05} />
        <path
          d="M-0.28 0.4 Q-0.1 0.28 0.02 0.42 Q0.16 0.56 0.32 0.36"
          fill="none"
          stroke="#3a241c"
          strokeWidth="0.055"
          strokeLinecap="round"
        />
      </g>
    )
  }

  return (
    <g>
      <Eye cx={-0.28} cy={-0.1} px={-0.06} py={-0.05} />
      <Eye cx={0.32} cy={-0.06} px={0.06} py={0.04} r={0.2} />
      <ellipse cx="0.02" cy="0.34" rx="0.16" ry="0.12" fill="#6b3038" />
      <ellipse cx="0.04" cy="0.46" rx="0.11" ry="0.14" fill="#ef5d78" />
    </g>
  )
}

export function BaldHead({ variant }: { variant: number }) {
  const uid = useId().replace(/:/g, '')
  const look = HEAD_LOOKS[variant % HEAD_LOOKS.length] ?? HEAD_LOOKS[0]

  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-skin`} cx="32%" cy="28%" r="75%">
          <stop offset="0%" stopColor={look.hi} />
          <stop offset="58%" stopColor={look.mid} />
          <stop offset="100%" stopColor={look.lo} />
        </radialGradient>
      </defs>
      <circle r="1" fill={`url(#${uid}-skin)`} />
      <ellipse
        cx="-0.32"
        cy="-0.46"
        rx="0.28"
        ry="0.16"
        fill="#fff"
        opacity="0.88"
        transform="rotate(-28 -0.32 -0.46)"
      />
      <ellipse cx="-0.42" cy="-0.52" rx="0.08" ry="0.045" fill="#fff" />
      <Expression variant={variant} />
    </g>
  )
}

export function Cat({ lit }: { lit: boolean }) {
  const eye = lit ? '#ffe56a' : '#d5e48a'
  return (
    <g>
      <ellipse cx="0" cy="0.78" rx="0.42" ry="0.12" fill="#05060a" opacity="0.35" />
      <path
        d="M0.42 0.28c0.42 0.15 0.5-0.32 0.22-0.48"
        fill="none"
        stroke="#140f18"
        strokeWidth="0.14"
        strokeLinecap="round"
      />
      <ellipse cx="0.02" cy="0.28" rx="0.5" ry="0.36" fill="#1b1522" />
      <circle cx="0" cy="-0.12" r="0.58" fill="#120e16" />
      <path d="M-0.36 -0.48 L-0.58 -0.92 L-0.08 -0.52 Z" fill="#120e16" />
      <path d="M0.32 -0.46 L0.6 -0.9 L0.08 -0.5 Z" fill="#120e16" />
      <path d="M-0.32 -0.5 L-0.46 -0.74 L-0.14 -0.52 Z" fill="#f0a3b8" />
      <path d="M0.28 -0.48 L0.46 -0.72 L0.12 -0.5 Z" fill="#f0a3b8" />
      <ellipse cx="-0.2" cy="-0.12" rx="0.18" ry="0.22" fill={eye} />
      <ellipse cx="0.2" cy="-0.12" rx="0.18" ry="0.22" fill={eye} />
      <ellipse cx="-0.2" cy="-0.08" rx="0.07" ry="0.11" fill="#1a1420" />
      <ellipse cx="0.2" cy="-0.08" rx="0.07" ry="0.11" fill="#1a1420" />
      <circle cx="-0.24" cy="-0.18" r="0.04" fill="#fff" />
      <circle cx="0.16" cy="-0.18" r="0.04" fill="#fff" />
      <path d="M-0.05 0.1 L0.06 0.1 L0.005 0.18 Z" fill="#f3a9be" />
      <path
        d="M0 0.16 Q-0.12 0.28 -0.18 0.16"
        fill="none"
        stroke="#f3a9be"
        strokeWidth="0.04"
        strokeLinecap="round"
      />
      <path
        d="M0 0.16 Q0.12 0.28 0.18 0.16"
        fill="none"
        stroke="#f3a9be"
        strokeWidth="0.04"
        strokeLinecap="round"
      />
      {lit ? (
        <circle
          r="1.04"
          fill="none"
          stroke="#ffe7a8"
          strokeWidth="0.07"
          opacity="0.95"
        />
      ) : null}
    </g>
  )
}

export function Lamp() {
  return (
    <g>
      <circle r="0.2" fill="#fff6d8" />
      <circle r="0.12" fill="#ffd56a" />
      <circle cx="-0.04" cy="-0.05" r="0.045" fill="#fff" opacity="0.95" />
      <path d="M0.16 0 L0.34 0.09 L0.34 -0.09 Z" fill="#ffe7a8" />
    </g>
  )
}
