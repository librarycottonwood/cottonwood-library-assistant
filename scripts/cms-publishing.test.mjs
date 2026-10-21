import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm, cp} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inputContext, checkApproval, checkPreviewRun, checkFileInventory, verifyHosted, previousStage, promoteWithRollback, checkHosting, checkTrigger, validate, revisionDigest} from './cms-publishing.mjs';
import {inventory, digestOf} from './release.mjs';

const source = 'a'.repeat(40), content = 'b'.repeat(64), release = 'c'.repeat(64);
const id = '11111111-1111-4111-8111-111111111111';
const publisher = 'https://cms-publisher.example.workers.dev';
const repository = 'librarycottonwood/cottonwood-library-assistant';
const env = {CMS_MODE: 'publish', CMS_OPERATION_ID: id, CMS_DOCUMENT_ID: 'event.sale', CMS_DOCUMENT_REVISION: 'rev1', CMS_SOURCE_SHA: source,
  CMS_CALLBACK_URL: `${publisher}/operations/${id}/result`, CMS_PUBLISHER_ORIGIN: publisher,
  CMS_CONTENT_DIGEST: content, CMS_RELEASE_DIGEST: release, CMS_PREVIEW_RUN_ID: '123456'};
const context = inputContext(env);
const receipt = {approved: true, publicationScope: 'cms-trial-only', websiteUrl: 'https://cms-trial.cottonwood-library-trial-preview.pages.dev',
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
  for (const changes of [{approved: false}, {publicationScope: 'public'}, {websiteUrl: 'https://cottonwoodlibrary.org'},
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

test('failed restoration and first-ever trial failures never claim a working rollback', async () => {
  const first = await promoteWithRollback({stage: 'next', previous: null, operation: {}, deployer: async () => {}, verifier: async () => {throw Error('Injected failed result');}});
  assert.equal(first.rollback, 'no_previous_verified_cms_trial'); assert.equal(first.status, 'deploy_failed');
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
  const previous = {operationId: id, sourceSha: source, contentDigest: content, releaseDigest: digest, previewRunId: '123456', previewUrl: 'https://1234abcd.cottonwood-library-trial-preview.pages.dev/'};
  try {
    const stage = await previousStage(previous, {root, fetcher});
    assert.equal(await readFile(path.join(stage, 'index.html'), 'utf8'), '<h1>Earlier library event</h1>');
    assert.deepEqual(await readFile(path.join(stage, '_review/desktop.png')), png);
    assert.equal(JSON.parse(await readFile(path.join(stage, '_review/status.json'))).digest, digest);
    await writeFile(path.join(hosted, '_review/phone.png'), 'tampered screenshot');
    await assert.rejects(previousStage(previous, {root, fetcher}), /picture changed/);
  } finally {await server.close(); await rm(root, {recursive: true, force: true});}
});

test('hosting guard refuses a production branch collision, public domain, or untracked existing CMS trial', async () => {
  const credentials = {CLOUDFLARE_ACCOUNT_ID: 'e05729fd6b6fad329e31896d8b1c2da9', CLOUDFLARE_API_TOKEN: 'local-fixture-hosting-token'};
  const good = {success: true, result: {name: 'cottonwood-library-trial-preview', production_branch: 'production', domains: ['cottonwood-library-trial-preview.pages.dev']}};
  await checkHosting(credentials, {fetcher: async url => Response.json(String(url).includes('/deployments?') ? {success: true, result: []} : good)});
  for (const changes of [{production_branch: 'cms-trial'}, {domains: ['cottonwoodlibrary.org']}]) {
    await assert.rejects(checkHosting(credentials, {fetcher: async () => Response.json({...good, result: {...good.result, ...changes}})}));
  }
  await assert.rejects(checkHosting(credentials, {requireEmptyTrial: true, fetcher: async url =>
    Response.json(String(url).includes('/deployments?') ? {success: true, result: [{deployment_trigger: {metadata: {branch: 'cms-trial'}}}]} : good)}), /no verified recovery/);
});

const hostingCredentials = {CLOUDFLARE_ACCOUNT_ID: 'e05729fd6b6fad329e31896d8b1c2da9', CLOUDFLARE_API_TOKEN: 'local-fixture-hosting-token'};
const hostingProject = {success: true, result: {name: 'cottonwood-library-trial-preview', production_branch: 'production', domains: ['cottonwood-library-trial-preview.pages.dev']}};

test('Pages inventory uses the page size accepted by the actual provider and is checked before preview', async () => {
  const requests = [];
  const fetcher = async value => {
    const url = new URL(value); requests.push(url);
    if (!url.pathname.endsWith('/deployments')) return Response.json(hostingProject);
    // Based on the account-connected probe: 100 returned 400/8000024; 25 returned 200.
    if (url.searchParams.get('per_page') !== '25') return Response.json({success: false, errors: [{code: 8000024}]}, {status: 400});
    return Response.json({success: true, result: [], result_info: {page: 1, per_page: 25, total_pages: 0}});
  };
  await checkHosting(hostingCredentials, {fetcher, requireEmptyTrial: true});
  requests.length = 0;
  await checkHosting(hostingCredentials, {fetcher});
  assert.equal(requests.length, 2);
  await assert.rejects(checkHosting(hostingCredentials, {fetcher: async value => new URL(value).pathname.endsWith('/deployments') ?
    Response.json({success: false}, {status: 400}) : Response.json(hostingProject)}), /hosting deployment inventory request failed \(400\)/);
});

test('first publication scans every page, including a smaller provider page, before declaring the branch new', async () => {
  const seen = [];
  let existing = false;
  const fetcher = async value => {
    const url = new URL(value);
    if (!url.pathname.endsWith('/deployments')) return Response.json(hostingProject);
    const page = Number(url.searchParams.get('page')); seen.push(page);
    return Response.json({success: true,
      result: page === 1 ? Array.from({length: 20}, () => ({deployment_trigger: {metadata: {branch: 'trial'}}})) :
        [{deployment_trigger: {metadata: {branch: existing ? 'cms-trial' : 'another-draft'}}}],
      result_info: {page, per_page: 20, total_pages: 2}});
  };
  await checkHosting(hostingCredentials, {fetcher, requireEmptyTrial: true});
  assert.deepEqual(seen, [1, 2]);
  existing = true; seen.length = 0;
  await assert.rejects(checkHosting(hostingCredentials, {fetcher, requireEmptyTrial: true}), /no verified recovery/);
  assert.deepEqual(seen, [1, 2]);
});

test('first publication fails closed on inconsistent paging or an inventory beyond the existing 1,000-record bound', async () => {
  const projectOr = body => async value => Response.json(new URL(value).pathname.endsWith('/deployments') ? body : hostingProject);
  for (const result_info of [{page: 2, per_page: 25}, {page: 1, per_page: 0}, {page: 1, per_page: 25, total_pages: 2}]) {
    await assert.rejects(checkHosting(hostingCredentials, {requireEmptyTrial: true, fetcher: projectOr({success: true, result: [], result_info})}), /Could not verify/);
  }
  let pages = 0;
  await assert.rejects(checkHosting(hostingCredentials, {requireEmptyTrial: true, fetcher: async value => {
    if (!new URL(value).pathname.endsWith('/deployments')) return Response.json(hostingProject);
    pages++;
    return Response.json({success: true, result: Array.from({length: 25}, () => ({}))});
  }}), /inventory is too large/);
  assert.equal(pages, 40);
});
