import { randomInt } from 'node:crypto';

/**
 * Picks the next daily answer.
 *
 *  - "Shuffle bag": only talents used the fewest times so far are eligible, so
 *    everyone in the pool comes up once before anyone repeats.
 *  - Cooldown: anyone answered in the last `cooldown` puzzles is skipped
 *    (capped at 75% of the pool so small pools still work).
 *  - `exclude`: talents to avoid, e.g. today's answer in another mode.
 *
 * Constraints relax in order (exclude, then cooldown) if nothing is left.
 *
 * @param {object} o
 * @param {string[]} o.pool      eligible talent ids
 * @param {string[]} o.history   previous answers for this mode, newest first
 * @param {number}   o.cooldown
 * @param {string[]} o.exclude
 * @param {(n:number)=>number} o.rng  returns an int in [0, n)
 * @returns {string|null}
 */
export function pickTalent({ pool, history = [], cooldown = 30, exclude = [], rng = randomInt }) {
  if (!pool.length) return null;

  const window = Math.max(0, Math.min(cooldown, Math.floor(pool.length * 0.75)));
  const recent = new Set(history.slice(0, window));
  const excluded = new Set(exclude);
  const uses = new Map();
  for (const id of history) uses.set(id, (uses.get(id) ?? 0) + 1);

  const tiers = [
    pool.filter((id) => !recent.has(id) && !excluded.has(id)),
    pool.filter((id) => !recent.has(id)),
    pool.filter((id) => !excluded.has(id)),
    pool,
  ];
  const candidates = tiers.find((t) => t.length > 0);

  const minUses = Math.min(...candidates.map((id) => uses.get(id) ?? 0));
  const finalists = candidates.filter((id) => (uses.get(id) ?? 0) === minUses);
  return finalists[rng(finalists.length)];
}
