// Volunteers get links from the assistant, so its instructions must never send them to an old page address.
// Today's demo hit exactly this: the news instructions still said /librarynews/ after the site moved to /news/.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';

async function files(dir) {
  const found = [];
  for (const entry of await readdir(dir, {withFileTypes: true}).catch(() => [])) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await files(file));
    else if (/\.md$/.test(entry.name)) found.push(file);
  }
  return found;
}

test('assistant instructions never point at retired page addresses', async () => {
  const config = await readFile('astro.config.mjs', 'utf8');
  const redirects = [...config.matchAll(/^\s*'(\/[^']+)':\s*'\//gm)].map(match => match[1]);
  assert.ok(redirects.includes('/librarynews'), 'reads the old-site redirects from astro.config.mjs');
  // Old addresses of this site's own pages (programs moved under Events & News).
  const retired = [...redirects, '/services/story-time', '/services/main-street-readers', '/services/book-club'];
  const pattern = new RegExp(`(?<![\\w.-])(${retired.map(item => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?=[/\`'")\\s<]|$)`);
  const instructions = [...await files('assistant'), ...await files('plugins'), ...await files('docs'), 'AGENTS.md', 'README.md'];
  const stale = [];
  for (const file of instructions) {
    const text = await readFile(file, 'utf8').catch(() => '');
    text.split('\n').forEach((line, index) => { const hit = line.match(pattern); if (hit) stale.push(`${file}:${index + 1} ${hit[1]}`); });
  }
  assert.deepEqual(stale, [], 'Use the current address (see src/pages): news is /news/<slug>/, programs are /events/regular/<id>/, the newsletter is /newsletter/.');
});
