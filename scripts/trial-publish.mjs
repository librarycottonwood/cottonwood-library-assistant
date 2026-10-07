import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { prepareReview } from './release.mjs';

const [source, branch = 'trial'] = process.argv.slice(2);
if (!/^[a-f0-9]{40}$/.test(source ?? '') || !['trial', 'repair-test'].includes(branch)) {
  throw new Error('A checked source version and a dedicated trial branch are required.');
}
const project = 'cottonwood-library-trial-preview';
const account = 'e05729fd6b6fad329e31896d8b1c2da9';
if (process.env.CLOUDFLARE_ACCOUNT_ID !== account || !process.env.CLOUDFLARE_API_TOKEN) {
  throw new Error('The library-owned trial hosting connection is required.');
}
let digest;
for (const entry of await readdir('output/releases', { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^[a-f0-9]{64}$/.test(entry.name)) continue;
  const manifest = JSON.parse(await readFile(path.join('output/releases', entry.name, 'manifest.json'), 'utf8'));
  if (manifest.sourceCommit === source) { digest = entry.name; break; }
}
if (!digest) throw new Error('No checked release matches this exact source version.');
const evidence = JSON.parse(await readFile(path.join('output/playwright', digest, 'evidence.json'), 'utf8'));
if (evidence.sourceCommit !== source) throw new Error('The pictures were checked for a different source version.');
const stage = await prepareReview(digest);
try {
  const status = { sourceSha: source, digest, branch,
    checkedAt: evidence.capturedAt,
    scope: 'Saved trial website; desktop/phone checks with external services blocked. Public library domain unchanged.',
    checkRun: process.env.LIBRARY_CHECK_URL || null };
  await writeFile(path.join(stage, '_review/status.json'), JSON.stringify(status, null, 2) + '\n');
  execFileSync('pnpm', ['exec', 'wrangler', 'pages', 'deploy', stage,
    '--project-name', project, '--branch', branch, '--commit-hash', source,
    '--commit-dirty=true'], { stdio: 'inherit', cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') });
  const base = `https://${branch}.${project}.pages.dev`;
  let matched = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const response = await fetch(`${base}/_review/status.json`, { cache: 'no-store' });
      const hosted = await response.json();
      if (response.ok && hosted.sourceSha === source && hosted.digest === digest) { matched = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  if (!matched) throw new Error('The stable trial address has not returned this checked version yet.');
  for (const route of ['/', '/_review/', '/_review/desktop.png', '/_review/phone.png']) {
    const response = await fetch(base + route);
    if (!response.ok) throw new Error(`The hosted trial check failed for ${route}.`);
    await response.arrayBuffer();
  }
  console.log(`Checked saved trial: ${base}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await writeFile(process.env.GITHUB_STEP_SUMMARY,
      `Your saved trial website is ready. 😊 [Take a look](${base}) · [Computer and phone pictures](${base}/_review/)\n`, { flag: 'a' });
  }
} finally { await rm(stage, { recursive: true, force: true }); }
