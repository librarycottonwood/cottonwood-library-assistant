/** Content rules shared by the website build (src/content/sanity.mjs) and Sanity Studio
 * (studio/validation.ts), so a value the Studio accepts is a value the build accepts.
 * Pure functions only: no Node or browser APIs, no network, no credentials.
 *
 * Each normalizer returns {ok: true, value, note?} or {ok: false, reason}.
 * `note` means the value was corrected in a way staff should hear about.
 * `reason` is a plain-English sentence that says what is wrong and how to fix it.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const LIBRARY_TIMEZONE = 'America/Los_Angeles';
const ok = (value, note) => note ? { ok: true, value, note } : { ok: true, value };
const bad = reason => ({ ok: false, reason });
const show = value => JSON.stringify(value.length > 120 ? `${value.slice(0, 117)}...` : value);

/** Deterministic URL identifier. Already-valid slugs are returned unchanged, so existing
 * addresses never move: `Printing & Copies` -> `printing-copies`, `bookDonations` -> `book-donations`. */
export function slugify(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (SLUG_PATTERN.test(trimmed) && trimmed.length <= 96) return trimmed;
  return trimmed
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 96).replace(/-+$/, '');
}

export function normalizeIdentifier(value) {
  if (typeof value !== 'string' || !value.trim()) return bad('This identifier is empty. Enter a short identifier such as book-sale.');
  const slug = slugify(value);
  if (!slug) return bad(`The identifier ${show(value)} has no letters or numbers. Use a short identifier such as book-sale.`);
  return ok(slug, slug === value ? undefined : `${show(value)} is used on the website as "${slug}". Change it to "${slug}" to remove this message.`);
}

/** US numbers become +1XXXXXXXXXX; a leading + keeps international numbers; short codes
 * such as 211 are kept. Extensions (ext. 2, x2, #2, ;ext=2) are dialed after a pause: `,2`. */
export function normalizePhone(value, { requireUS = false } = {}) {
  if (typeof value !== 'string' || !value.trim()) return bad('The phone number is empty.');
  const match = /^(.*?)(?:\s*(?:;\s*ext\s*=|,|#|ext(?:ension)?\.?|x)\s*(\d{1,6}))?\s*$/i.exec(value.trim());
  const main = match[1].trim(), extension = match[2];
  if (!/^\+?[\d\s().\-]+$/.test(main)) return bad(`The phone number ${show(value)} should contain only the digits of the number, such as (530) 347-4818, optionally followed by ext. 2.`);
  const digits = main.replace(/\D/g, '');
  let number;
  if (digits.length === 10 && !main.startsWith('+')) number = `+1${digits}`;
  else if (digits.length === 11 && digits.startsWith('1')) number = `+${digits}`;
  else if (requireUS) return bad(`The phone number ${show(value)} needs to be a 10-digit US number including the area code, such as (530) 347-4818.`);
  else if (main.startsWith('+') && digits.length >= 7 && digits.length <= 15) number = `+${digits}`;
  else if (!main.startsWith('+') && digits.length >= 3 && digits.length <= 15) number = digits;
  else return bad(`The phone number ${show(value)} isn't one the website can dial. Use a 10-digit number such as (530) 347-4818.`);
  return ok(`tel:${number}${extension ? `,${extension}` : ''}`);
}

const PRIVATE_HOST = /^(?:localhost|.*\.localhost|.*\.local|.*\.internal|.*\.lan|.*\.home\.arpa)$/i;
/** Links shown on the website: a site path (/visit/), a section (#hours), mailto:, tel:, or a public https:// URL.
 * Surrounding spaces are removed and tel: links are written in one dialable form. Anything else is refused. */
export function normalizeLink(value) {
  if (typeof value !== 'string' || !value.trim()) return bad('This link is empty. Enter a site page such as /visit/, a full https:// address, or an email or phone link.');
  const link = value.trim();
  if (link.length > 4000) return bad('This link is too long.');
  if (/[\u0000-\u001f\u007f\\]/.test(link) || /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(link)) return bad(`The link ${show(link)} contains a backslash or hidden control characters. Retype the link by hand.`);
  if (/^tel:/i.test(link)) {
    const phone = normalizePhone(link.slice(4));
    return phone.ok ? ok(phone.value, phone.value === link ? undefined : `${show(link)} is used as ${phone.value}.`) : bad(`The phone link ${show(link)} can't be used. ${phone.reason}`);
  }
  if (/\s/.test(link)) return bad(`The link ${show(link)} contains a space. Links can't contain spaces; remove them or use the page's real address.`);
  if (link.startsWith('//')) return bad(`The link ${show(link)} starts with //. Use a full address that starts with https://.`);
  if (link.startsWith('/')) {
    const path = link.split(/[?#]/)[0];
    const segments = path.split('/').map(segment => { try { return decodeURIComponent(segment); } catch { return segment; } });
    if (segments.some(segment => segment === '..' || segment === '.')) return bad(`The link ${show(link)} uses "." or ".." in the page path. Write the page's path directly, such as /events/.`);
    return ok(link);
  }
  if (link.startsWith('#')) return /^#[A-Za-z0-9_-]+$/.test(link) ? ok(link) : bad(`The link ${show(link)} must name one section on the page, such as #hours (letters, numbers, - and _ only).`);
  if (/^mailto:/i.test(link)) return /^mailto:[^?@\s]+@[^?@\s]+\.[^?@\s]+(?:\?.*)?$/i.test(link) ? ok(link) : bad(`The link ${show(link)} must be mailto: followed by one email address, such as mailto:cottonlib@shasta.com.`);
  let url;
  try { url = new URL(link); } catch { return bad(`The link ${show(link)} isn't a complete link. Use a site page such as /visit/ or a full address that starts with https://.`); }
  if (url.protocol === 'http:') return bad(`The link ${show(link)} starts with http://. Use the secure https:// address instead.`);
  if (url.protocol !== 'https:') return bad(`The link ${show(link)} starts with "${url.protocol}", which the website doesn't allow. Use a site page, an https:// address, mailto: or tel:.`);
  if (url.username || url.password) return bad(`The link ${show(link)} includes a username or password. Remove the sign-in details from the link.`);
  const host = url.hostname;
  if (!host.includes('.') || PRIVATE_HOST.test(host) || /^\d+(?:\.\d+){3}$/.test(host) || host.startsWith('[')) return bad(`The link ${show(link)} points to "${host}", which isn't a public website visitors can reach. Use the public https:// address.`);
  return ok(link);
}

// --- Dates and times -------------------------------------------------------------------------
const pacificParts = new Intl.DateTimeFormat('en-US', { timeZone: LIBRARY_TIMEZONE, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
/** Pacific wall-clock fields for an instant, as `YYYY-MM-DDTHH:MM:SS`. */
export function pacificWallClock(milliseconds) {
  const parts = Object.fromEntries(pacificParts.formatToParts(new Date(milliseconds)).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}
/** The UTC offsets (minutes) that Pacific time uses at this wall-clock time: one normally, two in
 * the repeated fall-back hour, none in the skipped spring-forward hour. */
export function pacificOffsets(wallClock) {
  const [date, time] = wallClock.split('T');
  const [year, month, dayOfMonth] = date.split('-').map(Number);
  const [hour, minute, second] = time.split(':').map(Number);
  const asUtc = Date.UTC(year, month - 1, dayOfMonth, hour, minute, second);
  return [-420, -480].filter(offset => pacificWallClock(asUtc - offset * 60000) === wallClock);
}
const formatOffset = minutes => `${minutes < 0 ? '-' : '+'}${String(Math.floor(Math.abs(minutes) / 60)).padStart(2, '0')}:${String(Math.abs(minutes) % 60).padStart(2, '0')}`;
const realDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T12:00:00Z`).toISOString().startsWith(value);
export function normalizeDay(value) {
  if (typeof value !== 'string' || !realDay(value.trim())) return bad(typeof value === 'string' && value.trim() ? `The date ${show(value)} must be a real calendar date written YYYY-MM-DD.` : 'The date is missing. Choose a date.');
  return ok(value.trim());
}
const clock = (value) => {
  const [hour, minute] = value.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'a.m.' : 'p.m.'}`;
};

/** Event and article times. Staff and the assistant think in Pacific wall-clock time, so:
 * - `Z` / `+00:00` values (what Studio itself saves) are exact instants and are kept.
 * - `-07:00` / `-08:00` values whose offset is wrong for that Pacific date (for example the
 *   winter -08:00 on a summer date) keep the wall-clock time as written and get the right offset.
 * - Values with no offset are read as Pacific wall-clock time.
 * - Other offsets are exact instants in another zone; kept, with a note.
 * Seconds are optional. Returns a canonical `YYYY-MM-DDTHH:MM:SS[.sss]±HH:MM` (or `Z`) string. */
export function normalizeInstant(value) {
  if (typeof value !== 'string' || !value.trim()) return bad('The date and time is missing. Choose a date and time.');
  const raw = value.trim();
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(raw);
  if (!match || !realDay(match[1]) || Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4] ?? 0) > 59) return bad(`The date and time ${show(raw)} must be a real date and time, such as 2026-11-14T10:00:00-08:00.`);
  const [, date, hour, minute, second = '00', fraction, zone] = match;
  const wallClock = `${date}T${hour}:${minute}:${second}`;
  const millis = fraction ? `.${fraction.slice(0, 3).padEnd(3, '0')}` : '';
  const offsets = pacificOffsets(wallClock);
  const label = `${clock(`${hour}:${minute}`)} on ${date}`;
  const build = offset => `${wallClock}${millis}${offset}`;
  if (!zone) {
    const offset = offsets[0] ?? -480;
    return ok(build(formatOffset(offset)), `${show(raw)} has no timezone, so it is read as ${label} Pacific time.`);
  }
  if (/^z$/i.test(zone) || /^[+-]00:?00$/.test(zone)) return ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(raw) ? raw : build('Z'));
  const sign = zone[0] === '-' ? -1 : 1;
  const digits = zone.slice(1).replace(':', '');
  const given = sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2)));
  const canonical = build(formatOffset(given));
  if (given === -420 || given === -480) {
    if (!offsets.length || offsets.includes(given)) return ok(raw === canonical ? raw : canonical);
    const fixed = build(formatOffset(offsets[0]));
    return ok(fixed, `${show(raw)} uses the ${given === -480 ? 'winter (PST, -08:00)' : 'summer (PDT, -07:00)'} offset, but on ${date} Pacific time is ${formatOffset(offsets[0])}. The website uses ${label} Pacific as written (${fixed}).`);
  }
  return ok(canonical, `${show(raw)} is not Pacific time; the website shows it as ${clock(pacificWallClock(Date.parse(canonical)).slice(11, 16))} on ${pacificWallClock(Date.parse(canonical)).slice(0, 10)} Pacific.`);
}
