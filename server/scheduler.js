import { COOLDOWN_DAYS, MODES, SCHEDULE_AHEAD_DAYS } from './config.js';
import { addDays, daysBetween, today } from './dates.js';
import { getAllTalents, query } from './db.js';
import { hasPortrait } from './images.js';
import { pickTalent } from './randomizer.js';

export const MODE_IDS = Object.keys(MODES);

/** Talents that can be the answer for a mode. */
export async function eligibleTalents(mode) {
  const m = MODES[mode];
  const talents = await getAllTalents();
  return talents.filter((t) => t.inPool && (!m.requiresImage || hasPortrait(t)));
}

export async function getPuzzleRow(date, mode) {
  const rows = await query(
    'SELECT date, mode, talent_id AS "talentId", source FROM daily_puzzles WHERE date = $1 AND mode = $2',
    [date, mode],
  );
  return rows[0] ?? null;
}

/** Randomly picks and stores the answer for a date. With `force`, replaces an existing one. */
export async function generatePuzzle(date, mode, { force = false } = {}) {
  const [pool, history, sameDay] = await Promise.all([
    eligibleTalents(mode),
    query('SELECT talent_id FROM daily_puzzles WHERE mode = $1 AND date < $2 ORDER BY date DESC', [mode, date]),
    query('SELECT talent_id FROM daily_puzzles WHERE date = $1 AND mode <> $2', [date, mode]),
  ]);

  const id = pickTalent({
    pool: pool.map((t) => t.id),
    history: history.map((r) => r.talent_id),
    exclude: sameDay.map((r) => r.talent_id),
    cooldown: COOLDOWN_DAYS,
  });
  if (!id) return null;

  const onConflict = force
    ? `DO UPDATE SET talent_id = excluded.talent_id, source = 'random', created_at = now()`
    : 'DO NOTHING';
  // If another request created this day's puzzle first, DO NOTHING keeps theirs,
  // and the SELECT below returns whichever answer won.
  await query(
    `INSERT INTO daily_puzzles (date, mode, talent_id, source) VALUES ($1, $2, $3, 'random')
     ON CONFLICT (date, mode) ${onConflict}`,
    [date, mode, id],
  );
  return getPuzzleRow(date, mode);
}

/** Pins a specific talent as the answer for a date. */
export async function setPuzzle(date, mode, talentId) {
  await query(
    `INSERT INTO daily_puzzles (date, mode, talent_id, source) VALUES ($1, $2, $3, 'manual')
     ON CONFLICT (date, mode) DO UPDATE SET talent_id = excluded.talent_id, source = 'manual', created_at = now()`,
    [date, mode, talentId],
  );
  return getPuzzleRow(date, mode);
}

/** Returns the puzzle for a date, generating it on demand if it's within the schedule window. */
export async function getPuzzle(date, mode) {
  const row = await getPuzzleRow(date, mode);
  if (row) return row;
  if (date > addDays(today(), SCHEDULE_AHEAD_DAYS)) return null;
  return generatePuzzle(date, mode);
}

/** Makes sure every mode has an answer from `from` through `from + days`. */
export async function ensureSchedule(from = today(), days = SCHEDULE_AHEAD_DAYS) {
  const created = [];
  // One day at a time, in order, so each day's pick sees the days before it.
  for (let i = 0; i <= days; i++) {
    const date = addDays(from, i);
    for (const mode of MODE_IDS) {
      if (await getPuzzleRow(date, mode)) continue;
      const row = await generatePuzzle(date, mode);
      if (row) created.push(row);
    }
  }
  return created;
}

export async function puzzleNumber(date) {
  const [{ first }] = await query('SELECT MIN(date) AS first FROM daily_puzzles');
  return first ? Math.max(1, daysBetween(first, date) + 1) : 1;
}

/** Checks every minute whether the day rolled over and tops up the schedule. */
export function startScheduler({ intervalMs = 60_000, log = console.log } = {}) {
  let current = null;
  let running = false;
  const tick = async () => {
    const date = today();
    if (date === current || running) return;
    running = true;
    try {
      const created = await ensureSchedule(date);
      current = date;
      const status = await Promise.all(
        MODE_IDS.map(async (m) => `${m}=${(await getPuzzleRow(date, m)) ? 'ready' : 'unavailable'}`),
      );
      log(`[scheduler] ${date}: ${status.join(', ')}; generated ${created.length} new puzzle(s)`);
    } catch (err) {
      console.error('[scheduler] failed to build schedule:', err.message);
    } finally {
      running = false;
    }
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
