import express from 'express';
import { ATTRIBUTES, MODES, PORT, PUBLIC_DIR, RESET_TZ } from './config.js';
import { addDays, isDateStr, secondsUntilReset, today } from './dates.js';
import { getAllTalents, getTalent, query } from './db.js';
import { compareTalents, formatHint } from './game.js';
import { imageUrl, portraitSource } from './images.js';
import { MODE_IDS, getPuzzle, getPuzzleRow, puzzleNumber, startScheduler } from './scheduler.js';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Fail fast with a readable message if Supabase can't be reached.
try {
  await query('SELECT 1');
  const talents = await getAllTalents();
  console.log(`[db] Connected to Supabase: ${talents.length} talents`);
  if (!talents.length) console.warn('[db] No talents found. Add some in Supabase (see db/seed.sql).');
} catch (err) {
  console.error(`[db] Could not connect to the database: ${err.message}`);
  console.error('     Check DATABASE_URL in .env (see README).');
  process.exit(1);
}
startScheduler();

const publicTalent = (t) => ({
  id: t.id,
  name: t.name,
  nameJp: t.nameJp ?? null,
  aliases: t.aliases ?? [],
  image: imageUrl(t),
});

const profile = (t) => ({
  branch: t.branch,
  generation: t.generation,
  status: t.status,
  debutDate: t.debutDate ?? null,
  fanName: t.fanName ?? null,
  oshiMark: t.oshiMark ?? null,
  youtube: t.youtube ?? null,
});

/** Validates mode/date from a request and returns today's (or a past day's) answer. */
async function resolvePuzzle({ mode, date }) {
  mode = String(mode ?? '');
  date = date ? String(date) : today();
  if (!MODES[mode]) throw new HttpError(400, 'Unknown mode');
  if (!isDateStr(date) || date > today()) throw new HttpError(400, 'Invalid date');
  const row = await getPuzzle(date, mode);
  if (!row) throw new HttpError(404, 'No puzzle for this mode yet');
  return { mode, date, answer: await getTalent(row.talentId) };
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8kb' }));
// no-cache: the browser may keep files but must check for a newer version on
// each load, so changes to the site show up after a normal refresh.
app.use(express.static(PUBLIC_DIR, { cacheControl: false, setHeaders: (res) => res.set('Cache-Control', 'no-cache') }));

app.get('/api/meta', async (req, res) => {
  const date = today();
  const [number, puzzles] = await Promise.all([
    puzzleNumber(date),
    Promise.all(MODE_IDS.map((id) => getPuzzle(date, id))),
  ]);
  res.json({
    today: date,
    puzzleNumber: number,
    secondsUntilReset: secondsUntilReset(),
    resetTimeZone: RESET_TZ,
    modes: MODE_IDS.map((id, i) => ({
      id,
      label: MODES[id].label,
      tagline: MODES[id].tagline,
      requiresImage: MODES[id].requiresImage,
      available: puzzles[i] !== null,
      hints: MODES[id].hints.map(({ key, label, icon, after }) => ({ key, label, icon, after })),
    })),
    attributes: ATTRIBUTES.map(({ key, label, type, unit }) => ({ key, label, type, unit })),
  });
});

app.get('/api/talents', async (req, res) => {
  res.json({ talents: (await getAllTalents()).map(publicTalent) });
});

app.post('/api/guess', async (req, res) => {
  const body = req.body ?? {};
  const { mode, answer } = await resolvePuzzle(body);
  const guess = await getTalent(String(body.talentId ?? ''));
  if (!guess) throw new HttpError(400, 'Unknown talent');

  const correct = guess.id === answer.id;
  const out = { correct, guess: publicTalent(guess) };
  if (MODES[mode].showsAttributes) out.cells = compareTalents(guess, answer);
  if (correct) out.profile = profile(answer);
  res.json(out);
});

app.get('/api/hints', async (req, res) => {
  const { mode, answer } = await resolvePuzzle(req.query);
  const count = Math.max(0, Number.parseInt(req.query.count, 10) || 0);
  const hints = MODES[mode].hints
    .filter((h) => count >= h.after)
    .map((h) => ({ key: h.key, label: h.label, value: formatHint(h, answer[h.key]) }));
  res.json({ hints });
});

app.get('/api/puzzle/:mode/image', async (req, res) => {
  const { answer } = await resolvePuzzle({ mode: req.params.mode, date: req.query.date });
  const source = portraitSource(answer);
  if (!source) throw new HttpError(404, 'No image for this puzzle');
  res.set('Cache-Control', 'private, max-age=600');
  if (source.file) return res.sendFile(source.file);

  // Fetch remote images here instead of redirecting, so the URL (and with it
  // the answer) never reaches the browser.
  const upstream = await fetch(source.url);
  if (!upstream.ok) throw new HttpError(502, 'Could not load the puzzle image');
  res.type(upstream.headers.get('content-type') ?? 'application/octet-stream');
  res.send(Buffer.from(await upstream.arrayBuffer()));
});

app.get('/api/yesterday', async (req, res) => {
  const date = addDays(today(), -1);
  const answers = {};
  for (const mode of MODE_IDS) {
    const row = await getPuzzleRow(date, mode);
    const t = row && (await getTalent(row.talentId));
    if (t) answers[mode] = publicTalent(t);
  }
  res.json({ date, answers });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Server error' : err.message });
});

app.listen(PORT, () => {
  console.log(`Yagoodle running at http://localhost:${PORT} (resets at midnight ${RESET_TZ})`);
});
