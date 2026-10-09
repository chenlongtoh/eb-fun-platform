const STORAGE_PREFIX = 'eb-fun'
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface GameStorage {
  /** Read a string previously stored for this game, or null. */
  get(key: string): string | null
  /** Store a string under a key that no other game can read. */
  set(key: string, value: string): void
  /** Delete one key for this game. */
  remove(key: string): void
}

/**
 * localStorage namespaced to one game slug.
 * Keys are stored as `eb-fun:<slug>:<encodeURIComponent(key)>`.
 */
export function createGameStorage(slug: string): GameStorage {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `Game slug must be lowercase kebab-case (received ${JSON.stringify(slug)})`,
    )
  }

  const prefix = `${STORAGE_PREFIX}:${slug}:`

  function storageKey(key: string): string {
    if (key.length === 0) {
      throw new Error('Storage key must not be empty')
    }
    return prefix + encodeURIComponent(key)
  }

  return {
    get(key) {
      return localStorage.getItem(storageKey(key))
    },
    set(key, value) {
      localStorage.setItem(storageKey(key), value)
    },
    remove(key) {
      localStorage.removeItem(storageKey(key))
    },
  }
}
