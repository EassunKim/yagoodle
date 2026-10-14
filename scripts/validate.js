// Checks data/talents.json without touching the database.
// Usage: npm run validate [-- path/to/talents.json]
import { TALENTS_JSON } from '../server/config.js';
import { readTalentsFile } from '../server/seed.js';
import { validateTalents } from '../server/validate.js';

const file = process.argv[2] ?? TALENTS_JSON;
const list = readTalentsFile(file);
const { errors, warnings } = validateTalents(list);

for (const w of warnings) console.log(`warn   ${w}`);
for (const e of errors) console.log(`ERROR  ${e}`);

const unverified = list.filter((t) => !t.verified).length;
console.log(
  `\n${list.length} talents, ${errors.length} error(s), ${warnings.length} warning(s), ${unverified} not yet marked verified.`,
);
if (errors.length) process.exitCode = 1;
