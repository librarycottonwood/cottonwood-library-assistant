// Library image rules. `prepare` makes a new photo or screenshot web-ready;
// `check` blocks saving when any picture breaks the rules below.
import sharp from 'sharp';
import { readdir, readFile, stat, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const LIMITS = { maxEdge: 2400, sourceBytes: 1_200_000, publicBytes: 150_000, servedBytes: 300_000 };
const RASTER = /\.(png|jpe?g|webp|avif|gif)$/i;
const SOURCES = ['library-files/images', 'library-files/logos', 'src/assets', 'public'];
// Pictures in these folders must be used by the site, so unused uploads don't pile up.
const MUST_BE_USED = ['library-files/images', 'src/assets'];

async function walk(dir, match) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const found = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await walk(full, match));
    else if (match.test(entry.name)) found.push(full);
  }
  return found.sort();
}

export const slug = name => path.parse(name).name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image';

// Re-encode one picture: upright, at most 2400px, no hidden metadata (camera, GPS).
// Photos become JPEG; screenshots, logos and graphics become PNG.
// With inPlace, the file keeps its name and format so existing references still work.
export async function prepare(input, { outDir = 'library-files/images', name, inPlace = false } = {}) {
  const meta = await sharp(input, { failOn: 'error' }).metadata();
  // Screenshots and flat graphics have few colors (low entropy); photos have many.
  const graphic = inPlace ? /\.png$/i.test(input) : meta.hasAlpha || (await sharp(input).stats()).entropy < 6.5;
  const image = sharp(input, { failOn: 'error' }).rotate().resize({ width: LIMITS.maxEdge, height: LIMITS.maxEdge, fit: 'inside', withoutEnlargement: true });
  const output = inPlace ? input : path.join(outDir, `${slug(name || input)}.${graphic ? 'png' : 'jpg'}`);
  const bytes = graphic
    ? await image.png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 }).toBuffer()
    : await image.flatten({ background: '#ffffff' }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  await writeFile(output, bytes);
  if (path.resolve(output) !== path.resolve(input) && path.resolve(path.dirname(input)) === path.resolve(outDir)) await rm(input);
  return output;
}

export async function pruneUnusedBuiltImages({root = '.', dist = 'dist'} = {}) {
  // Astro emits imported local originals even when CMS replacements mean no
  // page uses them. Keep every referenced asset and every source/recovery file.
  const originals = new Set((await Promise.all(SOURCES.filter(dir => dir !== 'public')
    .map(dir => walk(path.join(root, dir), RASTER)))).flat().map(file => path.basename(file)));
  const textFiles = await walk(path.join(root, dist), /\.(html|css|m?js|json|svg|xml|txt|webmanifest|map)$/i);
  const references = await Promise.all(textFiles.map(file => readFile(file, 'utf8')));
  const removed = [];
  for (const file of await walk(path.join(root, dist, '_astro'), RASTER)) {
    const name = path.basename(file);
    const emitted = name.match(/^(.+)\.[A-Za-z0-9_-]+\.(png|jpe?g|webp|avif|gif)$/i);
    if (!emitted || !originals.has(`${emitted[1]}.${emitted[2]}`)) continue;
    if (references.some(text => text.includes(name) || text.includes(encodeURIComponent(name)))) continue;
    await rm(file);
    removed.push(path.relative(path.join(root, dist), file));
  }
  return removed;
}

export async function check({ root = '.', dist } = {}) {
  const problems = [];
  const at = file => path.relative(root, file);
  for (const dir of SOURCES) {
    for (const file of await walk(path.join(root, dir), RASTER)) {
      const { size } = await stat(file);
      const meta = await sharp(file).metadata();
      const limit = dir === 'public' ? LIMITS.publicBytes : LIMITS.sourceBytes;
      if (size > limit) problems.push(`${at(file)} is ${Math.round(size / 1000)} KB (limit ${limit / 1000} KB).`);
      if (Math.max(meta.width, meta.height) > LIMITS.maxEdge) problems.push(`${at(file)} is ${meta.width}×${meta.height}px (limit ${LIMITS.maxEdge}px).`);
      if (meta.exif || meta.xmp || meta.iptc) problems.push(`${at(file)} still has hidden photo details (camera/location).`);
    }
  }
  const code = await walk(path.join(root, 'src'), /\.(astro|ts|tsx|js|mjs|css)$/);
  const text = await Promise.all(code.map(file => readFile(file, 'utf8')));
  for (const dir of MUST_BE_USED) {
    for (const file of await walk(path.join(root, dir), RASTER)) {
      if (!text.some(content => content.includes(path.basename(file)))) problems.push(`${at(file)} isn't used on the site. Delete it or use it.`);
    }
  }
  code.forEach((file, i) => {
    if (/src=\{[^}]*\.src\s*\}/.test(text[i])) problems.push(`${at(file)} shows an imported picture with <img src={x.src}>. Use <Image> from astro:assets so it is resized and converted.`);
    if (/url\(\s*['"]?[^)'"]*\.(png|jpe?g)['"]?\s*\)/i.test(text[i])) problems.push(`${at(file)} uses a PNG/JPEG as a CSS background. Use a WebP under ${LIMITS.publicBytes / 1000} KB or <Image>.`);
  });
  if (dist) {
    for (const file of await walk(path.join(root, dist), RASTER)) {
      if (path.relative(path.join(root, dist), file).startsWith('_review')) continue;
      const { size } = await stat(file);
      if (size > LIMITS.servedBytes) problems.push(`Built picture ${at(file)} is ${Math.round(size / 1000)} KB (limit ${LIMITS.servedBytes / 1000} KB). Use smaller widths or lower quality.`);
    }
  }
  return problems;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [action, ...rest] = process.argv.slice(2).filter(arg => arg !== '--');
  if (action === 'prepare' && rest.length) {
    const nameAt = rest.indexOf('--name');
    const name = nameAt >= 0 ? rest.splice(nameAt, 2)[1] : undefined;
    const inPlace = rest.includes('--in-place');
    for (const input of rest.filter(arg => arg !== '--in-place')) console.log(await prepare(input, { name, inPlace }));
  } else if (action === 'check') {
    const problems = await check({ dist: rest.includes('--dist') ? 'dist' : undefined });
    if (problems.length) { console.error(`Picture check failed:\n- ${problems.join('\n- ')}\nFix: pnpm assistant:image -- <file> [--name new-name]`); process.exit(1); }
    console.log('Picture check passed.');
  } else {
    console.error('Usage: node scripts/images.mjs prepare <file...> [--name name] | check [--dist]');
    process.exit(2);
  }
}
