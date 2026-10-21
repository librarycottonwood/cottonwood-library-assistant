import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {prepareRedirect, verifyRedirects, verifyDestination} from './retire-old-demo.mjs';

test('real Pages runtime redirects the old homepage, deep links, status and query strings to the single CMS trial', {timeout: 30000}, async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'library-retire-demo-'));
  const stage = path.join(root, 'site');
  await prepareRedirect(stage);
  const socket = createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
  const cli = new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url).pathname;
  const server = spawn(process.execPath, [cli, 'pages', 'dev', stage, '--ip', '127.0.0.1', '--port', String(port),
    '--persist-to', path.join(root, 'state'), '--show-interactive-dev-session=false', '--log-level', 'error'], {
    cwd: root, env: {PATH: process.env.PATH, HOME: process.env.HOME, WRANGLER_SEND_METRICS: 'false', CI: 'true'}, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = ''; server.stdout.on('data', bytes => {logs += bytes;}); server.stderr.on('data', bytes => {logs += bytes;});
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw Error('Pages runtime stopped: ' + logs.slice(-1000));
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`, {redirect: 'manual', signal: AbortSignal.timeout(500)});
        await response.body?.cancel(); ready = true; break;
      } catch {await new Promise(resolve => setTimeout(resolve, 100));}
    }
    assert.ok(ready, 'Pages runtime did not become ready: ' + logs.slice(-1000));
    const checks = await verifyRedirects({origin: `http://127.0.0.1:${port}`});
    assert.equal(checks.length, 5);
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      const exited = once(server, 'exit'); server.kill('SIGTERM'); await exited;
    }
    await rm(root, {recursive: true, force: true});
  }
});

test('retirement requires an independently verified CMS release and does not send status credentials to another origin', async () => {
  const env = {CMS_PUBLISHER_ORIGIN: 'https://cottonwood-library-cms-publisher.librarycottonwood.workers.dev', CMS_STATUS_TOKEN: 'local-fixture-status-token-32-characters'};
  const last = {websiteUrl: 'https://cms-trial.cottonwood-library-trial-preview.pages.dev', sourceSha: 'a'.repeat(40),
    contentDigest: 'b'.repeat(64), releaseDigest: 'c'.repeat(64), operationId: '11111111-1111-4111-8111-111111111111'};
  const status = {sourceSha: last.sourceSha, contentDigest: last.contentDigest, digest: last.releaseDigest, operationId: last.operationId};
  let requests = 0, verified = true, correct = true;
  const fetcher = async value => {
    requests++;
    if (String(value).endsWith('/monitor')) return Response.json({lastVerified: verified ? last : null});
    if (String(value).endsWith('/status.json')) return Response.json({...status, digest: correct ? status.digest : 'd'.repeat(64)});
    return new Response('<h1>CMS trial fixture</h1>', {headers: {'content-type': 'text/html'}});
  };
  await assert.rejects(verifyDestination({...env, CMS_PUBLISHER_ORIGIN: 'https://another.example'}, {fetcher}), /private CMS status/);
  assert.equal(requests, 0);
  assert.deepEqual(await verifyDestination(env, {fetcher}), status);
  correct = false;
  await assert.rejects(verifyDestination(env, {fetcher}), /differs from its approved/);
  verified = false;
  await assert.rejects(verifyDestination(env, {fetcher}), /verified approved CMS trial/);
});
