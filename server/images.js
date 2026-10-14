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

/** Finds `talent.image`, or falls back to `<id>.<ext>` in the directory. */
function findFile(dir, talent, { useImageField = true } = {}) {
  const files = listDir(dir);
  if (useImageField && talent.image) {
    const named = files.get(talent.image.toLowerCase());
    if (named) return named;
  }
  for (const ext of EXTS) {
    const named = files.get(`${talent.id}${ext}`.toLowerCase());
    if (named) return named;
  }
  return null;
}

export function imageUrl(talent) {
  const file = findFile(IMAGE_DIR, talent);
  return file ? IMAGE_URL_BASE + encodeURIComponent(file) : null;
}

/** Portrait-mode art: a private file in data/portraits wins, else the public icon. */
export function portraitPath(talent) {
  const priv = findFile(PORTRAIT_DIR, talent, { useImageField: false });
  if (priv) return path.join(PORTRAIT_DIR, priv);
  const pub = findFile(IMAGE_DIR, talent);
  return pub ? path.join(IMAGE_DIR, pub) : null;
}

export const hasPortrait = (talent) => portraitPath(talent) !== null;
