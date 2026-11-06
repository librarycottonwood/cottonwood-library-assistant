// After `astro build`: every public page has its own title, description, canonical address and share picture
// (BaseLayout and SeoMeta add them; docs/design-rules.md, "Search and sharing"). Missing tags are a code
// problem and fail the build. Two pages sharing a title or description usually comes from content (two events
// with the same name), so that only warns.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { SITE_URL } from '../src/content/seo.mjs';

const attributes = tag => Object.fromEntries([...tag.matchAll(/([a-zA-Z:-]+)\s*=\s*"([^"]*)"/g)].map(([, name, value]) => [name.toLowerCase(), value]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(match => attributes(match[0]));

/** Title, description, canonical and share picture of one built page; null for pages kept out of search. */
export function searchTags(html) {
  const metas = tags(html, 'meta');
  if (metas.some(meta => meta['http-equiv']?.toLowerCase() === 'refresh')) return null; // a redirect page
  if (metas.some(meta => meta.name === 'robots' && /noindex/i.test(meta.content ?? ''))) return null;
  const meta = key => metas.find(entry => entry.name === key || entry.property === key)?.content?.trim() ?? '';
  return {
    title: html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? '',
    description: meta('description'),
    canonical: tags(html, 'link').find(link => link.rel === 'canonical')?.href ?? '',
    image: meta('og:image'),
  };
}

/** pages: [{ path: '/visit/', html }]. Returns { errors, warnings } in plain words. */
export function searchTagProblems(pages) {
  const errors = [], warnings = [], seen = { title: new Map(), description: new Map() };
  for (const page of pages) {
    if (page.path.startsWith('/components/')) continue; // design-system pages, kept out of the sitemap
    const found = searchTags(page.html);
    if (!found) continue;
    for (const key of ['title', 'description']) {
      if (!found[key]) { errors.push(`${page.path} has no ${key}. Pass BaseLayout a ${key}.`); continue; }
      const other = seen[key].get(found[key]);
      if (other) warnings.push(`${page.path} has the same ${key} as ${other}: "${found[key]}".`);
      else seen[key].set(found[key], page.path);
    }
    const canonical = new URL(page.path, SITE_URL).href;
    if (found.canonical !== canonical) errors.push(`${page.path} has canonical address "${found.canonical}", expected ${canonical}.`);
    if (!found.image) errors.push(`${page.path} has no share picture (og:image).`);
  }
  return { errors, warnings };
}

async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('_')) found.push(...await htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

/** Reads every built page in `dist` (404.html counts as /404). */
export async function checkSearchTags({ dist }) {
  const pages = await Promise.all((await htmlFiles(dist)).map(async file => {
    const relative = path.relative(dist, file).split(path.sep).join('/');
    const pagePath = `/${relative.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '')}`;
    return { path: pagePath, html: await readFile(file, 'utf8') };
  }));
  return searchTagProblems(pages);
}
