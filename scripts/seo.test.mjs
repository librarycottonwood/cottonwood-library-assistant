import test from 'node:test';
import assert from 'node:assert/strict';
import { articleNode, breadcrumbNode, eventNodes, jsonLd, libraryDateTime, libraryNode, noticeClosesDay, openingHours, parseDays, parseHours, parseTime, programEventNodes, programSessions } from '../src/content/seo.mjs';
import { sessionPhrase } from '../src/content/schedule.mjs';
import { searchTagProblems } from './seo-pages.mjs';

test('day text from Sanity becomes schema.org days', () => {
  assert.deepEqual(parseDays('Monday–Wednesday'), ['Monday', 'Tuesday', 'Wednesday']);
  assert.deepEqual(parseDays('Saturday'), ['Saturday']);
  assert.deepEqual(parseDays('Mon, Wed & Fri'), ['Monday', 'Wednesday', 'Friday']);
  assert.deepEqual(parseDays('Tues. to Thurs.'), ['Tuesday', 'Wednesday', 'Thursday']);
  assert.deepEqual(parseDays('Fridays'), ['Friday']);
  for (const text of ['Weekdays', 'Holidays', 'By appointment', '']) assert.equal(parseDays(text), null, text);
});
test('hour text from Sanity becomes 24-hour opening and closing times', () => {
  assert.deepEqual(parseHours('11 a.m.–5 p.m.'), { opens: '11:00', closes: '17:00' });
  assert.deepEqual(parseHours('11 a.m.–2 p.m.'), { opens: '11:00', closes: '14:00' });
  assert.deepEqual(parseHours('10:30 a.m. to noon'), { opens: '10:30', closes: '12:00' });
  assert.deepEqual(parseHours('11–5 p.m.'), { opens: '11:00', closes: '17:00' });
  assert.deepEqual(parseHours('1–4 p.m.'), { opens: '13:00', closes: '16:00' });
  for (const text of ['Closed', 'By appointment', '11–5', '5 p.m.–11 a.m.', '']) assert.equal(parseHours(text), null, text);
});
test('opening hours skip closed days, and are left out entirely when any open row is unreadable', () => {
  const rows = [{ days: 'Monday–Wednesday', hours: '11 a.m.–5 p.m.' }, { days: 'Thursday–Friday', hours: 'Closed' }, { days: 'Saturday', hours: '11 a.m.–2 p.m.' }];
  assert.deepEqual(openingHours(rows), [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['https://schema.org/Monday', 'https://schema.org/Tuesday', 'https://schema.org/Wednesday'], opens: '11:00', closes: '17:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['https://schema.org/Saturday'], opens: '11:00', closes: '14:00' },
  ]);
  assert.equal(openingHours([...rows, { days: 'Sunday', hours: 'Call ahead' }]), null);
  assert.equal(openingHours([{ days: 'Every day', hours: 'Closed' }]), null);
});
test('the library record uses the Sanity contact details', () => {
  const node = libraryNode({ name: 'Cottonwood Community Library', address: '3427 Main Street', locality: 'Cottonwood, CA 96022', mailingAddress: 'PO Box 1807, Cottonwood, CA 96022', phone: '(530) 347-4818', phoneHref: 'tel:+15303474818', email: 'cottonlib@shasta.com', hours: [], facebookUrl: 'https://www.facebook.com/x', instagramUrl: '', directionsUrl: 'https://maps.example/' });
  assert.equal(node['@type'], 'Library');
  assert.deepEqual(node.address, { '@type': 'PostalAddress', streetAddress: '3427 Main Street', addressLocality: 'Cottonwood', addressRegion: 'CA', postalCode: '96022', addressCountry: 'US' });
  assert.equal(node.telephone, '+1-530-347-4818');
  assert.equal(node.contactPoint.address.postOfficeBoxNumber, '1807');
  assert.deepEqual(node.sameAs, ['https://www.facebook.com/x']);
  assert.equal('openingHoursSpecification' in node, false);
});
test('events and posts', () => {
  const [online] = eventNodes([{ title: 'Auction', summary: 'Bid', startsAt: '2026-11-14T12:00:00-08:00', endsAt: '2026-11-15T15:00:00-08:00', location: 'Online', link: 'https://givebutter.com/c/x' }], { url: 'https://site/events/a/' });
  assert.equal(online.eventAttendanceMode, 'https://schema.org/OnlineEventAttendanceMode');
  assert.deepEqual(online.location, { '@type': 'VirtualLocation', url: 'https://givebutter.com/c/x' });
  const [inPerson] = eventNodes([{ title: 'Story Time', summary: 'Stories', startsAt: 'a', endsAt: 'b' }], { url: 'u' });
  assert.equal(inPerson.location['@id'], 'https://www.cottonwoodcommunitylibrary.com/#library');
  assert.equal('datePublished' in articleNode({ title: 'T', summary: 'S', publishedAt: null }, { url: 'u' }), false);
});
test('CMS text cannot close the JSON-LD script', () => {
  assert.equal(jsonLd([{ name: '</script><script>alert(1)</script>' }]).includes('</'), false);
});

test('breadcrumbs describe real pages without treating a section anchor as another page', () => {
  const node = breadcrumbNode([
    { label: 'Home', href: '/' },
    { label: 'Events & News', href: '/events/' },
    { label: 'Regular Events', href: '/events/#regular' },
    { label: 'Story Time', href: '/events/regular/story-time/' },
  ]);
  assert.equal(node['@type'], 'BreadcrumbList');
  assert.deepEqual(node.itemListElement, [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.cottonwoodcommunitylibrary.com/' },
    { '@type': 'ListItem', position: 2, name: 'Events & News', item: 'https://www.cottonwoodcommunitylibrary.com/events/' },
    { '@type': 'ListItem', position: 3, name: 'Story Time', item: 'https://www.cottonwoodcommunitylibrary.com/events/regular/story-time/' },
  ]);
});

// Regular programs: dated sessions from the schedule text, worked out at build time.
const at = text => new Date(text);
const starts = (program, options) => programSessions(program, options).map(session => session.startsAt);
test('schedule times become 24-hour start (and end) times', () => {
  assert.deepEqual(parseTime('11:30 a.m.'), { starts: '11:30' });
  assert.deepEqual(parseTime('1 p.m.'), { starts: '13:00' });
  assert.deepEqual(parseTime('noon'), { starts: '12:00' });
  assert.deepEqual(parseTime('6–7:30 p.m.'), { starts: '18:00', ends: '19:30' });
  for (const text of ['11:30', 'midnight', 'soon', '']) assert.equal(parseTime(text), null, text);
});
test('library times carry the Pacific offset for that day, across daylight saving', () => {
  assert.equal(libraryDateTime('2026-10-31', '14:30'), '2026-10-31T14:30:00-07:00');
  assert.equal(libraryDateTime('2026-11-01', '14:30'), '2026-11-01T14:30:00-08:00');
  assert.equal(libraryDateTime('2027-03-13', '11:30'), '2027-03-13T11:30:00-08:00');
  assert.equal(libraryDateTime('2027-03-14', '11:30'), '2027-03-14T11:30:00-07:00');
});
test('a weekly program gets every matching day in the horizon, with the offset changing at daylight saving', () => {
  const story = { id: 'story-time', schedule: 'Wednesdays · 11:30 a.m.' };
  const sessions = starts(story, { now: at('2026-10-20T12:00:00-07:00'), days: 22 });
  assert.deepEqual(sessions, ['2026-10-21T11:30:00-07:00', '2026-10-28T11:30:00-07:00', '2026-11-04T11:30:00-08:00', '2026-11-11T11:30:00-08:00']);
  assert.deepEqual(starts(story, { now: at('2027-03-09T09:00:00-08:00'), days: 9 }), ['2027-03-10T11:30:00-08:00', '2027-03-17T11:30:00-07:00']);
});
test('a monthly program falls on the nth weekday of each month (or the last one)', () => {
  const readers = { id: 'main-street-readers', schedule: 'Third Tuesday · 2:30 p.m.' };
  assert.deepEqual(starts(readers, { now: at('2026-11-05T09:00:00-08:00') }), ['2026-11-17T14:30:00-08:00', '2026-12-15T14:30:00-08:00', '2027-01-19T14:30:00-08:00']);
  // A month that starts on the weekday itself: the third Thursday of October 2026 is the 15th.
  assert.deepEqual(starts({ id: 'book-club', schedule: 'Third Thursday · 1 p.m.' }, { now: at('2026-10-01T00:00:00-07:00'), days: 30 }), ['2026-10-15T13:00:00-07:00']);
  assert.deepEqual(starts({ id: 'x', schedule: 'Last Friday · 6–7 p.m.' }, { now: at('2027-01-01T00:00:00-08:00'), days: 60 }), ['2027-01-29T18:00:00-08:00', '2027-02-26T18:00:00-08:00']);
  assert.equal(programSessions({ id: 'x', schedule: 'Last Friday · 6–7 p.m.' }, { now: at('2027-01-01T00:00:00-08:00'), days: 30 })[0].endsAt, '2027-01-29T19:00:00-08:00');
});
test('sessions that already started are left out', () => {
  const story = { id: 'story-time', schedule: 'Wednesdays · 11:30 a.m.' };
  assert.equal(starts(story, { now: at('2026-11-11T11:29:00-08:00'), days: 7 })[0], '2026-11-11T11:30:00-08:00');
  assert.deepEqual(starts(story, { now: at('2026-11-11T11:30:00-08:00'), days: 7 }), ['2026-11-18T11:30:00-08:00']);
  for (const session of starts(story, { now: at('2026-11-11T15:00:00-08:00') })) assert.ok(Date.parse(session) > Date.parse('2026-11-11T15:00:00-08:00'));
});
test('a notice with closed days skips sessions on those days only, not every day its banner shows', () => {
  const story = { id: 'story-time', schedule: 'Wednesdays · 11:30 a.m.' };
  const now = at('2026-11-16T09:00:00-08:00');
  // Banner shows Nov 16–28 for a Thanksgiving closure Wednesday Nov 25 – Friday Nov 27.
  const thanksgiving = { startsOn: '2026-11-16', endsOn: '2026-11-28', closedDates: ['2026-11-25', '2026-11-26', '2026-11-27'] };
  assert.deepEqual(starts(story, { now, days: 16, notices: [thanksgiving] }), ['2026-11-18T11:30:00-08:00', '2026-12-02T11:30:00-08:00']);
  // Closed only Thursday the 26th: both Story Times in the banner's window stay listed.
  assert.deepEqual(starts(story, { now, days: 16, notices: [{ ...thanksgiving, closedDates: ['2026-11-26'] }] }), ['2026-11-18T11:30:00-08:00', '2026-11-25T11:30:00-08:00', '2026-12-02T11:30:00-08:00']);
  // A closed day after the banner comes down still skips that session (cancelling one Story Time this way works too).
  assert.deepEqual(starts(story, { now, days: 16, notices: [{ startsOn: '2026-11-16', endsOn: '2026-11-18', closedDates: ['2026-12-02'] }] }), ['2026-11-18T11:30:00-08:00', '2026-11-25T11:30:00-08:00']);
});
test('an older notice without closed days still skips every day its banner shows', () => {
  const story = { id: 'story-time', schedule: 'Wednesdays · 11:30 a.m.' };
  const now = at('2026-11-16T09:00:00-08:00');
  assert.deepEqual(starts(story, { now, days: 16, notices: [{ startsOn: '2026-11-24', endsOn: '2026-11-28' }] }), ['2026-11-18T11:30:00-08:00', '2026-12-02T11:30:00-08:00']);
  assert.deepEqual(starts(story, { now, days: 16, notices: [{ startsOn: '2026-11-16', endsOn: '2026-11-28', closedDates: [] }] }), ['2026-12-02T11:30:00-08:00']);
  assert.equal(noticeClosesDay({ startsOn: '2026-11-16', endsOn: '2026-11-28' }, '2026-11-16'), true);
  assert.equal(noticeClosesDay({ startsOn: '2026-11-16', endsOn: '2026-11-28' }, '2026-11-29'), false);
});
test('a notice that says the library stays open (shorter hours) skips no sessions', () => {
  const story = { id: 'story-time', schedule: 'Wednesdays · 11:30 a.m.' };
  const shorterHours = { startsOn: '2026-12-14', endsOn: '2026-12-24', staysOpen: true };
  assert.deepEqual(starts(story, { now: at('2026-12-14T09:00:00-08:00'), days: 10, notices: [shorterHours] }), ['2026-12-16T11:30:00-08:00', '2026-12-23T11:30:00-08:00']);
  // Closed days win if a notice somehow has both.
  assert.equal(noticeClosesDay({ ...shorterHours, closedDates: ['2026-12-23'] }, '2026-12-23'), true);
  assert.equal(noticeClosesDay({ ...shorterHours, closedDates: ['2026-12-23'] }, '2026-12-16'), false);
});
test('closed days are Pacific calendar days, across daylight saving and for evening sessions', () => {
  const story = { id: 'story-time', schedule: 'Wednesdays · 11:30 a.m.' };
  // The Wednesday right after clocks fall back (Nov 1, 2026), and right after they spring forward (Mar 14, 2027).
  assert.deepEqual(starts(story, { now: at('2026-10-27T09:00:00-07:00'), days: 15, notices: [{ startsOn: '2026-10-27', endsOn: '2026-11-04', closedDates: ['2026-11-04'] }] }), ['2026-10-28T11:30:00-07:00', '2026-11-11T11:30:00-08:00']);
  assert.deepEqual(starts(story, { now: at('2027-03-09T09:00:00-08:00'), days: 15, notices: [{ startsOn: '2027-03-09', endsOn: '2027-03-17', closedDates: ['2027-03-17'] }] }), ['2027-03-10T11:30:00-08:00', '2027-03-24T11:30:00-07:00']);
  // A 6 p.m. Pacific session is already the next day in UTC; the Pacific day is what counts.
  const evening = { id: 'x', schedule: 'Last Friday · 6–7 p.m.' };
  const now = at('2027-01-01T00:00:00-08:00');
  assert.deepEqual(starts(evening, { now, days: 30, notices: [{ startsOn: '2027-01-25', endsOn: '2027-01-29', closedDates: ['2027-01-29'] }] }), []);
  assert.deepEqual(starts(evening, { now, days: 30, notices: [{ startsOn: '2027-01-25', endsOn: '2027-01-30', closedDates: ['2027-01-30'] }] }), ['2027-01-29T18:00:00-08:00']);
});
test('a dated event for the program skips that day', () => {
  const story = { id: 'story-time', schedule: 'Wednesdays · 11:30 a.m.' };
  const now = at('2026-11-16T09:00:00-08:00');
  const events = [{ programId: 'story-time', startsAt: '2026-11-18T10:00:00-08:00' }, { programId: 'book-club', startsAt: '2026-12-02T13:00:00-08:00' }];
  assert.deepEqual(starts(story, { now, days: 16, events }), ['2026-11-25T11:30:00-08:00', '2026-12-02T11:30:00-08:00']);
});
test('a schedule that cannot be read with confidence gives no sessions', () => {
  for (const schedule of ['Every other Wednesday · 11:30 a.m.', 'Wednesdays', 'By appointment', 'First and third Tuesday · 2 p.m.', '']) assert.deepEqual(programSessions({ id: 'x', schedule }, { now: at('2026-11-05T09:00:00-08:00') }), [], schedule);
});
test('program sessions become in-person events at the library, each with its own address', () => {
  const sessions = programSessions({ id: 'main-street-readers', schedule: 'Third Tuesday · 2:30 p.m.' }, { now: at('2026-11-05T09:00:00-08:00'), days: 30 });
  const [node] = programEventNodes({ title: 'Main Street Readers', description: 'Talk books' }, sessions, { url: 'https://site/events/regular/main-street-readers/' });
  assert.equal(node.startDate, '2026-11-17T14:30:00-08:00');
  assert.equal('endDate' in node, false);
  assert.equal(node.url, 'https://site/events/regular/main-street-readers/#session-2026-11-17');
  assert.equal(node.eventAttendanceMode, 'https://schema.org/OfflineEventAttendanceMode');
  assert.equal(node.eventStatus, 'https://schema.org/EventScheduled');
  assert.equal(node.location['@id'], 'https://www.cottonwoodcommunitylibrary.com/#library');
});
test('the visible session list groups dates by month', () => {
  const text = sessions => sessionPhrase(sessions.map(day => ({ day }))).map(piece => piece.text).join('');
  assert.equal(text(['2026-11-11', '2026-11-18', '2026-11-25', '2026-12-02']), 'November 11, 18 and 25; December 2');
  assert.equal(text(['2026-11-17', '2026-12-15', '2027-01-19']), 'November 17, December 15 and January 19');
  assert.equal(text(['2026-11-17', '2026-12-15']), 'November 17 and December 15');
  assert.equal(sessionPhrase([{ day: '2026-12-02' }]).filter(piece => piece.session).length, 1);
});

test('built pages need their own title, description, canonical address and share picture', () => {
  const page = (path, { title = `${path} | Cottonwood Community Library`, description = `About ${path}.`, canonical = `https://www.cottonwoodcommunitylibrary.com${path}`, extra = '' } = {}) => ({ path,
    html: `<html><head><meta charset="UTF-8"><meta name="description" content="${description}"><link rel="canonical" href="${canonical}"><meta property="og:image" content="https://cdn/x.jpg">${extra}<title>${title}</title></head></html>` });
  assert.deepEqual(searchTagProblems([page('/'), page('/visit/'), page('/events/regular/story-time/')]), { errors: [], warnings: [] });
  const { errors, warnings } = searchTagProblems([page('/'), page('/new/', { title: '', description: '' }), page('/copy/', { title: '/ | Cottonwood Community Library', description: 'About /.' }), page('/moved/', { canonical: 'https://www.cottonwoodcommunitylibrary.com/' })]);
  assert.deepEqual(errors, ['/new/ has no title. Pass BaseLayout a title.', '/new/ has no description. Pass BaseLayout a description.', '/moved/ has canonical address "https://www.cottonwoodcommunitylibrary.com/", expected https://www.cottonwoodcommunitylibrary.com/moved/.']);
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /\/copy\/ has the same title as \//);
  // Pages kept out of search, redirects and design-system pages are not checked.
  assert.deepEqual(searchTagProblems([page('/404', { description: '', extra: '<meta name="robots" content="noindex">' }), { path: '/our-story/', html: '<meta http-equiv="refresh" content="0;url=/about/">' }, { path: '/components/', html: '<title></title>' }]), { errors: [], warnings: [] });
});
