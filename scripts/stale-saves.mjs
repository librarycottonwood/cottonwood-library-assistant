// Closes website saves nobody said yes to. Only PRs whose every changed file is a
// content-update file are touched; code PRs are never closed by this script.
import {pathToFileURL} from 'node:url';
import {isContentUpdatePath, parseContentUpdate, COMMENT_MARKER} from './content-changes.mjs';

const REPOSITORY = 'librarycottonwood/cottonwood-library-assistant';
export const STALE_DAYS = 14;
const KEEP_BRANCHES = new Set(['main', 'maintenance-reports']);

export const isContentSave = files => files.length > 0 && files.every(file => isContentUpdatePath(file.filename));
export function isStale(pr, now, days = STALE_DAYS) {
  return pr.state === 'open' && pr.base?.ref === 'main' && pr.head?.repo?.full_name === REPOSITORY && !KEEP_BRANCHES.has(pr.head.ref) &&
    now - Date.parse(pr.updated_at) > days * 24 * 60 * 60 * 1000;
}

export function closingComment({requests, documentIds, changesUrl}) {
  const lines = [`This website save waited more than ${STALE_DAYS} days without a yes, so it has been closed to keep things tidy.`, '',
    '**Nothing from this save went live on the website.**', '',
    '**Heads up:** anything that was already published in the website editor (Sanity) for this save is **not** undone. It is still published there, and it will go live with the next save anyone makes.'];
  if (requests.length) lines.push('', `What it was for: ${requests.join(' / ')}`);
  if (documentIds.length) lines.push('', 'Sanity documents it listed:', ...documentIds.map(id => `- \`${id}\``));
  if (changesUrl) lines.push('', `Everything its preview would have put live (including changes from other people) is listed in [this comment](${changesUrl}).`);
  lines.push('', 'Still want this change? Ask the library assistant to save it again. Don\'t want it? Ask the assistant to undo it in the editor so it does not go live with someone else\'s save.');
  return lines.join('\n');
}

async function github(route, env, {method = 'GET', body} = {}) {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/${route}`, {method,
    headers: {Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'Cottonwood-stale-saves', ...(body ? {'Content-Type': 'application/json'} : {})},
    ...(body ? {body: JSON.stringify(body)} : {}), redirect: 'error', signal: AbortSignal.timeout(30000)});
  if (!response.ok) throw Error(`GitHub ${method} ${route.split('?')[0]} failed (${response.status}).`);
  return response.status === 204 ? null : response.json();
}
async function all(route, env) {
  const items = [];
  for (let page = 1; page <= 30; page++) {
    const batch = await github(`${route}${route.includes('?') ? '&' : '?'}per_page=100&page=${page}`, env);
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

export async function closeStaleSaves(env = process.env, {now = Date.now(), log = console.log} = {}) {
  if (env.GITHUB_REPOSITORY !== REPOSITORY) throw Error('Stale save cleanup is restricted to the library repository.');
  const dryRun = env.DRY_RUN === 'true';
  const closed = [];
  for (const pr of await all('pulls?state=open', env)) {
    if (!isStale(pr, now)) continue;
    const files = await all(`pulls/${pr.number}/files`, env);
    if (!isContentSave(files)) {log(`#${pr.number}: not a content-only save; left open.`); continue;}
    const requests = [], documentIds = [];
    for (const file of files.filter(item => item.status !== 'removed')) {
      try {
        const body = await github(`contents/${file.filename.split('/').map(encodeURIComponent).join('/')}?ref=${pr.head.sha}`, env);
        const update = parseContentUpdate(Buffer.from(body.content ?? '', 'base64').toString('utf8'));
        requests.push(update.request);
        documentIds.push(...update.documentIds);
      } catch (error) {log(`#${pr.number}: could not read ${file.filename} (${error.message}).`);}
    }
    const comments = await all(`issues/${pr.number}/comments`, env);
    const changes = comments.find(item => item.user?.type === 'Bot' && item.body?.includes(COMMENT_MARKER));
    const body = closingComment({requests, documentIds: [...new Set(documentIds)], changesUrl: changes?.html_url});
    log(`#${pr.number} "${pr.title}": ${dryRun ? 'would close' : 'closing'} (last activity ${pr.updated_at}).`);
    if (!dryRun) {
      await github(`issues/${pr.number}/comments`, env, {method: 'POST', body: {body}});
      await github(`pulls/${pr.number}`, env, {method: 'PATCH', body: {state: 'closed'}});
      await github(`git/refs/heads/${pr.head.ref.split('/').map(encodeURIComponent).join('/')}`, env, {method: 'DELETE'})
        .catch(error => log(`#${pr.number}: branch ${pr.head.ref} not deleted (${error.message}).`));
    }
    closed.push(pr.number);
  }
  log(closed.length ? `${dryRun ? 'Would close' : 'Closed'}: ${closed.map(n => '#' + n).join(', ')}` : 'No stale content saves.');
  return closed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) closeStaleSaves().catch(error => {console.error(error.message); process.exitCode = 1;});
