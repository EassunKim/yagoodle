import { COOLDOWN_DAYS, MODES, SCHEDULE_AHEAD_DAYS } from './config.js';
import { addDays, daysBetween, today } from './dates.js';
import { getAllTalents } from './db.js';
import { hasPortrait } from './images.js';
import { pickTalent } from './randomizer.js';

export const MODE_IDS = Object.keys(MODES);

/** Talents that can be the answer for a mode. */
export function eligibleTalents(db, mode) {
  const m = MODES[mode];
  return getAllTalents(db).filter((t) => t.inPool && (!m.requiresImage || hasPortrait(t)));
}

export function getPuzzleRow(db, date, mode) {
  return (
    db
      .prepare('SELECT date, mode, talent_id AS talentId, source FROM daily_puzzles WHERE date = ? AND mode = ?')
      .get(date, mode) ?? null
  );
}

/** Randomly picks and stores the answer for a date. With `force`, replaces an existing one. */
export function generatePuzzle(db, date, mode, { force = false } = {}) {
  const pool = eligibleTalents(db, mode).map((t) => t.id);
  const history = db
    .prepare('SELECT talent_id FROM daily_puzzles WHERE mode = ? AND date < ? ORDER BY date DESC')
    .all(mode, date)
    .map((r) => r.talent_id);
  const sameDay = db
    .prepare('SELECT talent_id FROM daily_puzzles WHERE date = ? AND mode <> ?')
    .all(date, mode)
    .map((r) => r.talent_id);

  const id = pickTalent({ pool, history, exclude: sameDay, cooldown: COOLDOWN_DAYS });
  if (!id) return null;

  const onConflict = force
    ? `DO UPDATE SET talent_id = excluded.talent_id, source = 'random', created_at = datetime('now')`
    : 'DO NOTHING';
  db.prepare(
    `INSERT INTO daily_puzzles (date, mode, talent_id, source) VALUES (?, ?, ?, 'random')
     ON CONFLICT(date, mode) ${onConflict}`,
  ).run(date, mode, id);
  return getPuzzleRow(db, date, mode);
}

/** Pins a specific talent as the answer for a date. */
export function setPuzzle(db, date, mode, talentId) {
  db.prepare(
    `INSERT INTO daily_puzzles (date, mode, talent_id, source) VALUES (?, ?, ?, 'manual')
     ON CONFLICT(date, mode) DO UPDATE SET talent_id = excluded.talent_id, source = 'manual', created_at = datetime('now')`,
  ).run(date, mode, talentId);
  return getPuzzleRow(db, date, mode);
}

/** Returns the puzzle for a date, generating it on demand if it's within the schedule window. */
export function getPuzzle(db, date, mode) {
  const row = getPuzzleRow(db, date, mode);
  if (row) return row;
  if (date > addDays(today(), SCHEDULE_AHEAD_DAYS)) return null;
  return generatePuzzle(db, date, mode);
}

/** Makes sure every mode has an answer from `from` through `from + days`. */
export function ensureSchedule(db, from = today(), days = SCHEDULE_AHEAD_DAYS) {
  const created = [];
  for (let i = 0; i <= days; i++) {
    const date = addDays(from, i);
    for (const mode of MODE_IDS) {
      if (getPuzzleRow(db, date, mode)) continue;
      const row = generatePuzzle(db, date, mode);
      if (row) created.push(row);
    }
  }
  return created;
}

export function puzzleNumber(db, date) {
  const { first } = db.prepare('SELECT MIN(date) AS first FROM daily_puzzles').get();
  return first ? Math.max(1, daysBetween(first, date) + 1) : 1;
}

/** Checks every minute whether the day rolled over and tops up the schedule. */
export function startScheduler(db, { intervalMs = 60_000, log = console.log } = {}) {
  let current = null;
  const tick = () => {
    const date = today();
    if (date === current) return;
    try {
      const created = ensureSchedule(db, date);
      current = date;
      const todays = MODE_IDS.map((m) => `${m}=${getPuzzleRow(db, date, m) ? 'ready' : 'unavailable'}`);
      log(`[scheduler] ${date}: ${todays.join(', ')}; generated ${created.length} new puzzle(s)`);
    } catch (err) {
      console.error('[scheduler] failed to build schedule:', err);
    }
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
