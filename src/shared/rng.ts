/**
 * Deterministic PRNG (mulberry32).
 * The same seed always yields the same sequence of floats in [0, 1).
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Integer in the inclusive range [min, max]. */
export function randomInt(rng: () => number, min: number, max: number): number {
  const low = Math.ceil(min)
  const high = Math.floor(max)
  return low + Math.floor(rng() * (high - low + 1))
}
