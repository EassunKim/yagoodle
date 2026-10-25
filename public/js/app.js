import { api } from './api.js';
import * as store from './store.js';
import { avatarSrc, celebrate, copyText, fmtCountdown, h, hashString, normalize, toast } from './ui.js';

const ICONS = {
  classic:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
  portrait:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="12" cy="10" r="3.2"/><path d="M6.5 20c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
};
const SHARE_EMOJI = { correct: '🟩', partial: '🟨', wrong: '🟥', unknown: '⬜' };
const STATUS_TEXT = { correct: 'match', partial: 'partial match', wrong: 'no match', unknown: 'unknown' };
// Keep in sync with --flip-ms / --stagger-ms in styles.css.
const FLIP_MS = 600;
const STAGGER_MS = 300;
/**
 * Portrait view after 0, 1, 2… wrong guesses: starts grey, zoomed in, slightly
 * blurred and turned the wrong way; zooms out and sharpens slowly, then color
 * returns, and the picture is turned upright last.
 */
const PORTRAIT_STEPS = [
  { zoom: 2.6, blur: 4, gray: 1, upright: false },
  { zoom: 2.3, blur: 3.5, gray: 1, upright: false },
  { zoom: 2.05, blur: 3, gray: 1, upright: false },
  { zoom: 1.8, blur: 2.5, gray: 1, upright: false },
  { zoom: 1.6, blur: 2, gray: 1, upright: false },
  { zoom: 1.4, blur: 1.5, gray: 1, upright: false },
  { zoom: 1.25, blur: 1, gray: 1, upright: false },
  { zoom: 1.1, blur: 0.5, gray: 0, upright: false },
  { zoom: 1, blur: 0, gray: 0, upright: false },
  { zoom: 1, blur: 0, gray: 0, upright: true },
];
/** Wrong orientations the day's portrait can start in, in degrees. */
const PORTRAIT_TURNS = [90, 180, -90];
/** Time until the last card of a fresh Classic row has flipped. */
const revealMs = () => 250 + state.meta.attributes.length * STAGGER_MS + FLIP_MS;

const state = {
  meta: null,
  talents: [],
  mode: null,
  games: {},
  busy: false,
  freshId: null, // guess id to animate on the next render
  freshHint: null, // hint key to animate on the next render
  resetAt: 0,
  portraitImg: null,
  portraitTurn: null,
};

const $ = (sel) => document.querySelector(sel);
const currentMode = () => state.meta.modes.find((m) => m.id === state.mode);

init().catch((err) => {
  console.error(err);
  $('#mode-body').replaceChildren(
    h('div', { class: 'empty' }, h('p', {}, h('b', {}, "Couldn't load the game.")), h('p', { class: 'muted' }, err.message)),
  );
});

async function init() {
  setupChrome();
  const [meta, { talents }] = await Promise.all([api.meta(), api.talents()]);
  state.meta = meta;
  state.talents = talents.map((t) => ({ ...t, _keys: searchKeys(t) }));
  state.resetAt = Date.now() + meta.secondsUntilReset * 1000;

  store.pruneGames(meta.today);
  for (const m of meta.modes) state.games[m.id] = store.loadGame(meta.today, m.id);

  const fromHash = location.hash.slice(1);
  state.mode = (meta.modes.find((m) => m.id === fromHash) ?? meta.modes.find((m) => m.available) ?? meta.modes[0]).id;

  renderResetLabel();
  renderTabs();
  renderMode();
  startCountdown();
  loadYesterday();

  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (id !== state.mode && meta.modes.some((m) => m.id === id)) switchMode(id);
  });
}

// ─── Chrome: theme, dialogs ──────────────────────────────────────────────────

function setupChrome() {
  $('#btn-theme').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try {
      localStorage.setItem('yagoodle:theme', root.dataset.theme);
    } catch {}
  });
  $('#btn-help').addEventListener('click', () => $('#dlg-help').showModal());
  $('#btn-stats').addEventListener('click', () => {
    if (state.meta) renderStats();
    $('#dlg-stats').showModal();
  });
  for (const dlg of document.querySelectorAll('dialog')) {
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close(); // backdrop click
    });
  }
  try {
    if (!localStorage.getItem('yagoodle:seen-help')) {
      localStorage.setItem('yagoodle:seen-help', '1');
      $('#dlg-help').showModal();
    }
  } catch {}
}

function renderResetLabel() {
  const tz = state.meta.resetTimeZone;
  const name = tz === 'Asia/Tokyo' ? 'JST' : tz;
  const local = new Date(state.resetAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  $('#tz-label').textContent = `${name} (${local} your time)`;
}

function startCountdown() {
  const tick = () => {
    const ms = state.resetAt - Date.now();
    const text = ms > 0 ? fmtCountdown(ms) : 'now!';
    for (const el of document.querySelectorAll('[data-countdown]')) el.textContent = text;
    if (ms <= -2000) {
      clearInterval(timer);
      toast('A new talent is ready! Loading…');
      setTimeout(() => location.reload(), 1200);
    }
  };
  const timer = setInterval(tick, 1000);
  tick();
}

// ─── Mode tabs ───────────────────────────────────────────────────────────────

function renderTabs() {
  $('#mode-tabs').replaceChildren(
    ...state.meta.modes.map((m) => {
      const active = m.id === state.mode;
      const solved = state.games[m.id]?.solved;
      const failed = state.games[m.id]?.failed;
      return h(
        'button',
        {
          type: 'button',
          role: 'tab',
          class: `mode-tab${active ? ' active' : ''}${solved ? ' solved' : ''}`,
          'aria-selected': String(active),
          onclick: () => switchMode(m.id),
        },
        h('span', { class: 'mode-icon', html: ICONS[m.id] ?? ICONS.classic }),
        h('span', { class: 'mode-text' }, h('b', {}, m.label), h('small', {}, m.tagline)),
        solved ? h('span', { class: 'mode-check', title: 'Solved' }, '✓') : null,
        failed ? h('span', { class: 'mode-check failed', title: 'Out of guesses' }, '✗') : null,
      );
    }),
  );
}

function switchMode(id) {
  state.mode = id;
  state.freshId = null;
  history.replaceState(null, '', `#${id}`);
  renderTabs();
  renderMode();
}

// ─── Main game body ──────────────────────────────────────────────────────────

function renderMode() {
  const mode = currentMode();
  const game = state.games[mode.id];
  $('#puzzle-no').textContent = `#${state.meta.puzzleNumber} · ${mode.label}`;

  if (!mode.available) {
    $('#mode-body').replaceChildren(renderUnavailable(mode));
    return;
  }

  const parts = [
    mode.id === 'portrait' ? renderPortrait(game) : renderPrompt(game),
    renderHints(mode, game),
    game.solved ? renderWin(mode, game) : game.failed ? renderDefeat(mode, game) : renderSearch(game),
    mode.id === 'classic' ? renderGrid(game) : renderGuessList(game),
    mode.id === 'classic' && game.guesses.length ? renderLegend() : null,
  ];
  $('#mode-body').replaceChildren(...parts.filter(Boolean));
}

function renderUnavailable(mode) {
  return h(
    'div',
    { class: 'empty' },
    h('div', { class: 'empty-icon', html: ICONS[mode.id] ?? ICONS.classic }),
    h('p', {}, h('b', {}, `${mode.label} mode isn't ready yet.`)),
    h(
      'p',
      { class: 'muted' },
      mode.requiresImage
        ? 'This mode needs talent pictures. Add images to public/images/talents (or data/portraits) and it will start automatically.'
        : 'No talents are in the answer pool yet.',
    ),
  );
}

function renderPrompt(game) {
  if (game.solved || game.failed) return null;
  const left = state.meta.maxGuesses - game.guesses.length;
  return h(
    'p',
    { class: 'prompt' },
    game.guesses.length
      ? `${left} ${left === 1 ? 'guess' : 'guesses'} left. Keep going!`
      : `Type any talent's name to begin. You have ${left} guesses, and each one shows how close you are.`,
  );
}

// ─── Search / autocomplete ───────────────────────────────────────────────────

function searchKeys(t) {
  return [t.name, t.nameJp, ...(t.aliases ?? [])].filter(Boolean).map((s) => ({
    full: normalize(s),
    words: String(s).split(/[\s\-_.・]+/).map(normalize).filter(Boolean),
  }));
}

function searchTalents(query, exclude) {
  const q = normalize(query);
  if (!q) return [];
  const scored = [];
  for (const t of state.talents) {
    if (exclude.has(t.id)) continue;
    let best = Infinity;
    for (const k of t._keys) {
      if (k.full.startsWith(q)) best = Math.min(best, 0);
      else if (k.words.some((w) => w.startsWith(q))) best = Math.min(best, 1);
      else if (k.full.includes(q)) best = Math.min(best, 2);
    }
    if (best < Infinity) scored.push([best, t]);
  }
  return scored
    .sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name))
    .slice(0, 8)
    .map(([, t]) => t);
}

function renderSearch(game) {
  const guessed = new Set(game.guesses.map((g) => g.guess.id));
  let items = [];
  let active = 0;

  const input = h('input', {
    type: 'text',
    class: 'search-input',
    placeholder: 'Type a talent name…',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    role: 'combobox',
    'aria-label': 'Guess a talent',
    'aria-autocomplete': 'list',
    'aria-controls': 'suggestions',
    'aria-expanded': 'false',
  });
  const list = h('ul', { id: 'suggestions', class: 'suggestions', role: 'listbox', hidden: true });

  const setActive = (i) => {
    active = i;
    [...list.children].forEach((li, j) => {
      li.classList.toggle('active', j === i);
      li.setAttribute('aria-selected', String(j === i));
    });
    const el = list.children[i];
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', el.id);
    }
  };

  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
  };

  const paint = () => {
    list.replaceChildren(
      ...items.map((t, i) =>
        h(
          'li',
          {
            id: `opt-${t.id}`,
            role: 'option',
            onmousedown: (e) => {
              e.preventDefault();
              submit(t);
            },
            onmousemove: () => active !== i && setActive(i),
          },
          h('img', { src: avatarSrc(t), alt: '', loading: 'lazy' }),
          h('span', { class: 'opt-text' }, h('b', {}, t.name), t.nameJp ? h('small', {}, t.nameJp) : null),
        ),
      ),
    );
    if (input.value.trim() && !items.length) {
      list.append(h('li', { class: 'no-match', role: 'presentation' }, 'No talent matches that name'));
    }
    const open = list.children.length > 0;
    list.hidden = !open;
    input.setAttribute('aria-expanded', String(open));
    if (items.length) setActive(0);
  };

  const refresh = () => {
    items = searchTalents(input.value, guessed);
    paint();
  };

  async function submit(t) {
    if (state.busy) return;
    close();
    input.value = '';
    await makeGuess(t);
  }

  input.addEventListener('input', refresh);
  input.addEventListener('focus', () => input.value && refresh());
  input.addEventListener('blur', close);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault();
      setActive((active + 1) % items.length);
    } else if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault();
      setActive((active - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[active]) submit(items[active]);
    } else if (e.key === 'Escape') {
      close();
    }
  });

  const button = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-primary search-btn',
      onclick: () => (items[active] ? submit(items[active]) : input.focus()),
    },
    'Guess',
  );

  if (matchMedia('(pointer: fine)').matches || state.freshId) requestAnimationFrame(() => input.focus());

  return h(
    'div',
    { class: 'search' },
    h('div', { class: 'search-field' }, h('span', { class: 'search-icon', html: ICONS.search }), input, list),
    button,
  );
}

async function makeGuess(talent) {
  if (state.busy) return;
  state.busy = true;
  const mode = currentMode();
  const game = state.games[mode.id];
  const date = state.meta.today;
  try {
    const guessNumber = game.guesses.length + 1;
    const res = await api.guess({ date, mode: mode.id, talentId: talent.id, guessNumber });
    if (game.guesses.length === 0) store.recordPlayed(mode.id, date);
    game.guesses.push({ guess: res.guess, cells: res.cells ?? null, correct: res.correct });
    if (res.correct) {
      game.solved = true;
      game.profile = res.profile ?? null;
      store.recordWin(mode.id, date, game.guesses.length);
    } else if (res.answer) {
      game.failed = true;
      game.answer = res.answer;
      game.profile = res.profile ?? null;
      store.recordLoss(mode.id);
    }
    store.saveGame(date, mode.id, game);

    state.freshId = res.guess.id;
    renderMode();
    renderTabs();
    state.freshId = null;

    if (res.correct || game.failed) {
      const delay = mode.id === 'classic' ? revealMs() + 200 : 500;
      setTimeout(() => {
        $(res.correct ? '#win' : '#defeat')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (res.correct) celebrate();
      }, delay);
    }
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    state.busy = false;
  }
}

// ─── Hints ───────────────────────────────────────────────────────────────────

function renderHints(mode, game) {
  if (!mode.hints.length) return null;
  const n = game.guesses.length;
  return h(
    'div',
    { class: 'hints' },
    ...mode.hints.map((hint) => {
      const revealed = Object.hasOwn(game.hints ?? {}, hint.key);
      const left = hint.after - n;
      const ready = game.solved || game.failed || left <= 0;
      const status = revealed ? 'open' : ready ? 'ready' : 'locked';
      let value;
      if (revealed) value = game.hints[hint.key] ?? 'Not recorded';
      else if (ready) value = 'Tap to reveal';
      else value = `in ${left} ${left === 1 ? 'guess' : 'guesses'}`;
      return h(
        'button',
        {
          type: 'button',
          class: `hint ${status}${hint.key === state.freshHint ? ' just-opened' : ''}`,
          disabled: status !== 'ready',
          onclick: () => revealHint(hint),
        },
        h('span', { class: 'hint-icon', 'aria-hidden': 'true' }, status === 'locked' ? '🔒' : hint.icon),
        h('span', { class: 'hint-text' }, h('small', {}, hint.label), h('b', {}, value)),
      );
    }),
  );
}

async function revealHint(hint) {
  const mode = currentMode();
  const game = state.games[mode.id];
  try {
    const count = game.solved || game.failed ? 999 : game.guesses.length;
    const { hints } = await api.hints(state.meta.today, mode.id, count);
    const found = hints.find((x) => x.key === hint.key);
    if (!found) return;
    game.hints = { ...game.hints, [hint.key]: found.value };
    store.saveGame(state.meta.today, mode.id, game);
    state.freshHint = hint.key;
    renderMode();
    state.freshHint = null;
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ─── Classic results grid ────────────────────────────────────────────────────

function renderGrid(game) {
  if (!game.guesses.length) return null;
  const attrs = state.meta.attributes;
  const head = h(
    'div',
    { class: 'grid-row grid-head' },
    h('div', { class: 'grid-label' }, 'Talent'),
    ...attrs.map((a) => h('div', { class: 'grid-label' }, a.label)),
  );
  const rows = [...game.guesses].reverse().map((g) => {
    const fresh = g.guess.id === state.freshId;
    return h(
      'div',
      { class: `grid-row${fresh ? ' fresh' : ''}` },
      h(
        'div',
        { class: `tile tile-face${g.correct ? ' s-correct' : ''}`, title: g.guess.name },
        h('img', { src: avatarSrc(g.guess), alt: '' }),
        h('span', { class: 'tile-name' }, g.guess.name),
      ),
      ...g.cells.map((c, i) => {
        const attr = attrs.find((a) => a.key === c.key);
        const dirText = c.dir === 'up' ? ' (answer is higher/later)' : c.dir === 'down' ? ' (answer is lower/earlier)' : '';
        return h(
          'div',
          {
            class: 'tile',
            style: `--i:${i}`,
            title: `${attr?.label ?? c.key}: ${c.display}, ${STATUS_TEXT[c.status]}${dirText}`,
          },
          h('div', { class: `face s-${c.status}${c.dir ? ` dir-${c.dir}` : ''}` }, h('span', {}, c.display)),
        );
      }),
    );
  });
  return h(
    'div',
    { class: 'grid-scroll' },
    h('div', { class: 'grid', style: `--cols:${attrs.length + 1}` }, head, ...rows),
  );
}

function renderLegend() {
  const item = (cls, label) => h('span', { class: 'legend-item' }, h('span', { class: `swatch ${cls}` }), label);
  return h(
    'div',
    { class: 'legend' },
    item('s-correct', 'Correct'),
    item('s-partial', 'Partial'),
    item('s-wrong', 'Wrong'),
    item('s-wrong dir-up', 'Higher / later'),
    item('s-wrong dir-down', 'Lower / earlier'),
  );
}

// ─── Portrait mode ───────────────────────────────────────────────────────────

function renderPortrait(game) {
  const wrong = game.guesses.filter((g) => !g.correct).length;
  const over = game.solved || game.failed;
  const step = over ? PORTRAIT_STEPS.length - 1 : Math.min(wrong, PORTRAIT_STEPS.length - 1);
  const { blur, zoom, gray, upright } = PORTRAIT_STEPS[step];
  const seed = hashString(state.meta.today);
  const ox = 30 + (seed % 41);
  const oy = 15 + ((seed >>> 8) % 30);
  const turn = upright ? 0 : PORTRAIT_TURNS[(seed >>> 16) % PORTRAIT_TURNS.length];

  // Reuse the same elements across renders so each change animates smoothly.
  // The picture turns inside its own wrapper so it spins around the frame's
  // centre, while the zoom stays anchored on the day's focus point.
  const src = api.portraitUrl(state.meta.today, 'portrait');
  if (!state.portraitImg || state.portraitImg.dataset.src !== src) {
    state.portraitImg = h('img', { src, alt: 'Mystery talent', draggable: 'false', 'data-src': src });
    state.portraitTurn = h('div', { class: 'portrait-turn' }, state.portraitImg);
  }
  const img = state.portraitImg;
  img.alt = game.solved ? game.guesses.at(-1).guess.name : game.failed ? game.answer.name : 'Mystery talent';
  img.style.cssText = `--blur:${blur}px;--zoom:${zoom};--gray:${gray};--ox:${ox}%;--oy:${oy}%`;
  state.portraitTurn.style.cssText = `--turn:${turn}deg`;

  return h(
    'div',
    { class: 'portrait' },
    h('div', { class: `portrait-frame${over ? ' solved' : ''}` }, state.portraitTurn),
    h(
      'p',
      { class: 'muted small center' },
      over ? 'Full picture revealed!' : 'Every wrong guess zooms out a little further.',
    ),
  );
}

function renderGuessList(game) {
  if (!game.guesses.length) return null;
  return h(
    'ul',
    { class: 'guess-list' },
    ...[...game.guesses].reverse().map((g) =>
      h(
        'li',
        { class: `guess-chip ${g.correct ? 's-correct' : 's-wrong'}${g.guess.id === state.freshId ? ' fresh' : ''}` },
        h('img', { src: avatarSrc(g.guess), alt: '' }),
        h('span', {}, g.guess.name),
        h('b', { 'aria-label': g.correct ? 'correct' : 'wrong' }, g.correct ? '✓' : '✗'),
      ),
    ),
  );
}

// ─── Win card ────────────────────────────────────────────────────────────────

function renderWin(mode, game) {
  const t = game.guesses.at(-1).guess;
  const p = game.profile ?? {};
  const n = game.guesses.length;
  const fresh = t.id === state.freshId;
  const delay = fresh && mode.id === 'classic' ? revealMs() / 1000 : 0;
  const next = state.meta.modes.find(
    (m) => m.id !== mode.id && m.available && !state.games[m.id]?.solved && !state.games[m.id]?.failed,
  );

  const facts = profileFacts(p);

  return h(
    'section',
    { id: 'win', class: `win${fresh ? ' fresh' : ''}`, style: `--delay:${delay}s` },
    h('img', { class: 'win-face', src: avatarSrc(t), alt: '' }),
    h(
      'div',
      { class: 'win-body' },
      h('p', { class: 'eyebrow' }, 'You got it!'),
      h('h2', {}, t.name),
      t.nameJp ? h('p', { class: 'jp' }, t.nameJp) : null,
      h('p', { class: 'win-count' }, 'Found in ', h('b', {}, n), ` ${n === 1 ? 'guess' : 'guesses'}`),
      facts.length
        ? h(
            'dl',
            { class: 'facts' },
            ...facts.flatMap(([k, v], i) => [h('dt', { style: `--n:${i}` }, k), h('dd', { style: `--n:${i}` }, v)]),
          )
        : null,
      h(
        'div',
        { class: 'win-actions' },
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => share(mode, game) }, 'Share result'),
        next ? h('button', { type: 'button', class: 'btn', onclick: () => switchMode(next.id) }, `Play ${next.label} →`) : null,
        p.youtube ? h('a', { class: 'btn btn-ghost', href: p.youtube, target: '_blank', rel: 'noopener' }, 'YouTube ↗') : null,
      ),
      h('p', { class: 'muted small' }, 'Next talent in ', h('b', { 'data-countdown': '' }, fmtCountdown(state.resetAt - Date.now()))),
    ),
  );
}

function profileFacts(p) {
  return [
    ['Branch', [p.branch, p.generation].filter(Boolean).join(' · ')],
    ['Fan name', p.fanName],
    ['Debut', p.debutDate],
    ['Oshi mark', p.oshiMark],
  ].filter(([, v]) => v);
}

// ─── Defeat card ─────────────────────────────────────────────────────────────

function renderDefeat(mode, game) {
  const t = game.answer;
  const p = game.profile ?? {};
  const fresh = game.guesses.at(-1).guess.id === state.freshId;
  const delay = fresh && mode.id === 'classic' ? revealMs() / 1000 : 0;
  const next = state.meta.modes.find(
    (m) => m.id !== mode.id && m.available && !state.games[m.id]?.solved && !state.games[m.id]?.failed,
  );
  const facts = profileFacts(p);

  return h(
    'section',
    { id: 'defeat', class: `defeat${fresh ? ' fresh' : ''}`, style: `--delay:${delay}s` },
    h('img', { class: 'defeat-art', src: '/images/defeat.webp', alt: 'Out of guesses' }),
    h(
      'div',
      { class: 'win' },
      h('img', { class: 'win-face', src: avatarSrc(t), alt: '' }),
      h(
        'div',
        { class: 'win-body' },
        h('p', { class: 'eyebrow' }, 'Out of guesses'),
        h('p', { class: 'muted' }, "Today's talent was"),
        h('h2', {}, t.name),
        t.nameJp ? h('p', { class: 'jp' }, t.nameJp) : null,
        facts.length
          ? h(
              'dl',
              { class: 'facts' },
              ...facts.flatMap(([k, v], i) => [h('dt', { style: `--n:${i}` }, k), h('dd', { style: `--n:${i}` }, v)]),
            )
          : null,
        h(
          'div',
          { class: 'win-actions' },
          h('button', { type: 'button', class: 'btn btn-primary', onclick: () => share(mode, game) }, 'Share result'),
          next ? h('button', { type: 'button', class: 'btn', onclick: () => switchMode(next.id) }, `Play ${next.label} →`) : null,
          p.youtube ? h('a', { class: 'btn btn-ghost', href: p.youtube, target: '_blank', rel: 'noopener' }, 'YouTube ↗') : null,
        ),
        h('p', { class: 'muted small' }, 'Next talent in ', h('b', { 'data-countdown': '' }, fmtCountdown(state.resetAt - Date.now()))),
      ),
    ),
  );
}

async function share(mode, game) {
  const n = game.guesses.length;
  const lines = [
    `Yagoodle #${state.meta.puzzleNumber} · ${mode.label}`,
    game.failed
      ? `Couldn't find today's talent in ${state.meta.maxGuesses} guesses (X/${state.meta.maxGuesses})`
      : `Found today's talent in ${n} ${n === 1 ? 'guess' : 'guesses'}!`,
  ];
  if (mode.id === 'classic') {
    const rows = game.guesses.map((g) => g.cells.map((c) => SHARE_EMOJI[c.status]).join(''));
    if (rows.length > 7) lines.push(`…and ${rows.length - 6} more`, ...rows.slice(-6));
    else lines.push(...rows);
  } else {
    lines.push(game.guesses.map((g) => (g.correct ? '🟩' : '🟥')).join(''));
  }
  lines.push(location.origin);
  try {
    await copyText(lines.join('\n'));
    toast('Result copied to clipboard!');
  } catch {
    toast("Couldn't copy. Your browser blocked the clipboard.", 'error');
  }
}

// ─── Yesterday + stats ───────────────────────────────────────────────────────

async function loadYesterday() {
  try {
    const { answers } = await api.yesterday();
    const items = state.meta.modes
      .filter((m) => answers[m.id])
      .map((m) =>
        h(
          'div',
          { class: 'yday-item' },
          h('img', { src: avatarSrc(answers[m.id]), alt: '' }),
          h('span', {}, h('small', {}, m.label), h('b', {}, answers[m.id].name)),
        ),
      );
    if (!items.length) return;
    const el = $('#yesterday');
    el.replaceChildren(h('h3', {}, "Yesterday's talents"), h('div', { class: 'yday-list' }, ...items));
    el.hidden = false;
  } catch {
    // Not important enough to bother the player.
  }
}

function renderStats() {
  const all = store.loadStats();
  const today = state.meta.today;
  $('#stats-body').replaceChildren(
    ...state.meta.modes.map((m) => {
      const s = all[m.id] ?? { played: 0, wins: 0, maxStreak: 0, dist: {} };
      const max = Math.max(1, ...store.BUCKETS.map((b) => s.dist?.[b] ?? 0));
      const stat = (value, label) => h('div', { class: 'stat' }, h('b', {}, value), h('small', {}, label));
      return h(
        'section',
        { class: 'stats-mode' },
        h('h3', {}, m.label),
        h(
          'div',
          { class: 'stat-row' },
          stat(s.played, 'Played'),
          stat(s.wins, 'Wins'),
          stat(store.currentStreak(s, today), 'Streak'),
          stat(s.maxStreak, 'Best streak'),
        ),
        h(
          'div',
          { class: 'dist' },
          ...store.BUCKETS.map((b) => {
            const v = s.dist?.[b] ?? 0;
            return h(
              'div',
              { class: 'dist-row' },
              h('span', { class: 'dist-label' }, b),
              h('span', { class: 'dist-bar', style: `--w:${Math.max(6, (v / max) * 100)}%` }, h('b', {}, v)),
            );
          }),
        ),
        h('p', { class: 'muted small' }, 'Guesses needed per win'),
      );
    }),
  );
}
