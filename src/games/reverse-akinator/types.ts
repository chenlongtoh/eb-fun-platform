export interface Attribute {
  key: string
  q: string
  kw: string[]
  nkw: string[]
}

export interface Subject {
  id: number
  cat: string
  name: string
  aliases: string[]
  /** 1 yes, 0.75 probably, 0.5 don't know, 0.25 probably not, 0 no. */
  v: Record<string, number>
}

export interface Database {
  ATTRS: Attribute[]
  SUBJECTS: Subject[]
  CAT_NAMES: Record<string, string>
}

export type AnswerKey = 'yes' | 'probably' | 'unknown' | 'probably_not' | 'no'

export interface HistoryEntry {
  type: 'q' | 'g' | 'over'
  q: string
  answer: string
  label: string
  attr?: string | null
  inverse?: boolean
  typed?: string
  repeat?: boolean
  sound?: string
  subject?: Subject
  related?: Attribute[]
}

export interface SavedHistoryEntry {
  type: string
  q: string
  answer: string
  label: string
  attr?: string | null
  inverse?: boolean
  typed?: string
  repeat?: boolean
  sound?: string
  subject?: string
}

export interface SavedGame {
  secretId: number
  secretName: string
  asked: string[]
  questions: number
  guesses: number
  over: boolean
  won: boolean
  wrong: string[]
  history: SavedHistoryEntry[]
}

export type AskTextResult =
  | { type: 'empty' }
  | { type: 'over' }
  | { type: 'eat'; q: string }
  | { type: 'guessRedirect'; subject: Subject; text: string }
  | HistoryEntry

export type GuessResult =
  | { type: 'empty' }
  | { type: 'over' }
  | { type: 'unknownGuess'; text: string }
  | HistoryEntry
