import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import {isContentUpdatePath, contentUpdatePath, parseContentUpdate, siteDocuments, siteDigest, revisionList, parseRevisions, compareContent, statusDescription, commentBody, pagePath, checkPages, LEGACY_UPDATE_PATH, COMMENT_MARKER} from './content-changes.mjs';

const image = (id, rev = 'r1', extra = {}) => ({_id: id, _type: 'sanity.imageAsset', _rev: rev, originalFilename: `${id}.jpg`, ...extra});
const snapshot = documents => ({schemaVersion: 1, projectId: '2ou0xy2r', dataset: 'production', documents});
const auction = {_id: 'event-auction', _type: 'event', _rev: 'a2', title: 'Online auction', image: {asset: {_ref: 'image-new'}}, _updatedAt: '2026-10-27T20:00:00Z'};
const readers = {_id: 'program-readers', _type: 'program', _rev: 'p2', title: 'Main Street Readers', image: {asset: {_ref: 'image-readers'}}, _updatedAt: '2026-10-27T19:00:00Z'};
const settings = {_id: 'library-settings', _type: 'siteSettings', _rev: 's1', _updatedAt: '2026-10-01T00:00:00Z'};

test('each save has its own content-update file; the old shared path still counts', () => {
  assert.equal(contentUpdatePath('2026-10-27', 'Add the Nov 14 auction!'), 'content-updates/2026-10-27-add-the-nov-14-auction.json');
  for (const file of [LEGACY_UPDATE_PATH, 'content-updates/2026-10-27-auction.json']) assert.ok(isContentUpdatePath(file), file);
  for (const file of ['content-updates/latest.json', 'content-updates/auction.json', 'content-updates/2026-10-27-Auction.json', 'content-updates/x/2026-10-27-a.json', 'assistant/other.json', 'src/content/seed.ts'])
    assert.ok(!isContentUpdatePath(file), file);
  assert.throws(() => contentUpdatePath('Oct 27', 'x'));
});

test('content-update files are read leniently but need a request and document ids', () => {
  assert.deepEqual(parseContentUpdate(JSON.stringify({request: ' Add auction ', sanityDocuments: [{id: 'event-auction', revision: 'a2', fields: ['title'], before: {title: 'Old'}}, {id: 'post-x', before: null}], requestedInChat: '2026-10-27'})),
    {request: 'Add auction', documentIds: ['event-auction', 'post-x'], requestedInChat: '2026-10-27'});
  for (const bad of ['nope', '[]', '{"sanityDocuments":[]}', '{"request":"x"}', '{"request":"x","sanityDocuments":[{"id":"drafts.a"}]}', '{"request":"x","sanityDocuments":[],"requestedInChat":"today"}'])
    assert.throws(() => parseContentUpdate(bad), bad);
});

test('every content-update file in the repository is valid', async () => {
  const files = [LEGACY_UPDATE_PATH, ...(await readdir('content-updates').catch(() => [])).map(name => `content-updates/${name}`)];
  for (const file of files) {
    assert.ok(isContentUpdatePath(file), `${file} must be named content-updates/YYYY-MM-DD-short-name.json`);
    parseContentUpdate(await readFile(file, 'utf8'));
  }
});

test('an unused picture upload does not change the website digest', () => {
  const base = snapshot([settings, readers, image('image-readers')]);
  const withUpload = snapshot([...base.documents, image('image-unused')]);
  assert.deepEqual(siteDocuments(withUpload).map(doc => doc._id), ['library-settings', 'program-readers', 'image-readers']);
  assert.equal(siteDigest(withUpload), siteDigest(base));
  assert.notEqual(siteDigest(snapshot([settings, {...readers, title: 'Changed'}, image('image-readers')])), siteDigest(base));
  assert.notEqual(siteDigest(snapshot([settings, readers, image('image-readers', 'r2')])), siteDigest(base));
});

test('the live revision list keeps ids, revisions and titles only', () => {
  const list = revisionList(snapshot([readers, image('image-readers'), image('image-unused')]));
  assert.deepEqual(list, [{id: 'image-readers', type: 'sanity.imageAsset', rev: 'r1'}, {id: 'program-readers', type: 'program', rev: 'p2', label: 'Main Street Readers'}]);
  assert.deepEqual(parseRevisions({schemaVersion: 1, documents: list}), list);
  assert.equal(parseRevisions({schemaVersion: 2, documents: []}), null);
  assert.equal(parseRevisions(null), null);
});

test('a save lists its own documents and flags everything else that would go live', () => {
  const live = revisionList(snapshot([settings, {...readers, _rev: 'p1'}, image('image-readers'), {_id: 'notice-old', _type: 'notice', _rev: 'n1', message: 'Closed Monday'}]));
  const current = snapshot([settings, readers, image('image-readers'), auction, image('image-new'), image('image-unused')]);
  const result = compareContent({live, current, listed: ['event-auction'], updateFiles: ['content-updates/2026-10-27-auction.json']});
  assert.equal(result.basis, 'live-revisions');
  const byId = Object.fromEntries(result.changes.map(item => [item.id, item]));
  assert.deepEqual(Object.keys(byId).sort(), ['event-auction', 'image-new', 'notice-old', 'program-readers']);
  assert.equal(byId['event-auction'].listed, true);
  assert.equal(byId['image-new'].listed, true, 'a picture used by a listed document is part of the save');
  assert.equal(byId['program-readers'].change, 'changed');
  assert.equal(byId['notice-old'].change, 'removed');
  assert.deepEqual(result.notListed.map(item => item.id).sort(), ['notice-old', 'program-readers']);
  assert.match(statusDescription(result), /ALSO puts 2 other changes live/);
  assert.ok(statusDescription(result).length <= 140);
  const body = commentBody(result, {previewUrl: 'https://abcd1234.cottonwood-library.pages.dev/', sha: 'f'.repeat(40)});
  assert.ok(body.startsWith(COMMENT_MARKER));
  assert.match(body, /ALSO go live/);
  assert.match(body, /Program "Main Street Readers" \(changed\) `program-readers`/);
  assert.match(body, /Notice "Closed Monday" \(removed\)/);
});

test('without a live list, edit times after the live preview are used; otherwise it says it cannot compare', () => {
  const current = snapshot([settings, readers, image('image-readers', 'r1', {_updatedAt: '2026-10-01T00:00:00Z'}), auction, image('image-new', 'r1', {_updatedAt: '2026-10-27T20:00:00Z'})]);
  const byTime = compareContent({live: null, liveCheckedAt: Date.parse('2026-10-27T19:30:00Z'), current, listed: ['event-auction'], updateFiles: ['content-updates/2026-10-27-auction.json']});
  assert.equal(byTime.basis, 'updated-after-live');
  assert.deepEqual(byTime.changes.map(item => item.id).sort(), ['event-auction', 'image-new']);
  assert.equal(byTime.notListed.length, 0);
  assert.match(statusDescription(byTime), /Only this save/);
  const unknown = compareContent({live: null, current});
  assert.equal(unknown.basis, 'unknown');
  assert.match(statusDescription(unknown), /Could not compare/);
  assert.match(statusDescription(unknown, {contentMoved: true}), /Refresh before saving/);
  assert.match(commentBody(unknown, {}), /could not compare/i);
});

test('a code change with identical content says nothing else goes live', () => {
  const current = snapshot([settings, readers, image('image-readers')]);
  const result = compareContent({live: revisionList(current), current});
  assert.equal(result.changes.length, 0);
  assert.match(statusDescription(result), /No content differences/);
  assert.match(commentBody(result, {}), /No other changes will go live/);
});

test('posts, events, programs and newsletters get their current page address; the rest have none', () => {
  const page = (_type, current) => pagePath({_type, slug: {current}});
  assert.equal(page('post', 'our-new-website'), '/news/our-new-website/');
  assert.equal(page('event', 'book-sale'), '/events/book-sale/');
  assert.equal(page('program', 'story-time'), '/events/regular/story-time/');
  assert.equal(page('newsletter', 'summer-2026'), '/newsletters/summer-2026/');
  assert.equal(page('siteSettings', 'x'), null);
  assert.equal(page('post', 'Bad Slug'), null);
  assert.equal(pagePath(image('image-new')), null);
});

const launchPost = {_id: 'post-launch', _type: 'post', _rev: 'n1', title: 'Our New Library Website Is Live!', slug: {current: 'our-new-website-is-live'}};
const launchSave = () => compareContent({live: revisionList(snapshot([settings])), current: snapshot([settings, launchPost]), listed: ['post-launch'], updateFiles: ['content-updates/2026-11-03-launch.json']});
const respond = (status, body = '') => ({status, text: async () => body});

test('a newsletter page passes when it shows the issue heading, even though its title differs', async () => {
  const summer = {_id: 'newsletter-current', _type: 'newsletter', _rev: 'n2', issue: 'Summer 2026', title: 'A little news from your library', slug: {current: 'summer-2026'}};
  const result = compareContent({live: revisionList(snapshot([settings])), current: snapshot([settings, summer]), listed: ['newsletter-current'], updateFiles: ['content-updates/2026-11-10-word.json']});
  assert.equal(result.changes[0].pageHeading, 'Summer 2026 newsletter');
  const shown = await checkPages(result, 'https://abcd1234.cottonwood-library.pages.dev/', {fetcher: async () => respond(200, '<h1>Summer 2026 newsletter</h1>')});
  assert.equal(shown[0].ok, true);
  assert.equal(shown[0].url, 'https://abcd1234.cottonwood-library.pages.dev/newsletters/summer-2026/');
  const wrong = await checkPages(result, 'https://abcd1234.cottonwood-library.pages.dev/', {fetcher: async () => respond(200, '<h1>Page not found</h1>')});
  assert.match(wrong[0].problem, /does not show "A little news from your library"/);
});

test('the preview check opens each listed page and only passes when it shows the title', async () => {
  const result = launchSave();
  const asked = [];
  const ok = await checkPages(result, 'https://abcd1234.cottonwood-library.pages.dev/', {fetcher: async url => {asked.push(url); return respond(200, '<h1>Our New Library Website Is Live&#33;</h1>');}});
  assert.deepEqual(asked, ['https://abcd1234.cottonwood-library.pages.dev/news/our-new-website-is-live/']);
  assert.deepEqual(ok, [{id: 'post-launch', typeName: 'News post', label: 'Our New Library Website Is Live!', url: asked[0], ok: true}]);
  const body = commentBody(result, {previewUrl: 'https://abcd1234.cottonwood-library.pages.dev/', sha: 'f'.repeat(40), pages: ok});
  assert.match(body, /Pages checked on the preview/);
  assert.match(body, /News post "Our New Library Website Is Live!": https:\/\/abcd1234\.cottonwood-library\.pages\.dev\/news\/our-new-website-is-live\//);
  assert.match(statusDescription(result, {pages: ok}), /Only this save/);

  const missing = await checkPages(result, 'https://abcd1234.cottonwood-library.pages.dev/', {fetcher: async () => respond(404), wait: async () => {}});
  assert.equal(missing[0].ok, false);
  assert.match(statusDescription(result, {pages: missing}), /^No working preview: the news post page answers 404/);
  assert.match(commentBody(result, {pages: missing}), /\*\*Problem:\*\* News post "Our New Library Website Is Live!" answers 404/);

  const wrong = await checkPages(result, 'https://abcd1234.cottonwood-library.pages.dev/', {fetcher: async () => respond(200, '<h1>Page not found</h1>')});
  assert.match(wrong[0].problem, /does not show/);
  let tries = 0;
  const later = await checkPages(result, 'https://abcd1234.cottonwood-library.pages.dev/', {fetcher: async () => ++tries < 3 ? respond(404) : respond(200, '<h1>Our New Library Website Is Live!</h1>'), wait: async () => {}});
  assert.equal(later[0].ok, true, 'a page still being published gets a few tries');
});
