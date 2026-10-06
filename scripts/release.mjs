import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const releases = path.join(root, 'output/releases');
export async function inventory(dir, prefix = '') {
  const entries = await readdir(path.join(dir, prefix), { withFileTypes: true });
  const result = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const name = path.posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Release contains a symbolic link: ${name}`);
    if (entry.isDirectory()) result.push(...await inventory(dir, name));
    else result.push({ path: name, sha256: createHash('sha256').update(await readFile(path.join(dir, name))).digest('hex') });
  }
  return result;
}
export const digestOf = files => createHash('sha256').update(JSON.stringify(files)).digest('hex');
export async function verify(digest) {
  if (!/^[a-f0-9]{64}$/.test(digest ?? '')) throw new Error('A complete saved-version digest is required.');
  const dir = path.join(releases, digest);
  const manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8'));
  const files = await inventory(path.join(dir, 'site'));
  if (manifest.digest !== digest || digestOf(files) !== digest || JSON.stringify(manifest.files) !== JSON.stringify(files)) {
    throw new Error('Saved version changed. Prepare a new preview and request approval again.');
  }
  return { dir, manifest };
}
async function main() {
  const [action, digest] = process.argv.slice(2).filter(arg => arg !== '--');
  if (action === 'prepare') {
    const files = await inventory(path.join(root, 'dist'));
    if (!files.some(file => file.path === 'index.html')) throw new Error('Build the site first.');
    const version = digestOf(files);
    const dir = path.join(releases, version);
    try {
      await mkdir(dir, { recursive: false });
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'EEXIST') throw error;
      if (error.code === 'EEXIST') {
        await verify(version);
        console.log(version);
        return;
      }
      await mkdir(releases, { recursive: true });
      await mkdir(dir);
    }
    await cp(path.join(root, 'dist'), path.join(dir, 'site'), { recursive: true });
    let sourceCommit = null;
    try { sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
    await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ digest: version, sourceCommit, createdAt: new Date().toISOString(), files }, null, 2));
    await verify(version);
    console.log(version);
    return;
  }
  const { dir } = await verify(digest);
  if (action === 'verify') { console.log(`Verified ${digest}`); return; }
  if (action !== 'preview') throw new Error('Only prepare, verify, and preview are supported.');
  const project = process.env.CLOUDFLARE_PREVIEW_PROJECT;
  if (!/^[a-z0-9-]+$/.test(project ?? '') || !project.includes('preview')) {
    throw new Error('Set a dedicated CLOUDFLARE_PREVIEW_PROJECT whose name includes preview.');
  }
  // Deliberately no production action or real-domain project configuration.
  // The administrator must provision this separate project with production_branch=production.
  execFileSync('pnpm', ['exec', 'wrangler', 'pages', 'deploy', path.join(dir, 'site'), '--project-name', project, '--branch', `draft-${digest.slice(0,12)}`], { stdio: 'inherit', cwd: dir });
}
if (process.argv[1] === new URL(import.meta.url).pathname) main().catch(error => { console.error(error.message); process.exitCode = 1; });
