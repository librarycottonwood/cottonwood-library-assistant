import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {Miniflare} from 'miniflare';
import {readFileSync} from 'node:fs';
import {encodeSignatureHeader} from '@sanity/webhook';
import {revisionVector} from '../src/contract.mjs';
import {launchBrowser} from '../../scripts/browser.mjs';

// These run actual Worker + SQLite Durable Object HTTP handlers locally. All
// outbound providers are explicit stubs: no Sanity/GitHub account or deployment.
execFileSync('npx', ['--no-install', 'wrangler', 'deploy', '--dry-run', '--outdir', 'dist'], {
  stdio: 'pipe', env: {...process.env, WRANGLER_SEND_METRICS: 'false'},
});
const origin = 'https://cms-publisher.example.workers.dev';
const source = 'a'.repeat(40), content = 'b'.repeat(64), release = 'c'.repeat(64);
const preview = 'https://1234abcd.cottonwood-library-trial-preview.pages.dev/';
const website = 'https://cms-trial.cottonwood-library-trial-preview.pages.dev';
const secrets = {
  SANITY_WEBHOOK_SECRET: 'webhook-local-fixture-secret-'.repeat(2),
  GITHUB_DISPATCH_TOKEN: 'github-local-fixture-dispatch-token',
  CMS_WORKFLOW_TOKEN: 'callback-local-fixture-secret-'.repeat(2),
  CMS_STATUS_TOKEN: 'status-local-fixture-secret-'.repeat(2),
  REVIEW_GITHUB_CLIENT_ID: 'local-fixture-oauth-app',
  REVIEW_GITHUB_CLIENT_SECRET: 'github-local-fixture-oauth-secret',
  REVIEW_SESSION_SECRET: 'session-local-fixture-secret-'.repeat(2),
};
const event = {projectId: 'fixture1', dataset: 'rehearsal', documentId: 'event.sale', documentType: 'event', documentRevision: 'rev1', operation: 'update'};

function fixture(overrides = {}) {
  const external = {requests: [], dispatches: [], revision: 'rev1', source, identity: {login: 'librarycottonwood', id: 338888442}, hosted: null, dispatchThrows: false,
    documentFails: false, tree:'d'.repeat(40), omitted: null, inventory: [{_id: event.documentId, _type: 'event', _rev: 'rev1'}, {_id: 'library-settings', _type: 'siteSettings', _rev: 'settings1'}]};
  const outboundService = async request => {
      const url = new URL(request.url);
      external.requests.push({url: request.url, method: request.method});
      if (url.hostname === 'fixture1.api.sanity.io' && url.pathname.startsWith('/v2026-10-01/data/doc/')) {
        if (external.documentFails) return new Response('Explicit local content outage', {status: 503});
        const id = decodeURIComponent(url.pathname.split('/').at(-1));
        const document = id === event.documentId ? (external.revision === null ? null : {_id: id, _rev: external.revision}) : external.inventory.find(item => item._id === id);
        return Response.json({documents: document ? [document] : [], ...(external.omitted ? {omitted: external.omitted} : {})});
      }
      if (url.hostname === 'fixture1.api.sanity.io' && url.pathname.startsWith('/v2026-10-01/data/query/')) return Response.json({result: external.inventory});
      if (url.hostname === 'api.github.com' && url.pathname.includes('/git/commits/')) return Response.json({tree:{sha:external.tree}});
      if (url.hostname === 'api.github.com' && url.pathname.endsWith('/git/ref/heads/main')) return Response.json({object: {sha: external.source, type: 'commit'}});
      if (url.hostname === 'api.github.com' && url.pathname.endsWith('/actions/workflows/cms.yml/dispatches')) {
        const body = await request.json();
        external.dispatches.push(body);
        if (external.dispatchThrows) return new Response('Uncertain fixture delivery', {status: 503});
        return new Response(null, {status: 204});
      }
      if (url.href === 'https://github.com/login/oauth/access_token') {
        external.oauthRequest = new URLSearchParams(await request.text());
        return Response.json({access_token: 'fixture-identity-token-discard-after-use'});
      }
      if (url.href === 'https://api.github.com/user') return Response.json(external.identity);
      if (url.href === website + '/_review/status.json') return Response.json(external.hosted || {});
      throw new Error(`Unexpected local provider stub request: ${request.url}`);
  };
  const bindings = {PUBLIC_ORIGIN: origin, SANITY_PROJECT_ID: 'fixture1', SANITY_DATASET: 'rehearsal', ...secrets, ...overrides};
  const mf = new Miniflare({
    telemetry: {enabled: false},
    workers: [{
      config: {
        name: 'cms-publisher-test', compatibilityDate: '2026-10-06',
        compatibilityFlags: ['global_fetch_strictly_public'],
        manifest: {mainModule: 'index.js', modulesRoot: process.cwd(), modules: {
          'index.js': {type: 'esm', contents: readFileSync('dist/index.js', 'utf8')},
        }},
        env: {...Object.fromEntries(Object.entries(bindings).map(([name, value]) => [name, {type: 'text', value}])),
          CMS_LEDGER: {type: 'durable-object', worker: 'cms-publisher-test', exportName: 'CmsLedger'}},
        exports: {CmsLedger: {type: 'durable-object', storage: 'sqlite'}},
      },
      dev: {rootPath: process.cwd(), outboundService: {type: 'fetcher', handler: outboundService}},
    }],
  });
  const request = (path, init) => mf.dispatchFetch(origin + path, init);
  const status = id => request('/operations/' + id, {headers: {Authorization: `Bearer ${secrets.CMS_STATUS_TOKEN}`}});
  const result = (id, body, token = secrets.CMS_WORKFLOW_TOKEN) => request('/operations/' + id + '/result', {
    method: 'POST', headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'}, body: JSON.stringify(body),
  });
  async function webhook(value = event, options = {}) {
    const raw = JSON.stringify(value);
    const signature = await encodeSignatureHeader(raw, options.timestamp || Date.now(), secrets.SANITY_WEBHOOK_SECRET);
    return request('/webhooks/sanity', {method: 'POST', headers: {'sanity-webhook-signature': signature}, body: options.tamper ? raw + ' ' : raw});
  }
  async function queued() {
    const response = await webhook(); assert.equal(response.status, 202, await response.clone().text());
    assert.ok(external.dispatches[0], JSON.stringify({body: await response.clone().json(), requests: external.requests}));
    return external.dispatches[0].inputs.operation_id;
  }
  const previewResult = (overrides = {}) => ({stage: 'preview_ready', sourceSha: source, documentRevision: 'rev1', contentDigest: content,
    revisionDigest: createHash('sha256').update(JSON.stringify(revisionVector(external.inventory))).digest('hex'),
    releaseDigest: release, previewRunId: '123456', previewUrl: preview, ...overrides});
  async function previewReady() {
    const id = await queued();
    const response = await result(id, previewResult()); assert.equal(response.status, 200, await response.clone().text());
    return id;
  }
  async function login(id, {stateCookie = true} = {}) {
    const start = await request(`/review/${id}/sign-in`, {redirect: 'manual'});
    assert.equal(start.status, 303);
    const next = new URL(start.headers.get('Location'));
    assert.equal(next.origin, 'https://github.com'); assert.equal(next.searchParams.get('scope'), null);
    assert.equal(next.searchParams.get('code_challenge_method'), 'S256');
    const state = next.searchParams.get('state');
    const oauthCookie = start.headers.get('Set-Cookie').split(';')[0];
    const callback = await request(`/review/callback?code=fixture-code&state=${state}`, {
      redirect: 'manual', headers: stateCookie ? {Cookie: oauthCookie} : {},
    });
    const sessionCookie = callback.headers.get('Set-Cookie')?.match(/__Host-cms_review=[^;, ]+/)?.[0] || '';
    return {callback, cookie: sessionCookie, state, oauthCookie};
  }
  async function form(id, sessionCookie) {
    const response = await request(`/review/${id}`, {headers: {Cookie: sessionCookie}});
    assert.equal(response.status, 200);
    const body = await response.text();
    const values = Object.fromEntries([...body.matchAll(/name="([^"]+)" value="([^"]*)"/g)].map(match => [match[1], match[2]]));
    assert.ok(values.csrf); return values;
  }
  function approve(id, sessionCookie, values, headers = {}) {
    return request(`/review/${id}/approve`, {
      method: 'POST', redirect: 'manual',
      headers: {Cookie: sessionCookie, Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded', ...headers},
      body: new URLSearchParams(values).toString(),
    });
  }
  async function approved() {
    const id = await previewReady();
    const session = await login(id); assert.equal(session.callback.status, 303);
    const values = await form(id, session.cookie);
    const response = await approve(id, session.cookie, values); assert.equal(response.status, 303, await response.clone().text());
    return {id, session, values};
  }
  return {mf, external, request, status, result, webhook, queued, previewResult, previewReady, login, form, approve, approved};
}

test('browser forms: native approval and refresh preserve their same-origin request identity', {timeout: 60000}, async () => {
  const browser = await launchBrowser({args: ['--host-resolver-rules=MAP * ~NOTFOUND']});
  try {
    for (const action of ['approve', 'refresh']) {
      const f = fixture();
      const context = await browser.newContext({serviceWorkers: 'block'});
      try {
        const id = action === 'refresh' ? await f.queued() : await f.previewReady();
        if (action === 'refresh') assert.equal((await f.result(id, {stage: 'build_failed', sourceSha: source, documentRevision: 'rev1'})).status, 200);
        const session = await f.login(id);
        await context.addCookies([{name: '__Host-cms_review', value: session.cookie.slice('__Host-cms_review='.length),
          domain: new URL(origin).hostname, path: '/', secure: true, httpOnly: true, sameSite: 'Lax'}]);
        const received = [];
        await context.route('**/*', async route => {
          const request = route.request();
          if (new URL(request.url()).origin !== origin) return route.abort();
          const headers = await request.allHeaders();
          if (request.method() === 'POST') received.push({origin: headers.origin, path: new URL(request.url()).pathname});
          const response = await f.mf.dispatchFetch(request.url(), {method: request.method(), headers,
            ...(request.postDataBuffer() ? {body: request.postDataBuffer()} : {}), redirect: 'manual'});
          await route.fulfill({status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer())});
        });
        const page = await context.newPage();
        await page.goto(`${origin}/review/${id}`);
        for (const viewport of [{width: 1440, height: 1000}, {width: 390, height: 844}]) {
          await page.setViewportSize(viewport);
          assert.equal(await page.locator('img').count(), 0);
          if (action === 'approve') assert.equal(await page.getByRole('link', {name: 'Open website preview'}).getAttribute('href'), preview);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
          const visible = await page.locator('body').innerText();
          assert.ok(!visible.includes(event.documentId)); assert.ok(!visible.includes(release));
          assert.equal(await page.locator('details').count(), action === 'refresh' ? 1 : 0);
        }
        const response = page.waitForResponse(value => value.request().method() === 'POST' && value.url().endsWith(`/${action}`));
        if (action === 'refresh') await page.getByText('Need a new preview?', {exact: true}).click();
        await page.getByRole('button', {name: action === 'approve' ? 'Save to the trial website' : 'Prepare a fresh preview', exact: true}).click();
        const submitted = await response;
        assert.deepEqual(received, [{origin, path: `/review/${id}/${action}`}]);
        assert.equal(submitted.status(), 303);
        assert.equal(f.external.dispatches.length, 2);
        assert.equal(f.external.dispatches[1].inputs.mode, action === 'approve' ? 'publish' : 'preview');
      } finally {await context.close(); await f.mf.dispose();}
    }
  } finally {await browser.close();}
});

test('local runtime: unconfigured service fails closed before contacting a provider', async () => {
  const f = fixture({SANITY_PROJECT_ID: '', REVIEW_GITHUB_CLIENT_ID: ''});
  try {
    const health = await f.request('/health'); assert.equal(health.status, 200); assert.equal((await health.json()).status, 'setup_pending');
    const hook = await f.webhook(); assert.equal(hook.status, 503); assert.equal((await hook.json()).status, 'setup_pending');
    const review = await f.request('/review/11111111-1111-4111-8111-111111111111');
    assert.equal(review.status, 503); assert.match(review.headers.get('Content-Type'), /text\/html/);
    const page = await review.text(); assert.match(page, /Return to your library assistant/); assert.ok(!page.includes('setup_pending'));
    assert.equal(f.external.requests.length, 0);
  } finally {await f.mf.dispose();}
});

test('local runtime: raw-body tampering, expired signatures, and drafts cannot dispatch a build', async () => {
  const f = fixture();
  try {
    assert.equal((await f.webhook(event, {tamper: true})).status, 401);
    assert.equal((await f.webhook(event, {timestamp: Date.now() - 700000})).status, 401);
    assert.equal((await f.webhook({...event, documentId: 'drafts.event.sale'})).status, 400);
    assert.equal((await f.webhook({...event, projectId: 'foreign1'})).status, 400);
    assert.equal(f.external.dispatches.length, 0); assert.equal(f.external.requests.length, 0);
  } finally {await f.mf.dispose();}
});

test('local runtime: simultaneous duplicate deliveries produce one pinned preview job and keep status private', async () => {
  const f = fixture();
  try {
    const responses = await Promise.all([f.webhook(), f.webhook(), f.webhook({...event})]);
    assert.deepEqual(responses.map(response => response.status).sort(), [200, 200, 202]);
    for (const response of responses) assert.equal((await response.json()).id, undefined);
    assert.equal(f.external.dispatches.length, 1);
    const dispatched = f.external.dispatches[0];
    assert.equal(dispatched.ref, 'main'); assert.equal(dispatched.inputs.mode, 'preview'); assert.equal(dispatched.inputs.source_sha, source);
    assert.equal(dispatched.inputs.document_revision, 'rev1');
    const id = dispatched.inputs.operation_id;
    assert.equal(dispatched.inputs.callback_url, `${origin}/operations/${id}/result`);
    assert.equal((await f.request(`/operations/${id}`)).status, 401);
    assert.equal((await f.request(`/operations/${id}`, {headers: {Authorization: `Bearer ${secrets.CMS_WORKFLOW_TOKEN}`}})).status, 401);
    const stored = await (await f.status(id)).json(); assert.equal(stored.status, 'preview_queued'); assert.equal(stored.deployedVerified, false);
  } finally {await f.mf.dispose();}
});

test('local runtime: ambiguous dispatch is recorded once and a retry never starts another job', async () => {
  const f = fixture();
  try {
    f.external.dispatchThrows = true;
    const first = await f.webhook(); assert.equal(first.status, 202); assert.equal((await first.json()).status, 'preview_dispatch_uncertain');
    await f.webhook(); assert.equal(f.external.dispatches.length, 1);
    const id = f.external.dispatches[0].inputs.operation_id;
    assert.equal((await f.result(id, f.previewResult())).status, 200);
    assert.equal((await (await f.status(id)).json()).status, 'review_required');
  } finally {await f.mf.dispose();}
});

test('local runtime: stale revisions and unpublish deliveries validate the actual published document', async () => {
  const f = fixture();
  try {
    f.external.revision = 'newer-revision';
    assert.equal((await (await f.webhook()).json()).status, 'superseded'); assert.equal(f.external.dispatches.length, 0);
    f.external.revision = null;
    const deletion = await f.webhook({...event, documentRevision: 'newer-revision', operation: 'delete'});
    assert.equal(deletion.status, 202); assert.equal(f.external.dispatches.length, 1);
  } finally {await f.mf.dispose();}
});

test('local runtime: callbacks reject wrong source, revision and preview origin; hashes bind once', async () => {
  const f = fixture();
  try {
    const id = await f.queued();
    assert.equal((await f.result(id, f.previewResult(), secrets.CMS_STATUS_TOKEN)).status, 401);
    assert.equal((await f.result(id, f.previewResult({sourceSha: 'd'.repeat(40)}))).status, 409);
    assert.equal((await f.result(id, f.previewResult({documentRevision: 'rev2'}))).status, 409);
    assert.equal((await f.result(id, f.previewResult({previewUrl: 'https://example.com/'}))).status, 409);
    const good = f.previewResult(); assert.equal((await f.result(id, good)).status, 200);
    assert.equal((await f.result(id, good)).status, 200);
    assert.equal((await f.result(id, f.previewResult({contentDigest: 'e'.repeat(64)}))).status, 409);
    assert.equal((await f.result(id, f.previewResult({revisionDigest: 'f'.repeat(64)}))).status, 409);
    const status = await (await f.status(id)).json(); assert.equal(status.contentDigest, content); assert.equal(status.releaseDigest, release); assert.equal(status.deployedVerified, false);
  } finally {await f.mf.dispose();}
});

test('local runtime: preview cannot become ready after its document revision changed', async () => {
  const f = fixture();
  try {
    const id = await f.queued(); f.external.revision = 'rev2';
    assert.equal((await f.result(id, f.previewResult())).status, 409);
    assert.equal((await (await f.status(id)).json()).status, 'superseded');
  } finally {await f.mf.dispose();}
});

test('local runtime: missing review account configuration blocks approval without granting service tokens browser authority', async () => {
  const f = fixture({REVIEW_GITHUB_CLIENT_ID: ''});
  try {
    const id = await f.previewReady();
    assert.equal((await f.request(`/review/${id}`)).status, 503);
    assert.equal((await f.request(`/review/${id}/approve`, {method: 'POST', headers: {Authorization: `Bearer ${secrets.CMS_WORKFLOW_TOKEN}`}})).status, 503);
    assert.equal(f.external.dispatches.length, 1);
  } finally {await f.mf.dispose();}
});

test('local runtime: OAuth requires cookie-bound one-time state and the exact library identity', async () => {
  const f = fixture();
  try {
    const id = await f.previewReady();
    const forged = await f.login(id, {stateCookie: false}); assert.equal(forged.callback.status, 403);
    assert.equal(f.external.oauthRequest, undefined);
    f.external.identity = {login: 'somebody-else', id: 123};
    const wrong = await f.login(id); assert.equal(wrong.callback.status, 403); assert.equal(wrong.cookie, '');
    const replay = await f.request(`/review/callback?code=fixture-code&state=${wrong.state}`, {headers: {Cookie: wrong.oauthCookie}}); assert.equal(replay.status, 403);
    f.external.identity = {login: 'librarycottonwood', id: 338888442};
    const good = await f.login(id); assert.equal(good.callback.status, 303); assert.ok(good.cookie);
    assert.ok(f.external.oauthRequest.get('code_verifier')); assert.equal(f.external.oauthRequest.get('redirect_uri'), origin + '/review/callback');
    assert.match(good.callback.headers.get('Set-Cookie'), /Secure; HttpOnly; SameSite=Lax/);
    const page = await f.request(`/review/${id}`, {headers: {Cookie: good.cookie}}); const html = await page.text();
    assert.match(html, /Save to the trial website/); assert.ok(!html.includes('fixture-identity-token')); assert.match(page.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  } finally {await f.mf.dispose();}
});

test('local runtime: browser approval enforces session, origin, CSRF, exact hashes, and one publish dispatch', async () => {
  const f = fixture();
  try {
    const id = await f.previewReady();
    const authBefore = await f.request(`/operations/${id}/authorization`, {headers: {Authorization: `Bearer ${secrets.CMS_WORKFLOW_TOKEN}`}}); assert.equal(authBefore.status, 409);
    const session = await f.login(id); const values = await f.form(id, session.cookie);
    const expired = await f.approve(id, '', values);
    assert.equal(expired.status, 401); assert.match(expired.headers.get('Content-Type'), /text\/html/);
    assert.match(await expired.text(), /Sign in to review your update/);
    // The last base64url character can differ only in ignored padding bits.
    // Change the first signature character so the decoded HMAC always changes.
    const signatureAt = session.cookie.lastIndexOf('.') + 1;
    const forgedCookie = session.cookie.slice(0, signatureAt) + (session.cookie[signatureAt] === 'a' ? 'b' : 'a') + session.cookie.slice(signatureAt + 1);
    assert.equal((await f.approve(id, forgedCookie, values)).status, 401);
    assert.equal((await f.approve(id, session.cookie, values, {Origin: 'https://attacker.example'})).status, 403);
    assert.equal((await f.approve(id, session.cookie, {...values, csrf: 'forged'})).status, 403);
    assert.equal((await f.approve(id, session.cookie, {...values, releaseDigest: 'e'.repeat(64)})).status, 409);
    const [first, second] = await Promise.all([f.approve(id, session.cookie, values), f.approve(id, session.cookie, values)]);
    assert.equal(first.status, 303); assert.equal(second.status, 303); assert.equal(f.external.dispatches.length, 2);
    const publish = f.external.dispatches[1].inputs;
    assert.equal(publish.mode, 'publish'); assert.equal(publish.content_digest, content); assert.equal(publish.release_digest, release); assert.equal(publish.preview_run_id, '123456');
    const authAfter = await f.request(`/operations/${id}/authorization`, {headers: {Authorization: `Bearer ${secrets.CMS_WORKFLOW_TOKEN}`}});
    assert.equal(authAfter.status, 200); const receipt = await authAfter.json(); assert.equal(receipt.approved, true); assert.equal(receipt.publicationScope, 'cms-trial-only'); assert.equal(receipt.releaseDigest, release);
  } finally {await f.mf.dispose();}
});

test('local runtime: a rejected review form returns a friendly page without publishing', async () => {
  const f = fixture();
  try {
    const id = await f.previewReady(); const session = await f.login(id);
    const response = await f.request(`/review/${id}/approve`, {method: 'POST', headers: {
      Cookie: session.cookie, Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded',
    }, body: 'x'.repeat(5000)});
    assert.equal(response.status, 503); assert.match(response.headers.get('Content-Type'), /text\/html/);
    const body = await response.text(); assert.match(body, /Return to your library assistant/);
    assert.ok(!body.includes('check_unavailable')); assert.equal(f.external.dispatches.length, 1);
  } finally {await f.mf.dispose();}
});

test('local runtime: content or code changes invalidate approval and authorization', async () => {
  const f = fixture();
  try {
    const id = await f.previewReady(); const session = await f.login(id); const values = await f.form(id, session.cookie);
    f.external.source = 'd'.repeat(40);
    assert.equal((await f.approve(id, session.cookie, values)).status, 409); assert.equal(f.external.dispatches.length, 1);
    assert.equal((await (await f.status(id)).json()).status, 'superseded');
  } finally {await f.mf.dispose();}
  const second = fixture();
  try {
    const {id} = await second.approved(); second.external.revision = 'rev2';
    assert.equal((await second.request(`/operations/${id}/authorization`, {headers: {Authorization: `Bearer ${secrets.CMS_WORKFLOW_TOKEN}`}})).status, 409);
  } finally {await second.mf.dispose();}
});

test('local runtime: deployed_verified requires human approval and independent hosted digest verification', async () => {
  const f = fixture();
  try {
    const id = await f.previewReady();
    const callback = {...f.previewResult(), stage: 'deployed_verified', websiteUrl: website};
    assert.equal((await f.result(id, callback)).status, 409);
    const session = await f.login(id); const values = await f.form(id, session.cookie); await f.approve(id, session.cookie, values);
    f.external.hosted = {operationId: id, sourceSha: source, contentDigest: content, digest: 'e'.repeat(64)};
    assert.equal((await f.result(id, callback)).status, 503);
    assert.equal((await (await f.status(id)).json()).deployedVerified, false);
    f.external.hosted.digest = release;
    // A newer CMS edit arriving during upload must not erase the actual verified
    // approved deployment receipt. That newer edit needs its own preview.
    f.external.revision = 'rev2';
    const verified = await f.result(id, callback); assert.equal(verified.status, 200, await verified.clone().text()); assert.equal((await verified.json()).deployedVerified, true);
    assert.equal((await f.result(id, callback)).status, 200);
    assert.equal((await f.result(id, {...callback, stage: 'deploy_failed'})).status, 409);
    const monitor = await f.request('/monitor', {method: 'POST', headers: {Authorization: `Bearer ${secrets.CMS_STATUS_TOKEN}`}});
    const record = await monitor.json(); assert.equal(record.lastVerified.releaseDigest, release); assert.equal(record.lastVerified.operationId, id);
  } finally {await f.mf.dispose();}
});

test('local runtime: reconciliation catches a missed webhook, coalesces revisions and code changes, and never fans out identical daily scans', async () => {
  const f = fixture();
  const reconcile = () => f.request('/reconcile', {method: 'POST', headers: {Authorization: `Bearer ${secrets.CMS_STATUS_TOKEN}`}});
  try {
    assert.equal((await f.request('/reconcile', {method: 'POST'})).status, 401);
    const first = await reconcile(); assert.equal(first.status, 200, await first.clone().text()); assert.equal(f.external.dispatches.length, 1);
    const operation = (await first.json()).operation;
    const context = await f.request(`/operations/${operation.id}/context`, {headers: {Authorization: `Bearer ${secrets.CMS_WORKFLOW_TOKEN}`}});
    assert.equal(context.status, 200); assert.equal((await context.json()).operation, 'update');
    await reconcile(); await reconcile(); assert.equal(f.external.dispatches.length, 1);
    f.external.revision = 'rev2'; f.external.inventory[0]._rev = 'rev2';
    await reconcile(); assert.equal(f.external.dispatches.length, 2); await reconcile(); assert.equal(f.external.dispatches.length, 2);
    f.external.source = 'd'.repeat(40);
    await reconcile(); assert.equal(f.external.dispatches.length, 3); assert.equal(f.external.dispatches[2].inputs.source_sha, 'd'.repeat(40));
    await reconcile(); assert.equal(f.external.dispatches.length, 3);
    f.external.revision = null; f.external.inventory.shift();
    const deletion = await reconcile(); assert.equal(deletion.status, 200);
    const removed = (await deletion.json()).operation; assert.equal(removed.contentPublished, false); assert.equal(removed.contentState, 'unpublished');
  } finally {await f.mf.dispose();}
});

test('local runtime: reconciliation retries only a definitely-not-dispatched connection failure, once', async () => {
  const f = fixture();
  const reconcile = () => f.request('/reconcile', {method: 'POST', headers: {Authorization: `Bearer ${secrets.CMS_STATUS_TOKEN}`}});
  try {
    f.external.documentFails = true;
    assert.equal((await (await reconcile()).json()).status, 'connection_failed'); assert.equal(f.external.dispatches.length, 0);
    f.external.documentFails = false;
    assert.equal((await (await reconcile()).json()).status, 'preview_queued'); assert.equal(f.external.dispatches.length, 1);
    await reconcile(); assert.equal(f.external.dispatches.length, 1);
  } finally {await f.mf.dispose();}
  const second = fixture();
  try {
    second.external.dispatchThrows = true;
    const headers = {Authorization: `Bearer ${secrets.CMS_STATUS_TOKEN}`};
    const first = await second.request('/reconcile', {method: 'POST', headers}); assert.equal((await first.json()).status, 'preview_dispatch_uncertain');
    await second.request('/reconcile', {method: 'POST', headers}); await second.request('/reconcile', {method: 'POST', headers});
    assert.equal(second.external.dispatches.length, 1);
  } finally {await second.mf.dispose();}
});

test('local runtime: first reconciliation reuses a webhook-checked full snapshot without another preview or approval', async () => {
  const f = fixture();
  try {
    const id = await f.previewReady(); assert.equal(f.external.dispatches.length, 1);
    const first = await f.request('/reconcile', {method: 'POST', headers: {Authorization: `Bearer ${secrets.CMS_STATUS_TOKEN}`}});
    assert.equal(first.status, 200); const result = await first.json();
    assert.equal(result.reused, true); assert.equal(result.operation.id, id); assert.equal(result.status, 'review_required');
    assert.equal(f.external.dispatches.length, 1);
    await f.request('/reconcile', {method: 'POST', headers: {Authorization: `Bearer ${secrets.CMS_STATUS_TOKEN}`}});
    assert.equal(f.external.dispatches.length, 1);
  } finally {await f.mf.dispose();}
});

test('local runtime: first daily scan after webhook publication reuses the verified snapshot and source', async () => {
  const f = fixture();
  try {
    const {id} = await f.approved(); assert.equal(f.external.dispatches.length, 2);
    f.external.hosted = {operationId: id, sourceSha: source, contentDigest: content, digest: release};
    const published = await f.result(id, {...f.previewResult(), stage: 'deployed_verified', websiteUrl: website});
    assert.equal(published.status, 200);
    const first = await f.request('/reconcile', {method: 'POST', headers: {Authorization: `Bearer ${secrets.CMS_STATUS_TOKEN}`}});
    assert.equal(first.status, 200); const result = await first.json();
    assert.equal(result.reused, true); assert.equal(result.operation.id, id); assert.equal(result.status, 'deployed_verified');
    assert.equal(f.external.dispatches.length, 2, 'a third job would be a duplicate preview');
    const monitor = await f.request('/monitor', {method: 'POST', headers: {Authorization: `Bearer ${secrets.CMS_STATUS_TOKEN}`}});
    assert.equal((await monitor.json()).lastVerified.revisionDigest, f.previewResult().revisionDigest);
  } finally {await f.mf.dispose();}
});

test('local runtime: permission-omitted documents cannot masquerade as confirmed unpublishing', async () => {
  const f = fixture();
  try {
    f.external.revision = null; f.external.omitted = [{id: event.documentId, reason: 'permission'}];
    const response = await f.webhook({...event, operation: 'delete'});
    assert.equal((await response.json()).status, 'connection_failed'); assert.equal(f.external.dispatches.length, 0);
  } finally {await f.mf.dispose();}
});

test('local runtime: a human can refresh an expired/failed preview without editing content; old approval never carries forward', async () => {
  const f = fixture();
  try {
    const {id, session, values} = await f.approved();
    assert.equal((await f.result(id, {...f.previewResult(), stage: 'deploy_failed'})).status, 200);
    const headers = {Cookie: session.cookie, Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded'};
    const refresh = extra => f.request(`/review/${id}/refresh`, {method: 'POST', redirect: 'manual',
      headers: {...headers, ...extra}, body: new URLSearchParams({csrf: values.csrf}).toString()});
    assert.equal((await refresh({Origin: 'https://attacker.example'})).status, 403);
    assert.equal(f.external.dispatches.length, 2);
    const fresh = await refresh(); assert.equal(fresh.status, 303, await fresh.clone().text());
    const next = new URL(fresh.headers.get('Location')).pathname.split('/').at(-1);
    assert.notEqual(next, id); assert.equal(f.external.dispatches.length, 3);
    assert.equal(f.external.dispatches[2].inputs.document_revision, 'rev1', 'refresh needs no artificial CMS edit');
    const old = await (await f.status(id)).json(); const current = await (await f.status(next)).json();
    assert.equal(old.status, 'superseded'); assert.equal(old.approval, null); assert.equal(current.approval, null); assert.equal(current.status, 'preview_queued');
    for (const operation of [id, next]) assert.equal((await f.request(`/operations/${operation}/authorization`, {headers: {Authorization: `Bearer ${secrets.CMS_WORKFLOW_TOKEN}`}})).status, 409);
    assert.equal((await f.result(id, {...f.previewResult(), stage: 'deployed_verified', websiteUrl: website})).status, 409);
    assert.equal((await refresh()).headers.get('Location'), fresh.headers.get('Location')); assert.equal(f.external.dispatches.length, 3);
  } finally {await f.mf.dispose();}
});

test('local runtime: failed build/deploy summaries do not leak provider content or claim success', async () => {
  const f = fixture();
  try {
    const id = await f.queued();
    const failed = await f.result(id, {stage: 'build_failed', sourceSha: source, documentRevision: 'rev1', error: 'secret-provider-token=DO_NOT_EXPOSE'});
    assert.equal(failed.status, 200); const body = await failed.text(); assert.ok(!body.includes('DO_NOT_EXPOSE')); assert.match(body, /current website remains available/);
  } finally {await f.mf.dispose();}
  const second = fixture();
  try {
    const {id} = await second.approved();
    const failed = await second.result(id, {...second.previewResult(), stage: 'deploy_failed', error: 'raw-internal-provider-error'});
    assert.equal(failed.status, 200); const body = await failed.json(); assert.equal(body.deployedVerified, false); assert.equal(body.status, 'deploy_failed');
    const monitor = await second.request('/monitor', {method: 'POST', headers: {Authorization: `Bearer ${secrets.CMS_STATUS_TOKEN}`}});
    assert.equal((await monitor.json()).lastVerified, null);
  } finally {await second.mf.dispose();}
});

test('local runtime: trusted source callback records a verified merge without another approval or deployment', async () => {
  const f=fixture();
  try {
    const merged='e'.repeat(40);
    f.external.source=merged;
    const pins={sourceSha:source,mergedSourceSha:merged,operationId:'11111111-1111-4111-8111-111111111111',contentDigest:content,
      revisionDigest:f.previewResult().revisionDigest,releaseDigest:release,previewRunId:'123456',previewUrl:preview};
    const record=(body,token=secrets.CMS_WORKFLOW_TOKEN)=>f.request('/source-release',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await record(pins,'wrong')).status,401);
    assert.equal((await record(pins)).status,503,'hosted marker must match before the ledger changes');
    f.external.hosted={...pins,digest:release};
    const recorded=await record(pins); assert.equal(recorded.status,200,JSON.stringify({body:await recorded.text(),requests:f.external.requests}));
    const result=await (await f.request('/reconcile',{method:'POST',headers:{Authorization:`Bearer ${secrets.CMS_STATUS_TOKEN}`}})).json();
    assert.equal(result.status,'deployed_verified');
    assert.equal(f.external.dispatches.length,0,'no duplicate preview or save dispatch');
    assert.equal((await record({...pins,mergedSourceSha:'f'.repeat(40)})).status,409);
  } finally {await f.mf.dispose();}
});
