import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { prepare, check, pruneUnusedBuiltImages, LIMITS } from './images.mjs';

test('prepare removes location data, caps size, and picks the right format', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'library-images-'));
  try {
    const noisy = Buffer.alloc(2600 * 200 * 3); for (let i = 0; i < noisy.length; i++) noisy[i] = (i * 2654435761) >>> 24;
    const photo = path.join(dir, 'Phone Photo.JPG');
    await sharp(noisy, { raw: { width: 2600, height: 200, channels: 3 } }).jpeg().withExif({ IFD0: { Make: 'Phone' }, GPS: { GPSLatitudeRef: 'N' } }).toFile(photo);
    assert.ok((await sharp(photo).metadata()).exif, 'fixture has EXIF');
    const out = await prepare(photo, { outDir: dir });
    const meta = await sharp(out).metadata();
    assert.equal(path.basename(out), 'phone-photo.jpg');
    assert.equal(meta.exif, undefined);
    assert.ok(Math.max(meta.width, meta.height) <= LIMITS.maxEdge);
    const shot = path.join(dir, 'screenshot.png');
    await sharp({ create: { width: 800, height: 600, channels: 3, background: '#ffffff' } }).png().toFile(shot);
    assert.match(await prepare(shot, { outDir: dir, name: 'Event Poster' }), /event-poster\.png$/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('check blocks raw pictures, oversized files and unused uploads', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'library-site-'));
  try {
    await mkdir(path.join(root, 'src/components'), { recursive: true });
    await mkdir(path.join(root, 'src/assets/images'), { recursive: true });
    await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).jpeg().withExif({ IFD0: { Make: 'Phone' } }).toFile(path.join(root, 'src/assets/images/used.jpg'));
    await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).jpeg().toFile(path.join(root, 'src/assets/images/forgotten.jpg'));
    await writeFile(path.join(root, 'src/components/A.astro'), "import p from '../assets/images/used.jpg';\n<img src={p.src} alt=\"\" />\n<div style=\"background:url('/x.png')\"></div>");
    const problems = (await check({ root })).join('\n');
    assert.match(problems, /used\.jpg still has hidden photo details/);
    assert.match(problems, /forgotten\.jpg isn't used/);
    assert.match(problems, /<img src=\{x\.src\}>/);
    assert.match(problems, /CSS background/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('lossless screenshots preserve pixels and transparency while removing metadata', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'library-screenshot-'));
  try {
    const pixels = Buffer.alloc(96 * 64 * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = (i / 4) % 256;
      pixels[i + 1] = (i / 16) % 256;
      pixels[i + 2] = 245;
      pixels[i + 3] = i < 384 ? 0 : 255;
    }
    const input = path.join(dir, 'original.png');
    await sharp(pixels, { raw: { width: 96, height: 64, channels: 4 } }).png().withExif({ IFD0: { Make: 'Screenshot' } }).toFile(input);
    const originalPixels = await sharp(input).raw().toBuffer();
    const out = await prepare(input, { outDir: dir, name: 'prepared', lossless: true });
    assert.deepEqual(await sharp(out).raw().toBuffer(), originalPixels);
    assert.equal((await sharp(out).metadata()).exif, undefined);
    assert.equal((await sharp(out).metadata()).isPalette, false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('CMS replacement removes only unused emitted originals and still blocks oversized referenced pictures', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'library-cms-images-'));
  try {
    for (const dir of ['src/assets/images', 'dist/_astro', 'src']) await mkdir(path.join(root, dir), {recursive: true});
    const photo = await sharp({create: {width: 20, height: 20, channels: 3, background: '#fff'}}).png().toBuffer();
    for (const name of ['replaced.png', 'html.png', 'css.png', 'script.png']) await writeFile(path.join(root, 'src/assets/images', name), photo);
    await writeFile(path.join(root, 'src/registry.ts'), 'replaced.png html.png css.png script.png');
    for (const name of ['replaced.HASH.png', 'html.HASH.png', 'css.HASH.png', 'script.HASH.png', 'remote.HASH.png']) {
      await writeFile(path.join(root, 'dist/_astro', name), Buffer.alloc(LIMITS.servedBytes + 1));
    }
    await writeFile(path.join(root, 'dist/index.html'), '<img srcset="/_astro/html.HASH.png 800w">');
    await writeFile(path.join(root, 'dist/_astro/style.css'), '.cover {background: url(css.HASH.png)}');
    await writeFile(path.join(root, 'dist/_astro/script.js'), 'const image = "script.HASH.png";');
    assert.deepEqual(await pruneUnusedBuiltImages({root}), ['_astro/replaced.HASH.png']);
    assert.deepEqual(await readFile(path.join(root, 'src/assets/images/replaced.png')), photo);
    for (const name of ['html.HASH.png', 'css.HASH.png', 'script.HASH.png', 'remote.HASH.png']) {
      assert.equal((await stat(path.join(root, 'dist/_astro', name))).size, LIMITS.servedBytes + 1);
      assert.ok((await check({root, dist: 'dist'})).some(problem => problem.includes(name)));
    }
  } finally {await rm(root, {recursive: true, force: true});}
});
