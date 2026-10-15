// Per-browser persistence: in-progress games and streak stats.
const PREFIX = 'yagoodle:v1';
const KEEP_GAMES_DAYS = 14;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked; the game still works for this visit.
  }
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const gameKey = (date, mode) => `${PREFIX}:game:${date}:${mode}`;

export function loadGame(date, mode) {
  const g = read(gameKey(date, mode), null);
  return { guesses: [], solved: false, failed: false, answer: null, hints: {}, profile: null, ...g };
}

export function saveGame(date, mode, game) {
  write(gameKey(date, mode), game);
}

/** Drops saved games older than two weeks. */
export function pruneGames(today) {
  const cutoff = addDays(today, -KEEP_GAMES_DAYS);
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      const m = key?.match(/^yagoodle:v1:game:(\d{4}-\d{2}-\d{2}):/);
      if (m && m[1] < cutoff) localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export const BUCKETS = ['1', '2', '3', '4–5', '6–8', '9+'];

function bucketFor(n) {
  if (n <= 3) return String(n);
  if (n <= 5) return '4–5';
  if (n <= 8) return '6–8';
  return '9+';
}

const statsKey = `${PREFIX}:stats`;

export function loadStats() {
  return read(statsKey, {});
}

function modeStats(all, mode) {
  all[mode] ??= { played: 0, wins: 0, streak: 0, maxStreak: 0, lastWin: null, lastPlayed: null, dist: {} };
  return all[mode];
}

export function recordPlayed(mode, date) {
  const all = loadStats();
  const s = modeStats(all, mode);
  if (s.lastPlayed !== date) {
    s.played += 1;
    s.lastPlayed = date;
    write(statsKey, all);
  }
}

export function recordWin(mode, date, guessCount) {
  const all = loadStats();
  const s = modeStats(all, mode);
  if (s.lastWin === date) return;
  s.wins += 1;
  s.streak = s.lastWin === addDays(date, -1) ? s.streak + 1 : 1;
  s.maxStreak = Math.max(s.maxStreak, s.streak);
  s.lastWin = date;
  const b = bucketFor(guessCount);
  s.dist[b] = (s.dist[b] ?? 0) + 1;
  write(statsKey, all);
}

/** Running out of guesses ends the streak. */
export function recordLoss(mode) {
  const all = loadStats();
  const s = modeStats(all, mode);
  s.streak = 0;
  write(statsKey, all);
}

/** A streak only counts if it's still alive (won today or yesterday). */
export function currentStreak(s, today) {
  if (!s?.lastWin) return 0;
  return s.lastWin === today || s.lastWin === addDays(today, -1) ? s.streak : 0;
}
