import fs from 'node:fs';
import { upsertTalent } from './db.js';
import { validateTalents } from './validate.js';

export function readTalentsFile(file) {
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(parsed) ? parsed : parsed.talents;
}

/**
 * Syncs talents.json into the database.
 * Talents removed from the file are deleted, unless they were already a daily
 * answer, in which case they're kept but taken out of the answer pool.
 */
export function seedFromFile(db, file) {
  const list = readTalentsFile(file);
  const { errors, warnings } = validateTalents(list);
  if (errors.length) {
    const e = new Error(`${file} has ${errors.length} error(s):\n  - ${errors.join('\n  - ')}`);
    e.warnings = warnings;
    throw e;
  }

  const retired = [];
  const removed = [];
  db.exec('BEGIN');
  try {
    for (const t of list) upsertTalent(db, t);

    const keep = new Set(list.map((t) => t.id));
    const used = db.prepare('SELECT 1 FROM daily_puzzles WHERE talent_id = ? LIMIT 1');
    for (const { id } of db.prepare('SELECT id FROM talents').all()) {
      if (keep.has(id)) continue;
      if (used.get(id)) {
        db.prepare('UPDATE talents SET in_pool = 0 WHERE id = ?').run(id);
        retired.push(id);
      } else {
        db.prepare('DELETE FROM talents WHERE id = ?').run(id);
        removed.push(id);
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return { count: list.length, retired, removed, warnings };
}
