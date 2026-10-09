export const HEAD_LOOKS = [
  {
    name: 'peach',
    look: 'tongue out',
    hi: '#fff4ec',
    mid: '#f6c7a8',
    lo: '#e09878',
  },
  {
    name: 'sand',
    look: 'a wide grin',
    hi: '#ffe8d4',
    mid: '#e8b48c',
    lo: '#c4845c',
  },
  {
    name: 'golden',
    look: 'a sly smirk',
    hi: '#fbe0c0',
    mid: '#c68642',
    lo: '#8a5528',
  },
  {
    name: 'bronze',
    look: 'buck teeth',
    hi: '#f0c6a6',
    mid: '#a86b45',
    lo: '#6b3f28',
  },
  {
    name: 'deep',
    look: 'dizzy eyes',
    hi: '#d7a888',
    mid: '#6b3f2a',
    lo: '#3c2418',
  },
] as const

export function headVariantLabel(variant: number): string {
  const look = HEAD_LOOKS[variant % HEAD_LOOKS.length]
  if (!look) return 'bald head'
  return `${look.name} head, ${look.look}`
}
