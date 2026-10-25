// Birthday mode: picks the day's line-up of talents to put in birthday order.
//
// The line-up comes from a random generator seeded with the date, so every
// player gets the same talents in the same starting order without storing
// anything. It only changes if the talent data itself changes.

/** Small seeded PRNG (mulberry32) returning ints in [0, n). */
function seededRng(seedText) {
  let a = 2166136261;
  for (let i = 0; i < seedText.length; i++) a = Math.imul(a ^ seedText.charCodeAt(i), 16777619);
  return (n) => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) % n);
  };
}

function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** Calendar order: 'MM-DD' strings sort January → December. */
export const byBirthday = (talents) => [...talents].sort((a, b) => a.birthday.localeCompare(b.birthday));

const isSorted = (talents) => talents.every((t, i) => i === 0 || talents[i - 1].birthday <= t.birthday);

/**
 * Picks `size` talents with different birthdays, in the scrambled order the
 * player starts from. Returns null if not enough talents have birthdays.
 */
export function pickLineup(talents, date, size) {
  const rng = seededRng(`birthday:${date}`);
  const pool = talents.filter((t) => t.inPool && t.birthday).sort((a, b) => a.id.localeCompare(b.id));
  shuffle(pool, rng);

  const picked = [];
  const days = new Set();
  for (const t of pool) {
    if (days.has(t.birthday)) continue; // no ties, so there's exactly one right order
    days.add(t.birthday);
    picked.push(t);
    if (picked.length === size) break;
  }
  if (picked.length < size) return null;

  // Never start already solved.
  if (isSorted(picked)) picked.push(picked.shift());
  return picked;
}
