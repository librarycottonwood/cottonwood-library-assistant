// After `astro build`: the page structure screen readers rely on, checked on every built page. Each page has a language,
// exactly one h1, headings that never skip a level (an h1 followed by an h3 hides a level from people who jump between
// headings), alt text on every picture (alt="" for decoration) and a title on every frame. A problem fails the build;
// fix the component that renders it (Heading, Card and PostList take a heading level).
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const attributes = tag => Object.fromEntries([...tag.matchAll(/([a-zA-Z:-]+)(?:\s*=\s*"([^"]*)")?/g)].slice(1).map(([, name, value]) => [name.toLowerCase(), value ?? '']));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(match => attributes(match[0]));

/** Problems on one built page, in plain words. */
export function pageAccessibilityProblems(pagePath, html) {
  const problems = [];
  if (/<meta\b[^>]*http-equiv="refresh"/i.test(html)) return problems; // a redirect page
  if (!tags(html, 'html')[0]?.lang) problems.push(`${pagePath} has no lang on <html>.`);
  const body = html.slice(html.search(/<body\b/i));
  const levels = [...body.matchAll(/<h([1-6])\b/gi)].map(match => Number(match[1]));
  const ones = levels.filter(level => level === 1).length;
  if (ones !== 1) problems.push(`${pagePath} has ${ones} h1 headings; a page has exactly one (PageTitle or the homepage hero).`);
  let previous = 0;
  for (const level of levels) {
    if (level > previous + 1) problems.push(`${pagePath} jumps from ${previous ? `h${previous}` : 'the top of the page'} to h${level}; headings never skip a level (give the Card or PostList a lower heading level).`);
    previous = level;
  }
  const pictures = tags(body, 'img').filter(img => !('alt' in img));
  if (pictures.length) problems.push(`${pagePath} has ${pictures.length} picture(s) without alt text (${pictures.map(img => img.src).join(', ')}).`);
  for (const frame of tags(body, 'iframe')) if (!frame.title?.trim()) problems.push(`${pagePath} has a frame without a title (${frame.src}).`);
  return problems;
}

/** pages: [{ path: '/visit/', html }]. Design-system pages (/components/) are not public and are skipped. */
export function accessibilityProblems(pages) {
  return pages.filter(page => !page.path.startsWith('/components/')).flatMap(page => pageAccessibilityProblems(page.path, page.html));
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

/** Reads every built page in `dist`. */
export async function checkAccessibility({ dist }) {
  const pages = await Promise.all((await htmlFiles(dist)).map(async file => {
    const relative = path.relative(dist, file).split(path.sep).join('/');
    return { path: `/${relative.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '')}`, html: await readFile(file, 'utf8') };
  }));
  return accessibilityProblems(pages);
}
