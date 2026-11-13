// Daily check that every account connection the website depends on still works
// and is not about to expire. Read-only: it never changes an account, token or
// setting. Secrets stay in the environment; only ok/expiry facts are reported.
import {writeFileSync} from 'node:fs';

export const WARN_DAYS = 45;
const DAY = 86400000;
const ACCOUNT = 'e05729fd6b6fad329e31896d8b1c2da9';
const DOMAIN = 'cottonwoodcommunitylibrary.com';

// One plain status per connection: ok, warn (fix soon) or fail (broken now).
export function assess(check, now = Date.now()) {
  if (check.ok === null) return {...check, status: 'unknown'};
  if (!check.ok) return {...check, status: 'fail'};
  if (check.expiresOn) {
    const days = Math.floor((Date.parse(check.expiresOn) - now) / DAY);
    if (Number.isNaN(days)) return {...check, status: 'ok'};
    if (days < 0) return {...check, daysLeft: days, status: 'fail'};
    if (days <= WARN_DAYS) return {...check, daysLeft: days, status: 'warn'};
    return {...check, daysLeft: days, status: 'ok'};
  }
  return {...check, status: check.warn ? 'warn' : 'ok'};
}

export function overall(checks) {
  if (checks.some(c => c.status === 'fail')) return 'fail';
  if (checks.some(c => c.status === 'warn')) return 'warn';
  return 'ok';
}

async function get(url, init = {}) {
  try {
    const response = await fetch(url, {...init, signal: AbortSignal.timeout(15000)});
    let body = null;
    try { body = await response.json(); } catch {}
    return {response, body};
  } catch {
    return {response: null, body: null};
  }
}

async function cloudflare(name, token, fix) {
  if (!token) return {name, ok: null, note: 'Not configured', fix};
  for (const path of [`/accounts/${ACCOUNT}/tokens/verify`, '/user/tokens/verify']) {
    const {body} = await get('https://api.cloudflare.com/client/v4' + path, {headers: {Authorization: `Bearer ${token}`}});
    if (body?.success && body.result?.status === 'active') return {name, ok: true, expiresOn: body.result.expires_on || null, fix};
  }
  return {name, ok: false, note: 'Cloudflare rejected the token', fix};
}

async function sanity(env) {
  const name = 'Sanity content read token';
  const fix = 'Create a Viewer token in Sanity (project 2ou0xy2r → API → Tokens) and replace the SANITY_READ_TOKEN repository secret.';
  if (!env.SANITY_READ_TOKEN) return {name, ok: true, note: 'Not needed: the content dataset is public', fix};
  const url = `https://${env.SANITY_PROJECT_ID}.api.sanity.io/v2025-02-19/data/query/${env.SANITY_DATASET}?query=${encodeURIComponent('count(*[_id == "library-settings"])')}`;
  const {response} = await get(url, {headers: {Authorization: `Bearer ${env.SANITY_READ_TOKEN}`}});
  return {name, ok: !!response?.ok, note: response?.ok ? undefined : `Sanity answered ${response?.status ?? 'nothing'}`, fix};
}

async function publisher(env) {
  const origin = env.CMS_PUBLISHER_ORIGIN;
  const headers = {Authorization: `Bearer ${env.CMS_STATUS_TOKEN}`};
  const monitor = await get(origin + '/monitor', {method: 'POST', headers});
  const checks = [{name: 'Website publisher (saves)', ok: !!monitor.response?.ok,
    note: monitor.response?.ok ? undefined : `Publisher answered ${monitor.response?.status ?? 'nothing'}`,
    fix: 'Check the CMS publisher Worker in the library Cloudflare account and its CMS_STATUS_TOKEN.'}];
  const connections = await get(origin + '/connections', {method: 'POST', headers});
  const fix = 'In the librarycottonwood GitHub account, create a replacement token (only this repository; Actions write, Contents read; no expiry) and replace the publisher Worker secret GITHUB_DISPATCH_TOKEN.';
  if (connections.response?.status === 404) checks.push({name: 'Publisher GitHub token', ok: null, note: 'Publisher update with this check not deployed yet', fix});
  else {
    const github = connections.body?.github;
    checks.push({name: 'Publisher GitHub token', ok: !!github?.ok, expiresOn: github?.expiresOn ? github.expiresOn.replace(' UTC', 'Z').replace(' ', 'T') : null,
      note: github?.ok ? undefined : `GitHub answered ${github?.status ?? 'nothing'}`, fix});
  }
  return checks;
}

async function github(path, env) {
  return get(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}${path}`, {headers: {Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json'}});
}

async function repairSignIn(env, now) {
  const name = 'Automatic repair sign-in (library ChatGPT)';
  const fix = 'Reconnect it: the library assistant opens an issue titled "Reconnect automatic repairs" (assistant/MAINTENANCE.md → "Renew the repair sign-in").';
  const runs = (await github('/actions/workflows/upkeep.yml/runs?branch=main&per_page=30', env)).body?.workflow_runs || [];
  const signInRuns = runs.filter(r => r.status === 'completed' && ['schedule', 'workflow_dispatch', 'issues'].includes(r.event) && r.conclusion !== 'skipped');
  const last = signInRuns[0];
  const vaults = (await github('/actions/artifacts?name=library-codex-auth&per_page=10', env)).body?.artifacts || [];
  const newest = vaults.filter(a => !a.expired).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!last) return {name, ok: null, note: 'No recent sign-in run', fix};
  if (last.conclusion !== 'success') return {name, ok: false, note: `Last sign-in run ${last.conclusion} on ${last.created_at.slice(0, 10)}`, fix};
  // The stored sign-in is kept 90 days; a weekly run renews it.
  return {name, ok: true, expiresOn: newest ? new Date(Date.parse(newest.created_at) + 90 * DAY).toISOString() : null, fix};
}

async function analytics(env) {
  const name = 'Visitor reports (Google Analytics)';
  const fix = 'Follow connector/README.md recovery; the library assistant uses the reconnect page.';
  const {body} = await github('/contents/.library-analytics-checks/latest.json?ref=maintenance-reports', env);
  if (!body?.content) return {name, ok: null, note: 'No daily result yet', fix};
  const report = JSON.parse(Buffer.from(body.content, 'base64').toString());
  return {name, ok: report.result === 'success', note: report.result === 'success' ? undefined : `Daily check: ${report.status}`, fix};
}

async function domain() {
  const name = `Web address ${DOMAIN} (Squarespace)`;
  const fix = 'Renewal is automatic at Squarespace; the board keeps a working card on that account.';
  const {body} = await get(`https://rdap.verisign.com/com/v1/domain/${DOMAIN}`);
  const expiry = body?.events?.find(e => e.eventAction === 'expiration')?.eventDate;
  return expiry ? {name, ok: true, expiresOn: expiry, fix} : {name, ok: null, note: 'Registry did not answer', fix};
}

export async function run(env = process.env, now = Date.now()) {
  const pages = 'Create a replacement Account API token in the library Cloudflare account with the same permissions and no expiry, then replace the repository secret';
  const raw = [
    await cloudflare('Live website hosting token', env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_TRIAL_API_TOKEN, `${pages} CLOUDFLARE_TRIAL_API_TOKEN.`),
    await cloudflare('Publisher deploy token', env.CMS_PUBLISHER_DEPLOY_TOKEN, `${pages} CMS_PUBLISHER_DEPLOY_TOKEN.`),
    await cloudflare('Visitor-report deploy token', env.LIBRARY_ANALYTICS_DEPLOY_TOKEN, `${pages} LIBRARY_ANALYTICS_DEPLOY_TOKEN.`),
    await sanity(env),
    ...await publisher(env),
    await repairSignIn(env, now),
    await analytics(env),
    await domain(),
  ];
  const checks = raw.map(c => assess(c, now));
  return {checkedAt: new Date(now).toISOString(), status: overall(checks), warnDays: WARN_DAYS, checks};
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = await run();
  writeFileSync(process.argv[2] || 'connections.json', JSON.stringify(report, null, 2) + '\n');
  const icon = {ok: '✅', warn: '⚠️', fail: '❌', unknown: '❔'};
  const lines = ['| Connection | Status | Expires | Note |', '| --- | --- | --- | --- |',
    ...report.checks.map(c => `| ${c.name} | ${icon[c.status]} ${c.status} | ${c.expiresOn ? c.expiresOn.slice(0, 10) + (c.daysLeft !== undefined ? ` (${c.daysLeft} days)` : '') : (c.status === 'ok' ? 'never' : '–')} | ${c.note || ''} |`)];
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n', {flag: 'a'});
  console.log(lines.join('\n'));
}
