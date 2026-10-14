import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DB_PATH } from './config.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS talents (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  name_jp         TEXT,
  aliases         TEXT NOT NULL DEFAULT '[]',
  branch          TEXT NOT NULL,
  generation      TEXT NOT NULL,
  status          TEXT NOT NULL,
  debut_date      TEXT,
  graduation_date TEXT,
  birthday        TEXT,
  height          INTEGER,
  hair_color      TEXT NOT NULL DEFAULT '[]',
  fan_name        TEXT,
  oshi_mark       TEXT,
  image           TEXT,
  youtube         TEXT,
  twitter         TEXT,
  in_pool         INTEGER NOT NULL DEFAULT 1,
  verified        INTEGER NOT NULL DEFAULT 0,
  extra           TEXT NOT NULL DEFAULT '{}',
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_puzzles (
  date       TEXT NOT NULL,
  mode       TEXT NOT NULL,
  talent_id  TEXT NOT NULL REFERENCES talents(id),
  source     TEXT NOT NULL DEFAULT 'random',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (date, mode)
);

CREATE INDEX IF NOT EXISTS idx_daily_mode_date ON daily_puzzles (mode, date);
`;

/** Talent record field (camelCase, as in talents.json) ↔ table column. */
const FIELDS = [
  { key: 'id', col: 'id' },
  { key: 'name', col: 'name' },
  { key: 'nameJp', col: 'name_jp' },
  { key: 'aliases', col: 'aliases', json: true, def: [] },
  { key: 'branch', col: 'branch' },
  { key: 'generation', col: 'generation' },
  { key: 'status', col: 'status' },
  { key: 'debutDate', col: 'debut_date' },
  { key: 'graduationDate', col: 'graduation_date' },
  { key: 'birthday', col: 'birthday' },
  { key: 'height', col: 'height' },
  { key: 'hairColor', col: 'hair_color', json: true, def: [] },
  { key: 'fanName', col: 'fan_name' },
  { key: 'oshiMark', col: 'oshi_mark' },
  { key: 'image', col: 'image' },
  { key: 'youtube', col: 'youtube' },
  { key: 'twitter', col: 'twitter' },
  { key: 'inPool', col: 'in_pool', bool: true, def: true },
  { key: 'verified', col: 'verified', bool: true, def: false },
];
const KNOWN_KEYS = new Set(FIELDS.map((f) => f.key));

export function openDb(file = DB_PATH) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

/** Unknown keys in a talent record are kept in the `extra` JSON column. */
export function talentToRow(t) {
  const row = {};
  for (const f of FIELDS) {
    let v = t[f.key] ?? f.def ?? null;
    if (f.json) v = JSON.stringify(v);
    else if (f.bool) v = v ? 1 : 0;
    row[f.col] = v;
  }
  const extra = {};
  for (const [k, v] of Object.entries(t)) if (!KNOWN_KEYS.has(k) && !k.startsWith('_')) extra[k] = v;
  row.extra = JSON.stringify(extra);
  return row;
}

export function rowToTalent(row) {
  if (!row) return null;
  const t = { ...JSON.parse(row.extra || '{}') };
  for (const f of FIELDS) {
    let v = row[f.col];
    if (f.json) v = JSON.parse(v ?? 'null') ?? f.def;
    else if (f.bool) v = Boolean(v);
    t[f.key] = v;
  }
  return t;
}

const COLS = [...FIELDS.map((f) => f.col), 'extra'];
const UPSERT_SQL = `
  INSERT INTO talents (${COLS.join(', ')}, updated_at)
  VALUES (${COLS.map((c) => ':' + c).join(', ')}, datetime('now'))
  ON CONFLICT(id) DO UPDATE SET
    ${COLS.filter((c) => c !== 'id').map((c) => `${c} = excluded.${c}`).join(',\n    ')},
    updated_at = datetime('now')`;

export function upsertTalent(db, talent) {
  db.prepare(UPSERT_SQL).run(talentToRow(talent));
}

export function getTalent(db, id) {
  return rowToTalent(db.prepare('SELECT * FROM talents WHERE id = ?').get(id));
}

export function getAllTalents(db) {
  return db.prepare('SELECT * FROM talents ORDER BY name COLLATE NOCASE').all().map(rowToTalent);
}

export function countTalents(db) {
  return db.prepare('SELECT COUNT(*) AS n FROM talents').get().n;
}
