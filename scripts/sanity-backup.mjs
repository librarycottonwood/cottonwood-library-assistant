/** Weekly CMS backup: every Sanity record plus its pictures and PDFs, in the same
 * .tar.gz layout `sanity dataset export` writes, so `sanity dataset import` restores it.
 *
 * Usage: SANITY_PROJECT_ID=… SANITY_DATASET=… node scripts/sanity-backup.mjs --out output/backup.tar.gz
 *
 * SANITY_READ_TOKEN is optional. Without it the export API returns the published records of
 * this public dataset (unsaved drafts are left out) and pictures come from the public CDN,
 * which may re-compress them. With a Viewer token drafts and original picture files are included.
 * The token is only sent to the Sanity API and is never written to the archive or the log.
 * Read-only: nothing in Sanity is changed.
 */
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SANITY_API_VERSION, sanityConfig } from '../src/content/sanity.mjs';

const ASSET_TYPES = { 'sanity.imageAsset': 'image', 'sanity.fileAsset': 'file' };
// Asset document fields Sanity sets again on import; the rest is kept in assets.json.
const EXCLUDE_META = ['_id', '_type', 'assetId', 'extension', 'mimeType', 'path', 'uploadId', 'url'];
const ASSET_REF = /^(image-[a-f0-9]{40}-\d+x\d+-[a-z0-9]+|file-[a-f0-9]{40}-[a-z0-9]+)$/;
const ASSET_HOSTS = new Set(['cdn.sanity.io']);
const MAX_ASSET_BYTES = 200 * 1024 * 1024;

/** image-<sha1>-800x600-jpg → images/<sha1>-800x600.jpg; file-<sha1>-pdf → files/<sha1>.pdf */
export function assetPath(assetId) {
  const match = /^(image|file)-(.+?)(?:-([a-z0-9]+))?$/.exec(assetId);
  if (!match) throw Error(`Unexpected asset id ${assetId}`);
  return `${match[1]}s/${match[2]}.${match[3] ?? 'bin'}`;
}

/** Replace each {asset: {_ref}} with the `_sanityAsset` pointer `sanity dataset import` reads. */
export function rewriteAssets(value) {
  if (Array.isArray(value)) return value.map(rewriteAssets);
  if (!value || typeof value !== 'object') return value;
  const ref = value.asset?._ref;
  if (typeof ref === 'string' && ASSET_REF.test(ref)) {
    const { asset, ...rest } = value;
    return { _sanityAsset: `${ref.split('-')[0]}@file://./${assetPath(ref)}`, ...rewriteAssets(rest) };
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, rewriteAssets(child)]));
}

async function fetchRetry(fetcher, url, init, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetcher(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(120000) });
      if (response.ok || response.status === 404 || response.status === 401 || response.status === 403 || attempt >= tries) return response;
    } catch (error) {
      if (attempt >= tries) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
  }
}

export async function createBackup({ config, token, out, fetch: fetcher = globalThis.fetch, now = new Date(), log = console.log }) {
  const auth = token ? { Authorization: `Bearer ${token}` } : {};
  const exportUrl = `https://${config.projectId}.api.sanity.io/v${SANITY_API_VERSION}/data/export/${config.dataset}`;
  const response = await fetchRetry(fetcher, exportUrl, { headers: auth });
  if (!response.ok) throw Error(`Sanity export failed (HTTP ${response.status}). Nothing was saved.`);
  const lines = (await response.text()).split('\n').filter(line => line.trim());
  const documents = lines.map(line => JSON.parse(line));
  const failure = documents.find(doc => doc.error || !doc._id || !doc._type);
  if (failure) throw Error(`Sanity export returned an unexpected record: ${JSON.stringify(failure).slice(0, 200)}`);
  if (!documents.some(doc => !ASSET_TYPES[doc._type])) throw Error('Sanity export returned no content records. Nothing was saved.');

  const prefix = `${config.dataset}-export-${now.toISOString().slice(0, 10)}`;
  const work = await mkdtemp(path.join(tmpdir(), 'sanity-backup-'));
  try {
    const root = path.join(work, prefix);
    await mkdir(path.join(root, 'images'), { recursive: true });
    await mkdir(path.join(root, 'files'), { recursive: true });
    const assetMap = {}, missing = [], data = [];
    let assetCount = 0, assetBytes = 0, cdnCopies = 0;
    for (const doc of documents) {
      const type = ASSET_TYPES[doc._type];
      if (!type) { data.push(JSON.stringify(rewriteAssets(doc))); continue; }
      const url = new URL(doc.url);
      if (url.protocol !== 'https:' || !ASSET_HOSTS.has(url.hostname)) throw Error(`Asset ${doc._id} is not on the Sanity CDN.`);
      // With a token, ask for the untouched original like `sanity dataset export` does. Without one
      // the public CDN may serve a re-compressed copy of a picture (same size and look, other bytes).
      const original = type === 'file' || Boolean(token);
      if (type === 'image' && token) url.searchParams.set('dlRaw', 'true');
      const asset = await fetchRetry(fetcher, url, { headers: type === 'image' ? auth : {} });
      if (!asset.ok) {
        if ([401, 403, 404].includes(asset.status)) { missing.push(`${doc._id} (HTTP ${asset.status})`); continue; }
        throw Error(`Downloading ${doc._id} failed (HTTP ${asset.status}).`);
      }
      const bytes = Buffer.from(await asset.arrayBuffer());
      if (bytes.length > MAX_ASSET_BYTES) throw Error(`Asset ${doc._id} is larger than expected.`);
      const sha1 = createHash('sha1').update(bytes).digest('hex');
      const md5 = createHash('md5').update(bytes).digest('hex');
      const sentSha1 = asset.headers.get('x-sanity-sha1'), sentMd5 = asset.headers.get('x-sanity-md5');
      if ((sentSha1 && sentSha1 !== sha1) || (sentMd5 && sentMd5 !== md5) || (original && doc.sha1hash && sha1 !== doc.sha1hash))
        throw Error(`Asset ${doc._id} did not match its checksum; the download was incomplete.`);
      if (!original) cdnCopies++;
      await writeFile(path.join(root, assetPath(doc._id)), bytes);
      const meta = Object.fromEntries(Object.entries(doc).filter(([key]) => !EXCLUDE_META.includes(key)));
      if (Object.keys(meta).length) assetMap[`${type}-${sha1}`] = meta;
      assetCount++; assetBytes += bytes.length;
    }
    await writeFile(path.join(root, 'data.ndjson'), data.join('\n') + '\n');
    await writeFile(path.join(root, 'assets.json'), JSON.stringify(assetMap) + '\n');
    await mkdir(path.dirname(path.resolve(out)), { recursive: true });
    const tar = spawnSync('tar', ['-czf', path.resolve(out), '-C', work, prefix], { env: { ...process.env, COPYFILE_DISABLE: '1' }, encoding: 'utf8' });
    if (tar.status !== 0) throw Error(`Packing the backup failed: ${tar.stderr || tar.error}`);
    const drafts = documents.filter(doc => /^(drafts|versions)\./.test(doc._id)).length;
    const summary = { project: config.projectId, dataset: config.dataset, createdAt: now.toISOString(), records: data.length, drafts,
      draftsIncluded: Boolean(token), assets: assetCount, assetBytes, picturesAsCdnCopies: cdnCopies, missingAssets: missing };
    log(JSON.stringify(summary));
    if (missing.length) log(`Warning: ${missing.length} asset(s) could not be downloaded: ${missing.join(', ')}`);
    return summary;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const at = process.argv.indexOf('--out');
  const out = at > -1 ? process.argv[at + 1] : null;
  if (!out || !out.endsWith('.tar.gz')) { console.error('Usage: node scripts/sanity-backup.mjs --out <file.tar.gz>'); process.exit(2); }
  try {
    await createBackup({ config: sanityConfig(process.env), token: process.env.SANITY_READ_TOKEN || undefined, out });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
