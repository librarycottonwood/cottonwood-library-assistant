/** Next date of a regular program from its schedule text, such as "Wednesdays · 11:30 a.m." or
 * "Third Tuesday · 2:30 p.m.". Used by EventCards at build time and again in the visitor's browser.
 * Pure functions on YYYY-MM-DD day keys (library time), so daylight-saving changes can't skip a day.
 * Anything it can't read with confidence (e.g. "every other week", "by appointment") returns null,
 * and the card keeps showing the schedule text as written.
 */
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const ORDINALS = { first: 1, '1st': 1, second: 2, '2nd': 2, third: 3, '3rd': 3, fourth: 4, '4th': 4, last: -1 };
const CLOCK = String.raw`(?:noon|\d{1,2}(?::\d{2})?)`, MERIDIEM = String.raw`\s*(?:a\.?m\.?|p\.?m\.?)`;
// "11:30 a.m.", "noon", "6–7 p.m." or "6 p.m. to 7:30 p.m."; a bare number ("1st") is not a time.
const TIME = new RegExp(String.raw`\b(?:${CLOCK}(?:${MERIDIEM})?\s*(?:[–—-]|to)\s*${CLOCK}${MERIDIEM}|noon|\d{1,2}(?::\d{2})?${MERIDIEM})`, 'i');

const noon = key => new Date(`${key}T12:00:00Z`);
const keyOf = date => date.toISOString().slice(0, 10);
const addDays = (key, days) => keyOf(new Date(noon(key).getTime() + days * 864e5));

/** Reads the schedule text. Returns null when it isn't a plain weekly or monthly pattern. */
export function parseSchedule(schedule) {
  const text = String(schedule ?? '').toLowerCase();
  if (/\b(other|alternate|biweekly|bi-weekly|appointment|request|varies|tbd|seasonal)\b/.test(text)) return null;
  const days = WEEKDAYS.flatMap((name, index) => new RegExp(`\\b${name}s?\\b`).test(text) ? [index] : []);
  if (!days.length) return null;
  const ordinals = Object.entries(ORDINALS).flatMap(([word, n]) => new RegExp(`\\b${word}\\b`).test(text) ? [n] : []);
  if (ordinals.length > 1) return null;
  const time = String(schedule).match(TIME)?.[0];
  return { days, nth: ordinals[0] ?? null, ...(time ? { time } : {}) };
}

/** The first day on or after `todayKey` (YYYY-MM-DD) that matches the schedule, or null. */
export function nextScheduledDay(schedule, todayKey) {
  const rule = parseSchedule(schedule);
  if (!rule) return null;
  if (rule.nth === null) {
    for (let offset = 0; offset < 7; offset++) {
      const key = addDays(todayKey, offset);
      if (rule.days.includes(noon(key).getUTCDay())) return { day: key, ...(rule.time ? { time: rule.time } : {}) };
    }
    return null;
  }
  const [year, month] = todayKey.split('-').map(Number);
  const candidates = [];
  for (let step = 0; step < 3; step++) {
    const first = new Date(Date.UTC(year, month - 1 + step, 1, 12));
    const lastDate = new Date(Date.UTC(year, month + step, 0, 12)).getUTCDate();
    for (const weekday of rule.days) {
      const firstMatch = 1 + (weekday - first.getUTCDay() + 7) % 7;
      const date = rule.nth === -1 ? firstMatch + Math.floor((lastDate - firstMatch) / 7) * 7 : firstMatch + (rule.nth - 1) * 7;
      if (date <= lastDate) candidates.push(keyOf(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), date, 12))));
    }
  }
  const day = candidates.filter(key => key >= todayKey).sort()[0];
  return day ? { day, ...(rule.time ? { time: rule.time } : {}) } : null;
}
