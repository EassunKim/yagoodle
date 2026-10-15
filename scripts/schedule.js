// Admin tool for the daily answers.
//
//   npm run schedule                              list recent and upcoming answers
//   npm run schedule -- fill 30                   generate the next 30 days
//   npm run schedule -- set 2026-10-20 classic usada-pekora
//   npm run schedule -- reroll 2026-10-20 [mode] [--force]
//   npm run schedule -- pool [mode]               list who can be an answer
import { MODES } from '../server/config.js';
import { addDays, isDateStr, today } from '../server/dates.js';
import { closeDb, getTalent, query } from '../server/db.js';
import { MODE_IDS, eligibleTalents, ensureSchedule, generatePuzzle, setPuzzle } from '../server/scheduler.js';

const [cmd = 'list', ...args] = process.argv.slice(2);
const force = args.includes('--force');
const positional = args.filter((a) => !a.startsWith('--'));

class UsageError extends Error {}
const fail = (msg) => {
  throw new UsageError(msg);
};

function checkMode(mode) {
  if (!MODES[mode]) fail(`Unknown mode "${mode}". Modes: ${MODE_IDS.join(', ')}`);
}

async function list() {
  const now = today();
  const rows = await query(
    `SELECT p.date, p.mode, p.source, t.name FROM daily_puzzles p
     JOIN talents t ON t.id = p.talent_id
     WHERE p.date >= $1 ORDER BY p.date, p.mode`,
    [addDays(now, -7)],
  );
  if (!rows.length) return console.log('No puzzles scheduled yet. Start the server or run "fill".');
  for (const r of rows) {
    const mark = r.date === now ? '▶' : r.date < now ? ' ' : '·';
    console.log(`${mark} ${r.date}  ${r.mode.padEnd(9)} ${r.name}${r.source === 'manual' ? '  (manual)' : ''}`);
  }
}

async function run() {
  switch (cmd) {
    case 'list':
      await list();
      break;

    case 'fill': {
      const days = Number.parseInt(positional[0] ?? '7', 10);
      const created = await ensureSchedule(today(), days);
      console.log(`Generated ${created.length} puzzle(s).`);
      await list();
      break;
    }

    case 'set': {
      const [date, mode, id] = positional;
      if (!isDateStr(date) || !mode || !id) fail('Usage: set <YYYY-MM-DD> <mode> <talent-id>');
      checkMode(mode);
      const talent = await getTalent(id);
      if (!talent) fail(`No talent with id "${id}"`);
      if (date <= today() && !force) fail('That date has already started; players may have guessed. Add --force to change it anyway.');
      await setPuzzle(date, mode, id);
      console.log(`${date} ${mode} → ${talent.name}`);
      const nearby = await query(
        `SELECT date FROM daily_puzzles
         WHERE mode = $1 AND talent_id = $2 AND date <> $3 AND date BETWEEN $4 AND $5`,
        [mode, id, date, addDays(date, -14), addDays(date, 14)],
      );
      if (nearby.length) {
        console.log(`Heads up: also the answer on ${nearby.map((r) => r.date).join(', ')}. Reroll those with "reroll <date> ${mode}".`);
      }
      break;
    }

    case 'reroll': {
      const [date, mode] = positional;
      if (!isDateStr(date)) fail('Usage: reroll <YYYY-MM-DD> [mode] [--force]');
      if (date <= today() && !force) fail('That date has already started; players may have guessed. Add --force to reroll anyway.');
      const modes = mode ? [mode] : MODE_IDS;
      modes.forEach(checkMode);
      for (const m of modes) {
        const row = await generatePuzzle(date, m, { force: true });
        console.log(`${date} ${m} → ${row ? (await getTalent(row.talentId)).name : '(no eligible talents)'}`);
      }
      break;
    }

    case 'pool': {
      const modes = positional[0] ? [positional[0]] : MODE_IDS;
      modes.forEach(checkMode);
      for (const m of modes) {
        const pool = await eligibleTalents(m);
        console.log(`${m}: ${pool.length} eligible`);
        if (pool.length) console.log('  ' + pool.map((t) => t.id).join(', '));
      }
      break;
    }

    default:
      fail(`Unknown command "${cmd}". Commands: list, fill, set, reroll, pool`);
  }
}

try {
  await run();
} catch (err) {
  console.error(err instanceof UsageError ? err.message : `Error: ${err.message}`);
  process.exitCode = 1;
} finally {
  await closeDb();
}
