/** Shared with the actual form rules; these guard content, never library facts.
 * Link, identifier, phone and time rules come from the website build itself (src/content/rules.mjs),
 * so anything the Studio accepts, the build accepts too. */
import {SLUG_PATTERN, normalizeIdentifier, normalizeInstant, normalizeLink, normalizePhone} from '../src/content/rules.mjs';

export const slugPattern = SLUG_PATTERN;

export function validLink(value: unknown): true | string {
  const result = normalizeLink(value);
  return result.ok ? true : result.reason;
}

/** Free-text identifiers (services, ways to help, acknowledgments, campaigns). */
export function validIdentifier(value: unknown): true | string {
  if (value == null || value === '') return true; // `required()` reports the empty case.
  const result = normalizeIdentifier(value);
  return result.ok ? true : result.reason;
}
/** Warning only: the website will use a tidied form of this identifier. */
export function identifierNotice(value: unknown): true | string {
  if (typeof value !== 'string' || !value.trim()) return true;
  const result = normalizeIdentifier(value);
  return result.ok && result.note ? result.note : true;
}

export function validPhone(value: unknown): true | string {
  if (value == null || value === '') return true;
  const result = normalizePhone(value, {requireUS: true});
  return result.ok ? true : result.reason;
}

/** Warning only: blank paragraphs and steps are left off the website. */
export function emptyEntryNotice(value: unknown): true | string {
  return typeof value === 'string' && !value.trim() ? 'This entry is empty and will be left off the website. Delete it or fill it in.' : true;
}

/** Warning only: the website shows one list level, so indented items join the main list. */
export function nestedListNotice(value: unknown): true | string {
  return Array.isArray(value) && value.some((block: {listItem?: string; level?: number} | null) => block?.listItem && (block.level ?? 1) > 1)
    ? 'Indented list items appear in the main list on the website. Use Shift+Tab to remove the indent.' : true;
}

export function validImage(value: unknown): true | string {
  if (!value || typeof value !== 'object') return 'Add a picture.';
  const image = value as {asset?: {_ref?: string}; legacyKey?: string};
  return image.asset?._ref || image.legacyKey?.trim() ? true : 'Upload a picture or keep the imported picture reference.';
}

export function validDateRange(value: unknown): true | string {
  if (!value || typeof value !== 'object') return true;
  const range = value as {startsOn?: string; endsOn?: string};
  return range.startsOn && range.endsOn && range.endsOn < range.startsOn
    ? 'The end date must be the same as or later than the start date.' : true;
}

type NoticeClosure = {startsOn?: string; endsOn?: string; closedDates?: unknown; staysOpen?: unknown};
const closedDays = (notice: NoticeClosure) => Array.isArray(notice.closedDates) ? notice.closedDates.filter((day): day is string => typeof day === 'string' && day !== '') : [];

/** A notice either lists the days the library is closed or says it stays open, not both. */
export function validNoticeClosure(value: unknown): true | string {
  if (!value || typeof value !== 'object') return true;
  return (value as NoticeClosure).staysOpen === true && closedDays(value as NoticeClosure).length
    ? 'Choose one: list the days the library is closed, or turn on "The library stays open". Not both.' : true;
}

/** Warning only: without closed days or "stays open", the website leaves regular programs off every day the banner shows. */
export function noticeClosureNotice(value: unknown): true | string {
  if (!value || typeof value !== 'object') return true;
  const notice = value as NoticeClosure, days = closedDays(notice);
  if (!days.length) return notice.staysOpen === true ? true
    : 'Add the days the library is closed, or turn on "The library stays open". Otherwise Story Time and other regular programs are left off the website for every day this banner shows.';
  const outside = days.filter((day) => (notice.startsOn && day < notice.startsOn) || (notice.endsOn && day > notice.endsOn));
  return outside.length ? `The banner is not showing on ${outside.join(', ')}. Check the closed days and the banner dates.` : true;
}

const sessionTime = (value: unknown) => {
  if (value == null || value === '') return undefined;
  const result = normalizeInstant(value);
  return result.ok ? Date.parse(result.value) : NaN;
};

export function validSession(value: unknown): true | string {
  if (!value || typeof value !== 'object') return true;
  const session = value as {startsAt?: string; endsAt?: string};
  const start = sessionTime(session.startsAt), end = sessionTime(session.endsAt);
  if (Number.isNaN(start)) return 'Choose a valid start date and time.';
  if (end === undefined) return 'Choose an end date and time.';
  if (Number.isNaN(end)) return 'Choose a valid end date and time.';
  return start !== undefined && end <= start ? 'The end time must be later than the start time.' : true;
}

/** Warning only: a time written with the wrong Pacific offset (for example by the assistant). */
export function sessionTimeNotice(value: unknown): true | string {
  if (!value || typeof value !== 'object') return true;
  const session = value as {startsAt?: string; endsAt?: string};
  const notes = [session.startsAt, session.endsAt].map((time) => time ? normalizeInstant(time) : undefined)
    .flatMap((result) => result?.ok && result.note ? [result.note] : []);
  return notes.length ? notes.join(' ') : true;
}

export function uniqueSessions(value: unknown): true | string {
  if (!Array.isArray(value)) return true;
  const starts = value.map((session: {startsAt?: string} | null) => session?.startsAt)
    .filter((start): start is string => Boolean(start))
    .map((start) => { const time = sessionTime(start); return time !== undefined && Number.isFinite(time) ? new Date(time).toISOString() : start; });
  return new Set(starts).size === starts.length ? true : 'This date and time is already listed. Keep one entry per occurrence.';
}

export function validNewsletter(value: unknown): true | string {
  const newsletter = value as {file?: {asset?: {_ref?: string}}; legacyFileUrl?: string} | undefined;
  return newsletter?.file?.asset?._ref || newsletter?.legacyFileUrl?.trim()
    ? true : 'Upload the newsletter PDF before publishing.';
}

export const WORD_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** The optional accessible Word version must be a .docx file (not a PDF or an old .doc). */
export function validWordFile(asset: {mimeType?: string; extension?: string} | null | undefined): true | string {
  return asset?.mimeType === WORD_MIME || asset?.extension === 'docx'
    ? true : 'Choose a Word document (.docx). Save it from Word or Google Docs as .docx.';
}
