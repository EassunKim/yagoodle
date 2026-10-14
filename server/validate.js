import { imageUrl } from './images.js';

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_DAY_RE = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const KNOWN_BRANCHES = ['JP', 'EN', 'ID', 'DEV_IS'];
const KNOWN_STATUSES = ['Active', 'Graduated', 'Affiliate', 'Hiatus'];

/**
 * Checks talents.json. Errors block seeding; warnings are printed but allowed.
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateTalents(list) {
  const errors = [];
  const warnings = [];
  if (!Array.isArray(list)) return { errors: ['Expected an array of talents'], warnings };

  const ids = new Set();
  const names = new Set();
  list.forEach((t, i) => {
    const where = `#${i} (${t?.id ?? t?.name ?? 'unnamed'})`;
    const err = (msg) => errors.push(`${where}: ${msg}`);
    const warn = (msg) => warnings.push(`${where}: ${msg}`);

    if (!t || typeof t !== 'object') return err('not an object');

    if (typeof t.id !== 'string' || !ID_RE.test(t.id)) err('id must be lowercase-kebab-case, e.g. "usada-pekora"');
    else if (ids.has(t.id)) err(`duplicate id "${t.id}"`);
    else ids.add(t.id);

    for (const key of ['name', 'branch', 'generation', 'status']) {
      if (typeof t[key] !== 'string' || !t[key].trim()) err(`"${key}" is required`);
    }
    if (typeof t.name === 'string') {
      const n = t.name.toLowerCase();
      if (names.has(n)) warn(`duplicate name "${t.name}"`);
      names.add(n);
    }
    if (t.branch && !KNOWN_BRANCHES.includes(t.branch)) warn(`unusual branch "${t.branch}"`);
    if (t.status && !KNOWN_STATUSES.includes(t.status)) warn(`unusual status "${t.status}"`);

    for (const key of ['debutDate', 'graduationDate']) {
      if (t[key] != null && !(typeof t[key] === 'string' && DATE_RE.test(t[key]))) err(`"${key}" must be YYYY-MM-DD`);
    }
    if (t.debutDate == null) warn('missing debutDate');
    if (t.birthday != null && !(typeof t.birthday === 'string' && MONTH_DAY_RE.test(t.birthday))) {
      err('"birthday" must be MM-DD');
    }
    if (t.height != null && !(typeof t.height === 'number' && t.height > 0)) err('"height" must be a positive number (cm)');

    for (const key of ['aliases', 'hairColor']) {
      if (t[key] == null) continue;
      if (!Array.isArray(t[key]) || t[key].some((v) => typeof v !== 'string')) err(`"${key}" must be a list of strings`);
    }
    if (!t.hairColor?.length) warn('missing hairColor');

    if (t.id && !imageUrl(t)) warn('no icon in public/images/talents');
  });

  return { errors, warnings };
}
