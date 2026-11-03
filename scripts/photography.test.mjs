import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshPhoto } from '../src/content/photography.ts';

test('the old program artwork becomes a local photo with matching description and crop', () => {
  const original = {
    url: 'https://cdn.sanity.io/images/2ou0xy2r/production/420d14d5696a4f17d16d5c0a5c00c491d9964d40-1800x1200.png',
    alt: 'Lamp-lit book illustration', fit: 'contain', width: 1800, height: 1200,
  };
  const updated = refreshPhoto(original);
  assert.equal(updated.key, 'readersSession');
  assert.equal(updated.fit, 'cover');
  assert.match(updated.alt, /participant sharing a book/);
  assert.equal(updated.url, undefined);
  assert.equal(updated.width, undefined);
  assert.equal(updated.height, undefined);
  assert.equal(original.fit, 'contain');
  assert.strictEqual(refreshPhoto(updated), updated);
});

test('new CMS uploads and other projects are never overridden, even with an old local key', () => {
  for (const url of [
    'https://cdn.sanity.io/images/2ou0xy2r/production/new-upload-1800x1200.jpg',
    'https://cdn.sanity.io/images/another/production/420d14d5696a4f17d16d5c0a5c00c491d9964d40-1800x1200.png',
  ]) {
    const image = { url, key: 'mainStreetReaders', alt: 'A new uploaded photo', fit: 'contain' };
    assert.strictEqual(refreshPhoto(image), image);
  }
});

test('artwork, certificates, logos and unrelated images retain their original metadata', () => {
  for (const key of ['watercolor', 'cattleDrivePainting', 'founders', 'foundersPortrait', 'countyCertificate', 'muralOrchard', 'firstFive', 'newsletter']) {
    const image = { key, alt: 'Original artwork', fit: 'contain', caption: 'Existing caption' };
    assert.strictEqual(refreshPhoto(image), image);
  }
});

test('local service aliases use the approved computer photo and retain editorial captions', () => {
  for (const key of ['computerRoom', 'computerLab']) {
    const updated = refreshPhoto({ key, alt: 'Old description', caption: 'Library computers' });
    assert.equal(updated.key, 'computersV2');
    assert.equal(updated.caption, 'Library computers');
    assert.match(updated.alt, /Public computer stations/);
  }
});
