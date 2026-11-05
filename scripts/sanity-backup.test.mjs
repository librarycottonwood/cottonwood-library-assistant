// Weekly CMS backup (scripts/sanity-backup.mjs). Sanity is never called: a fake fetch answers
// like the export API and the CDN, and the archive is unpacked to check its layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { assetPath, createBackup, rewriteAssets } from './sanity-backup.mjs';

const sha = text => createHash('sha1').update(text).digest('hex');
const picture = 'picture bytes', pdf = 'pdf bytes';
const imageId = `image-${sha(picture)}-800x600-jpg`, fileId = `file-${sha(pdf)}-pdf`;
const config = { projectId: 'abc123', dataset: 'production' };
const records = [
  { _id: imageId, _type: 'sanity.imageAsset', url: `https://cdn.sanity.io/images/abc123/production/${sha(picture)}-800x600.jpg`, sha1hash: sha(picture), originalFilename: 'hall.jpg', extension: 'jpg' },
  { _id: fileId, _type: 'sanity.fileAsset', url: `https://cdn.sanity.io/files/abc123/production/${sha(pdf)}.pdf`, sha1hash: sha(pdf), originalFilename: 'fall.pdf' },
  { _id: 'post-1', _type: 'post', title: 'New books', image: { _type: 'image', asset: { _type: 'reference', _ref: imageId }, alt: 'Hall' } },
  { _id: 'drafts.newsletter-1', _type: 'newsletter', file: { _type: 'file', asset: { _type: 'reference', _ref: fileId } } },
];

function fakeSanity({ exportStatus = 200, assets = {} } = {}) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url: String(url), auth: init.headers?.Authorization });
    const href = String(url);
    if (href.includes('/data/export/')) return new Response(records.map(r => JSON.stringify(r)).join('\n'), { status: exportStatus });
    const body = href.includes('/images/') ? picture : pdf;
    return new Response(assets.body ?? body, { status: assets.status ?? 200, headers: assets.headers ?? {} });
  };
  return { fetcher, calls };
}

test('asset ids map to the file names sanity dataset export uses', () => {
  assert.equal(assetPath(imageId), `images/${sha(picture)}-800x600.jpg`);
  assert.equal(assetPath(fileId), `files/${sha(pdf)}.pdf`);
});

test('asset references become import pointers and other fields are kept', () => {
  const rewritten = rewriteAssets(records[2]);
  assert.deepEqual(rewritten.image, { _sanityAsset: `image@file://./images/${sha(picture)}-800x600.jpg`, _type: 'image', alt: 'Hall' });
  assert.equal(rewritten.title, 'New books');
});

test('a backup holds records, pictures and PDFs in the importable layout', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'backup-test-'));
  try {
    const { fetcher, calls } = fakeSanity();
    const out = path.join(dir, 'backup.tar.gz');
    const summary = await createBackup({ config, token: 'viewer-token', out, fetch: fetcher, now: new Date('2026-11-08T10:00:00Z'), log: () => {} });
    assert.deepEqual({ records: summary.records, drafts: summary.drafts, assets: summary.assets, missing: summary.missingAssets.length },
      { records: 2, drafts: 1, assets: 2, missing: 0 });
    // The token goes only to the export API and picture originals, never to the PDF host request.
    assert.equal(calls[0].auth, 'Bearer viewer-token');
    assert.ok(calls.find(c => c.url.includes('/images/')).url.endsWith('dlRaw=true'));
    assert.equal(calls.find(c => c.url.includes('/files/')).auth, undefined);
    assert.equal(spawnSync('tar', ['-xzf', out, '-C', dir]).status, 0);
    const root = path.join(dir, 'production-export-2026-11-08');
    const data = (await readFile(path.join(root, 'data.ndjson'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    assert.deepEqual(data.map(doc => doc._id), ['post-1', 'drafts.newsletter-1']);
    assert.equal(await readFile(path.join(root, assetPath(imageId)), 'utf8'), picture);
    assert.equal(await readFile(path.join(root, assetPath(fileId)), 'utf8'), pdf);
    const assets = JSON.parse(await readFile(path.join(root, 'assets.json'), 'utf8'));
    assert.equal(assets[`image-${sha(picture)}`].originalFilename, 'hall.jpg');
    assert.ok(!(await readFile(path.join(root, 'data.ndjson'), 'utf8')).includes('viewer-token'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a failed export or a corrupted download saves nothing', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'backup-test-'));
  try {
    const out = path.join(dir, 'backup.tar.gz');
    await assert.rejects(createBackup({ config, out, fetch: fakeSanity({ exportStatus: 500 }).fetcher, log: () => {} }), /export failed \(HTTP 500\)/);
    await assert.rejects(createBackup({ config, out, fetch: fakeSanity({ assets: { body: 'truncated' } }).fetcher, log: () => {} }), /did not match its checksum/);
    assert.equal(spawnSync('test', ['-e', out]).status, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('without a token, public picture copies are accepted but CDN checksums still apply', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'backup-test-'));
  try {
    const out = path.join(dir, 'backup.tar.gz');
    const recompressed = fakeSanity({ assets: { body: 'smaller copy' } }).fetcher;
    // The PDF must still match exactly, so a different body for every asset fails on the PDF.
    await assert.rejects(createBackup({ config, out, fetch: recompressed, log: () => {} }), /file-.* did not match/);
    const onlyPictureDiffers = async (url, init) => String(url).includes('/images/') ? new Response('smaller copy') : fakeSanity().fetcher(url, init);
    const summary = await createBackup({ config, out, fetch: onlyPictureDiffers, log: () => {} });
    assert.equal(summary.picturesAsCdnCopies, 1);
    assert.equal(summary.draftsIncluded, false);
    const badHeader = async (url, init) => String(url).includes('/images/') ? new Response('x', { headers: { 'x-sanity-md5': 'f'.repeat(32) } }) : fakeSanity().fetcher(url, init);
    await assert.rejects(createBackup({ config, out, fetch: badHeader, log: () => {} }), /did not match its checksum/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
