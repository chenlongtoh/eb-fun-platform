import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, RefObject } from 'react'
import { createGameStorage } from '@/shared/storage.ts'
import './game.css'
import {
  ATTRS,
  CAT_NAMES,
  Game as PlayGame,
  SUBJECTS,
  matchSubject,
  norm,
} from './engine.ts'
import type { Attribute, HistoryEntry, SavedGame } from './types.ts'
import { Genie } from './Genie.tsx'
import { GameTitle, gameTitle } from './Title.tsx'

const saves = createGameStorage('reverse-akinator')
const SAVE_KEY = 'progress'

const SOUNDS = [
  'En...',
  'Mmm..',
  'Hor..',
  'Ah',
  'Orh..',
  'Eh..',
  'Hmm...',
  'Aiyo..',
  'Wah..',
  'Haiz..',
  'Lor..',
  'Ah ha..',
  'Ok lah..',
  'Ya lor..',
]
const SPECIAL = ['Vinijaya', 'Ganesha']
const ICONS: Record<string, string> = {
  egg: '🍛',
  yes: '✔',
  probably: '◕',
  unknown: '?',
  probably_not: '◔',
  no: '✖',
  cant: '∅',
  correct: '★',
  wrong: '✖',
  intro: '✦',
  reveal: '☾',
  ready: '✦',
}
const MOTION: Record<string, string> = {
  egg: 'cheer',
  yes: 'nod',
  probably: 'nod',
  probably_not: 'shake',
  no: 'shake',
  unknown: 'wobble',
  cant: 'wobble',
  wrong: 'shake',
  correct: 'cheer',
  reveal: 'wobble',
}
const NOTES_CANT = [
  'I cannot answer that, mortal. Try another…',
  'Such riddles are beyond my lamp, mortal. Ask differently…',
  'That question swirls into smoke. Try one of these…',
]
const CONFETTI_COLORS = ['#7ff0ff', '#f3c74b', '#b388ff', '#ff7ab6', '#3ddc84']

interface View {
  phase: 'start' | 'play' | 'end'
  bubble: string
  bubbleSpecial: boolean
  badge: string
  badgeLabel: string
  note: string
  motion: string
  anim: number
  chips: Attribute[]
  related: string[]
  meter: number
  meterLabel: string
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

function genieSound(force = false): { text: string; special: boolean } {
  const special = force || Math.random() < 0.15
  return { text: pick(special ? SPECIAL : SOUNDS), special }
}

function moodText(remaining: number, total: number): string {
  if (remaining <= 1) return "The genie is sweating… you know it, don't you?"
  const confidence = 1 - Math.log(remaining) / Math.log(total)
  if (confidence < 0.15) return 'The genie looks smug'
  if (confidence < 0.35) return 'The genie strokes his chin'
  if (confidence < 0.55) return 'The genie shifts uneasily'
  if (confidence < 0.75) return "The genie's smoke flickers nervously"
  return 'The genie is getting very nervous!'
}

function meterOf(game: PlayGame): { meter: number; meterLabel: string } {
  const remaining = game.candidates.length
  const total = SUBJECTS.length
  let confidence = remaining <= 1 ? 1 : 1 - Math.log(remaining) / Math.log(total)
  confidence = Math.max(
    0.04,
    Math.min(1, confidence * 0.92 + (Math.random() - 0.5) * 0.06),
  )
  return { meter: Math.round(confidence * 100), meterLabel: moodText(remaining, total) }
}

function startView(): View {
  return {
    phase: 'start',
    bubble: 'Hor..',
    bubbleSpecial: false,
    badge: 'ready',
    badgeLabel: 'Ready',
    note: 'I have chosen something, mortal. Ask, and I shall answer.',
    motion: '',
    anim: 0,
    chips: [],
    related: [],
    meter: 5,
    meterLabel: 'The genie looks smug',
  }
}

function withSpeech(
  view: View,
  badge: string,
  label: string,
  note: string,
  forceSpecial = false,
): { view: View; sound: string } {
  const sound = genieSound(forceSpecial)
  return {
    sound: sound.text,
    view: {
      ...view,
      bubble: sound.text,
      bubbleSpecial: sound.special,
      badge,
      badgeLabel: label,
      note,
      motion: MOTION[badge] ?? '',
      anim: view.anim + 1,
    },
  }
}

function playSnapshot(game: PlayGame, speech: View): View {
  return {
    ...speech,
    phase: 'play',
    chips: game.suggest(5),
    related: [],
    ...meterOf(game),
  }
}

function loadSaved(): PlayGame | null {
  try {
    const raw = saves.get(SAVE_KEY)
    if (!raw) return null
    return PlayGame.fromJSON(JSON.parse(raw) as SavedGame)
  } catch {
    saves.remove(SAVE_KEY)
    return null
  }
}

function persist(game: PlayGame) {
  try {
    saves.set(SAVE_KEY, JSON.stringify(game.toJSON()))
  } catch {
    // A full or blocked store should not stop the round.
  }
}

function secretFromLocation(): { present: boolean; id?: number } {
  const match = /[?&]secret=([^&]+)/.exec(window.location.search)
  const raw = match?.[1]
  if (!raw) return { present: false }
  const key = decodeURIComponent(raw)
  if (/^\d+$/.test(key)) {
    const subject = SUBJECTS[Number(key)]
    return { present: true, id: subject?.id }
  }
  return { present: true, id: matchSubject(key)?.subject.id }
}

function restoredView(game: PlayGame): View {
  const last = game.history[game.history.length - 1]
  const base = startView()
  const phase = game.over ? 'end' : 'play'
  const note = game.over
    ? game.won
      ? `You have unmasked my secret: ${game.secret.name}!`
      : `Hah! It was ${game.secret.name} all along.`
    : last
      ? `You asked: ${last.q}`
      : base.note
  return {
    ...base,
    phase,
    bubble: last?.sound || (phase === 'play' ? 'Hor..' : base.bubble),
    bubbleSpecial: last?.sound === 'Vinijaya' || last?.sound === 'Ganesha',
    badge: last?.answer || (phase === 'play' ? 'intro' : 'ready'),
    badgeLabel: last?.label || (phase === 'play' ? 'Secret chosen' : 'Ready'),
    note,
    chips: phase === 'play' ? game.suggest(5) : [],
    ...meterOf(game),
  }
}

function createInitial(): { game: PlayGame | null; view: View } {
  const secret = secretFromLocation()
  if (secret.present && secret.id != null) {
    const game = new PlayGame({ secretId: secret.id })
    const spoken = withSpeech(
      startView(),
      'intro',
      'Secret chosen',
      'I have chosen something, mortal. Ask, and I shall answer.',
    )
    return { game, view: playSnapshot(game, spoken.view) }
  }
  if (!secret.present) {
    const saved = loadSaved()
    if (saved) return { game: saved, view: restoredView(saved) }
  }
  return { game: null, view: startView() }
}

function restart(element: Element | null, className: string) {
  if (!element) return
  element.classList.remove(className)
  void element.getBoundingClientRect()
  element.classList.add(className)
}

function submitOnEnter(event: KeyboardEvent<HTMLInputElement>, submit: () => void) {
  if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
  event.preventDefault()
  submit()
}

function countPhrase(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  let questions = 0
  let guesses = 0
  return (
    <ol className="history">
      {entries.map((entry, index) => {
        const marker =
          entry.type === 'g'
            ? `G${++guesses}`
            : entry.answer === 'cant'
              ? '–'
              : `Q${++questions}`
        const showTyped = entry.typed != null && norm(entry.typed) !== norm(entry.q)
        return (
          <li key={`${index}-${entry.q}`}>
            <span className="n">{marker}</span>
            <span className="q">
              {entry.q}
              {showTyped ? <small>you asked: “{entry.typed}”</small> : null}
            </span>
            <span className="snd">“{entry.sound ?? ''}”</span>
            <span className={`tagh h-${entry.answer}`}>
              {ICONS[entry.answer] ?? ''} {entry.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function clearAndFocus(ref: RefObject<HTMLInputElement | null>, clear: () => void) {
  clear()
  ref.current?.focus()
}

const SUBJECT_NAMES = SUBJECTS.map((subject) => subject.name).sort((a, b) =>
  a.localeCompare(b),
)

function celebrate() {
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement('div')
    piece.className = 'ps-confetti'
    piece.style.left = `${Math.random() * 100}vw`
    piece.style.background = pick(CONFETTI_COLORS)
    piece.style.animationDuration = `${2 + Math.random() * 2.5}s`
    piece.style.animationDelay = `${Math.random() * 0.6}s`
    document.body.appendChild(piece)
    window.setTimeout(() => piece.remove(), 5500)
  }
}

interface Session {
  game: PlayGame | null
  view: View
}

export default function Game() {
  const [session, setSession] = useState<Session>(createInitial)
  const { game, view } = session
  const [askValue, setAskValue] = useState('')
  const [guessValue, setGuessValue] = useState('')
  const askRef = useRef<HTMLInputElement>(null)
  const guessRef = useRef<HTMLInputElement>(null)
  const torsoRef = useRef<SVGGElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const tokenRef = useRef(0)

  useEffect(() => {
    if (game) persist(game)
    return () => {
      tokenRef.current += 1
    }
  }, [game])

  useLayoutEffect(() => {
    if (view.anim === 0) return
    restart(bubbleRef.current, 'pop')
    restart(badgeRef.current, 'pop')
    const torso = torsoRef.current
    if (!torso) return
    for (const name of ['nod', 'shake', 'wobble', 'cheer']) torso.classList.remove(name)
    if (view.motion) restart(torso, view.motion)
  }, [view.anim, view.motion])

  function later(ms: number, run: () => void) {
    const token = tokenRef.current
    window.setTimeout(() => {
      if (token === tokenRef.current) run()
    }, ms)
  }

  function commit(nextGame: PlayGame, next: View) {
    persist(nextGame)
    setSession({ game: nextGame, view: next })
  }

  function speak(
    game: PlayGame,
    badge: string,
    label: string,
    note: string,
    entry?: HistoryEntry,
    forceSpecial = false,
    next?: (speech: View) => View,
  ) {
    const spoken = withSpeech(view, badge, label, note, forceSpecial)
    if (entry) entry.sound = spoken.sound
    commit(game, next ? next(spoken.view) : spoken.view)
  }

  function afterQuestion(game: PlayGame, speech: View): View {
    return {
      ...speech,
      phase: 'play',
      chips: game.over ? speech.chips : game.suggest(5),
      related: [],
      ...meterOf(game),
    }
  }

  function begin(secretId?: number) {
    tokenRef.current += 1
    const game = new PlayGame(secretId != null ? { secretId } : {})
    setAskValue('')
    setGuessValue('')
    const spoken = withSpeech(
      { ...startView(), anim: view.anim },
      'intro',
      'Secret chosen',
      'I have chosen something, mortal. Ask, and I shall answer.',
    )
    commit(game, playSnapshot(game, spoken.view))
  }

  function askKey(key: string) {
    if (!game || game.over) return
    const result = game.ask(key)
    if (!result || result.type === 'over') return
    if (result.repeat) {
      speak(
        game,
        result.answer,
        result.label,
        `You already asked that, mortal – same answer: ${result.label}.`,
      )
      return
    }
    speak(
      game,
      result.answer,
      result.label,
      `You asked: ${result.q}`,
      result,
      false,
      (speech) => afterQuestion(game, speech),
    )
  }

  function askText(text: string) {
    const trimmed = text.trim()
    if (!trimmed || !game || game.over) return
    const result = game.askText(trimmed)
    if (result.type === 'empty' || result.type === 'over') return
    if (result.type === 'eat') {
      speak(
        game,
        'egg',
        'Easter egg',
        "The genie's stomach rumbles… now ask about my secret, mortal.",
        undefined,
        true,
      )
      return
    }
    if (result.type === 'guessRedirect') {
      makeGuess(trimmed)
      return
    }
    if (result.answer === 'cant') {
      const related = result.related ?? []
      speak(
        game,
        'cant',
        "Can't answer",
        pick(NOTES_CANT),
        result,
        false,
        (speech) => ({
          ...speech,
          chips: related,
          related: related.map((attr) => attr.key),
        }),
      )
      return
    }
    if (result.repeat) {
      speak(
        game,
        result.answer,
        result.label,
        `You already asked that, mortal (${result.q}) – same answer.`,
      )
      return
    }
    const opposite = result.inverse ? '  (you asked it the opposite way)' : ''
    speak(
      game,
      result.answer,
      result.label,
      `I understood: ${result.q}${opposite}`,
      result,
      false,
      (speech) => afterQuestion(game, speech),
    )
  }

  function makeGuess(text: string) {
    const trimmed = text.trim()
    if (!trimmed || !game || game.over) return
    const result = game.guess(trimmed)
    if (result.type === 'empty' || result.type === 'over') return
    if (result.type === 'unknownGuess') {
      speak(
        game,
        'cant',
        'Unknown',
        `“${trimmed}”? I know of no such thing, mortal. Guess again…`,
      )
      return
    }
    if (game.won) {
      speak(
        game,
        'correct',
        'Correct!',
        `You have unmasked my secret: ${game.secret.name}!`,
        result,
        false,
        (speech) => afterQuestion(game, speech),
      )
      celebrate()
      later(900, () =>
        setSession((current) => ({
          ...current,
          view: { ...current.view, phase: 'end' },
        })),
      )
      return
    }
    const name = result.subject?.name ?? 'that'
    speak(
      game,
      'wrong',
      'Wrong',
      `It is not ${name}, mortal. Keep asking…`,
      result,
      false,
      (speech) => afterQuestion(game, speech),
    )
  }

  function giveUp() {
    if (!game || game.over) return
    game.giveUp()
    speak(game, 'reveal', 'Revealed', `Hah! It was ${game.secret.name} all along.`)
    later(500, () =>
      setSession((current) => ({
        ...current,
        view: { ...current.view, phase: 'end' },
      })),
    )
  }

  function submitAsk() {
    const text = askValue
    clearAndFocus(askRef, () => setAskValue(''))
    askText(text)
  }

  function submitGuess() {
    const text = guessValue
    clearAndFocus(guessRef, () => setGuessValue(''))
    makeGuess(text)
  }

  const badgeClass =
    view.badge === 'ready' ? 'badge badge-intro' : `badge b-${view.badge}`

  return (
    <div className="ps">
      <div className="stars" aria-hidden="true" />
      <header className="top">
        <h1 className="ps-title" aria-label={gameTitle}>
          <GameTitle />
        </h1>
        <p className="tag">
          The genie has chosen a secret. Ask your questions, mortal… and name it.
        </p>
      </header>

      <div className="game">
        <Genie
          torsoRef={torsoRef}
          bubbleRef={bubbleRef}
          badgeRef={badgeRef}
          bubble={view.bubble}
          bubbleSpecial={view.bubbleSpecial}
          badgeClass={badgeClass}
          badgeIcon={ICONS[view.badge] ?? '✦'}
          badgeLabel={view.badgeLabel}
          note={view.note}
          meter={view.meter}
          meterLabel={view.meterLabel}
          motion={view.motion}
          popped={view.anim > 0}
        />

        <section className="panel">
          {view.phase === 'start' ? (
            <div className="card start">
              <h2>How to play</h2>
              <ol>
                <li>
                  The genie secretly picks a{' '}
                  <b>person, character, animal, food, place or object</b>.
                </li>
                <li>Ask yes/no questions – click a suggestion or type your own.</li>
                <li>
                  He mumbles (he&apos;s that kind of genie), but the <b>badge</b> shows
                  his real answer: Yes, No, Probably, Probably not or Don&apos;t know.
                </li>
                <li>
                  When you think you know, <b>make a guess</b>!
                </li>
              </ol>
              <button className="btn big" type="button" onClick={() => begin()}>
                ✨ Summon the Genie
              </button>
            </div>
          ) : null}

          {view.phase === 'play' && game ? (
            <div className="card play">
              <div className="row between">
                <div className="counter">
                  Question <b>{game.questions}</b>
                </div>
                <div className="counter subtle">
                  Guesses <b>{game.guesses}</b>
                </div>
              </div>

              <h3>Suggested questions</h3>
              <div className="chips">
                {view.chips.length === 0 ? (
                  <span className="empty">
                    The mists have cleared… you should be able to name it now. Make your
                    guess!
                  </span>
                ) : (
                  view.chips.map((attr) => (
                    <button
                      key={attr.key}
                      className={
                        view.related.includes(attr.key) ? 'chip related' : 'chip'
                      }
                      type="button"
                      onClick={(event) => {
                        if (event.detail > 1) return
                        askKey(attr.key)
                      }}
                    >
                      {attr.q}
                    </button>
                  ))
                )}
              </div>

              <div className="ask">
                <input
                  ref={askRef}
                  type="text"
                  maxLength={200}
                  placeholder="Type your own question… e.g. Can it fly?"
                  aria-label="Ask a question"
                  autoComplete="off"
                  value={askValue}
                  onChange={(event) => setAskValue(event.target.value)}
                  onKeyDown={(event) => submitOnEnter(event, submitAsk)}
                />
                <button
                  className="btn"
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={submitAsk}
                >
                  Ask
                </button>
              </div>

              <div className="ask guess">
                <input
                  ref={guessRef}
                  type="text"
                  maxLength={100}
                  placeholder="Make a guess… e.g. Pikachu"
                  aria-label="Make a guess"
                  autoComplete="off"
                  list="ps-names"
                  value={guessValue}
                  onChange={(event) => setGuessValue(event.target.value)}
                  onKeyDown={(event) => submitOnEnter(event, submitGuess)}
                />
                <button
                  className="btn gold"
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={submitGuess}
                >
                  Guess
                </button>
              </div>
              <datalist id="ps-names">
                {SUBJECT_NAMES.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>

              <div className="row between actions">
                <button className="btn ghost" type="button" onClick={giveUp}>
                  🏳 Give up & reveal
                </button>
                <button className="btn ghost" type="button" onClick={() => begin()}>
                  ↻ New secret
                </button>
              </div>

              <h3>History</h3>
              <HistoryList entries={game.history} />
            </div>
          ) : null}

          {view.phase === 'end' && game ? (
            <div className="card end">
              <h2>{game.won ? 'You found it!' : 'The genie wins this time'}</h2>
              <p className="reveal">
                The genie&apos;s secret was <b>{game.secret.name}</b>
              </p>
              <p className="cat">{CAT_NAMES[game.secret.cat] ?? game.secret.cat}</p>
              <p>
                {game.won
                  ? `Solved with ${countPhrase(game.questions, 'question', 'questions')} and ${countPhrase(game.guesses, 'guess', 'guesses')}.`
                  : `You asked ${countPhrase(game.questions, 'question', 'questions')}. Try again!`}
              </p>
              <button className="btn big" type="button" onClick={() => begin()}>
                ✨ Play again
              </button>
              <h3>History</h3>
              <HistoryList entries={game.history} />
            </div>
          ) : null}
        </section>
      </div>
      <footer className="foot">
        Play StaySEAN · a reverse Akinator · offline, no AI · {SUBJECTS.length} secrets
        · {ATTRS.length} traits
      </footer>
    </div>
  )
}
