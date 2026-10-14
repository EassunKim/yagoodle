import { RESET_TZ } from './config.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: RESET_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function zonedParts(now) {
  const out = {};
  for (const p of partsFormatter.formatToParts(now)) out[p.type] = p.value;
  return out;
}

/** The current puzzle date (YYYY-MM-DD) in the reset time zone. */
export function today(now = new Date()) {
  const p = zonedParts(now);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Seconds until the next midnight in the reset time zone. */
export function secondsUntilReset(now = new Date()) {
  const p = zonedParts(now);
  const elapsed = Number(p.hour) * 3600 + Number(p.minute) * 60 + Number(p.second);
  return Math.max(1, 86400 - elapsed);
}

export function isDateStr(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}
