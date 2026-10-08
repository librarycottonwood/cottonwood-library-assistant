import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { prepare, check, LIMITS } from './images.mjs';

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
    await mkdir(path.join(root, 'library-files/images'), { recursive: true });
    await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).jpeg().withExif({ IFD0: { Make: 'Phone' } }).toFile(path.join(root, 'library-files/images/used.jpg'));
    await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).jpeg().toFile(path.join(root, 'library-files/images/forgotten.jpg'));
    await writeFile(path.join(root, 'src/components/A.astro'), "import p from '../../library-files/images/used.jpg';\n<img src={p.src} alt=\"\" />\n<div style=\"background:url('/x.png')\"></div>");
    const problems = (await check({ root })).join('\n');
    assert.match(problems, /used\.jpg still has hidden photo details/);
    assert.match(problems, /forgotten\.jpg isn't used/);
    assert.match(problems, /<img src=\{x\.src\}>/);
    assert.match(problems, /CSS background/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
