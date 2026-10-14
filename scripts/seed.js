// Syncs data/talents.json into the SQLite database.
// Usage: npm run seed [-- path/to/talents.json]
import { TALENTS_JSON } from '../server/config.js';
import { openDb } from '../server/db.js';
import { seedFromFile } from '../server/seed.js';

const file = process.argv[2] ?? TALENTS_JSON;
const db = openDb();
try {
  const { count, retired, removed, warnings } = seedFromFile(db, file);
  console.log(`Imported ${count} talents from ${file}`);
  if (removed.length) console.log(`Removed: ${removed.join(', ')}`);
  if (retired.length) console.log(`Taken out of the answer pool (already used as answers): ${retired.join(', ')}`);
  if (warnings.length) console.log(`${warnings.length} warning(s); run "npm run validate" to see them.`);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
