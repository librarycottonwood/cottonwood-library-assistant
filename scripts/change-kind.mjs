// Which kind of change a pull request makes, so the check can skip work that cannot
// matter (Actions minutes are limited). Writes kind=docs|content|code to GITHUB_OUTPUT.
// Any doubt, error or very large change means code: the full checks run.
// This only saves time; trusted publish-live.mjs classifies the PR again before it
// accepts a skipped preview.
import {appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {changeKind} from './content-changes.mjs';

export async function prKind({repository, base, head, token}, {fetcher = fetch} = {}) {
  if (!/^[0-9a-f]{40}$/.test(base || '') || !/^[0-9a-f]{40}$/.test(head || '')) return 'code';
  try {
    const response = await fetcher(`https://api.github.com/repos/${repository}/compare/${base}...${head}`, {
      headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'Cottonwood-check'},
      redirect: 'error', signal: AbortSignal.timeout(30000)});
    if (!response.ok) return 'code';
    const {files} = await response.json();
    // GitHub lists at most 300 files here; a longer list may be incomplete.
    if (!Array.isArray(files) || files.length >= 300) return 'code';
    return changeKind(files.flatMap(file => [file.filename, file.previous_filename].filter(Boolean)));
  } catch { return 'code'; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const {GITHUB_REPOSITORY: repository, BASE_SHA: base, HEAD_SHA: head, GH_TOKEN: token, GITHUB_OUTPUT} = process.env;
  const kind = await prKind({repository, base, head, token});
  console.log(`Change kind: ${kind}`);
  if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `kind=${kind}\n`);
}
