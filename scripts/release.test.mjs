import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const script = new URL('./release.mjs', import.meta.url).pathname;
test('reviewed assets cannot be substituted and the helper cannot publish production', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'library-release-'));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8' });
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
    const preview = run('preview', digest);
    assert.notEqual(preview.status, 0);
    assert.match(preview.stderr, /Local preview uploads are retired/);
    assert.notEqual(run('verify', '../escape').status, 0);
    await writeFile(saved, '<h1>Unreviewed substitution</h1>');
    const tampered = run('verify', digest);
    assert.notEqual(tampered.status, 0);
    assert.match(tampered.stderr, /Saved version changed/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('hosted pictures belong to the checked release and never replace its assets', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'library-pictures-'));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8' });
  const review = digest => spawnSync(process.execPath, ['--input-type=module', '-e', `const {prepareReview}=await import(${JSON.stringify(script)}); console.log(await prepareReview(${JSON.stringify(digest)}));`], { cwd: dir, encoding: 'utf8' });
  try {
    await mkdir(path.join(dir, 'dist'));
    await writeFile(path.join(dir, 'dist/index.html'), '<h1>The checked site</h1>');
    const digest = run('prepare').stdout.trim();
    assert.notEqual(review(digest).status, 0, 'missing pictures must block delivery');
    const pictures = path.join(dir, 'output/playwright', digest);
    await mkdir(pictures, { recursive: true });
    const png = Buffer.from([137,80,78,71,13,10,26,10]);
    const hash = createHash('sha256').update(png).digest('hex');
    for (const name of ['desktop', 'phone']) await writeFile(path.join(pictures, name + '.png'), png);
    const pageFile='desktop-0123456789abcdef.png';
    await writeFile(path.join(pictures,pageFile),png);
    const evidence = { digest, pictures: { desktop: hash, phone: hash }, errors: [], evidence: ['desktop', 'phone'].map(name => ({ name, route: '/', ...(name==='desktop'?{picture:{file:pageFile,sha256:hash}}:{}) })) };
    await writeFile(path.join(pictures, 'evidence.json'), JSON.stringify(evidence));
    const staged = review(digest);
    assert.equal(staged.status, 0, staged.stderr);
    const stage = staged.stdout.trim();
    assert.equal(await readFile(path.join(stage, 'index.html'), 'utf8'), '<h1>The checked site</h1>');
    assert.match(await readFile(path.join(stage, '_review/index.html'), 'utf8'), /desktop.png/);
    assert.equal(JSON.parse(await readFile(path.join(stage, '_review/manifest.json'))).siteDigest, digest);
    assert.deepEqual(await readFile(path.join(stage,'_review',pageFile)),png);
    await writeFile(path.join(pictures,pageFile),Buffer.concat([png,Buffer.from('changed')]));
    assert.match(review(digest).stderr,/Checked page picture changed/);
    await writeFile(path.join(pictures,pageFile),png);
    assert.equal(run('verify', digest).status, 0, 'original saved release stays intact');
    await writeFile(path.join(pictures, 'phone.png'), Buffer.concat([png, Buffer.from('changed')]));
    assert.match(review(digest).stderr, /Review pictures changed/);
    evidence.digest = '0'.repeat(64);
    await writeFile(path.join(pictures, 'evidence.json'), JSON.stringify(evidence));
    assert.match(review(digest).stderr, /Capture and check/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
