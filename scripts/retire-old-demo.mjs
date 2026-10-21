import {mkdir, mkdtemp, writeFile, rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {REPOSITORY, TRIAL_ORIGIN, sourcePattern, digestPattern, operationIdPattern} from '../cms-publisher/src/contract.mjs';
import {checkHosting} from './cms-publishing.mjs';

export const OLD_DEMO = 'https://trial.cottonwood-library-trial-preview.pages.dev';
const PUBLISHER = 'https://cottonwood-library-cms-publisher.librarycottonwood.workers.dev';
const OUTPUT = 'output/trial-retirement';
const routes = ['/', '/librarynews/', '/librarynews/?view=events', '/visit/', '/_review/status.json'];
const fail = message => {throw Error(message);};
const jsonFile = async (name, value) => writeFile(path.join(OUTPUT, name), JSON.stringify(value, null, 2) + '\n', {mode: 0o600});
async function readJson(url, options = {}, fetcher = fetch) {
  const response = await fetcher(url, {...options, redirect: 'error', signal: AbortSignal.timeout(15000)});
  if (!response.ok) fail('The existing trial or publishing record could not be verified.');
  const text = await response.text();
  if (Buffer.byteLength(text) > 1024 * 1024) fail('The trial verification record is too large.');
  return JSON.parse(text);
}

export async function verifyDestination(env, {fetcher = fetch} = {}) {
  if (env.CMS_PUBLISHER_ORIGIN !== PUBLISHER || !env.CMS_STATUS_TOKEN || env.CMS_STATUS_TOKEN.length < 32) fail('The existing private CMS status connection is required.');
  const monitor = await readJson(PUBLISHER + '/monitor', {method: 'POST', headers: {Authorization: `Bearer ${env.CMS_STATUS_TOKEN}`}}, fetcher);
  const last = monitor.lastVerified;
  if (last?.websiteUrl !== TRIAL_ORIGIN || !sourcePattern.test(last.sourceSha || '') || !digestPattern.test(last.contentDigest || '') ||
      !digestPattern.test(last.releaseDigest || '') || !operationIdPattern.test(last.operationId || '')) fail('A verified approved CMS trial is required before retiring the demo.');
  const status = await readJson(TRIAL_ORIGIN + '/_review/status.json', {}, fetcher);
  if (status.operationId !== last.operationId || status.sourceSha !== last.sourceSha || status.contentDigest !== last.contentDigest || status.digest !== last.releaseDigest) fail('The CMS trial differs from its approved publishing record.');
  const homepage = await fetcher(TRIAL_ORIGIN + '/', {redirect: 'error', signal: AbortSignal.timeout(15000)});
  if (!homepage.ok || !homepage.headers.get('content-type')?.includes('text/html')) fail('The CMS trial homepage is unavailable.');
  await homepage.body?.cancel();
  return status;
}

export async function prepareRedirect(stage) {
  await mkdir(stage, {recursive: true});
  await writeFile(path.join(stage, '_redirects'), `/* ${TRIAL_ORIGIN}/:splat 302\n`);
  await writeFile(path.join(stage, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Library trial website</title><meta http-equiv="refresh" content="0;url=${TRIAL_ORIGIN}/"><h1>The library trial website has moved</h1><p><a href="${TRIAL_ORIGIN}/">Open the library trial website</a>.</p></html>`);
}

export async function verifyRedirects({origin = OLD_DEMO, fetcher = fetch} = {}) {
  const checks = [];
  for (const route of routes) {
    const response = await fetcher(origin + route, {redirect: 'manual', signal: AbortSignal.timeout(15000)});
    const location = response.headers.get('location');
    await response.body?.cancel();
    if (response.status !== 302 || location !== TRIAL_ORIGIN + route) fail('An old demo address did not redirect to the matching CMS trial page.');
    checks.push({route, status: response.status, location});
  }
  return checks;
}

async function main(env = process.env) {
  if (env.GITHUB_REPOSITORY !== REPOSITORY || env.GITHUB_REF !== 'refs/heads/main' || env.GITHUB_EVENT_NAME !== 'workflow_dispatch' ||
      env.GITHUB_WORKFLOW_REF !== `${REPOSITORY}/.github/workflows/retire-old-demo.yml@refs/heads/main` ||
      !sourcePattern.test(env.GITHUB_SHA || '') || env.LIBRARY_CONTENT_SOURCE !== 'sanity') fail('Demo retirement is restricted to its trusted main workflow.');
  await mkdir(OUTPUT, {recursive: true});
  await checkHosting(env);
  const approved = await verifyDestination(env);
  let checks;
  try {checks = await verifyRedirects();} catch {}
  if (!checks) {
    const previous = await readJson(OLD_DEMO + '/_review/status.json');
    if (!sourcePattern.test(previous.sourceSha || '') || !digestPattern.test(previous.digest || '')) fail('The old demo recovery version could not be identified.');
    await jsonFile('before.json', {oldDemo: OLD_DEMO, previous, destination: TRIAL_ORIGIN, approved});
    const stage = await mkdtemp(path.join(OUTPUT, 'redirect-'));
    try {
      await prepareRedirect(stage);
      const safe = Object.fromEntries(Object.entries(env).filter(([key]) => ['PATH', 'HOME', 'TMPDIR', 'TMP', 'TEMP', 'CI', 'PNPM_HOME', 'NODE_EXTRA_CA_CERTS', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'].includes(key)));
      execFileSync('pnpm', ['exec', 'wrangler', 'pages', 'deploy', stage, '--project-name', 'cottonwood-library-trial-preview', '--branch', 'trial',
        '--commit-hash', env.GITHUB_SHA, '--commit-dirty=true', '--commit-message', 'Retire old demo; use the CMS trial'], {stdio: 'inherit', env: {...safe, WRANGLER_SEND_METRICS: 'false'}});
      for (let attempt = 0; attempt < 12; attempt++) {
        try {checks = await verifyRedirects(); break;} catch {if (attempt === 11) throw Error('The old demo redirect could not be verified.');}
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } finally {await rm(stage, {recursive: true, force: true});}
  }
  const after = await verifyDestination(env);
  if (after.operationId !== approved.operationId || after.digest !== approved.digest) fail('The CMS trial changed during retirement; check the current approved result again.');
  const result = {status: 'retired_verified', verifiedAt: new Date().toISOString(), oldDemo: OLD_DEMO, websiteUrl: TRIAL_ORIGIN,
    approvedWebsiteStatus: after, redirects: checks, scope: 'Old demo redirected; the approved CMS trial and public library domain were not modified.'};
  await jsonFile('result.json', result);
  console.log('Old demo retired. Use ' + TRIAL_ORIGIN + '/');
  if (env.GITHUB_STEP_SUMMARY) await writeFile(env.GITHUB_STEP_SUMMARY, `[Library trial website](${TRIAL_ORIGIN}/)\n\nOld demo bookmarks redirect to the matching page.\n`, {flag: 'a'});
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {console.error(error.message); process.exitCode = 1;});
