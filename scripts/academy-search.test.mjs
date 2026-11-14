import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { academySearchEntries as entries } from '../src/content/academy-search.ts';
import { searchEntries, searchExcerpt } from '../src/scripts/search.ts';

test('search ranks relevant academy sections and does not return everything for empty input', () => {
  assert.equal(searchEntries(entries, 'social account')[0].href, '/academy/facebook-posts/#buffer-connect');
  assert.equal(searchEntries(entries, 'RECONNECT')[0].href, '/academy/facebook-posts/#buffer-reconnect');
  assert.equal(searchEntries(entries, 'newsletter subscribers')[0].href, '/academy/everyday-jobs/#subscribers');
  assert.ok(searchEntries(entries, 'flyer').some(entry => entry.href.includes('#example-')));
  assert.equal(searchEntries(entries, 'Givebutter')[0].href, '/academy/accounts-and-tools/#website-givebutter');
  assert.deepEqual(searchEntries(entries, '   '), []);
  assert.deepEqual(searchEntries(entries, '???'), []);
  assert.deepEqual(searchEntries(entries, '<script>alert(1)</script>'), []);
  assert.deepEqual(searchEntries(entries, 'xyzzynothing'), []);
  const body = `${'Opening instructions. '.repeat(20)}reconnect your account here. ${'More context. '.repeat(20)}`;
  const excerpt = searchExcerpt(body, 'reconnect');
  assert.match(excerpt, /reconnect your account/);
  assert.ok(excerpt.length <= 182);
});

test('every indexed section exists in the built academy, including examples and services', async () => {
  for (const entry of entries) {
    const [route, hash] = entry.href.split('#');
    assert.match(route, /^\/academy\/[a-z-]+\/$/);
    const html = await readFile(`dist${route}index.html`, 'utf8');
    if (hash) assert.ok(html.includes(`id="${hash}"`), entry.href);
  }
});
