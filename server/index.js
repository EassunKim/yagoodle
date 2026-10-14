import express from 'express';
import { ATTRIBUTES, MODES, PORT, PUBLIC_DIR, RESET_TZ, TALENTS_JSON } from './config.js';
import { addDays, isDateStr, secondsUntilReset, today } from './dates.js';
import { countTalents, getAllTalents, getTalent, openDb } from './db.js';
import { compareTalents, formatHint } from './game.js';
import { imageUrl, portraitPath } from './images.js';
import { MODE_IDS, getPuzzle, getPuzzleRow, puzzleNumber, startScheduler } from './scheduler.js';
import { seedFromFile } from './seed.js';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const db = openDb();
if (countTalents(db) === 0) {
  const { count, warnings } = seedFromFile(db, TALENTS_JSON);
  console.log(`[seed] Empty database: imported ${count} talents from talents.json (${warnings.length} warnings, run "npm run validate" for details)`);
}
startScheduler(db);

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
function resolvePuzzle({ mode, date }) {
  mode = String(mode ?? '');
  date = date ? String(date) : today();
  if (!MODES[mode]) throw new HttpError(400, 'Unknown mode');
  if (!isDateStr(date) || date > today()) throw new HttpError(400, 'Invalid date');
  const row = getPuzzle(db, date, mode);
  if (!row) throw new HttpError(404, 'No puzzle for this mode yet');
  return { mode, date, answer: getTalent(db, row.talentId) };
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8kb' }));
app.use(express.static(PUBLIC_DIR));

app.get('/api/meta', (req, res) => {
  const date = today();
  res.json({
    today: date,
    puzzleNumber: puzzleNumber(db, date),
    secondsUntilReset: secondsUntilReset(),
    resetTimeZone: RESET_TZ,
    modes: MODE_IDS.map((id) => ({
      id,
      label: MODES[id].label,
      tagline: MODES[id].tagline,
      requiresImage: MODES[id].requiresImage,
      available: getPuzzle(db, date, id) !== null,
      hints: MODES[id].hints.map(({ key, label, icon, after }) => ({ key, label, icon, after })),
    })),
    attributes: ATTRIBUTES.map(({ key, label, type, unit }) => ({ key, label, type, unit })),
  });
});

app.get('/api/talents', (req, res) => {
  res.json({ talents: getAllTalents(db).map(publicTalent) });
});

app.post('/api/guess', (req, res) => {
  const body = req.body ?? {};
  const { mode, answer } = resolvePuzzle(body);
  const guess = getTalent(db, String(body.talentId ?? ''));
  if (!guess) throw new HttpError(400, 'Unknown talent');

  const correct = guess.id === answer.id;
  const out = { correct, guess: publicTalent(guess) };
  if (MODES[mode].showsAttributes) out.cells = compareTalents(guess, answer);
  if (correct) out.profile = profile(answer);
  res.json(out);
});

app.get('/api/hints', (req, res) => {
  const { mode, answer } = resolvePuzzle(req.query);
  const count = Math.max(0, Number.parseInt(req.query.count, 10) || 0);
  const hints = MODES[mode].hints
    .filter((h) => count >= h.after)
    .map((h) => ({ key: h.key, label: h.label, value: formatHint(h, answer[h.key]) }));
  res.json({ hints });
});

app.get('/api/puzzle/:mode/image', (req, res) => {
  const { answer } = resolvePuzzle({ mode: req.params.mode, date: req.query.date });
  const file = portraitPath(answer);
  if (!file) throw new HttpError(404, 'No image for this puzzle');
  res.set('Cache-Control', 'private, max-age=600');
  res.sendFile(file);
});

app.get('/api/yesterday', (req, res) => {
  const date = addDays(today(), -1);
  const answers = {};
  for (const mode of MODE_IDS) {
    const row = getPuzzleRow(db, date, mode);
    const t = row && getTalent(db, row.talentId);
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
