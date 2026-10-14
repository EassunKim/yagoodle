import { ATTRIBUTES } from './config.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0);
const norm = (v) => String(v).trim().toLowerCase();

/** "2019-07-17" → months since year 0, so dates compare at month precision. */
function monthIndex(dateStr) {
  const [y, m] = String(dateStr).split('-').map(Number);
  return y * 12 + (m - 1);
}

export function formatValue(attr, v) {
  if (isEmpty(v)) return '?';
  switch (attr.type) {
    case 'multi':
      return v.join(', ');
    case 'number':
      return attr.unit ? `${v} ${attr.unit}` : String(v);
    case 'date': {
      const [y, m] = String(v).split('-').map(Number);
      return `${MONTHS[m - 1]} ${y}`;
    }
    default:
      return String(v);
  }
}

/**
 * Compares one attribute of a guess against the answer.
 * @returns {{key:string, display:string, status:'correct'|'partial'|'wrong'|'unknown', dir:'up'|'down'|null}}
 *   `dir` points toward the answer: 'up' means the answer is higher/later.
 */
export function compareAttr(attr, guessValue, answerValue) {
  const cell = { key: attr.key, display: formatValue(attr, guessValue), status: 'wrong', dir: null };
  if (isEmpty(guessValue) || isEmpty(answerValue)) {
    cell.status = 'unknown';
    return cell;
  }

  switch (attr.type) {
    case 'exact':
      cell.status = norm(guessValue) === norm(answerValue) ? 'correct' : 'wrong';
      break;

    case 'multi': {
      const g = new Set(guessValue.map(norm));
      const a = new Set(answerValue.map(norm));
      const overlap = [...g].filter((x) => a.has(x)).length;
      if (overlap === g.size && g.size === a.size) cell.status = 'correct';
      else cell.status = overlap > 0 ? 'partial' : 'wrong';
      break;
    }

    case 'number': {
      const g = Number(guessValue);
      const a = Number(answerValue);
      if (g === a) cell.status = 'correct';
      else cell.dir = a > g ? 'up' : 'down';
      break;
    }

    case 'date': {
      const g = monthIndex(guessValue);
      const a = monthIndex(answerValue);
      if (g === a) {
        cell.status = 'correct';
      } else {
        cell.dir = a > g ? 'up' : 'down';
        cell.status = Math.floor(g / 12) === Math.floor(a / 12) ? 'partial' : 'wrong';
      }
      break;
    }

    default:
      throw new Error(`Unknown attribute type: ${attr.type}`);
  }
  return cell;
}

export function compareTalents(guess, answer, attributes = ATTRIBUTES) {
  return attributes.map((attr) => compareAttr(attr, guess[attr.key], answer[attr.key]));
}

export function formatHint(hint, value) {
  if (isEmpty(value)) return null;
  if (hint.format === 'monthDay') {
    const [m, d] = String(value).split('-').map(Number);
    return `${MONTHS[m - 1]} ${d}`;
  }
  return Array.isArray(value) ? value.join(', ') : String(value);
}
