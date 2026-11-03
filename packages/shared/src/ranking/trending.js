// Trending score: engagement points that decay exponentially, so it measures what's hot
// right now rather than all-time totals. apps/api adds points as people save, claim and
// share, and a job decays every live loot's score and moves it between `active` and `trending`.

/** Points one action adds. Same weights as the engagement signal in scoreLoot. */
export const TRENDING_POINTS = Object.freeze({ save: 1, claim: 2, share: 1 })

/** A point is worth half as much after this many hours. */
export const TRENDING_HALF_LIFE_HOURS = 3

/** A live loot becomes `trending` at this score, and drops back to `active` below half of it. */
export const TRENDING_THRESHOLD = 10

/** Scores below this are rounded down to 0, so long-dead loot leaves the Trending feed. */
export const TRENDING_MIN_SCORE = 0.01

/**
 * The score after `elapsedMs` of decay.
 * @param {number} score
 * @param {number} elapsedMs
 */
export function decayTrendingScore(score, elapsedMs) {
  const decayed = Math.max(0, score) * 0.5 ** (Math.max(0, elapsedMs) / (TRENDING_HALF_LIFE_HOURS * 3600_000))
  return decayed < TRENDING_MIN_SCORE ? 0 : decayed
}
