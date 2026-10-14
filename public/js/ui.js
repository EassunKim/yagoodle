/** Tiny DOM builder: h('div', { class: 'x', onclick }, child, 'text', ...) */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k === 'html') el.innerHTML = v; // trusted, static markup only
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

export function hashString(s) {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return x >>> 0;
}

const placeholderCache = new Map();

/** Talent icon, or a colorful initials placeholder when no image exists yet. */
export function avatarSrc(t) {
  if (t.image) return t.image;
  if (placeholderCache.has(t.id)) return placeholderCache.get(t.id);
  const hue = hashString(t.id) % 360;
  const initials = t.name
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
    .replace(/[<>&'"]/g, '');
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='hsl(${hue} 85% 74%)'/><stop offset='1' stop-color='hsl(${(hue + 45) % 360} 75% 56%)'/>` +
    `</linearGradient></defs><rect width='64' height='64' fill='url(#g)'/>` +
    `<text x='32' y='33' text-anchor='middle' dominant-baseline='central' font-family='system-ui,sans-serif' font-size='24' font-weight='800' fill='white'>${initials}</text></svg>`;
  const url = 'data:image/svg+xml,' + encodeURIComponent(svg);
  placeholderCache.set(t.id, url);
  return url;
}

/** Lowercase, strip accents, spaces and punctuation for forgiving search. */
export function normalize(s) {
  return String(s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s'’\-_.・·]/g, '');
}

export function fmtCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

let toastTimer;
export function toast(message, kind = 'info') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.dataset.kind = kind;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const ta = h('textarea', { style: 'position:fixed;opacity:0' });
  ta.value = text;
  document.body.append(ta);
  ta.select();
  const ok = document.execCommand('copy');
  ta.remove();
  if (!ok) throw new Error('Copy failed');
}

export function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#1aa9e8', '#ff7eb3', '#ffd23f', '#20b26b', '#9b7bff'];
  const layer = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  for (let i = 0; i < 48; i++) {
    layer.append(
      h('i', {
        style:
          `--x:${Math.random() * 100}vw;--dx:${(Math.random() - 0.5) * 30}vw;` +
          `--r:${Math.random() * 720 - 360}deg;--d:${Math.random() * 0.5}s;` +
          `--t:${1.8 + Math.random() * 1.4}s;background:${colors[i % colors.length]}`,
      }),
    );
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 4000);
}
