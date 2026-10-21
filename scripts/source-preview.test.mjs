import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {checkContext, checkBundle} from './source-preview.mjs';
import {seedSnapshot, saveSnapshot, contentDigest} from './cms.mjs';
import {inventory, digestOf} from './release.mjs';

const repo = 'librarycottonwood/cottonwood-library-assistant';
const source = 'a'.repeat(40);
const config = {projectId: '2ou0xy2r', dataset: 'production'};
const expected = {repository: repo, sourceSha: source, runId: '123', pullRequest: 32};
const run = {id: 123, repository: {full_name: repo}, head_repository: {full_name: repo}, event: 'pull_request',
  path: '.github/workflows/check.yml', conclusion: 'success', head_sha: source, pull_requests: [{number: 32}]};
const pr = {number: 32, state: 'open', base: {ref: 'main', repo: {full_name: repo}}, head: {sha: source, repo: {full_name: repo}}};

test('only a successful check of the current owned draft can supply a preview', () => {
  assert.deepEqual(checkContext(run, pr), expected);
  for (const changed of [{conclusion: 'failure'}, {event: 'push'}, {head_sha: 'b'.repeat(40)},
    {head_repository: {full_name: 'other/repo'}}, {path: '.github/workflows/untrusted.yml'}, {pull_requests: []}]) {
    assert.throws(() => checkContext({...run, ...changed}, pr));
  }
  for (const changed of [{state: 'closed'}, {number: 33}, {head: {...pr.head, sha: 'b'.repeat(40)}},
    {base: {...pr.base, ref: 'another'}}, {head: {...pr.head, repo: {full_name: 'fork/repo'}}}]) {
    assert.throws(() => checkContext(run, {...pr, ...changed}));
  }
});

async function fixture() {
  const folder = await mkdtemp(path.join(tmpdir(), 'library-code-preview-'));
  await mkdir(path.join(folder, 'site/_content'), {recursive: true});
  await mkdir(path.join(folder, 'evidence'));
  const snapshot = await seedSnapshot(config);
  await saveSnapshot(snapshot, path.join(folder, 'snapshot.json'));
  await writeFile(path.join(folder, 'site/index.html'), '<!doctype html><h1>Library draft</h1>');
  const content = contentDigest(snapshot);
  await writeFile(path.join(folder, 'site/_content/version.json'), JSON.stringify({provider: 'sanity', sourceSha: source, contentDigest: content, workingTreeChanged: false}));
  const files = await inventory(path.join(folder, 'site'));
  const digest = digestOf(files);
  const picture = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lL8AAAAASUVORK5CYII=', 'base64');
  const hash = createHash('sha256').update(picture).digest('hex');
  for (const name of ['desktop', 'phone']) await writeFile(path.join(folder, 'evidence', `${name}.png`), picture);
  await writeFile(path.join(folder, 'evidence/evidence.json'), JSON.stringify({digest, sourceCommit: source, errors: [],
    pictures: {desktop: hash, phone: hash}, evidence: [{name: 'desktop', route: '/'}, {name: 'phone', route: '/'}]}));
  await writeFile(path.join(folder, 'manifest.json'), JSON.stringify({...expected, schemaVersion: 1, digest, files, contentDigest: content}));
  return folder;
}

test('the uploader rejects changed assets, pictures, source pins, and foreign content', async () => {
  const folder = await fixture();
  try {
    await checkBundle(folder, expected, config);
    await assert.rejects(checkBundle(folder, {...expected, sourceSha: 'b'.repeat(40)}, config), /checked code draft/);
    await assert.rejects(checkBundle(folder, expected, {...config, dataset: 'another'}), /different project or dataset/);
    await writeFile(path.join(folder, 'evidence/phone.png'), 'changed');
    await assert.rejects(checkBundle(folder, expected, config), /picture changed/);
    await writeFile(path.join(folder, 'site/index.html'), '<h1>Unverified replacement</h1>');
    await assert.rejects(checkBundle(folder, expected, config), /inventory|static website/);
  } finally {await rm(folder, {recursive: true, force: true});}
});

test('extra archive files are rejected rather than executed or deployed', async () => {
  const folder = await fixture();
  try {
    await writeFile(path.join(folder, 'run-me.sh'), 'do not execute');
    await assert.rejects(checkBundle(folder, expected, config), /unexpected files/);
  } finally {await rm(folder, {recursive: true, force: true});}
});
