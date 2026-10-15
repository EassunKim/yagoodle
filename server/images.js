import fs from 'node:fs';
import path from 'node:path';
import { IMAGE_DIR, IMAGE_URL_BASE, PORTRAIT_DIR } from './config.js';

const EXTS = ['.webp', '.png', '.jpg', '.jpeg', '.avif', '.gif'];
const CACHE_MS = 10_000;
const cache = new Map(); // dir -> { at, files: Map<lowercase name, actual name> }

function listDir(dir) {
  const hit = cache.get(dir);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.files;
  const files = new Map();
  try {
    for (const name of fs.readdirSync(dir)) files.set(name.toLowerCase(), name);
  } catch {
    // A missing directory just means there are no images yet.
  }
  cache.set(dir, { at: Date.now(), files });
  return files;
}

/** Finds `<id>.<ext>` in a directory. */
function findFile(dir, id) {
  const files = listDir(dir);
  for (const ext of EXTS) {
    const named = files.get(`${id}${ext}`.toLowerCase());
    if (named) return named;
  }
  return null;
}

/** Talent icon: the image_url from the database, or a local file named after the id. */
export function imageUrl(talent) {
  if (talent.imageUrl) return talent.imageUrl;
  const file = findFile(IMAGE_DIR, talent.id);
  return file ? IMAGE_URL_BASE + encodeURIComponent(file) : null;
}

/**
 * Portrait-mode art, in order of preference: a private file in data/portraits,
 * a local icon, then the database image_url.
 * @returns {{ file: string } | { url: string } | null}
 */
export function portraitSource(talent) {
  const priv = findFile(PORTRAIT_DIR, talent.id);
  if (priv) return { file: path.join(PORTRAIT_DIR, priv) };
  const pub = findFile(IMAGE_DIR, talent.id);
  if (pub) return { file: path.join(IMAGE_DIR, pub) };
  if (talent.imageUrl) return { url: talent.imageUrl };
  return null;
}

export const hasPortrait = (talent) => portraitSource(talent) !== null;
