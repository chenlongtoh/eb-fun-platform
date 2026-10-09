import type { RefObject } from 'react'
import genieTorso from './assets/genie-torso.png'

interface GenieProps {
  torsoRef: RefObject<SVGGElement | null>
  bubbleRef: RefObject<HTMLDivElement | null>
  badgeRef: RefObject<HTMLDivElement | null>
  bubble: string
  bubbleSpecial: boolean
  badgeClass: string
  badgeIcon: string
  badgeLabel: string
  note: string
  meter: number
  meterLabel: string
  motion: string
  popped: boolean
}

export function Genie({
  torsoRef,
  bubbleRef,
  badgeRef,
  bubble,
  bubbleSpecial,
  badgeClass,
  badgeIcon,
  badgeLabel,
  note,
  meter,
  meterLabel,
  motion,
  popped,
}: GenieProps) {
  return (
    <section className="stage">
      <div className="genie-wrap">
        <svg className="genie" viewBox="0 0 360 700" role="img" aria-label="The genie">
          <defs>
            <linearGradient id="psTailGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7ff3ff" stopOpacity="0" />
              <stop offset="0.08" stopColor="#6fe6f5" stopOpacity="0.85" />
              <stop offset="0.45" stopColor="#3fb6e0" stopOpacity="0.9" />
              <stop offset="0.8" stopColor="#7a5cf0" stopOpacity="0.85" />
              <stop offset="1" stopColor="#c39bff" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="psTailGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e8fdff" stopOpacity="0" />
              <stop offset="0.15" stopColor="#e8fdff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.2" />
            </linearGradient>
            <radialGradient id="psPuffGrad" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#9ff6ff" stopOpacity="0.75" />
              <stop offset="0.6" stopColor="#5ccfe8" stopOpacity="0.35" />
              <stop offset="1" stopColor="#5ccfe8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="psAuraGrad" cx="0.5" cy="0.45" r="0.5">
              <stop offset="0" stopColor="#7fe9ff" stopOpacity="0.35" />
              <stop offset="0.6" stopColor="#8a5cff" stopOpacity="0.12" />
              <stop offset="1" stopColor="#8a5cff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="psGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff2b0" />
              <stop offset="0.35" stopColor="#f3c74b" />
              <stop offset="0.75" stopColor="#b97c13" />
              <stop offset="1" stopColor="#6f4307" />
            </linearGradient>
            <filter id="psSmoke" x="-40%" y="-15%" width="180%" height="130%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.011 0.028"
                numOctaves="3"
                seed="7"
                result="noise"
              >
                <animate
                  attributeName="baseFrequency"
                  dur="14s"
                  values="0.011 0.028;0.015 0.036;0.011 0.028"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="30"
                xChannelSelector="R"
                yChannelSelector="G"
                result="d"
              />
              <feGaussianBlur in="d" stdDeviation="2.4" />
            </filter>
            <filter id="psWisp" x="-50%" y="-20%" width="200%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012 0.03"
                numOctaves="2"
                seed="2"
                result="n"
              >
                <animate
                  attributeName="baseFrequency"
                  dur="9s"
                  values="0.012 0.03;0.018 0.022;0.012 0.03"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale="16"
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feGaussianBlur stdDeviation="2.6" />
            </filter>
            <filter id="psSmokeSoft" x="-40%" y="-60%" width="180%" height="220%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.02 0.05"
                numOctaves="2"
                seed="11"
                result="n2"
              >
                <animate
                  attributeName="baseFrequency"
                  dur="7s"
                  values="0.02 0.05;0.026 0.04;0.02 0.05"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap
                in="SourceGraphic"
                in2="n2"
                scale="26"
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <filter id="psSoft">
              <feGaussianBlur stdDeviation="10" />
            </filter>
            <filter id="psGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="b" />
              <feFlood floodColor="#6ff0ff" floodOpacity="0.55" />
              <feComposite in2="b" operator="in" result="g" />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="psFadeTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.24" stopColor="#fff" stopOpacity="1" />
              <stop offset="1" stopColor="#fff" stopOpacity="1" />
            </linearGradient>
            <mask
              id="psTailMask"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="360"
              height="700"
            >
              <rect x="0" y="300" width="360" height="400" fill="url(#psFadeTop)" />
            </mask>
          </defs>

          <ellipse
            cx="180"
            cy="330"
            rx="175"
            ry="300"
            fill="url(#psAuraGrad)"
            className="aura"
          />

          <g mask="url(#psTailMask)">
            <g filter="url(#psSmoke)">
              <path id="psTailBody" fill="url(#psTailGrad)">
                <animate
                  attributeName="d"
                  dur="4.2s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                  values="M70 318 C46 410 118 462 150 494 C186 530 100 548 104 584 C106 600 108 610 110 616 C138 604 222 570 206 506 C194 466 290 420 272 318 Z;M70 306 C44 400 122 458 154 492 C190 530 100 548 104 584 C106 600 108 610 110 616 C138 604 226 570 210 504 C198 462 292 410 272 306 Z;M70 318 C46 410 118 462 150 494 C186 530 100 548 104 584 C106 600 108 610 110 616 C138 604 222 570 206 506 C194 466 290 420 272 318 Z"
                />
              </path>
            </g>
            <g
              filter="url(#psWisp)"
              fill="none"
              strokeLinecap="round"
              className="strands"
            >
              <path
                className="strand s1"
                stroke="url(#psTailGrad2)"
                strokeWidth="7"
                d="M100 380 C84 440 150 470 168 500 C190 536 120 556 112 612"
              />
              <path
                className="strand s2"
                stroke="#bff8ff"
                strokeOpacity="0.45"
                strokeWidth="5"
                d="M244 380 C262 440 196 462 182 500 C168 540 150 570 112 614"
              />
              <path
                className="strand s3"
                stroke="#d9c4ff"
                strokeOpacity="0.5"
                strokeWidth="5"
                d="M172 390 C124 430 212 462 152 505 C104 545 140 580 112 614"
              />
              <path
                className="strand s4"
                stroke="#ffffff"
                strokeOpacity="0.35"
                strokeWidth="4"
                d="M214 396 C252 450 140 476 160 520 C172 556 128 584 112 614"
              />
            </g>
          </g>

          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              dur="4.2s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.5;1"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
              values="0 0;0 -12;0 0"
            />
            <g ref={torsoRef} className={motion ? `torso ${motion}` : 'torso'}>
              <image
                href={genieTorso}
                x="55"
                y="12"
                width="250"
                height="452"
                filter="url(#psGlow)"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
            <g filter="url(#psSmokeSoft)" className="waist-puffs">
              <ellipse cx="168" cy="448" rx="100" ry="30" fill="url(#psPuffGrad)" />
              <ellipse
                cx="118"
                cy="438"
                rx="50"
                ry="24"
                fill="url(#psPuffGrad)"
                opacity="0.8"
              />
              <ellipse
                cx="222"
                cy="440"
                rx="54"
                ry="24"
                fill="url(#psPuffGrad)"
                opacity="0.8"
              />
            </g>
          </g>

          <g className="sparkles" fill="#e9fbff">
            <circle cx="112" cy="612" r="2.2" className="sp sp1" />
            <circle cx="118" cy="606" r="1.6" className="sp sp2" />
            <circle cx="106" cy="608" r="1.8" className="sp sp3" />
            <circle cx="124" cy="600" r="1.4" className="sp sp4" />
            <circle cx="110" cy="598" r="1.5" className="sp sp5" />
          </g>

          <g className="lamp">
            <ellipse cx="214" cy="692" rx="80" ry="7" fill="#000" opacity="0.4" />
            <path
              d="M188 676 L242 676 L252 690 L178 690 Z"
              fill="url(#psGold)"
              stroke="#5a3606"
              strokeWidth="1.2"
            />
            <path
              d="M276 646 C306 640 314 612 294 606 C282 603 274 616 270 630"
              fill="none"
              stroke="url(#psGold)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M276 646 C306 640 314 612 294 606 C282 603 274 616 270 630"
              fill="none"
              stroke="#5a3606"
              strokeWidth="1"
              opacity="0.5"
            />
            <path
              d="M160 650 C140 648 124 636 112 620 C108 614 103 615 105 621 C114 644 132 664 166 668 Z"
              fill="url(#psGold)"
              stroke="#5a3606"
              strokeWidth="1.2"
            />
            <path
              d="M150 636 C162 626 268 626 280 636 C286 664 254 680 215 680 C176 680 144 664 150 636 Z"
              fill="url(#psGold)"
              stroke="#5a3606"
              strokeWidth="1.4"
            />
            <path
              d="M162 646 C180 670 250 670 268 646"
              fill="none"
              stroke="#fff3c0"
              strokeOpacity="0.55"
              strokeWidth="2.5"
            />
            <ellipse
              cx="215"
              cy="632"
              rx="40"
              ry="8"
              fill="url(#psGold)"
              stroke="#5a3606"
              strokeWidth="1.2"
            />
            <path
              d="M192 630 C194 610 236 610 238 630 Z"
              fill="url(#psGold)"
              stroke="#5a3606"
              strokeWidth="1.2"
            />
            <circle
              cx="215"
              cy="607"
              r="5"
              fill="#ffe27a"
              stroke="#5a3606"
              strokeWidth="1"
            />
            <ellipse cx="200" cy="652" rx="14" ry="5" fill="#fffbe0" opacity="0.55" />
          </g>
        </svg>

        <div className="bubble-row">
          <div
            ref={bubbleRef}
            className={`bubble${bubbleSpecial ? ' special' : ''}${popped ? ' pop' : ''}`}
            aria-live="polite"
          >
            {bubble}
          </div>
          <div ref={badgeRef} className={`${badgeClass}${popped ? ' pop' : ''}`}>
            <span className="ico">{badgeIcon}</span>
            <span className="txt">{badgeLabel}</span>
          </div>
        </div>
        <p className="genie-note">{note}</p>
      </div>
      <div className="meter" title="How close you are (the genie will not say exactly)">
        <div className="meter-label">{meterLabel}</div>
        <div className="meter-bar">
          <div className="meter-fill" style={{ width: `${meter}%` }} />
        </div>
      </div>
    </section>
  )
}
