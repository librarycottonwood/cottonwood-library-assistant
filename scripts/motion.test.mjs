// Motion stays one system (docs/design-rules.md, "Motion"): only src/scripts/motion.ts imports the library, and every
// data-motion value is one of its presets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const PRESETS = ['rise', 'group', 'settle'];
const MOTION_FILE = 'src/scripts/motion.ts';

async function files(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await files(full));
    else if (/\.(astro|ts|tsx|js|mjs|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}
const sources = await Promise.all((await files('src')).map(async file => ({ file, text: await readFile(file, 'utf8') })));

test('only src/scripts/motion.ts imports an animation library', () => {
  const importers = sources.filter(({ text }) => /from\s+['"](motion|framer-motion|gsap|animejs|aos)(\/[^'"]*)?['"]/.test(text)).map(({ file }) => file);
  assert.deepEqual(importers, [MOTION_FILE]);
});

test('every data-motion value is a preset', () => {
  const used = sources.flatMap(({ file, text }) => [...text.matchAll(/data-motion=(?:"([^"]+)"|\{[^}]*?'([^']+)'[^}]*?\})/g)].map(match => ({ file, value: match[1] ?? match[2] })));
  assert.ok(used.length > 0);
  for (const { file, value } of used) assert.ok(PRESETS.includes(value), `${file}: data-motion="${value}" is not a preset (${PRESETS.join(', ')})`);
});

test('the presets listed here are the ones motion.ts handles', async () => {
  const text = sources.find(({ file }) => file === MOTION_FILE).text;
  for (const name of PRESETS) assert.match(text, new RegExp(`\\b${name}\\b`), `${name} is missing from ${MOTION_FILE}`);
});

test('presets animate only opacity and transform, which the browser runs off the main thread', async () => {
  const text = sources.find(({ file }) => file === MOTION_FILE).text;
  const block = text.slice(text.indexOf('export const presets'), text.indexOf('} as const;', text.indexOf('export const presets')));
  for (const match of block.matchAll(/keyframes:\s*\{([^}]*)\}/g)) {
    for (const key of match[1].matchAll(/(\w+):/g)) assert.ok(['opacity', 'transform'].includes(key[1]), `preset keyframe "${key[1]}" is not opacity or transform (see docs/design-rules.md, "Motion")`);
  }
});
