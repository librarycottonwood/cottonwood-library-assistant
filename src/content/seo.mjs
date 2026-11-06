/** Search-engine and AI-answer data (schema.org JSON-LD) built from the same Sanity content the pages show.
 * Nothing here is a library fact of its own: hours, address, phone and links all come from Sanity settings,
 * except the map point, which is the building's location on Main Street (also used by the map).
 * Anything it can't read with confidence is left out rather than guessed.
 */
export const SITE_URL = 'https://www.cottonwoodcommunitylibrary.com';
/** [longitude, latitude] of the library building. */
export const LIBRARY_POINT = [-122.2805738, 40.3873866];
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
