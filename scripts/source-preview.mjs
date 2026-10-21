import {readFile, writeFile, mkdir, cp, rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {inventory, digestOf, prepareReview} from './release.mjs';
import {contentDigest, readSnapshot} from './cms.mjs';
import {sanityConfig, fetchSanitySnapshot} from '../src/content/sanity.mjs';
import {checkFileInventory, checkHosting, verifyHosted} from './cms-publishing.mjs';
import {REPOSITORY, sourcePattern, digestPattern, previewUrlValid} from '../cms-publisher/src/contract.mjs';

const ROOT = 'output/source-preview';
const BUNDLE = `${ROOT}/bundle`;
const PROJECT = 'cottonwood-library-trial-preview';
const ACCOUNT = 'e05729fd6b6fad329e31896d8b1c2da9';
const ARTIFACT = 'library-source-checked-preview';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async filename => JSON.parse(await readFile(filename, 'utf8'));
const save = async (filename, value) => {
  await mkdir(path.dirname(filename), {recursive: true});
  await writeFile(filename, JSON.stringify(value, null, 2) + '\n');
};
const fail = message => {throw new Error(message);};

export function checkContext(run, pr) {
  if (run.repository?.full_name !== REPOSITORY || run.head_repository?.full_name !== REPOSITORY ||
      run.event !== 'pull_request' || run.path !== '.github/workflows/check.yml' || run.status !== 'completed' || run.conclusion !== 'success' ||
      !sourcePattern.test(run.head_sha || '') || !Number.isSafeInteger(run.id) ||
      !Number.isSafeInteger(pr.number) || pr.number < 1 || pr.state !== 'open' ||
      pr.base?.repo?.full_name !== REPOSITORY || pr.base?.ref !== 'main' ||
      pr.head?.repo?.full_name !== REPOSITORY || pr.head?.sha !== run.head_sha ||
      !run.pull_requests?.some(item => item.number === pr.number)) fail('The code draft is closed, changed, or not a successful library pull-request check.');
  return {repository: REPOSITORY, sourceSha: run.head_sha, runId: String(run.id), pullRequest: pr.number};
}

async function github(endpoint, {env = process.env, method = 'GET', body} = {}) {
  if (!env.GH_TOKEN) fail('The existing GitHub workflow connection is required.');
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}${endpoint}`, {
    method, headers: {Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json'},
    ...(body ? {body: JSON.stringify(body)} : {}), redirect: 'error', signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) fail(`GitHub preview request failed (${response.status}).`);
  return response.status === 204 ? null : response.json();
}

async function context(env = process.env) {
  if (!/^[1-9][0-9]{0,19}$/.test(env.SOURCE_RUN_ID || '')) fail('A checked run ID is required.');
  const run = await github(`/actions/runs/${env.SOURCE_RUN_ID}`, {env});
  if (run.pull_requests?.length !== 1) fail('The checked run must identify exactly one code draft.');
  const pr = await github(`/pulls/${run.pull_requests[0].number}`, {env});
  const value = checkContext(run, pr);
  const artifacts = await github(`/actions/runs/${value.runId}/artifacts?name=${ARTIFACT}`, {env});
  const matches = artifacts.artifacts?.filter(item => item.name === ARTIFACT && !item.expired);
  if (matches?.length !== 1 || !Number.isSafeInteger(matches[0].id) || matches[0].size_in_bytes > 100 * 1024 * 1024) fail('The checked code preview is missing, expired, or too large.');
  await save(`${ROOT}/context.json`, value);
  if (env.GITHUB_OUTPUT) await writeFile(env.GITHUB_OUTPUT, `artifact_id=${matches[0].id}\npull_request=${value.pullRequest}\n`, {flag: 'a'});
  return value;
}

export async function checkBundle(bundle, expected, config) {
  const manifest = await json(path.join(bundle, 'manifest.json'));
  if (manifest.schemaVersion !== 1 || manifest.repository !== REPOSITORY ||
      manifest.sourceSha !== expected.sourceSha || manifest.runId !== expected.runId || manifest.pullRequest !== expected.pullRequest ||
      !sourcePattern.test(manifest.sourceSha || '') || !digestPattern.test(manifest.contentDigest || '') ||
      !digestPattern.test(manifest.digest || '')) fail('The preview does not match this checked code draft.');
  const files = await inventory(path.join(bundle, 'site'));
  checkFileInventory(files, manifest.digest);
  if (files.some(file => file.path.startsWith('_review/') || file.path.split('/').some(part => ['functions', '_worker.js', '_headers', '_redirects'].includes(part))) ||
      JSON.stringify(files) !== JSON.stringify(manifest.files) || !files.some(file => file.path === 'index.html')) fail('The draft must contain only the checked static website.');
  const version = await json(path.join(bundle, 'site/_content/version.json'));
  if (version.provider !== 'sanity' || version.sourceSha !== manifest.sourceSha || version.contentDigest !== manifest.contentDigest || version.workingTreeChanged) fail('The preview did not use clean source and published library content.');
  const snapshot = await readSnapshot(path.join(bundle, 'snapshot.json'), config);
  if (contentDigest(snapshot) !== manifest.contentDigest) fail('The preview content snapshot changed.');
  const evidence = await json(path.join(bundle, 'evidence/evidence.json'));
  if (evidence.sourceCommit !== manifest.sourceSha || evidence.digest !== manifest.digest || !Array.isArray(evidence.errors) || evidence.errors.length ||
      !['desktop', 'phone'].every(name => evidence.evidence?.some(item => item.name === name && item.route === '/'))) fail('The preview has no matching computer and phone checks.');
  for (const name of ['desktop', 'phone']) {
    const bytes = await readFile(path.join(bundle, 'evidence', `${name}.png`));
    if (!bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || hash(bytes) !== evidence.pictures?.[name]) fail('A checked preview picture changed.');
  }
  const allFiles = await inventory(bundle);
  const allowed = new Set(['manifest.json', 'snapshot.json', 'evidence/evidence.json', 'evidence/desktop.png', 'evidence/phone.png', ...files.map(file => `site/${file.path}`)]);
  if (allFiles.some(file => !allowed.has(file.path))) fail('The preview archive contains unexpected files.');
  return manifest;
}

async function bundle(digest, env = process.env) {
  if (!digestPattern.test(digest || '') || env.GITHUB_EVENT_NAME !== 'pull_request' || env.GITHUB_REPOSITORY !== REPOSITORY) fail('Bundle creation requires a library code-draft check.');
  const event = await json(env.GITHUB_EVENT_PATH);
  const pr = event.pull_request;
  const expected = {repository: REPOSITORY, sourceSha: pr.head.sha, runId: env.GITHUB_RUN_ID, pullRequest: pr.number};
  if (pr.head.repo.full_name !== REPOSITORY || pr.base.ref !== 'main' || !sourcePattern.test(expected.sourceSha) ||
      execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim() !== expected.sourceSha) fail('Build the exact library draft source.');
  const release = await json(`output/releases/${digest}/manifest.json`);
  const snapshot = await readSnapshot(`${ROOT}/snapshot.json`, sanityConfig(env));
  await rm(BUNDLE, {recursive: true, force: true});
  await mkdir(BUNDLE, {recursive: true});
  await cp(`output/releases/${digest}/site`, `${BUNDLE}/site`, {recursive: true});
  await cp(`output/playwright/${digest}`, `${BUNDLE}/evidence`, {recursive: true});
  await cp(`${ROOT}/snapshot.json`, `${BUNDLE}/snapshot.json`);
  await save(`${BUNDLE}/manifest.json`, {...expected, schemaVersion: 1, digest, files: release.files, contentDigest: contentDigest(snapshot)});
  await checkBundle(BUNDLE, expected, sanityConfig(env));
  console.log('Checked code preview bundled with published library content.');
}

async function deploy(env = process.env) {
  const expected = await json(`${ROOT}/context.json`);
  // Read the current PR again immediately before upload; never publish a stale link as current.
  const current = await context(env);
  if (JSON.stringify(current) !== JSON.stringify(expected)) fail('The code draft changed while its preview was prepared.');
  const config = sanityConfig(env);
  const manifest = await checkBundle(`${ROOT}/download`, expected, config);
  const live = await fetchSanitySnapshot(config);
  if (contentDigest(live) !== manifest.contentDigest) fail('Library content changed. Rerun the code draft checks for a fresh preview.');
  await checkHosting(env);
  const release = `output/releases/${manifest.digest}`;
  await mkdir(release, {recursive: true});
  await cp(`${ROOT}/download/site`, `${release}/site`, {recursive: true});
  await save(`${release}/manifest.json`, {digest: manifest.digest, sourceCommit: manifest.sourceSha, files: manifest.files});
  await cp(`${ROOT}/download/evidence`, `output/playwright/${manifest.digest}`, {recursive: true});
  const stage = await prepareReview(manifest.digest);
  try {
    await save(path.join(stage, '_review/source.json'), {...expected, digest: manifest.digest, contentDigest: manifest.contentDigest, scope: 'Code draft preview only; saving and trial publication remain separate.'});
    const safeEnv = Object.fromEntries(Object.entries(env).filter(([key]) => ['PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'CI', 'NODE_EXTRA_CA_CERTS', 'PNPM_HOME'].includes(key)));
    const log = execFileSync('pnpm', ['exec', 'wrangler', 'pages', 'deploy', stage, '--project-name', PROJECT,
      '--branch', `source-draft-${expected.pullRequest}-${expected.sourceSha.slice(0, 12)}`, '--commit-hash', expected.sourceSha,
      '--commit-dirty=true', '--commit-message', 'Checked library code draft'], {
      encoding: 'utf8', env: {...safeEnv, CLOUDFLARE_ACCOUNT_ID: ACCOUNT, CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN, WRANGLER_SEND_METRICS: 'false'},
    });
    const url = log.match(/https:\/\/[a-f0-9]{8}\.cottonwood-library-trial-preview\.pages\.dev/g)?.at(-1);
    if (!previewUrlValid(url + '/', env)) fail('The upload returned no immutable library preview link.');
    for (let attempt = 0; ; attempt++) {
      try {await verifyHosted(stage, url); break;} catch (error) {
        if (attempt === 7) throw error;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    const latest = await context(env);
    if (JSON.stringify(latest) !== JSON.stringify(expected)) fail('A newer code draft replaced this preview.');
    const result = {...expected, digest: manifest.digest, contentDigest: manifest.contentDigest, previewUrl: url + '/', verifiedAt: new Date().toISOString(), trialPublished: false};
    await save(`${ROOT}/result.json`, result);
    const marker = '<!-- cottonwood-source-preview -->';
    const body = `${marker}\n[Open the website preview](${result.previewUrl})\n\nThis is the checked code draft with the library’s published content. The saved trial has not changed.\n\nSource: \`${expected.sourceSha}\``;
    const comments = await github(`/issues/${expected.pullRequest}/comments?per_page=100`, {env});
    const previous = comments.find(item => item.user?.login === 'github-actions[bot]' && item.body?.startsWith(marker));
    await github(previous ? `/issues/comments/${previous.id}` : `/issues/${expected.pullRequest}/comments`, {env, method: previous ? 'PATCH' : 'POST', body: {body}});
    if (env.GITHUB_STEP_SUMMARY) await writeFile(env.GITHUB_STEP_SUMMARY, body + '\n', {flag: 'a'});
    console.log(result.previewUrl);
  } finally {await rm(stage, {recursive: true, force: true});}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [action, digest] = process.argv.slice(2);
  ({bundle: () => bundle(digest), context, deploy}[action] || (() => fail('Use bundle, context, or deploy.')))().catch(error => {console.error(error.message); process.exitCode = 1;});
}
