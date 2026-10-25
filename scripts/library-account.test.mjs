import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {LIBRARY_CLOUDFLARE_ACCOUNT_ID, requireLibraryAccount, requireLibraryWorkerConfig} from './library-account.mjs';

const library = {CLOUDFLARE_ACCOUNT_ID: LIBRARY_CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN: 'fixture-library-token'};

test('deploys refuse any account other than the library account', () => {
  assert.equal(requireLibraryAccount(library), LIBRARY_CLOUDFLARE_ACCOUNT_ID);
  // Another (for example personal) account id, a missing id, or a personal wrangler login (no token) are all refused.
  for (const env of [{...library, CLOUDFLARE_ACCOUNT_ID: '0123456789abcdef0123456789abcdef'}, {CLOUDFLARE_API_TOKEN: 'token'}, {CLOUDFLARE_ACCOUNT_ID: LIBRARY_CLOUDFLARE_ACCOUNT_ID}, {}]) {
    assert.throws(() => requireLibraryAccount(env), /Refusing to deploy/);
  }
});

test('worker configuration must also name the library account', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'library-account-'));
  try {
    const good = path.join(root, 'good.jsonc'), bad = path.join(root, 'bad.jsonc');
    await writeFile(good, `{\n  // comment\n  "account_id": "${LIBRARY_CLOUDFLARE_ACCOUNT_ID}"\n}`);
    await writeFile(bad, '{"account_id": "0123456789abcdef0123456789abcdef"}');
    assert.equal(requireLibraryWorkerConfig(good, library), LIBRARY_CLOUDFLARE_ACCOUNT_ID);
    assert.throws(() => requireLibraryWorkerConfig(bad, library), /must name the library/);
    assert.throws(() => requireLibraryWorkerConfig(good, {}), /Refusing to deploy/);
  } finally {await rm(root, {recursive: true, force: true});}
});

test('the real worker configurations name the library account', () => {
  for (const file of ['cms-publisher/wrangler.jsonc', 'connector/wrangler.jsonc']) {
    assert.equal(requireLibraryWorkerConfig(new URL('../' + file, import.meta.url).pathname, library), LIBRARY_CLOUDFLARE_ACCOUNT_ID);
  }
});
