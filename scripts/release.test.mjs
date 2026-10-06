import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const script = new URL('./release.mjs', import.meta.url).pathname;
test('reviewed assets cannot be substituted and the helper cannot publish production', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'library-release-'));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env, CLOUDFLARE_PREVIEW_PROJECT: '' } });
  try {
    await mkdir(path.join(dir, 'dist'));
    await writeFile(path.join(dir, 'dist/index.html'), '<h1>Original preview</h1>');
    const prepared = run('prepare');
    assert.equal(prepared.status, 0, prepared.stderr);
    const digest = prepared.stdout.trim();
    assert.match(digest, /^[a-f0-9]{64}$/);
    assert.equal(run('verify', '--', digest).status, 0);
    // Editing the working build must not alter the stored preview.
    await writeFile(path.join(dir, 'dist/index.html'), '<h1>Later edit</h1>');
    const saved = path.join(dir, 'output/releases', digest, 'site/index.html');
    assert.equal(await readFile(saved, 'utf8'), '<h1>Original preview</h1>');
    assert.equal(run('verify', digest).status, 0);
    assert.notEqual(run('publish', digest).status, 0);
    assert.notEqual(run('preview', digest).status, 0);
    assert.notEqual(run('verify', '../escape').status, 0);
    await writeFile(saved, '<h1>Unreviewed substitution</h1>');
    const tampered = run('verify', digest);
    assert.notEqual(tampered.status, 0);
    assert.match(tampered.stderr, /Saved version changed/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
