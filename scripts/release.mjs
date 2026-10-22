import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
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
export async function prepareReview(digest) {
  const { dir } = await verify(digest);
  const pictures = path.join(root, 'output/playwright', digest);
  const evidence = JSON.parse(await readFile(path.join(pictures, 'evidence.json'), 'utf8'));
  if (evidence.digest !== digest || evidence.errors.length || !['desktop', 'phone'].every(name => evidence.evidence.some(item => item.name === name && item.route === '/'))) {
    throw new Error('Capture and check this saved version before sharing it.');
  }
  const files = await inventory(path.join(dir, 'site'));
  if (files.some(file => file.path === '_review' || file.path.startsWith('_review/'))) throw new Error('The site already uses the reserved review path.');
  const stage = await mkdtemp(path.join(releases, 'review-'));
  try {
    await cp(path.join(dir, 'site'), stage, { recursive: true });
    await mkdir(path.join(stage, '_review'));
    for (const name of ['desktop', 'phone']) {
      const bytes = await readFile(path.join(pictures, `${name}.png`));
      if (!bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('Review pictures must be PNG images.');
      if (createHash('sha256').update(bytes).digest('hex') !== evidence.pictures?.[name]) throw new Error('Review pictures changed. Capture this saved version again.');
      await writeFile(path.join(stage, '_review', `${name}.png`), bytes);
    }
    // New captures include each checked page so the assistant can show the actual
    // changed page in chat. Legacy releases retain their homepage pictures.
    for (const item of evidence.evidence.filter(item => item.picture)) {
      const {file, sha256} = item.picture;
      if (!/^(desktop|phone)-[a-f0-9]{16}\.png$/.test(file)) throw new Error('Invalid checked page picture.');
      const bytes = await readFile(path.join(pictures, file));
      if (!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || createHash('sha256').update(bytes).digest('hex') !== sha256) throw new Error('Checked page picture changed.');
      await writeFile(path.join(stage, '_review', file), bytes);
    }
    await cp(path.join(pictures, 'evidence.json'), path.join(stage, '_review/evidence.json'));
    await writeFile(path.join(stage, '_review/index.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your library preview</title><style>body{font:18px system-ui;margin:2rem auto;max-width:1000px;padding:0 1rem}img{max-width:100%;height:auto;border:1px solid #ddd}.phone{max-width:390px}</style><h1>Your library preview</h1><p>Here is how your draft looks on a computer and a phone. <a href="/">Explore the draft website</a>.</p><h2>Computer</h2><img src="desktop.png" alt="Library homepage on a computer"><h2>Phone</h2><img class="phone" src="phone.png" alt="Library homepage on a phone"></html>');
    await writeFile(path.join(stage, '_review/manifest.json'), JSON.stringify({ siteDigest: digest, files: await inventory(path.join(stage, '_review')) }, null, 2));
    await verify(digest);
    return stage;
  } catch (error) { await rm(stage, { recursive: true, force: true }); throw error; }
}
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
  const stage = await prepareReview(digest);
  try {
    const log = execFileSync('pnpm', ['exec', 'wrangler', 'pages', 'deploy', stage, '--project-name', project, '--branch', `draft-${digest.slice(0,12)}`], { encoding: 'utf8', cwd: dir });
    console.log(log);
    const urls = log.match(/https:\/\/[a-f0-9]+\.[a-z0-9-]+\.pages\.dev/g);
    if (!urls?.length) throw new Error('The upload returned no immutable preview link. Check the deployment before sharing.');
    const base = urls.at(-1);
    const delivery = { digest, preview: base, pictures: `${base}/_review/`, desktop: `${base}/_review/desktop.png`, phone: `${base}/_review/phone.png` };
    await writeFile(path.join(dir, 'preview.json'), JSON.stringify(delivery, null, 2));
    console.log(JSON.stringify(delivery, null, 2));
  } finally { await rm(stage, { recursive: true, force: true }); }
}
if (process.argv[1] === new URL(import.meta.url).pathname) main().catch(error => { console.error(error.message); process.exitCode = 1; });
