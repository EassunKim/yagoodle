import pg from 'pg';
import { DATABASE_URL } from './config.js';

// Postgres DATE columns arrive as plain 'YYYY-MM-DD' strings. By default pg turns
// them into JS Dates at local midnight, which can shift them by a day.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

let pool = null;

/**
 * A pool keeps a few connections open and reuses them, instead of connecting
 * to Supabase from scratch on every query.
 */
function getPool() {
  if (!pool) {
    if (!DATABASE_URL) throw new Error('DATABASE_URL is not set. Add it to .env (see README).');
    pool = new pg.Pool({
      connectionString: DATABASE_URL,
      max: 5,
      // Supabase requires an encrypted connection. Its certificate is signed by
      // Supabase's own authority rather than a public one, so we skip verifying it.
      ssl: { rejectUnauthorized: false },
    });
    pool.on('error', (err) => console.error('[db] connection error:', err.message));
  }
  return pool;
}

/**
 * Runs one SQL statement and returns the result rows.
 * Values go in `params` and are referenced as $1, $2… in the SQL, never pasted
 * into the SQL text, so they can't be used for SQL injection.
 */
export async function query(sql, params = []) {
  const { rows } = await getPool().query(sql, params);
  return rows;
}

export async function closeDb() {
  await pool?.end();
  pool = null;
}

/** Converts a talent_profiles row (snake_case columns) into the shape the game uses. */
export function rowToTalent(row) {
  return {
    id: row.id,
    name: row.name,
    nameJp: row.name_jp,
    aliases: row.aliases ?? [],
    branch: row.branch,
    generation: row.generation,
    status: row.status,
    debutDate: row.debut_date,
    height: row.height_cm,
    hairColor: row.hair_colors ?? [],
    fanName: row.fan_name,
    oshiMark: row.oshi_mark,
    imageUrl: row.image_url,
    youtube: row.youtube_url,
    inPool: row.in_pool,
  };
}

// Talents change rarely, so keep them in memory for a minute instead of asking
// Supabase on every guess. Edits in Supabase show up within a minute.
const CACHE_MS = 60_000;
let cache = null;

export async function getAllTalents({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.talents;
  const rows = await query('SELECT * FROM talent_profiles ORDER BY name');
  cache = { at: Date.now(), talents: rows.map(rowToTalent) };
  return cache.talents;
}

export async function getTalent(id) {
  const cached = (await getAllTalents()).find((t) => t.id === id);
  if (cached) return cached;
  // Not in the cache: it may have been added in the last minute.
  const rows = await query('SELECT * FROM talent_profiles WHERE id = $1', [id]);
  return rows[0] ? rowToTalent(rows[0]) : null;
}
