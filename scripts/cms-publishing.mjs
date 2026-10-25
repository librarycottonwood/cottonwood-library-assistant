import {readFile, writeFile, mkdir, rm, mkdtemp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {contentDigest, readSnapshot, saveSnapshot} from './cms.mjs';
import {sanityConfig, fetchSanitySnapshot} from '../src/content/sanity.mjs';
import {inventory, digestOf, prepareReview} from './release.mjs';
import {requireLibraryAccount} from './library-account.mjs';
import {REPOSITORY, LIVE_ORIGIN, LIVE_PROJECT, operationIdPattern, sourcePattern, digestPattern, idPattern, revisionPattern, previewUrlValid, revisionVector} from '../cms-publisher/src/contract.mjs';

const PROJECT = LIVE_PROJECT;
// Production deployment of PROJECT = the live website. Every other upload is an
// isolated preview branch on the same library-account project.
export const LIVE_BRANCH = 'production';
// The live project may carry only the library's own public domain (launch plan).
export const LIVE_DOMAINS = ['cottonwoodcommunitylibrary.com', 'www.cottonwoodcommunitylibrary.com'];
const OUTPUT = 'output/cms';
const ARTIFACT = 'library-cms-checked-preview';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const revisionDigest = snapshot => hash(JSON.stringify(revisionVector(snapshot.documents)));
const fail = message => {throw new Error(message);};
const jsonFile = async filename => JSON.parse(await readFile(filename, 'utf8'));
const writeJson = async (filename, value) => {await mkdir(path.dirname(filename), {recursive: true}); await writeFile(filename, JSON.stringify(value, null, 2) + '\n', {mode: 0o600});};
const output = async (values, env = process.env) => {
  if (env.GITHUB_OUTPUT) await writeFile(env.GITHUB_OUTPUT, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', {flag: 'a'});
};

export function inputContext(env = process.env) {
  const value = {
    mode: env.CMS_MODE, operationId: env.CMS_OPERATION_ID, documentId: env.CMS_DOCUMENT_ID,
    documentRevision: env.CMS_DOCUMENT_REVISION, sourceSha: env.CMS_SOURCE_SHA,
    callbackUrl: env.CMS_CALLBACK_URL, publisherOrigin: env.CMS_PUBLISHER_ORIGIN,
    contentDigest: env.CMS_CONTENT_DIGEST || null, releaseDigest: env.CMS_RELEASE_DIGEST || null,
    previewRunId: env.CMS_PREVIEW_RUN_ID || null,
  };
  if (!['preview', 'publish'].includes(value.mode) || !operationIdPattern.test(value.operationId || '') ||
      !idPattern.test(value.documentId || '') || value.documentId.startsWith('drafts.') || value.documentId.startsWith('versions.') ||
      !revisionPattern.test(value.documentRevision || '') || !sourcePattern.test(value.sourceSha || '')) fail('Invalid CMS operation identity.');
  let origin; try {origin = new URL(value.publisherOrigin);} catch {fail('The library CMS publisher origin is required.');}
  if (origin.protocol !== 'https:' || origin.origin !== value.publisherOrigin ||
      value.callbackUrl !== `${origin.origin}/operations/${value.operationId}/result`) fail('CMS callback must use the configured library publisher and exact operation.');
  if (value.mode === 'publish' && (!digestPattern.test(value.contentDigest || '') || !digestPattern.test(value.releaseDigest || '') || !/^[1-9][0-9]{0,19}$/.test(value.previewRunId || ''))) fail('Publishing requires exact checked content, release and preview-run pins.');
  return value;
}

function token(env, name) {if (!env[name]) fail(`${name} is required for this controlled operation.`); return env[name];}
async function requestJson(url, {fetcher = fetch, headers = {}, method = 'GET', body, missing = false, label = 'Controlled publishing request'} = {}) {
  const response = await fetcher(url, {method, headers: {...headers, ...(body ? {'Content-Type': 'application/json'} : {})},
    ...(body ? {body: JSON.stringify(body)} : {}), redirect: 'error', signal: AbortSignal.timeout(30000)});
  if (missing && response.status === 404) return null;
  if (!response.ok) fail(`${label} failed (${response.status}). No successful update claimed.`);
  return response.json();
}
const githubHeaders = env => ({Authorization: `Bearer ${token(env, 'GH_TOKEN')}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Cottonwood-Library-CMS'});
const workerHeaders = env => ({Authorization: `Bearer ${token(env, 'CMS_WORKFLOW_TOKEN')}`});

export function checkOperation(context, operation) {
  if (operation.id !== context.operationId || operation.sourceSha !== context.sourceSha ||
      operation.documentId !== context.documentId || operation.documentRevision !== context.documentRevision ||
      !['create', 'update', 'delete'].includes(operation.operation)) fail('The CMS operation does not match the trusted publisher record.');
  return operation;
}

export async function validate(context, {env = process.env, fetcher = fetch, root = process.cwd()} = {}) {
  if (env.LIBRARY_CONTENT_SOURCE !== 'sanity' || env.GITHUB_REPOSITORY !== REPOSITORY || env.GITHUB_EVENT_NAME !== 'workflow_dispatch' ||
      env.GITHUB_REF !== 'refs/heads/main' || env.GITHUB_SHA !== context.sourceSha ||
      env.GITHUB_WORKFLOW_REF !== `${REPOSITORY}/.github/workflows/cms.yml@refs/heads/main`) fail('CMS publishing is restricted to the enabled library workflow on its exact main source.');
  const current = await requestJson(`https://api.github.com/repos/${REPOSITORY}/git/ref/heads/main`, {fetcher, headers: githubHeaders(env)});
  if (current.object?.sha !== context.sourceSha || current.object?.type !== 'commit') fail('Website code changed; prepare a fresh preview.');
  const checks = await requestJson(`https://api.github.com/repos/${REPOSITORY}/actions/workflows/check.yml/runs?branch=main&per_page=20`, {fetcher, headers: githubHeaders(env)});
  const candidates = checks.workflow_runs?.filter(run => run.head_sha === context.sourceSha && run.head_branch === 'main' &&
    ['push', 'schedule', 'workflow_dispatch'].includes(run.event) && run.path === '.github/workflows/check.yml' && run.head_repository?.full_name === REPOSITORY) || [];
  let verified = false;
  // Account reconciliation runs after the verify job, so requiring the entire
  // workflow to finish would create a cycle. Trust only that complete, successful
  // credential-free verification job for this exact main source.
  for (const run of candidates.slice(0, 5)) {
    const jobs = await requestJson(`https://api.github.com/repos/${REPOSITORY}/actions/runs/${run.id}/jobs?per_page=100`, {fetcher, headers: githubHeaders(env)});
    if (jobs.jobs?.some(job => job.name === 'verify' && job.status === 'completed' && job.conclusion === 'success')) {verified = true; break;}
  }
  if (!verified) fail('This exact website source has not passed its complete verification job yet; a later reconciliation or fresh preview can retry.');
  const operation = checkOperation(context, await requestJson(`${context.publisherOrigin}/operations/${context.operationId}/context`, {fetcher, headers: workerHeaders(env)}));
  if (context.mode === 'preview' && !['preview_dispatching', 'preview_queued', 'preview_dispatch_uncertain'].includes(operation.status)) fail('This preview operation is no longer pending.');
  await writeJson(path.join(root, OUTPUT, 'operation.json'), {...context, operation: operation.operation, schemaVersion: 1});
  await output({source_sha: context.sourceSha, operation_id: context.operationId}, env);
  return context;
}

export function checkTrigger(context, snapshot) {
  const document = snapshot.documents.find(item => item._id === context.documentId);
  if (context.operation === 'delete' ? !!document : document?._rev !== context.documentRevision) fail('The content revision changed; prepare a fresh preview.');
}

async function captureSnapshot(context, env) {
  const snapshot = await fetchSanitySnapshot(sanityConfig(env), {token: env.SANITY_READ_TOKEN});
  checkTrigger(context, snapshot);
  await saveSnapshot(snapshot, `${OUTPUT}/snapshot.json`);
  const operation = {...context, contentDigest: contentDigest(snapshot), revisionDigest: revisionDigest(snapshot)};
  await writeJson(`${OUTPUT}/operation.json`, operation);
  await output({content_digest: operation.contentDigest, source_sha: operation.sourceSha});
  return operation;
}

export function checkPins(context, operation) {
  if (operation.schemaVersion !== 1 || operation.operationId !== context.operationId || operation.sourceSha !== context.sourceSha ||
      operation.documentId !== context.documentId || operation.documentRevision !== context.documentRevision ||
      !digestPattern.test(operation.contentDigest || '') || !digestPattern.test(operation.releaseDigest || '') ||
      !digestPattern.test(operation.revisionDigest || '') ||
      !/^[1-9][0-9]{0,19}$/.test(String(operation.previewRunId || '')) ||
      (context.mode === 'publish' && (operation.contentDigest !== context.contentDigest || operation.releaseDigest !== context.releaseDigest || operation.previewRunId !== context.previewRunId))) fail('The downloaded preview does not match the approved operation pins.');
  return operation;
}

export async function verifyBundle(operation, {root = process.cwd()} = {}) {
  const releaseDir = path.join(root, 'output/releases', operation.releaseDigest);
  const manifest = await jsonFile(path.join(releaseDir, 'manifest.json'));
  const files = await inventory(path.join(releaseDir, 'site'));
  if (manifest.sourceCommit !== operation.sourceSha || manifest.digest !== operation.releaseDigest || digestOf(files) !== operation.releaseDigest ||
      JSON.stringify(manifest.files) !== JSON.stringify(files) || files.some(file => file.path.startsWith('_review/'))) fail('Checked CMS website assets changed after preparation.');
  const version = await jsonFile(path.join(releaseDir, 'site/_content/version.json'));
  if (version.provider !== 'sanity' || version.contentDigest !== operation.contentDigest || version.sourceSha !== operation.sourceSha || version.workingTreeChanged) fail('The website build does not match its clean source and frozen CMS snapshot.');
  const snapshot = await readSnapshot(path.join(root, OUTPUT, 'snapshot.json'));
  if (contentDigest(snapshot) !== operation.contentDigest) fail('The captured CMS content changed.');
  if (revisionDigest(snapshot) !== operation.revisionDigest) fail('The captured CMS revision vector changed.');
  checkTrigger(operation, snapshot);
  const evidence = await jsonFile(path.join(root, 'output/playwright', operation.releaseDigest, 'evidence.json'));
  if (evidence.sourceCommit !== operation.sourceSha || evidence.digest !== operation.releaseDigest || evidence.errors.length ||
      !['desktop', 'phone'].every(name => evidence.evidence.some(item => item.name === name && item.route === '/'))) fail('The CMS release has no matching desktop and phone verification.');
  for (const name of ['desktop', 'phone']) {
    const bytes = await readFile(path.join(root, 'output/playwright', operation.releaseDigest, name + '.png'));
    if (hash(bytes) !== evidence.pictures?.[name]) fail('The checked CMS screenshots changed.');
  }
  return {releaseDir, manifest};
}

export async function recordBuild(operation, env) {
  if (['SANITY_READ_TOKEN', 'SANITY_WRITE_TOKEN', 'CLOUDFLARE_API_TOKEN', 'CMS_WORKFLOW_TOKEN'].some(key => env[key])) fail('Do not expose connection or publishing credentials to build/capture processes.');
  const version = JSON.parse(await readFile('dist/_content/version.json', 'utf8'));
  if (version.sourceSha !== operation.sourceSha || version.contentDigest !== operation.contentDigest || version.workingTreeChanged) fail('Build did not use the clean pinned source and snapshot.');
  const digest = execFileSync(process.execPath, ['scripts/release.mjs', 'prepare'], {encoding: 'utf8'}).trim();
  if (!digestPattern.test(digest)) fail('Release preparation returned no immutable digest.');
  execFileSync(process.execPath, ['scripts/capture.mjs', digest], {stdio: 'inherit'});
  const checked = {...operation, releaseDigest: digest, previewRunId: String(env.GITHUB_RUN_ID)};
  checkPins({...operation, mode: 'preview'}, checked);
  await verifyBundle(checked);
  await writeJson(`${OUTPUT}/operation.json`, checked);
  await output({content_digest: checked.contentDigest, release_digest: digest, source_sha: checked.sourceSha, preview_run_id: checked.previewRunId});
  return checked;
}

function hostingEnvironment(env) {
  const account = requireLibraryAccount(env);
  const safe = Object.fromEntries(Object.entries(env).filter(([key]) => ['PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'CI', 'NODE_EXTRA_CA_CERTS', 'PNPM_HOME'].includes(key)));
  return {...safe, CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN, WRANGLER_SEND_METRICS: 'false'};
}
export async function deploy(stage, branch, operation, env) {
  if (branch !== LIVE_BRANCH && branch !== `cms-draft-${operation.operationId}`) fail('Only the live production branch or an isolated preview branch may be deployed.');
  const log = execFileSync('pnpm', ['exec', 'wrangler', 'pages', 'deploy', stage, '--project-name', PROJECT, '--branch', branch,
    '--commit-hash', operation.sourceSha, '--commit-dirty=true', '--commit-message', branch === LIVE_BRANCH ? 'Checked library live website' : 'Checked library preview'], {encoding: 'utf8', env: hostingEnvironment(env)});
  const matches = log.match(/https:\/\/[a-f0-9]{8}\.cottonwood-library\.pages\.dev/g);
  if (!matches?.length) fail('The upload returned no immutable hosting URL.');
  return new URL(matches.at(-1)).href;
}

const projectApi = (account, name) => `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${name}`;
export function checkProjectSettings(project) {
  const domains = project?.result?.domains;
  if (!project?.success || project.result?.name !== PROJECT || project.result?.production_branch !== LIVE_BRANCH ||
      !Array.isArray(domains) || !domains.includes(`${PROJECT}.pages.dev`) ||
      domains.some(domain => domain !== `${PROJECT}.pages.dev` && !domain.endsWith(`.${PROJECT}.pages.dev`) && !LIVE_DOMAINS.includes(domain))) {
    fail(`The live hosting project must be ${PROJECT}.pages.dev with production branch ${LIVE_BRANCH} and no domains other than the library's own.`);
  }
  return project;
}

export async function checkHosting(env, {fetcher = fetch, requireNoLive = false} = {}) {
  const account = hostingEnvironment(env).CLOUDFLARE_ACCOUNT_ID;
  const base = projectApi(account, PROJECT);
  const headers = {Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`};
  checkProjectSettings(await requestJson(base, {fetcher, headers, label: 'Live hosting project request'}));
  // Exercise the inventory connection during preview too, before asking for approval.
  // The live Pages API rejects per_page=100; 25 succeeds.
  const pageSize = 25;
  // A missing or unreachable live address does not prove the live site never existed.
  // Confirm a first live publication through the authenticated production inventory.
  const records = await requestJson(`${base}/deployments?env=production&per_page=${pageSize}&page=1`, {fetcher, headers, label: 'Live hosting deployment inventory request'});
  const info = records.result_info || {};
  const perPage = info.per_page ?? pageSize;
  if (!records.success || !Array.isArray(records.result) || !Number.isInteger(perPage) || perPage < 1 || perPage > pageSize ||
      records.result.length > perPage || (info.page !== undefined && info.page !== 1) ||
      (info.total_pages !== undefined && (!Number.isInteger(info.total_pages) || info.total_pages < 0 ||
        (!info.total_pages && records.result.length) || (info.total_pages > 0 && !records.result.length))) ||
      (info.total_count !== undefined && (!Number.isInteger(info.total_count) || info.total_count < records.result.length || (info.total_count && !records.result.length)))) {
    fail('Could not verify the current live hosting state.');
  }
  if (requireNoLive && records.result.length) fail('The live website already has a deployment with no verified recovery record; reconnect it before publishing.');
}

/** One-time setup: create the live project on the library account, or confirm it. */
export async function ensureLiveProject(env, {fetcher = fetch} = {}) {
  const account = hostingEnvironment(env).CLOUDFLARE_ACCOUNT_ID;
  const headers = {Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`};
  let project = await requestJson(projectApi(account, PROJECT), {fetcher, headers, missing: true, label: 'Live hosting project request'});
  let created = false;
  if (!project) {
    project = await requestJson(`https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects`, {fetcher, headers, method: 'POST',
      body: {name: PROJECT, production_branch: LIVE_BRANCH}, label: 'Live hosting project creation'});
    created = true;
  }
  checkProjectSettings(project);
  if (project.result.subdomain !== undefined && project.result.subdomain !== `${PROJECT}.pages.dev`) fail(`Cloudflare assigned ${project.result.subdomain}; choose another project name.`);
  return {created, name: project.result.name, liveUrl: LIVE_ORIGIN};
}

function safeAssetPath(value) {
  return typeof value === 'string' && value.length < 512 && !value.startsWith('/') && !/[\\?#\u0000-\u0020]/.test(value) &&
    value.split('/').every(part => part && part !== '.' && part !== '..') && !['_headers', '_redirects', '_worker.js'].includes(value);
}
export function checkFileInventory(files, digest) {
  if (!Array.isArray(files) || !files.length || files.length > 2000 || files.some(item => !safeAssetPath(item.path) || !digestPattern.test(item.sha256 || '')) ||
      new Set(files.map(item => item.path)).size !== files.length || digestOf(files) !== digest) fail('The retained release inventory is invalid.');
  return files;
}

async function hostedBytes(base, filename, {fetcher = fetch} = {}) {
  let url = new URL(filename.split('/').map(encodeURIComponent).join('/'), base.endsWith('/') ? base : base + '/');
  const expectedOrigin = url.origin;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetcher(url, {redirect: 'manual', headers: {'Cache-Control': 'no-cache', 'User-Agent': 'Cottonwood-CMS-verification/1.0'}, signal: AbortSignal.timeout(30000)});
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      url = new URL(response.headers.get('Location'), url);
      if (url.origin !== expectedOrigin || url.username || url.password) fail('Hosted asset redirected outside its checked website.');
      continue;
    }
    if (!response.ok || Number(response.headers.get('Content-Length')) > 12 * 1024 * 1024) fail('A hosted website asset could not be checked.');
    const parts = []; let size = 0;
    const reader = response.body.getReader();
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 12 * 1024 * 1024) {await reader.cancel(); fail('Hosted asset exceeds the verification limit.');}
      parts.push(Buffer.from(value));
    }
    const bytes = Buffer.concat(parts, size);
    return bytes;
  }
  fail('Hosted asset redirected too many times.');
}

export async function verifyHosted(stage, base, options = {}) {
  const expected = await inventory(stage);
  // Check all published files, including article pages, pictures and status metadata.
  for (let index = 0; index < expected.length; index += 4) {
    await Promise.all(expected.slice(index, index + 4).map(async file => {
      const bytes = await hostedBytes(base, file.path, options);
      if (hash(bytes) !== file.sha256) fail('The hosted website differs from the checked release.');
    }));
  }
}

export async function waitForHosted(stage, base) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {await verifyHosted(stage, base); return;} catch (error) {
      if (attempt === 7) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

export async function stageRelease(operation) {
  await verifyBundle(operation);
  const stage = await prepareReview(operation.releaseDigest);
  const {manifest} = await verifyBundle(operation);
  await writeJson(path.join(stage, '_review/release.json'), {
    schemaVersion: 1, sourceSha: operation.sourceSha, contentDigest: operation.contentDigest,
    revisionDigest: operation.revisionDigest, digest: operation.releaseDigest, files: manifest.files, reviewFiles: await inventory(path.join(stage, '_review')),
  });
  await writeJson(path.join(stage, '_review/status.json'), {
    sourceSha: operation.sourceSha, contentDigest: operation.contentDigest, revisionDigest: operation.revisionDigest, digest: operation.releaseDigest,
    operationId: operation.operationId, previewRunId: operation.previewRunId, previewUrl: operation.previewUrl || null,
    scope: 'Checked library website release. Only the production deployment is the live website.',
  });
  return stage;
}

export async function preview(operation, env) {
  await checkHosting(env);
  const stage = await stageRelease(operation);
  try {
    const base = await deploy(stage, `cms-draft-${operation.operationId}`, operation, env);
    await waitForHosted(stage, base);
    const checked = {...operation, previewUrl: base};
    await writeJson(`${OUTPUT}/operation.json`, checked);
    await output({preview_url: base, content_digest: checked.contentDigest, release_digest: checked.releaseDigest,
      source_sha: checked.sourceSha, preview_run_id: checked.previewRunId});
    return checked;
  } finally {await rm(stage, {recursive: true, force: true});}
}

export function checkApproval(context, receipt) {
  if (!receipt?.approved || receipt.publicationScope !== 'live-website-only' || receipt.websiteUrl !== LIVE_ORIGIN ||
      receipt.operationId !== context.operationId || receipt.sourceSha !== context.sourceSha || receipt.documentId !== context.documentId ||
      receipt.documentRevision !== context.documentRevision || receipt.contentDigest !== context.contentDigest || receipt.releaseDigest !== context.releaseDigest ||
      receipt.previewRunId !== context.previewRunId || (context.revisionDigest && receipt.revisionDigest !== context.revisionDigest)) fail('A current human approval for this exact checked live release is required.');
  return receipt;
}

export async function previousStage(previous, {root = process.cwd(), fetcher = fetch} = {}) {
  if (!previous) return null;
  if (!previewUrlValid(previous.previewUrl, {}) || !sourcePattern.test(previous.sourceSha || '') || !digestPattern.test(previous.contentDigest || '') ||
      !digestPattern.test(previous.releaseDigest || '') || !operationIdPattern.test(previous.operationId || '')) fail('The previous verified live version has invalid pins.');
  const metadata = JSON.parse(await hostedBytes(previous.previewUrl, '_review/release.json', {fetcher}));
  if (metadata.sourceSha !== previous.sourceSha || metadata.contentDigest !== previous.contentDigest || metadata.digest !== previous.releaseDigest) fail('The retained previous preview does not match the verified version.');
  checkFileInventory(metadata.files, previous.releaseDigest);
  const stage = await mkdtemp(path.join(root, 'output/cms/rollback-'));
  try {
    let downloaded = 0;
    const limited = bytes => {downloaded += bytes.length; if (downloaded > 100 * 1024 * 1024) fail('Retained rollback assets exceed the 100 MB budget.'); return bytes;};
    for (const file of metadata.files) {
      if (file.path === '_review' || file.path.startsWith('_review/')) fail('Rollback content uses the reserved review path.');
      const bytes = limited(await hostedBytes(previous.previewUrl, file.path, {fetcher}));
      if (hash(bytes) !== file.sha256) fail('A retained rollback asset changed.');
      const filename = path.join(stage, file.path); await mkdir(path.dirname(filename), {recursive: true}); await writeFile(filename, bytes);
    }
    const reviewFiles = metadata.reviewFiles;
    if (!Array.isArray(reviewFiles)) fail('The retained version has no checked pictures.');
    const saved = {};
    for (const name of ['desktop.png', 'phone.png', 'evidence.json']) {
      const file = reviewFiles.find(item => item.path === name);
      if (!file || !digestPattern.test(file.sha256 || '')) fail('The retained picture inventory is incomplete.');
      const bytes = limited(await hostedBytes(previous.previewUrl, `_review/${name}`, {fetcher}));
      if (hash(bytes) !== file.sha256) fail('A retained checked picture changed.');
      if (name.endsWith('.png') && !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) fail('Retained screenshots must be PNG files.');
      saved[name] = bytes;
    }
    const evidence = JSON.parse(saved['evidence.json']);
    if (evidence.digest !== previous.releaseDigest || evidence.sourceCommit !== previous.sourceSha || evidence.errors?.length ||
        !['desktop', 'phone'].every(name => evidence.evidence?.some(item => item.name === name && item.route === '/') &&
          evidence.pictures?.[name] === hash(saved[name + '.png']))) fail('Retained screenshots do not match the verified release.');
    await mkdir(path.join(stage, '_review'), {recursive: true});
    for (const [name, bytes] of Object.entries(saved)) await writeFile(path.join(stage, '_review', name), bytes);
    // Restore the exact site bytes. Regenerate only safe review metadata, without
    // executing or trusting unpinned review HTML from a remote response.
    await writeJson(path.join(stage, '_review/release.json'), metadata);
    await writeJson(path.join(stage, '_review/status.json'), {sourceSha: previous.sourceSha, contentDigest: previous.contentDigest,
      revisionDigest: previous.revisionDigest, digest: previous.releaseDigest, operationId: previous.operationId, previewRunId: previous.previewRunId,
      previewUrl: previous.previewUrl, ...(previous.mergedSourceSha ? {mergedSourceSha: previous.mergedSourceSha} : {}), scope: 'Earlier checked live website restored after a failed update.'});
    await writeFile(path.join(stage, '_review/index.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Library website restored</title><h1>The earlier checked live website was restored</h1><p><a href="/">Open the saved website</a>. Return to the library assistant for the update status.</p><h2>Checked computer picture</h2><img style="max-width:100%" src="desktop.png" alt="Earlier checked library website on a computer"><h2>Checked phone picture</h2><img style="max-width:390px;width:100%" src="phone.png" alt="Earlier checked library website on a phone"></html>');
    await writeJson(path.join(stage, '_review/manifest.json'), {siteDigest: previous.releaseDigest,
      files: (await inventory(path.join(stage, '_review'))).filter(file => file.path !== 'manifest.json')});
    return stage;
  } catch (error) {await rm(stage, {recursive: true, force: true}); throw error;}
}

/** Isolated for fault-injection tests; production uses actual hosting CLI + HTTP reads. */
export async function promoteWithRollback({stage, previous, operation, deployer, verifier}) {
  try {
    await deployer(stage, operation);
    await verifier(stage);
    return {status: 'deployed_verified', rollback: 'not_needed'};
  } catch {
    if (!previous) return {status: 'deploy_failed', rollback: 'no_previous_verified_live', summary: 'The first live website update could not be verified.'};
    try {
      await deployer(previous.stage, previous.operation);
      await verifier(previous.stage);
      return {status: 'deploy_failed', rollback: 'restored_verified', summary: 'The update could not be verified. The earlier checked live website was restored and verified.'};
    } catch {
      return {status: 'deploy_failed', rollback: 'restoration_not_verified', summary: 'The update and automatic restoration could not be verified. The live website needs technical attention; no successful update is claimed.'};
    }
  }
}

async function publish(operation, context, env) {
  checkPins(context, operation);
  const authorization = async () => checkApproval({...context, revisionDigest: operation.revisionDigest}, await requestJson(`${context.publisherOrigin}/operations/${context.operationId}/authorization`, {headers: workerHeaders(env)}));
  const receipt = await authorization();
  // A recovery pointer recorded before the live website existed cannot restore it.
  if (receipt.previousVerified && receipt.previousVerified.websiteUrl !== LIVE_ORIGIN) fail('The live website has no verified first release yet. Merge a reviewed PR first; its checked save sets up the live website.');
  await checkHosting(env, {requireNoLive: !receipt.previousVerified});
  const snapshot = await fetchSanitySnapshot(sanityConfig(env), {token: env.SANITY_READ_TOKEN});
  checkTrigger(operation, snapshot);
  if (contentDigest(snapshot) !== operation.contentDigest) fail('Content changed after the approved preview. Prepare a fresh preview.');
  const stage = await stageRelease(operation);
  let rollback;
  try {
    rollback = await previousStage(receipt.previousVerified);
    await authorization(); // Recheck exact approval immediately before the only mutable upload.
    const result = await promoteWithRollback({stage, previous: rollback ? {stage: rollback, operation: {...operation, ...receipt.previousVerified}} : null,
      operation, deployer: (folder, version) => deploy(folder, LIVE_BRANCH, version, env), verifier: folder => waitForHosted(folder, LIVE_ORIGIN)});
    await writeJson(`${OUTPUT}/publish-result.json`, {...result, operationId: operation.operationId, sourceSha: operation.sourceSha,
      contentDigest: operation.contentDigest, releaseDigest: operation.releaseDigest, websiteUrl: LIVE_ORIGIN,
      scope: 'Actual hosted live website checks.'});
    await output({publish_status: result.status, rollback_status: result.rollback});
    if (result.status !== 'deployed_verified') fail(result.summary || 'The approved live website update could not be verified.');
    return result;
  } finally {await rm(stage, {recursive: true, force: true}); if (rollback) await rm(rollback, {recursive: true, force: true});}
}

export function checkPreviewRun(context, run) {
  if (String(run.id) !== context.previewRunId || run.path !== '.github/workflows/cms.yml' || run.event !== 'workflow_dispatch' ||
      run.status !== 'completed' || run.conclusion !== 'success' || run.head_sha !== context.sourceSha || run.head_branch !== 'main' ||
      run.repository?.full_name !== REPOSITORY || run.head_repository?.full_name !== REPOSITORY) fail('The referenced preview was not a successful trusted CMS workflow run.');
}

async function download(context, env) {
  const run = await requestJson(`https://api.github.com/repos/${REPOSITORY}/actions/runs/${context.previewRunId}`, {headers: githubHeaders(env)});
  checkPreviewRun(context, run);
  // Avoid downloading into paths containing another request's stale assets.
  await rm('output/releases', {recursive: true, force: true}); await rm('output/playwright', {recursive: true, force: true});
  await rm(OUTPUT, {recursive: true, force: true});
  execFileSync('gh', ['run', 'download', context.previewRunId, '--repo', REPOSITORY, '--name', ARTIFACT, '--dir', 'output'], {stdio: 'inherit', env});
  const operation = checkPins(context, await jsonFile(`${OUTPUT}/operation.json`));
  if (!previewUrlValid(operation.previewUrl, {})) fail('The saved preview URL is not an immutable library preview.');
  await verifyBundle(operation);
  return operation;
}

async function callback(context, stage, env) {
  if (!['preview_ready', 'build_failed', 'deploy_failed', 'deployed_verified'].includes(stage)) fail('Unknown CMS callback stage.');
  let operation = context;
  try {operation = {...context, ...await jsonFile(`${OUTPUT}/operation.json`)};} catch {}
  const body = {stage, sourceSha: context.sourceSha, documentRevision: context.documentRevision,
    ...(operation.contentDigest ? {contentDigest: operation.contentDigest} : {}),
    ...(operation.revisionDigest ? {revisionDigest: operation.revisionDigest} : {}),
    ...(operation.releaseDigest ? {releaseDigest: operation.releaseDigest} : {}),
    ...(operation.previewRunId ? {previewRunId: operation.previewRunId} : {}),
    ...(operation.previewUrl ? {previewUrl: operation.previewUrl} : {})};
  if (stage === 'deployed_verified') {
    const result = await jsonFile(`${OUTPUT}/publish-result.json`);
    if (result.status !== 'deployed_verified' || result.operationId !== context.operationId || result.releaseDigest !== operation.releaseDigest) fail('No verified hosted publication result exists.');
    body.websiteUrl = LIVE_ORIGIN;
  }
  if (stage === 'deploy_failed') {
    try {
      const result = await jsonFile(`${OUTPUT}/publish-result.json`);
      if (result.operationId === context.operationId && ['restored_verified', 'restoration_not_verified', 'no_previous_verified_live'].includes(result.rollback)) body.rollback = result.rollback;
    } catch {}
  }
  const result = await requestJson(context.callbackUrl, {method: 'POST', headers: workerHeaders(env), body});
  await writeJson(`${OUTPUT}/callback-result.json`, result);
  if (env.GITHUB_STEP_SUMMARY) await writeFile(env.GITHUB_STEP_SUMMARY, `${result.summary}\n\n[Review this update](${context.publisherOrigin}/review/${context.operationId})\n`, {flag: 'a'});
}

async function main() {
  const [action, flag, stage] = process.argv.slice(2);
  const context = inputContext();
  if (action === 'validate') return validate(context);
  if (action === 'download') return download(context, process.env);
  if (action === 'callback') return callback(context, flag === '--stage' ? stage : flag, process.env);
  const operation = await jsonFile(`${OUTPUT}/operation.json`);
  if (operation.operationId !== context.operationId || operation.sourceSha !== context.sourceSha) fail('A different CMS operation occupies this workspace.');
  if (action === 'snapshot') return captureSnapshot(operation, process.env);
  if (action === 'build') return recordBuild(operation, process.env);
  if (action === 'preview') return preview(checkPins({...context, mode: 'preview'}, operation), process.env);
  if (action === 'publish') return publish(operation, context, process.env);
  fail('Use cms-publishing.mjs validate|snapshot|build|preview|download|publish|callback --stage STAGE.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {console.error(error.message); process.exitCode = 1;});
