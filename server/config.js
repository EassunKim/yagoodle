import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const int = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const PORT = int(process.env.PORT, 3000);
/** Puzzles roll over at midnight in this time zone. */
export const RESET_TZ = process.env.RESET_TZ || 'Asia/Tokyo';
/** How many days of future puzzles the scheduler keeps generated. */
export const SCHEDULE_AHEAD_DAYS = int(process.env.SCHEDULE_AHEAD_DAYS, 7);
/** A talent can't be the answer again (in the same mode) within this many days. */
export const COOLDOWN_DAYS = int(process.env.COOLDOWN_DAYS, 30);

/** Supabase connection string, loaded from .env. */
export const DATABASE_URL = process.env.DATABASE_URL;
export const PUBLIC_DIR = path.join(ROOT, 'public');
/** Public talent icons, shown in search results and guess rows. */
export const IMAGE_DIR = path.join(PUBLIC_DIR, 'images', 'talents');
export const IMAGE_URL_BASE = '/images/talents/';
/** Optional private art for Portrait mode (not served statically, so it can't be matched by URL). */
export const PORTRAIT_DIR = path.join(ROOT, 'data', 'portraits');

/**
 * Columns compared in Classic mode. `key` is a field on the talent record.
 *  exact  – same value → green, otherwise red
 *  multi  – list; identical → green, any overlap → orange, none → red
 *  number – equal → green, otherwise red with an arrow toward the answer
 *  date   – same month → green, same year → orange, otherwise red; arrow toward the answer
 *  monthDay – 'MM-DD'; same day → green, same month → orange, otherwise red; arrow toward the answer
 */
export const ATTRIBUTES = [
  { key: 'branch', label: 'Branch', type: 'exact' },
  { key: 'generation', label: 'Generation', type: 'exact' },
  { key: 'status', label: 'Status', type: 'exact' },
  { key: 'height', label: 'Height', type: 'number', unit: 'cm' },
  { key: 'debutDate', label: 'Debut', type: 'date' },
  { key: 'birthday', label: 'Birthday', type: 'monthDay' },
];

/** Wrong guesses allowed per puzzle; the answer is revealed when they run out. */
export const MAX_GUESSES = 10;

/**
 * Birthday mode: put a daily line-up of talents in birthday order. Separate
 * from MODES because it has no single answer, so it isn't stored in
 * daily_puzzles; the line-up is picked from the date instead.
 */
export const BIRTHDAY_MODE = {
  id: 'birthday',
  label: 'Birthdays',
  tagline: 'Put them in order',
  size: 5,
  attempts: 3,
};

/** Game modes. Each gets its own daily answer. Hints unlock after `after` guesses. */
export const MODES = {
  classic: {
    label: 'Classic',
    tagline: 'Narrow it down by traits',
    showsAttributes: true,
    requiresImage: false,
    hints: [
      { key: 'oshiMark', label: 'Oshi mark', icon: '✨', after: 4 },
      { key: 'fanName', label: 'Fan name', icon: '💬', after: 8 },
    ],
  },
  portrait: {
    label: 'Portrait',
    tagline: 'Who is in the picture?',
    showsAttributes: false,
    requiresImage: true,
    hints: [
      { key: 'branch', label: 'Branch', icon: '🌏', after: 2 },
      { key: 'generation', label: 'Generation', icon: '🎓', after: 4 },
    ],
  },
};
