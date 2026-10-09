import { createRng } from '@/shared/rng.ts'
import { DB } from './data.ts'
import type {
  AnswerKey,
  AskTextResult,
  Attribute,
  GuessResult,
  HistoryEntry,
  SavedGame,
  Subject,
} from './types.ts'

export const ATTRS = DB.ATTRS
export const SUBJECTS = DB.SUBJECTS
export const CAT_NAMES = DB.CAT_NAMES

const ATTR_BY_KEY = new Map<string, Attribute>(ATTRS.map((attr) => [attr.key, attr]))

const ANSWER_LABEL: Record<AnswerKey, string> = {
  yes: 'Yes',
  probably: 'Probably',
  unknown: "Don't know",
  probably_not: 'Probably not',
  no: 'No',
}

const INVERT: Record<AnswerKey, AnswerKey> = {
  yes: 'no',
  probably: 'probably_not',
  unknown: 'unknown',
  probably_not: 'probably',
  no: 'yes',
}

const NEG_RE =
  /\b(not|isnt|arent|wasnt|werent|doesnt|dont|didnt|cant|cannot|couldnt|wont|never|no longer|neither)\b/

const LEAD_RE =
  /^(is it|is he|is she|is this|are you|it is|its|is it an?|is it the|is he an?|is she an?|is it actually|could it be|maybe its?|i guess|i think its|i think it is)\s+(.*)$/

const GUESS_PREFIX_RE =
  /^(is it|is he|is she|are you|it is|its|i think its|i think it is|i guess|my guess is|the answer is)\s+/

const MAX_INPUT = 200

export function answerOf(value: number): AnswerKey {
  if (value >= 1) return 'yes'
  if (value >= 0.75) return 'probably'
  if (value > 0.25) return 'unknown'
  if (value > 0) return 'probably_not'
  return 'no'
}

/** A candidate survives when it is not clearly on the other side of the secret's value. */
export function consistent(candidateValue: number, secretValue: number): boolean {
  if (secretValue === 0.5) return true
  return secretValue > 0.5 ? candidateValue >= 0.5 : candidateValue <= 0.5
}

export function norm(value: string): string {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  let cur = new Array<number>(n + 1)
  for (let i = 1; i <= m; i++) {
    cur[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost)
    }
    const swap = prev
    prev = cur
    cur = swap
  }
  return prev[n]!
}

function namesOf(subject: Subject): string[] {
  const list = [subject.name, ...subject.aliases].map(norm)
  for (const name of [...list]) {
    if (name.startsWith('the ')) list.push(name.slice(4))
  }
  return list
}

export function matchSubject(
  text: string,
): { subject: Subject; exact: boolean } | null {
  const normalized = norm(text)
    .replace(GUESS_PREFIX_RE, '')
    .replace(/^(a|an)\s+/, '')
    .replace(/\s+(right|maybe)$/, '')
  if (!normalized) return null
  const withoutThe = normalized.replace(/^the\s+/, '')
  let best: Subject | null = null
  let bestDistance = 1e9
  for (const subject of SUBJECTS) {
    for (const name of namesOf(subject)) {
      let distance = Math.min(
        levenshtein(normalized, name),
        levenshtein(withoutThe, name),
      )
      if (normalized === `${name}s` || `the ${normalized}` === name) distance = 0
      const tolerance =
        name.length <= 3 ? 0 : name.length <= 6 ? 1 : name.length <= 10 ? 2 : 3
      if (distance <= tolerance && distance < bestDistance) {
        bestDistance = distance
        best = subject
      }
    }
  }
  return best ? { subject: best, exact: bestDistance === 0 } : null
}

export function matchAttr(text: string): { attr: Attribute; inverse: boolean } | null {
  const normalized = norm(text)
  const padded = ` ${normalized} `
  let best: Attribute | null = null
  let bestScore = 0
  let bestInfo: { inv: boolean; phrases: string[] } | null = null
  for (const attr of ATTRS) {
    let score = 0
    let longest = ''
    let inv = false
    const phrases: string[] = []
    const scan = (list: string[], isInverse: boolean) => {
      for (const raw of list) {
        const keyword = norm(raw)
        if (keyword && padded.includes(` ${keyword} `)) {
          score += 2 + keyword.length
          phrases.push(keyword)
          if (keyword.length > longest.length) {
            longest = keyword
            inv = isInverse
          }
        }
      }
    }
    scan(attr.kw, false)
    scan(attr.nkw, true)
    if (norm(attr.q) === normalized) score += 100
    if (score > bestScore) {
      bestScore = score
      best = attr
      bestInfo = { inv, phrases }
    }
  }
  if (!best || !bestInfo) return null
  let rest = padded
  for (const phrase of bestInfo.phrases) rest = rest.split(` ${phrase} `).join(' ')
  const negated = NEG_RE.test(rest)
  return { attr: best, inverse: bestInfo.inv !== negated }
}

/** "What should I eat?" / "I'm hungry" / "makan apa" — not "can you eat it?". */
export function isEatEgg(text: string): boolean {
  const normalized = norm(text)
  if (
    /\b(i m|im|i am|we re|were|so) (so |very |damn )?hungry\b/.test(normalized) ||
    (/\bhungry\b/.test(normalized) && !/\b(it|he|she|this)\b/.test(normalized))
  ) {
    return true
  }
  if (
    /\bmakan (apa|mana|where|what)\b/.test(normalized) ||
    /\b(apa|mana) (nak |mau )?makan\b/.test(normalized)
  ) {
    return true
  }
  if (/\b(lunch|dinner|breakfast|supper|food) (where|what)\b/.test(normalized))
    return true
  if (/\b(recommend|suggest)\b.*\b(food|eat|restaurant|makan)\b/.test(normalized))
    return true
  if (!/\b(eat|eating|makan)\b/.test(normalized)) return false
  if (/\b(it|its|he|she|they|this|that thing)\b/.test(normalized)) return false
  return /^(what|where|wat|wad|which|so what|so where|then what|then where|now what|ok what|okay what|genie what|genie where)\b/.test(
    normalized,
  )
}

const RELATED_STOP = new Set([
  'what',
  'does',
  'have',
  'with',
  'this',
  'that',
  'they',
  'from',
  'your',
])

function relatedAttrs(text: string, exclude: string[]): Attribute[] {
  const words = norm(text)
    .split(' ')
    .filter((word) => word.length > 3 && !RELATED_STOP.has(word))
  return ATTRS.map((attr) => {
    const hay = norm(`${attr.q} ${attr.kw.join(' ')}`)
    let score = 0
    for (const word of words) {
      if (hay.includes(word.slice(0, Math.max(4, word.length - 2)))) score++
    }
    return { attr, score }
  })
    .filter((item) => item.score > 0 && !exclude.includes(item.attr.key))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.attr)
}

interface RankedAttr {
  a: Attribute
  score: number
  y: number
  no: number
  u: number
}

export interface GameOptions {
  seed?: number
  secretId?: number
  rng?: () => number
}

function subjectByRef(ref: string | number | undefined): Subject | null {
  if (typeof ref === 'number') return SUBJECTS[ref] ?? null
  if (ref == null) return null
  return SUBJECTS.find((subject) => subject.name === ref) ?? null
}

export class Game {
  rng: () => number
  secret: Subject
  candidates: Subject[]
  asked: string[]
  history: HistoryEntry[]
  questions: number
  guesses: number
  over: boolean
  won: boolean

  constructor(opts: GameOptions = {}) {
    this.rng = opts.rng ?? (opts.seed != null ? createRng(opts.seed) : Math.random)
    const chosen = opts.secretId != null ? SUBJECTS[opts.secretId] : undefined
    this.secret = chosen ?? SUBJECTS[Math.floor(this.rng() * SUBJECTS.length)]!
    this.candidates = SUBJECTS.slice()
    this.asked = []
    this.history = []
    this.questions = 0
    this.guesses = 0
    this.over = false
    this.won = false
  }

  ask(
    key: string,
    opts: { inverse?: boolean; typed?: string } = {},
  ): HistoryEntry | null {
    const attr = ATTR_BY_KEY.get(key)
    if (!attr) return null
    const secretValue = this.secret.v[key] ?? 0
    let answer = answerOf(secretValue)
    const inverse = !!opts.inverse
    if (inverse) answer = INVERT[answer]
    const entry: HistoryEntry = {
      type: 'q',
      q: inverse ? `NOT: ${attr.q}` : attr.q,
      attr: key,
      answer,
      label: ANSWER_LABEL[answer],
      inverse,
    }
    if (opts.typed) entry.typed = opts.typed
    if (this.over) {
      entry.type = 'over'
      return entry
    }
    if (this.asked.includes(key)) {
      entry.repeat = true
      return entry
    }
    this.asked.push(key)
    // The badge is inverted for opposite wording; elimination still uses the trait itself.
    this.candidates = this.candidates.filter((candidate) =>
      consistent(candidate.v[key] ?? 0, secretValue),
    )
    this.questions++
    this.history.push(entry)
    return entry
  }

  askText(text: string): AskTextResult {
    const clipped = String(text).slice(0, MAX_INPUT).trim()
    if (!norm(clipped)) return { type: 'empty' }
    if (this.over) return { type: 'over' }
    if (isEatEgg(clipped)) return { type: 'eat', q: clipped }
    const normalized = norm(clipped)
    const lead = LEAD_RE.exec(normalized)
    const guess = lead ? matchSubject(clipped) : null
    if (guess && !NEG_RE.test(normalized)) {
      const remainder = lead?.[2] ?? ''
      const remainderIsKeyword = ATTRS.some((attr) =>
        attr.kw.some((keyword) => norm(keyword) === remainder),
      )
      if (!remainderIsKeyword) {
        return { type: 'guessRedirect', subject: guess.subject, text: clipped }
      }
    }
    const matched = matchAttr(clipped)
    if (!matched) {
      const entry: HistoryEntry = {
        type: 'q',
        q: clipped,
        attr: null,
        answer: 'cant',
        label: 'Cannot answer',
      }
      this.history.push(entry)
      const suggestions = this.suggest(5)
      const related = relatedAttrs(clipped, this.asked)
        .filter((attr) => !suggestions.includes(attr))
        .slice(0, 3)
      entry.related = related.concat(suggestions).slice(0, 5)
      return entry
    }
    return this.ask(matched.attr.key, { inverse: matched.inverse, typed: clipped })!
  }

  guess(text: string): GuessResult {
    const clipped = String(text).slice(0, MAX_INPUT).trim()
    if (!norm(clipped)) return { type: 'empty' }
    if (this.over) return { type: 'over' }
    const matched = matchSubject(clipped)
    if (!matched) return { type: 'unknownGuess', text: clipped }
    this.guesses++
    const correct = matched.subject === this.secret
    const entry: HistoryEntry = {
      type: 'g',
      q: `Is it ${matched.subject.name}?`,
      subject: matched.subject,
      answer: correct ? 'correct' : 'wrong',
      label: correct ? 'Correct!' : 'Wrong',
    }
    this.history.push(entry)
    if (correct) {
      this.over = true
      this.won = true
    } else {
      this.candidates = this.candidates.filter(
        (candidate) => candidate !== matched.subject,
      )
    }
    return entry
  }

  giveUp(): Subject | null {
    if (this.over) return null
    this.over = true
    this.won = false
    return this.secret
  }

  rank(): RankedAttr[] {
    const candidates = this.candidates
    const total = candidates.length
    const out: RankedAttr[] = []
    for (const attr of ATTRS) {
      if (this.asked.includes(attr.key)) continue
      let yes = 0
      let no = 0
      let unknown = 0
      for (const candidate of candidates) {
        const value = candidate.v[attr.key] ?? 0
        if (value > 0.5) yes++
        else if (value < 0.5) no++
        else unknown++
      }
      if (!yes || !no) continue
      const score = Math.min(yes, no) / total - (0.5 * unknown) / total
      out.push({ a: attr, score, y: yes, no, u: unknown })
    }
    out.sort((a, b) => b.score - a.score)
    return out
  }

  suggest(count = 5): Attribute[] {
    const ranked = this.rank()
    if (!ranked.length) return []
    const top = ranked.slice(0, Math.max(count + 3, Math.ceil(count * 1.6)))
    const first = top[0]
    if (!first) return []
    const pick = [first]
    const rest = top.slice(1)
    while (pick.length < count && rest.length) {
      const weights = rest.map((item) => Math.max(0.02, item.score) + 0.02)
      const sum = weights.reduce((total, weight) => total + weight, 0)
      let cursor = this.rng() * sum
      let index = 0
      for (; index < weights.length - 1; index++) {
        cursor -= weights[index]!
        if (cursor <= 0) break
      }
      const chosen = rest.splice(index, 1)[0]
      if (chosen) pick.push(chosen)
    }
    return pick.map((item) => item.a)
  }

  confidence(): number {
    return 1 - Math.log(this.candidates.length) / Math.log(SUBJECTS.length)
  }

  toJSON(): SavedGame {
    return {
      secretId: this.secret.id,
      secretName: this.secret.name,
      asked: this.asked.slice(),
      questions: this.questions,
      guesses: this.guesses,
      over: this.over,
      won: this.won,
      wrong: this.history
        .filter(
          (entry) => entry.type === 'g' && entry.answer === 'wrong' && entry.subject,
        )
        .map((entry) => entry.subject!.name),
      history: this.history.map((entry) => ({
        type: entry.type,
        q: entry.q,
        answer: entry.answer,
        label: entry.label,
        attr: entry.attr,
        inverse: entry.inverse,
        typed: entry.typed,
        repeat: entry.repeat,
        sound: entry.sound,
        subject: entry.subject?.name,
      })),
    }
  }

  static fromJSON(saved: SavedGame): Game {
    const secret = subjectByRef(
      saved.secretName != null ? saved.secretName : saved.secretId,
    )
    if (!secret) {
      throw new Error(
        `saved secret no longer exists: ${saved.secretName || saved.secretId}`,
      )
    }
    const game = new Game({ secretId: secret.id })
    for (const key of saved.asked ?? []) {
      const secretValue = secret.v[key]
      if (secretValue == null) continue
      game.asked.push(key)
      game.candidates = game.candidates.filter((candidate) =>
        consistent(candidate.v[key] ?? 0, secretValue),
      )
    }
    for (const name of saved.wrong ?? []) {
      const wrong = subjectByRef(name)
      game.candidates = game.candidates.filter((candidate) => candidate !== wrong)
    }
    game.questions = saved.questions | 0
    game.guesses = saved.guesses | 0
    game.over = !!saved.over
    game.won = !!saved.won
    game.history = (saved.history ?? [])
      .map((entry) => {
        const subject = entry.subject ? subjectByRef(entry.subject) : undefined
        const restored: HistoryEntry = {
          type: entry.type === 'g' ? 'g' : entry.type === 'over' ? 'over' : 'q',
          q: entry.q,
          answer: entry.answer,
          label: entry.label,
          attr: entry.attr,
          inverse: entry.inverse,
          typed: entry.typed,
          repeat: entry.repeat,
          sound: entry.sound,
        }
        if (subject) restored.subject = subject
        return restored
      })
      .filter((entry) => entry.type !== 'g' || entry.subject)
    return game
  }
}
