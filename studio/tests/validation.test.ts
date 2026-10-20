import assert from 'node:assert/strict';
import {test} from 'node:test';
import {studioEnvironment} from '../environment.ts';
import {pacificDateLabel} from '../dates.ts';
import {uniqueSessions, validDateRange, validImage, validLink, validNewsletter, validSession} from '../validation.ts';

test('events reject backwards times, including equivalent UTC and Pacific offsets', () => {
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
