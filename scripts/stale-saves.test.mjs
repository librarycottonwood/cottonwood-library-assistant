import test from 'node:test';
import assert from 'node:assert/strict';
import {isContentSave, isStale, closingComment, closeStaleSaves} from './stale-saves.mjs';

const repo = 'librarycottonwood/cottonwood-library-assistant';
const now = Date.parse('2026-11-20T00:00:00Z');
const pr = (number, updated, extra = {}) => ({number, title: `Save ${number}`, state: 'open', updated_at: updated, base: {ref: 'main'},
  head: {ref: `content/save-${number}`, sha: String(number).repeat(40).slice(0, 40), repo: {full_name: repo}}, ...extra});

test('only content-update-only PRs count as content saves', () => {
  assert.ok(isContentSave([{filename: 'content-updates/2026-10-27-auction.json'}]));
  assert.ok(isContentSave([{filename: 'assistant/website-update.json'}]));
  assert.ok(!isContentSave([{filename: 'content-updates/2026-10-27-auction.json'}, {filename: 'src/pages/index.astro'}]));
  assert.ok(!isContentSave([{filename: 'scripts/build.mjs'}]));
  assert.ok(!isContentSave([]));
});

test('stale means 14 days without activity on an open same-repository PR into main', () => {
  assert.ok(isStale(pr(1, '2026-11-01T00:00:00Z'), now));
  assert.ok(!isStale(pr(2, '2026-11-10T00:00:00Z'), now));
  assert.ok(!isStale(pr(3, '2026-11-01T00:00:00Z', {base: {ref: 'other'}}), now));
  assert.ok(!isStale(pr(4, '2026-11-01T00:00:00Z', {head: {ref: 'x', repo: {full_name: 'someone/fork'}}}), now));
  assert.ok(!isStale(pr(5, '2026-11-01T00:00:00Z', {head: {ref: 'main', repo: {full_name: repo}}}), now));
});

test('the closing comment says nothing went live and Sanity is not undone', () => {
  const text = closingComment({requests: ['Replace program photos'], documentIds: ['program-readers'], changesUrl: 'https://github.com/x#issuecomment-1'});
  assert.match(text, /Nothing from this save went live/);
  assert.match(text, /\*\*not\*\* undone/);
  assert.match(text, /`program-readers`/);
  assert.match(text, /issuecomment-1/);
});

test('closes stale content saves, leaves code PRs open and deletes only the save branch', async () => {
  const calls = [];
  const files = {1: [{filename: 'content-updates/2026-10-27-photos.json', status: 'added'}], 2: [{filename: 'src/pages/index.astro', status: 'modified'}]};
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const {pathname, searchParams} = new URL(url);
    const route = pathname.replace(`/repos/${repo}/`, '');
    calls.push(`${options.method ?? 'GET'} ${route}`);
    const json = value => new Response(JSON.stringify(value), {status: 200});
    if (route === 'pulls' && searchParams.get('state') === 'open') return json([pr(1, '2026-11-01T00:00:00Z'), pr(2, '2026-11-01T00:00:00Z'), pr(3, '2026-11-19T00:00:00Z')]);
    const filesMatch = /^pulls\/(\d+)\/files$/.exec(route);
    if (filesMatch) return json(files[filesMatch[1]]);
    if (route.startsWith('contents/')) return json({content: Buffer.from(JSON.stringify({request: 'Replace photos', sanityDocuments: [{id: 'program-readers'}]})).toString('base64')});
    if (route === 'issues/1/comments' && options.method === 'GET') return json([{user: {type: 'Bot'}, body: '<!-- cottonwood-content-changes -->', html_url: 'https://example.test/c'}]);
    if (options.method === 'DELETE') return new Response(null, {status: 204});
    return json({});
  };
  try {
    const closed = await closeStaleSaves({GITHUB_REPOSITORY: repo, GH_TOKEN: 'x'}, {now, log: () => {}});
    assert.deepEqual(closed, [1]);
    assert.ok(calls.includes('POST issues/1/comments'));
    assert.ok(calls.includes('PATCH pulls/1'));
    assert.ok(calls.includes('DELETE git/refs/heads/content/save-1'));
    assert.ok(!calls.some(call => /PATCH pulls\/2|DELETE .*save-2|pulls\/3\/files/.test(call)));
    calls.length = 0;
    assert.deepEqual(await closeStaleSaves({GITHUB_REPOSITORY: repo, GH_TOKEN: 'x', DRY_RUN: 'true'}, {now, log: () => {}}), [1]);
    assert.ok(!calls.some(call => !call.startsWith('GET')), 'a dry run changes nothing');
  } finally {globalThis.fetch = original;}
});
