import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm, cp} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inputContext, checkApproval, checkPreviewRun, checkFileInventory, verifyHosted, previousStage, promoteWithRollback, checkHosting, checkTrigger, validate, revisionDigest, deploy, ensureLiveProject} from './cms-publishing.mjs';
import {inventory, digestOf} from './release.mjs';

const source = 'a'.repeat(40), content = 'b'.repeat(64), release = 'c'.repeat(64);
const id = '11111111-1111-4111-8111-111111111111';
const publisher = 'https://cms-publisher.example.workers.dev';
const repository = 'librarycottonwood/cottonwood-library-assistant';
const env = {CMS_MODE: 'publish', CMS_OPERATION_ID: id, CMS_DOCUMENT_ID: 'event.sale', CMS_DOCUMENT_REVISION: 'rev1', CMS_SOURCE_SHA: source,
  CMS_CALLBACK_URL: `${publisher}/operations/${id}/result`, CMS_PUBLISHER_ORIGIN: publisher,
  CMS_CONTENT_DIGEST: content, CMS_RELEASE_DIGEST: release, CMS_PREVIEW_RUN_ID: '123456'};
const context = inputContext(env);
const receipt = {approved: true, publicationScope: 'live-website-only', websiteUrl: 'https://cottonwood-library.pages.dev',
  operationId: id, documentId: 'event.sale', documentRevision: 'rev1', sourceSha: source, contentDigest: content, releaseDigest: release, previewRunId: '123456'};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lL8AAAAASUVORK5CYII=', 'base64');

test('publishing inputs cannot target another callback, source or unpinned artifact', () => {
  assert.equal(inputContext(env).operationId, id);
  for (const changes of [{CMS_CALLBACK_URL: 'https://attacker.example/callback'}, {CMS_CALLBACK_URL: `${env.CMS_CALLBACK_URL}?token=leak`},
    {CMS_SOURCE_SHA: 'main'}, {CMS_DOCUMENT_ID: 'drafts.event.sale'}, {CMS_RELEASE_DIGEST: ''}, {CMS_PREVIEW_RUN_ID: '../run'}]) {
    assert.throws(() => inputContext({...env, ...changes}));
  }
});

test('a published CMS record is not approval; every source, document, content, release and run pin matters', () => {
  assert.equal(checkApproval(context, receipt), receipt);
  for (const changes of [{approved: false}, {publicationScope: 'public'}, {publicationScope: 'cms-trial-only'}, {websiteUrl: 'https://cottonwoodlibrary.org'},
    {websiteUrl: 'https://cms-trial.cottonwood-library-trial-preview.pages.dev'},
    {sourceSha: 'd'.repeat(40)}, {documentRevision: 'rev2'}, {contentDigest: 'd'.repeat(64)}, {releaseDigest: 'e'.repeat(64)}, {previewRunId: '999999'}]) {
    assert.throws(() => checkApproval(context, {...receipt, ...changes}));
  }
});

test('artifact provenance rejects unsuccessful, foreign, PR, or wrong-source workflow runs', () => {
  const run = {id: 123456, path: '.github/workflows/cms.yml', event: 'workflow_dispatch', status: 'completed', conclusion: 'success',
    head_sha: source, head_branch: 'main', repository: {full_name: repository}, head_repository: {full_name: repository}};
  assert.doesNotThrow(() => checkPreviewRun(context, run));
  for (const changes of [{id: 654321}, {path: '.github/workflows/check.yml'}, {event: 'pull_request'}, {conclusion: 'failure'},
    {head_sha: 'd'.repeat(40)}, {head_branch: 'feature'}, {head_repository: {full_name: 'another/repository'}}]) {
    assert.throws(() => checkPreviewRun(context, {...run, ...changes}));
  }
});

test('a complete successful exact-source verify job is required without waiting on later CMS reconciliation', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'cms-source-proof-'));
  const runtime = {LIBRARY_CONTENT_SOURCE: 'sanity', GITHUB_REPOSITORY: repository, GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/main',
    GITHUB_WORKFLOW_REF: `${repository}/.github/workflows/cms.yml@refs/heads/main`, GITHUB_SHA: source, GH_TOKEN: 'fixture-repo-reader', CMS_WORKFLOW_TOKEN: 'fixture-workflow-service'};
  let successful = true;
  const fetcher = async url => {
    const pathname = new URL(url).pathname;
    if (pathname.endsWith('/git/ref/heads/main')) return Response.json({object: {type: 'commit', sha: source}});
    if (pathname.endsWith('/actions/workflows/check.yml/runs')) return Response.json({workflow_runs: [{id: 10, path: '.github/workflows/check.yml',
      event: 'push', status: 'in_progress', head_sha: source, head_branch: 'main', head_repository: {full_name: repository}}]});
    if (pathname.endsWith('/actions/runs/10/jobs')) return Response.json({jobs: [{name: 'verify', status: 'completed', conclusion: successful ? 'success' : 'failure'}, {name: 'cms-live', status: 'in_progress'}]});
    if (pathname.endsWith(`/operations/${id}/context`)) return Response.json({id, sourceSha: source, documentId: context.documentId, documentRevision: 'rev1', operation: 'update', status: 'preview_queued'});
    throw Error('Unexpected explicit provider fixture request');
  };
  try {
    await validate({...context, mode: 'preview'}, {env: runtime, fetcher, root});
    assert.equal(JSON.parse(await readFile(path.join(root, 'output/cms/operation.json'))).sourceSha, source);
    successful = false;
    await assert.rejects(validate({...context, mode: 'preview'}, {env: runtime, fetcher, root}), /verification job/);
    await assert.rejects(validate({...context, mode: 'preview'}, {env: {...runtime, GITHUB_EVENT_NAME: 'pull_request'}, fetcher, root}), /restricted/);
  } finally {await rm(root, {recursive: true, force: true});}
});

test('snapshot revision checks distinguish an unpublish from an edited published record', () => {
  assert.doesNotThrow(() => checkTrigger({...context, operation: 'update'}, {documents: [{_id: 'event.sale', _rev: 'rev1'}]}));
  assert.throws(() => checkTrigger({...context, operation: 'update'}, {documents: [{_id: 'event.sale', _rev: 'rev2'}]}));
  assert.doesNotThrow(() => checkTrigger({...context, operation: 'delete'}, {documents: []}));
  assert.throws(() => checkTrigger({...context, operation: 'delete'}, {documents: [{_id: 'event.sale', _rev: 'rev1'}]}));
});

test('the complete revision fingerprint is order independent and changes when any document revision changes', () => {
  const documents = [{_id: 'post.news', _type: 'post', _rev: 'post1'}, {_id: 'library-settings', _type: 'siteSettings', _rev: 'settings1'}];
  assert.equal(revisionDigest({documents}), revisionDigest({documents: [...documents].reverse()}));
  assert.notEqual(revisionDigest({documents}), revisionDigest({documents: [{...documents[0], _rev: 'post2'}, documents[1]]}));
  assert.throws(() => revisionDigest({documents: [{_id: 'post.news', _type: 'post'}]}));
});

test('retained inventories reject path traversal, hosting-control files and changed hashes', () => {
  const files = [{path: 'index.html', sha256: hash('hello')}];
  assert.doesNotThrow(() => checkFileInventory(files, digestOf(files)));
  for (const name of ['../outside', '/absolute', 'nested/../outside', 'bad?query', '_redirects', '_headers', '_worker.js', 'back\\slash']) {
    const bad = [{path: name, sha256: hash('hello')}]; assert.throws(() => checkFileInventory(bad, digestOf(bad)));
  }
  assert.throws(() => checkFileInventory(files, 'd'.repeat(64)));
});

async function httpFixture(folder) {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname === '/index.html') {response.writeHead(302, {Location: '/'}).end(); return;}
      const filename = path.resolve(folder, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!filename.startsWith(folder + path.sep)) {response.writeHead(403).end(); return;}
      response.writeHead(200).end(await readFile(filename));
    } catch {response.writeHead(404).end('missing local fixture');}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {base: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise(resolve => server.close(resolve))};
}

test('real local HTTP result checks include all article/image/status bytes and detect a substituted asset', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'cms-hosted-test-'));
  const stage = path.join(root, 'stage'), hosted = path.join(root, 'hosted');
  await mkdir(path.join(stage, '_review'), {recursive: true});
  await writeFile(path.join(stage, 'index.html'), '<h1>Checked event</h1>');
  await writeFile(path.join(stage, '_review/status.json'), JSON.stringify({digest: release}));
  await cp(stage, hosted, {recursive: true}); const server = await httpFixture(hosted);
  try {
    await verifyHosted(stage, server.base);
    await writeFile(path.join(hosted, 'index.html'), '<h1>Wrong event</h1>');
    await assert.rejects(verifyHosted(stage, server.base), /differs/);
  } finally {await server.close(); await rm(root, {recursive: true, force: true});}
});

test('real local HTTP fault injection restores the earlier exact files and verifies the restoration', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'cms-rollback-test-'));
  const old = path.join(root, 'old'), next = path.join(root, 'next'), hosted = path.join(root, 'hosted');
  for (const folder of [old, next, hosted]) await mkdir(folder);
  await writeFile(path.join(old, 'index.html'), '<h1>Earlier checked library website</h1>');
  await writeFile(path.join(next, 'index.html'), '<h1>New approved event</h1>');
  const server = await httpFixture(hosted); const deployed = [];
  try {
    const result = await promoteWithRollback({stage: next, previous: {stage: old, operation: {sourceSha: 'older-source'}}, operation: {sourceSha: source},
      deployer: async (folder, version) => {
        deployed.push(version.sourceSha); await rm(hosted, {recursive: true, force: true}); await cp(folder, hosted, {recursive: true});
        if (folder === next) await writeFile(path.join(hosted, 'index.html'), 'Injected corrupted upload');
      }, verifier: folder => verifyHosted(folder, server.base)});
    assert.equal(result.status, 'deploy_failed'); assert.equal(result.rollback, 'restored_verified');
    assert.deepEqual(deployed, [source, 'older-source']);
    assert.equal(await (await fetch(server.base)).text(), '<h1>Earlier checked library website</h1>');
  } finally {await server.close(); await rm(root, {recursive: true, force: true});}
});

test('failed restoration and first-ever live failures never claim a working rollback', async () => {
  const first = await promoteWithRollback({stage: 'next', previous: null, operation: {}, deployer: async () => {}, verifier: async () => {throw Error('Injected failed result');}});
  assert.equal(first.rollback, 'no_previous_verified_live'); assert.equal(first.status, 'deploy_failed');
  const broken = await promoteWithRollback({stage: 'next', previous: {stage: 'old', operation: {}}, operation: {}, deployer: async () => {}, verifier: async () => {throw Error('Injected failed restoration');}});
  assert.equal(broken.rollback, 'restoration_not_verified'); assert.equal(broken.status, 'deploy_failed');
});

test('rollback reconstruction uses pinned immutable preview bytes and keeps checked PNG evidence', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'cms-retained-test-'));
  const hosted = path.join(root, 'immutable'); await mkdir(path.join(hosted, '_review'), {recursive: true});
  await mkdir(path.join(root, 'output/cms'), {recursive: true});
  await writeFile(path.join(hosted, 'index.html'), '<h1>Earlier library event</h1>');
  const files = (await inventory(hosted)).filter(file => !file.path.startsWith('_review/'));
  const digest = digestOf(files);
  for (const name of ['desktop', 'phone']) await writeFile(path.join(hosted, '_review', name + '.png'), png);
  const evidence = {digest, sourceCommit: source, pictures: {desktop: hash(png), phone: hash(png)}, errors: [], evidence: [{name: 'desktop', route: '/'}, {name: 'phone', route: '/'}]};
  await writeFile(path.join(hosted, '_review/evidence.json'), JSON.stringify(evidence));
  const reviewFiles = await inventory(path.join(hosted, '_review'));
  await writeFile(path.join(hosted, '_review/release.json'), JSON.stringify({sourceSha: source, contentDigest: content, digest, files, reviewFiles}));
  const server = await httpFixture(hosted);
  const fetcher = (url, options) => fetch(new URL(new URL(url).pathname, server.base), options);
  const previous = {operationId: id, sourceSha: source, contentDigest: content, releaseDigest: digest, previewRunId: '123456', previewUrl: 'https://1234abcd.cottonwood-library.pages.dev/'};
  try {
    const stage = await previousStage(previous, {root, fetcher});
    assert.equal(await readFile(path.join(stage, 'index.html'), 'utf8'), '<h1>Earlier library event</h1>');
    assert.deepEqual(await readFile(path.join(stage, '_review/desktop.png')), png);
    assert.equal(JSON.parse(await readFile(path.join(stage, '_review/status.json'))).digest, digest);
    await writeFile(path.join(hosted, '_review/phone.png'), 'tampered screenshot');
    await assert.rejects(previousStage(previous, {root, fetcher}), /picture changed/);
    // A recovery pointer on the retired trial project cannot restore the live website.
    await assert.rejects(previousStage({...previous, previewUrl: 'https://1234abcd.cottonwood-library-trial-preview.pages.dev/'}, {root, fetcher}), /invalid pins/);
  } finally {await server.close(); await rm(root, {recursive: true, force: true});}
});

const hostingCredentials = {CLOUDFLARE_ACCOUNT_ID: 'e05729fd6b6fad329e31896d8b1c2da9', CLOUDFLARE_API_TOKEN: 'local-fixture-hosting-token'};
const hostingProject = {success: true, result: {name: 'cottonwood-library', production_branch: 'production', domains: ['cottonwood-library.pages.dev']}};
const withInventory = (body, project = hostingProject) => async value => Response.json(new URL(value).pathname.endsWith('/deployments') ? body : project);

test('hosting guard refuses another account, a personal login, wrong project settings or foreign domains', async () => {
  const empty = {success: true, result: []};
  await checkHosting(hostingCredentials, {fetcher: withInventory(empty)});
  // The live project may carry the library's own public domain at launch.
  await checkHosting(hostingCredentials, {fetcher: withInventory(empty, {...hostingProject, result: {...hostingProject.result, domains: ['cottonwood-library.pages.dev', 'www.cottonwoodcommunitylibrary.com']}})});
  for (const changes of [{production_branch: 'cms-trial'}, {name: 'cottonwood-library-trial-preview'}, {domains: ['cottonwoodlibrary.org']},
    {domains: ['cottonwood-library.pages.dev', 'cottonwoodlibrary.org']}, {domains: ['cottonwood-library-4x2.pages.dev']}, {domains: []}]) {
    await assert.rejects(checkHosting(hostingCredentials, {fetcher: withInventory(empty, {...hostingProject, result: {...hostingProject.result, ...changes}})}), /live hosting project must be/);
  }
  for (const env of [{...hostingCredentials, CLOUDFLARE_ACCOUNT_ID: '0123456789abcdef0123456789abcdef'}, {CLOUDFLARE_ACCOUNT_ID: hostingCredentials.CLOUDFLARE_ACCOUNT_ID}]) {
    await assert.rejects(checkHosting(env, {fetcher: async () => assert.fail('no request without the library account')}), /Refusing to deploy/);
  }
});

test('deploys accept only the live production branch or this operation\'s isolated preview branch', async () => {
  for (const branch of ['cms-trial', 'main', 'cms-draft-' + 'f'.repeat(8), 'trial']) {
    await assert.rejects(deploy('stage', branch, {operationId: id, sourceSha: source}, hostingCredentials), /Only the live production branch/);
  }
  await assert.rejects(deploy('stage', 'production', {operationId: id, sourceSha: source}, {}), /Refusing to deploy/);
});

test('first live publication requires an empty authenticated production inventory', async () => {
  await checkHosting(hostingCredentials, {requireNoLive: true, fetcher: withInventory({success: true, result: [], result_info: {page: 1, per_page: 25, total_pages: 0, total_count: 0}})});
  // Previews do not count as a live website.
  await assert.rejects(checkHosting(hostingCredentials, {requireNoLive: true, fetcher: withInventory({success: true, result: [{environment: 'production'}]})}), /already has a deployment/);
  await checkHosting(hostingCredentials, {fetcher: withInventory({success: true, result: [{environment: 'production'}]})});
});

test('Pages inventory uses the page size accepted by the actual provider and the production environment', async () => {
  const requests = [];
  const fetcher = async value => {
    const url = new URL(value); requests.push(url);
    if (!url.pathname.endsWith('/deployments')) return Response.json(hostingProject);
    // Based on the account-connected probe: 100 returned 400/8000024; 25 returned 200.
    if (url.searchParams.get('per_page') !== '25') return Response.json({success: false, errors: [{code: 8000024}]}, {status: 400});
    assert.equal(url.searchParams.get('env'), 'production');
    return Response.json({success: true, result: [], result_info: {page: 1, per_page: 25, total_pages: 0}});
  };
  await checkHosting(hostingCredentials, {fetcher, requireNoLive: true});
  assert.equal(requests.length, 2);
  await assert.rejects(checkHosting(hostingCredentials, {fetcher: async value => new URL(value).pathname.endsWith('/deployments') ?
    Response.json({success: false}, {status: 400}) : Response.json(hostingProject)}), /hosting deployment inventory request failed \(400\)/);
});

test('first live publication fails closed on inconsistent paging', async () => {
  for (const result_info of [{page: 2, per_page: 25}, {page: 1, per_page: 0}, {page: 1, per_page: 25, total_pages: 2}, {page: 1, per_page: 25, total_count: 3}]) {
    await assert.rejects(checkHosting(hostingCredentials, {requireNoLive: true, fetcher: withInventory({success: true, result: [], result_info})}), /Could not verify/);
  }
  await assert.rejects(checkHosting(hostingCredentials, {requireNoLive: true, fetcher: withInventory({success: true, result: Array.from({length: 26}, () => ({}))})}), /Could not verify/);
});

test('live project setup creates only the expected library project and confirms its address', async () => {
  const calls = [];
  let exists = false;
  const fetcher = async (value, options) => {
    calls.push([options.method, new URL(value).pathname]);
    assert.equal(options.headers.Authorization, 'Bearer local-fixture-hosting-token');
    if (options.method === 'POST') {
      assert.deepEqual(JSON.parse(options.body), {name: 'cottonwood-library', production_branch: 'production'});
      exists = true; return Response.json({...hostingProject, result: {...hostingProject.result, subdomain: 'cottonwood-library.pages.dev'}});
    }
    return exists ? Response.json(hostingProject) : new Response('missing', {status: 404});
  };
  assert.deepEqual(await ensureLiveProject(hostingCredentials, {fetcher}), {created: true, name: 'cottonwood-library', liveUrl: 'https://cottonwood-library.pages.dev'});
  assert.ok(calls.every(([, pathname]) => pathname.startsWith('/client/v4/accounts/e05729fd6b6fad329e31896d8b1c2da9/pages/projects')));
  assert.equal((await ensureLiveProject(hostingCredentials, {fetcher})).created, false);
  await assert.rejects(ensureLiveProject(hostingCredentials, {fetcher: async (value, options) => options.method === 'POST' ?
    Response.json({...hostingProject, result: {...hostingProject.result, subdomain: 'cottonwood-library-4x2.pages.dev', domains: ['cottonwood-library-4x2.pages.dev']}}) : new Response('missing', {status: 404})}), /live hosting project must be/);
});
