/** Search-engine and AI-answer data (schema.org JSON-LD) built from the same Sanity content the pages show.
 * Nothing here is a library fact of its own: hours, address, phone and links all come from Sanity settings,
 * except the map point, which is the building's location on Main Street (also used by the map).
 * Anything it can't read with confidence is left out rather than guessed.
 */
export const SITE_URL = 'https://www.cottonwoodcommunitylibrary.com';
/** [longitude, latitude] of the library building. */
export const LIBRARY_POINT = [-122.2805738, 40.3873866];
import { parseSchedule } from './schedule.mjs';
const LIBRARY_ID = `${SITE_URL}/#library`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayIndex = word => {
  // "Monday", "Mondays", "Mon", "Mon.", "Tues", "Thurs"
  const short = String(word).trim().toLowerCase().replace(/\.$/, '').replace(/(?<=...)s$/, '');
  return short.length < 3 ? -1 : DAYS.findIndex(day => day.toLowerCase().startsWith(short));
};
const RANGE = /\s*(?:[–—-]|\bto\b|\bthrough\b|\bthru\b)\s*/i;

/** "Monday–Wednesday", "Saturday", "Mon, Wed & Fri" → ['Monday', …], or null. */
export function parseDays(text) {
  const parts = String(text ?? '').split(/\s*(?:,|&|\band\b)\s*/i).filter(Boolean);
  if (!parts.length) return null;
  const days = [];
  for (const part of parts) {
    const ends = part.split(RANGE);
    if (ends.length > 2) return null;
    const [from, to = from] = ends.map(dayIndex);
    if (from < 0 || to < 0) return null;
    for (let i = from; ; i = (i + 1) % 7) { days.push(DAYS[i]); if (i === to) break; }
  }
  return [...new Set(days)];
}

const CLOCK = /^(noon|midnight|(\d{1,2})(?::(\d{2}))?)\s*(a\.?\s*m\.?|p\.?\s*m\.?)?$/i;
const pad = n => String(n).padStart(2, '0');
function readClock(text) {
  const match = String(text).trim().match(CLOCK);
  if (!match) return null;
  if (/^noon$/i.test(match[1])) return { minutes: 12 * 60, meridiem: 'p' };
  if (/^midnight$/i.test(match[1])) return { minutes: 24 * 60, meridiem: 'a' };
  const hour = Number(match[2]), minute = Number(match[3] ?? 0);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  return { hour, minute, meridiem: match[4] ? match[4][0].toLowerCase() : null };
}
const toMinutes = ({ hour, minute }, meridiem) => (hour % 12 + (meridiem === 'p' ? 12 : 0)) * 60 + minute;

/** "11 a.m.–5 p.m.", "10:30 a.m. to noon", "11–5 p.m." → { opens: '11:00', closes: '17:00' }, or null. */
export function parseHours(text) {
  const ends = String(text ?? '').trim().split(RANGE);
  if (ends.length !== 2) return null;
  const [start, end] = ends.map(readClock);
  if (!start || !end) return null;
  const closes = end.minutes ?? (end.meridiem ? toMinutes(end, end.meridiem) : null);
  if (closes == null) return null;
  let opens = start.minutes;
  if (opens == null) {
    // "11–5 p.m." means 11 a.m.: a start without a.m./p.m. takes the end's, unless that would put it after the end.
    const meridiem = start.meridiem ?? end.meridiem;
    if (!meridiem) return null;
    opens = toMinutes(start, meridiem);
    if (!start.meridiem && opens >= closes) opens = toMinutes(start, 'a');
  }
  if (opens >= closes) return null;
  const clock = minutes => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
  return { opens: clock(opens), closes: closes === 24 * 60 ? '23:59' : clock(closes) };
}

/** schema.org opening hours for the Sanity hours rows. Null when any open row can't be read, so a search
 * engine never gets hours that differ from the page. Closed rows are simply left out. */
export function openingHours(rows) {
  const specs = [];
  for (const row of rows ?? []) {
    if (/^\s*closed\s*$/i.test(row.hours)) continue;
    const days = parseDays(row.days), hours = parseHours(row.hours);
    if (!days || !hours) return null;
    specs.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: days.map(day => `https://schema.org/${day}`), ...hours });
  }
  return specs.length ? specs : null;
}

/** "Cottonwood, CA 96022" → its parts; anything else stays as the locality. */
function postalAddress(street, locality) {
  const match = String(locality).match(/^\s*(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/);
  return { '@type': 'PostalAddress', streetAddress: street, ...(match ? { addressLocality: match[1], addressRegion: match[2], postalCode: match[3] } : { addressLocality: locality }), addressCountry: 'US' };
}

const telephone = phoneHref => {
  const digits = String(phoneHref ?? '').replace(/^tel:/, '').replace(/[^\d+]/g, '');
  const match = digits.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return match ? `+1-${match[1]}-${match[2]}-${match[3]}` : undefined;
};

/** The library itself, on every page: name, address, map point, phone, hours and social profiles. */
export function libraryNode(library, { image, description } = {}) {
  const mailing = String(library.mailingAddress ?? '').match(/^\s*(.+?),\s*(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/);
  const hours = openingHours(library.hours);
  const sameAs = [library.facebookUrl, library.instagramUrl].filter(url => /^https:\/\//.test(url ?? ''));
  return {
    '@type': 'Library',
    '@id': LIBRARY_ID,
    name: library.name,
    url: `${SITE_URL}/`,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    logo: `${SITE_URL}/apple-touch-icon.png`,
    address: postalAddress(library.address, library.locality),
    geo: { '@type': 'GeoCoordinates', latitude: LIBRARY_POINT[1], longitude: LIBRARY_POINT[0] },
    ...(telephone(library.phoneHref) ? { telephone: telephone(library.phoneHref) } : {}),
    ...(library.email ? { email: library.email } : {}),
    ...(hours ? { openingHoursSpecification: hours } : {}),
    ...(mailing ? { contactPoint: { '@type': 'ContactPoint', contactType: 'mailing address', address: { '@type': 'PostalAddress', postOfficeBoxNumber: mailing[1].replace(/^P\.?\s*O\.?\s*Box\s*/i, ''), addressLocality: mailing[2], addressRegion: mailing[3], postalCode: mailing[4], addressCountry: 'US' } } } : {}),
    ...(library.directionsUrl ? { hasMap: library.directionsUrl } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    isAccessibleForFree: true,
    publicAccess: true,
  };
}

export function websiteNode(library) {
  return { '@type': 'WebSite', '@id': WEBSITE_ID, url: `${SITE_URL}/`, name: library.name, inLanguage: 'en-US', publisher: { '@id': LIBRARY_ID } };
}

/** The visible breadcrumb trail. Section anchors are navigation within a page, not extra levels. */
export function breadcrumbNode(crumbs) {
  const pages = crumbs.filter(crumb => !new URL(crumb.href, SITE_URL).hash);
  return {
    '@type': 'BreadcrumbList',
    itemListElement: pages.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: new URL(crumb.href, SITE_URL).href,
    })),
  };
}

/** One event and all its sessions (each session is its own schema.org Event). */
export function eventNodes(sessions, { url, image }) {
  return sessions.map(session => {
    const online = /online/i.test(session.location ?? '');
    const atLibrary = !session.location || /library|3427 main/i.test(session.location);
    const place = online
      ? { '@type': 'VirtualLocation', url: session.link ?? url }
      : atLibrary ? { '@id': LIBRARY_ID } : { '@type': 'Place', name: session.location };
    return {
      '@type': 'Event',
      name: session.title,
      description: session.summary,
      startDate: session.startsAt,
      endDate: session.endsAt,
      url,
      ...(image ? { image } : {}),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
      location: place,
      organizer: { '@id': LIBRARY_ID },
    };
  });
}

/** "11:30 a.m.", "noon" or "6–7:30 p.m." → { starts: '11:30', ends?: '19:30' }, or null. */
export function parseTime(text) {
  const range = parseHours(text);
  if (range) return { starts: range.opens, ends: range.closes };
  const clock = readClock(text);
  if (!clock) return null;
  if (clock.minutes != null) return clock.minutes === 12 * 60 ? { starts: '12:00' } : null;
  return clock.meridiem ? { starts: `${pad(Math.floor(toMinutes(clock, clock.meridiem) / 60))}:${pad(clock.minute)}` } : null;
}

const ZONE = 'America/Los_Angeles';
const zoneOffset = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, timeZoneName: 'longOffset' });
/** Minutes the library's clock is ahead of UTC at `instant` (−480 in winter, −420 in summer). */
function offsetAt(instant) {
  const match = zoneOffset.formatToParts(instant).find(part => part.type === 'timeZoneName').value.match(/GMT(?:([+-])(\d{2}):(\d{2}))?/);
  return match[1] ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
}
/** "2026-11-17" + "14:30" in library time → "2026-11-17T14:30:00-08:00" (the offset follows daylight saving). */
export function libraryDateTime(day, time) {
  const asUtc = Date.parse(`${day}T${time}:00Z`);
  let offset = offsetAt(new Date(asUtc));
  offset = offsetAt(new Date(asUtc - offset * 6e4));
  const sign = offset < 0 ? '-' : '+', size = Math.abs(offset);
  return `${day}T${time}:00${sign}${pad(Math.floor(size / 60))}:${pad(size % 60)}`;
}
const dayAfter = (day, days = 1) => new Date(Date.parse(`${day}T12:00:00Z`) + days * 864e5).toISOString().slice(0, 10);
const libraryDay = instant => new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);

/** Whether a notice closes the library on `day` (YYYY-MM-DD, Pacific). A notice with closedDates closes only
 * those days; one marked staysOpen (shorter hours, a reminder) closes none. Older notices with neither are
 * treated cautiously: every day the banner shows counts as closed, so no session is advertised on a day
 * the library may be shut. */
export function noticeClosesDay(notice, day) {
  if (notice.closedDates?.length) return notice.closedDates.includes(day);
  if (notice.staysOpen) return false;
  return notice.startsOn <= day && day <= notice.endsOn;
}

/** Upcoming dated sessions of a regular program, worked out from its Sanity schedule text at build time
 * ("Wednesdays · 11:30 a.m.", "Third Tuesday · 2:30 p.m."). The site only rebuilds when a change is saved,
 * so this covers the next `days` days. Left out: sessions that already started, any day a notice closes
 * the library (noticeClosesDay; to cancel one session, publish a notice with that closed day), and days the
 * program already has a dated event. A schedule without a readable pattern and time gives no sessions at all. */
export function programSessions(program, { now = new Date(), days = 90, notices = [], events = [] } = {}) {
  const rule = parseSchedule(program.schedule);
  const time = rule?.time && parseTime(rule.time);
  if (!rule || !time) return [];
  const blocked = day => notices.some(notice => noticeClosesDay(notice, day))
    || events.some(event => event.programId === program.id && libraryDay(new Date(event.startsAt)) === day);
  const sessions = [];
  const today = libraryDay(now);
  for (let offset = 0; offset <= days; offset++) {
    const day = dayAfter(today, offset);
    const date = new Date(`${day}T12:00:00Z`);
    if (!rule.days.includes(date.getUTCDay())) continue;
    if (rule.nth !== null) {
      const dayOfMonth = date.getUTCDate();
      const lastDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
      if (rule.nth === -1 ? dayOfMonth + 7 <= lastDate : Math.ceil(dayOfMonth / 7) !== rule.nth) continue;
    }
    const startsAt = libraryDateTime(day, time.starts);
    if (Date.parse(startsAt) <= now.getTime() || blocked(day)) continue;
    sessions.push({ day, startsAt, ...(time.ends ? { endsAt: libraryDateTime(day, time.ends) } : {}) });
  }
  return sessions;
}

/** One schema.org Event per upcoming session of a regular program, at the library. */
export function programEventNodes(program, sessions, { url, image }) {
  return sessions.map(session => ({
    '@type': 'Event',
    name: program.title,
    description: program.description,
    startDate: session.startsAt,
    ...(session.endsAt ? { endDate: session.endsAt } : {}),
    url: `${url}#session-${session.day}`,
    ...(image ? { image } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@id': LIBRARY_ID },
    organizer: { '@id': LIBRARY_ID },
  }));
}

/** A library-written news post. */
export function articleNode(post, { url, image }) {
  return {
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.summary,
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    url,
    mainEntityOfPage: url,
    ...(image ? { image } : {}),
    author: { '@id': LIBRARY_ID },
    publisher: { '@id': LIBRARY_ID },
  };
}

/** Questions and answers exactly as they are shown on the page. */
export function faqNode(items, url) {
  return { '@type': 'FAQPage', url, mainEntity: items.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) };
}

/** One <script type="application/ld+json"> body; "<" is escaped so CMS text can't close the script. */
export function jsonLd(nodes) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) }).replace(/</g, '\\u003c');
}
