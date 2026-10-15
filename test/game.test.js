import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareAttr, formatHint } from '../server/game.js';
import { pickTalent } from '../server/randomizer.js';

const exact = { key: 'branch', type: 'exact' };
const multi = { key: 'hairColor', type: 'multi' };
const num = { key: 'height', type: 'number', unit: 'cm' };
const date = { key: 'debutDate', type: 'date' };

test('exact compares case-insensitively', () => {
  assert.equal(compareAttr(exact, 'JP', 'jp').status, 'correct');
  assert.equal(compareAttr(exact, 'JP', 'EN').status, 'wrong');
});

test('multi: identical sets correct, overlap partial, none wrong', () => {
  assert.equal(compareAttr(multi, ['White', 'Blue'], ['Blue', 'White']).status, 'correct');
  assert.equal(compareAttr(multi, ['White'], ['White', 'Blue']).status, 'partial');
  assert.equal(compareAttr(multi, ['Red'], ['Blue']).status, 'wrong');
  assert.equal(compareAttr(multi, ['White', 'Blue'], ['Blue']).display, 'White, Blue');
});

test('number arrows point toward the answer', () => {
  assert.deepEqual(compareAttr(num, 150, 153), { key: 'height', display: '150 cm', status: 'wrong', dir: 'up' });
  assert.equal(compareAttr(num, 160, 153).dir, 'down');
  assert.equal(compareAttr(num, 153, 153).status, 'correct');
});

test('date: same month correct, same year partial', () => {
  assert.equal(compareAttr(date, '2019-07-17', '2019-07-01').status, 'correct');
  const sameYear = compareAttr(date, '2019-07-17', '2019-12-27');
  assert.equal(sameYear.status, 'partial');
  assert.equal(sameYear.dir, 'up');
  assert.equal(sameYear.display, 'Jul 2019');
  const diffYear = compareAttr(date, '2021-08-22', '2018-06-01');
  assert.equal(diffYear.status, 'wrong');
  assert.equal(diffYear.dir, 'down');
});

test('monthDay: same day correct, same month partial', () => {
  const bday = { key: 'birthday', type: 'monthDay' };
  assert.equal(compareAttr(bday, '01-12', '01-12').status, 'correct');
  const sameMonth = compareAttr(bday, '01-12', '01-30');
  assert.equal(sameMonth.status, 'partial');
  assert.equal(sameMonth.dir, 'up');
  assert.equal(sameMonth.display, 'Jan 12');
  const diffMonth = compareAttr(bday, '11-24', '03-05');
  assert.equal(diffMonth.status, 'wrong');
  assert.equal(diffMonth.dir, 'down');
});

test('missing values are unknown', () => {
  assert.equal(compareAttr(num, null, 150).status, 'unknown');
  assert.equal(compareAttr(num, null, 150).display, '?');
});

test('formatHint', () => {
  assert.equal(formatHint({ format: 'monthDay' }, '01-12'), 'Jan 12');
  assert.equal(formatHint({}, null), null);
});

test('randomizer uses everyone once before repeating', () => {
  const pool = ['a', 'b', 'c', 'd', 'e'];
  const history = [];
  for (let i = 0; i < pool.length; i++) history.unshift(pickTalent({ pool, history, cooldown: 0 }));
  assert.deepEqual([...history].sort(), pool);
});

test('randomizer respects cooldown and exclusions', () => {
  const pool = Array.from({ length: 20 }, (_, i) => `t${i}`);
  const history = [];
  for (let day = 0; day < 200; day++) {
    const pick = pickTalent({ pool, history, cooldown: 10, exclude: ['t0'] });
    assert.notEqual(pick, 't0');
    assert.ok(!history.slice(0, 10).includes(pick), `repeat within cooldown on day ${day}`);
    history.unshift(pick);
  }
});

test('randomizer relaxes constraints for tiny pools', () => {
  assert.equal(pickTalent({ pool: ['solo'], history: ['solo'], cooldown: 30, exclude: ['solo'] }), 'solo');
  assert.equal(pickTalent({ pool: [] }), null);
});
