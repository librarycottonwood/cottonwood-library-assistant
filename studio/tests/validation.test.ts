import assert from 'node:assert/strict';
import {test} from 'node:test';
import {studioEnvironment} from '../environment.ts';
import {pacificDateLabel} from '../dates.ts';
import {emptyEntryNotice, identifierNotice, nestedListNotice, sessionTimeNotice, uniqueSessions, validDateRange, validIdentifier, validImage, validLink, validNewsletter, validPhone, validSession} from '../validation.ts';
import {normalizeLink} from '../../src/content/rules.mjs';

test('events require an end time and reject backwards times, including equivalent UTC and Pacific offsets', () => {
  assert.match(String(validSession({startsAt: '2026-11-07T18:00:00Z'})), /Choose an end date and time/);
  assert.match(String(validSession({startsAt: '2026-11-07T18:00:00Z', endsAt: ''})), /Choose an end date and time/);
  assert.equal(validSession({startsAt: '2026-11-07T18:00:00Z', endsAt: '2026-11-07T11:00:00-08:00'}), true);
  assert.match(String(validSession({startsAt: '2026-11-07T18:00:00Z', endsAt: '2026-11-07T09:30:00-08:00'})), /later/);
  assert.match(String(validSession({startsAt: '2026-11-07T10:00:00-08:00', endsAt: '2026-11-07T18:00:00Z'})), /later/);
  assert.match(String(validSession({startsAt: 'not a date'})), /valid start/);
  assert.match(String(validSession({startsAt: '2026-11-07T10:00:00-08:00', endsAt: 'not a date'})), /valid end/);
});

test('one event can have several dates but cannot repeat the same instant in different timezones', () => {
  assert.equal(uniqueSessions([{startsAt: '2026-11-07T18:00:00Z'}, {startsAt: '2026-11-08T18:00:00Z'}]), true);
  assert.match(String(uniqueSessions([{startsAt: '2026-11-07T18:00:00Z'}, {startsAt: '2026-11-07T10:00:00-08:00'}])), /already listed/);
});

test('a one-day closure is valid; a closure cannot expire before it starts', () => {
  assert.equal(validDateRange({startsOn: '2026-11-26', endsOn: '2026-11-26'}), true);
  assert.match(String(validDateRange({startsOn: '2026-11-26', endsOn: '2026-11-25'})), /end date/);
});

test('picture replacement and imported picture references both work; empty objects cannot publish', () => {
  assert.equal(validImage({asset: {_ref: 'image-abc-1200x800-jpg'}}), true);
  assert.equal(validImage({legacyKey: 'exterior'}), true);
  assert.match(String(validImage({alt: 'A useful description without a picture'})), /Upload/);
});

test('a newsletter must have an uploaded PDF asset or a preserved migration URL', () => {
  assert.equal(validNewsletter({file: {asset: {_ref: 'file-abcd-pdf'}}}), true);
  assert.equal(validNewsletter({legacyFileUrl: '/documents/old-issue.pdf'}), true);
  assert.match(String(validNewsletter({file: {}})), /Upload/);
  assert.match(String(validNewsletter({legacyFileUrl: ' '})), /Upload/);
});

test('volunteer links allow library paths and contacts but block script and insecure external links', () => {
  for (const value of ['/visit/', '/#visit', '#hours', 'https://example.org/news?q=library', 'mailto:cottonlib@shasta.com?subject=Hello', 'tel:+15303474818']) {
    assert.equal(validLink(value), true, value);
  }
  for (const value of ['javascript:alert(1)', '//untrusted.example/path', 'http://example.org/', 'data:text/html,test', 'https://username:password@example.org/', '/\\untrusted.example/path']) {
    assert.notEqual(validLink(value), true, value);
  }
});

test('an unconnected Studio fails explicitly and never chooses a project or dataset for the library', () => {
  assert.throws(() => studioEnvironment({}), /not connected/);
  assert.throws(() => studioEnvironment({SANITY_STUDIO_PROJECT_ID: 'cmscheck'}), /not connected/);
  assert.throws(() => studioEnvironment({SANITY_STUDIO_PROJECT_ID: 'https://sanity.io', SANITY_STUDIO_DATASET: 'production'}), /project ID/);
  assert.deepEqual(studioEnvironment({SANITY_STUDIO_PROJECT_ID: 'library123', SANITY_STUDIO_DATASET: 'production'}), {projectId: 'library123', dataset: 'production'});
});

test('list previews use Pacific dates across UTC midnight and keep incomplete drafts editable', () => {
  assert.equal(pacificDateLabel('2026-11-08T01:00:00Z'), 'Nov 7, 2026');
  assert.equal(pacificDateLabel('not ready yet'), 'Choose a date');
  assert.equal(pacificDateLabel(undefined), 'Choose a date');
});

// The Studio uses the website build's own rules, so what Studio accepts the build accepts.
test('Studio accepts the link mistakes the website corrects, and explains the ones it refuses', () => {
  for (const value of ['tel:(208) 555-0142', 'tel:+1 208 555 0142', 'https://givebutter.com/auction ', ' /visit/']) {
    assert.equal(validLink(value), true, value);
    assert.equal(normalizeLink(value).ok, true, value);
  }
  assert.match(String(validLink('https://localhost/x')), /isn't a public website/);
  assert.match(String(validLink('/visit/../events/')), /"\.\." in the page path/);
  assert.match(String(validLink('http://givebutter.com/')), /secure https:\/\//);
});

test('identifiers: valid ones pass silently, free text passes with a warning showing the address used', () => {
  assert.equal(validIdentifier('book-sale'), true);
  assert.equal(identifierNotice('book-sale'), true);
  assert.equal(validIdentifier('Printing & Copies'), true);
  assert.match(String(identifierNotice('Printing & Copies')), /"printing-copies"/);
  assert.match(String(identifierNotice('bookDonations')), /"book-donations"/);
  assert.match(String(validIdentifier('&&&')), /no letters or numbers/);
});

test('phone numbers may include an extension but need an area code', () => {
  assert.equal(validPhone('(530) 555-0173 ext. 2'), true);
  assert.equal(validPhone('(530) 347-4818'), true);
  assert.match(String(validPhone('347-4818')), /10-digit/);
});

test('blank entries and indented list items are warnings, matching what the website does with them', () => {
  assert.match(String(emptyEntryNotice('  ')), /left off the website/);
  assert.equal(emptyEntryNotice('A real paragraph.'), true);
  assert.match(String(nestedListNotice([{listItem: 'bullet', level: 1}, {listItem: 'bullet', level: 2}])), /main list/);
  assert.equal(nestedListNotice([{listItem: 'bullet', level: 1}, {style: 'normal'}]), true);
});

test('event times: seconds are optional and a wrong Pacific offset is flagged as a warning', () => {
  assert.equal(validSession({startsAt: '2026-11-14T00:00-08:00', endsAt: '2026-11-14T23:59-08:00'}), true);
  assert.equal(sessionTimeNotice({startsAt: '2026-11-14T00:00-08:00', endsAt: '2026-11-14T23:59-08:00'}), true);
  assert.equal(sessionTimeNotice({startsAt: '2026-11-07T18:00:00.000Z', endsAt: '2026-11-07T20:00:00.000Z'}), true);
  assert.match(String(sessionTimeNotice({startsAt: '2026-10-31T10:00:00-08:00', endsAt: '2026-10-31T12:00:00-07:00'})), /winter \(PST, -08:00\).*2026-10-31T10:00:00-07:00/);
  // Compared as corrected Pacific times: 10 a.m. to 11 a.m. is valid even though the start offset was wrong.
  assert.equal(validSession({startsAt: '2026-10-31T10:00:00-08:00', endsAt: '2026-10-31T11:00:00-07:00'}), true);
});
