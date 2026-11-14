import { launchBrowser } from './browser.mjs';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { verify } from './release.mjs';
import { createHash } from 'node:crypto';

const digest = process.argv.slice(2).filter(arg => arg !== '--')[0];
const { dir, manifest } = await verify(digest);
const site = path.join(dir, 'site');
const output = path.resolve('output/playwright', digest);
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(site, '.' + pathname);
    if (!file.startsWith(site + path.sep) && file !== site) { res.writeHead(403).end(); return; }
    if (!path.extname(file)) file = path.join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const errors = [], evidence = [];
// Most of the time is each page's network-idle wait, so a few tabs load at once.
// Evidence keeps the page order; each internal link target is fetched once per run.
const TABS = 4;
const routes = manifest.files.filter(file => file.path.endsWith('.html') && file.path !== '404.html').map(file => '/' + file.path.replace(/index\.html$/, ''));
const linkChecks = new Map();
const linkWorks = href => {
  if (!linkChecks.has(href)) linkChecks.set(href, fetch(href).then(response => response.ok, () => false));
  return linkChecks.get(href);
};
try {
  browser = await launchBrowser({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const openTab = async (name, viewport) => {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`${name}: ${message.text()}`); });
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      // Exercise the real address/directions fallback in offline cloud captures.
      // Live map rendering is checked separately with the provider available.
      if (url.hostname === 'tiles.openfreemap.org') return route.fulfill({ contentType: 'application/json', body: '{}' });
      // Same for an active fundraiser: an empty Givebutter library leaves the widget undefined,
      // so the "See progress and give on Givebutter" fallback link is what gets checked.
      if (url.hostname === 'widgets.givebutter.com') return route.fulfill({ contentType: 'text/javascript', body: '' });
      // Turnstile's spam check only runs on the real site; an empty script keeps the form usable.
      if (url.hostname === 'challenges.cloudflare.com') return route.fulfill({ contentType: 'text/javascript', body: '' });
      return url.origin === base ? route.continue() : route.abort();
    });
    return page;
  };
  const check = async (page, name, viewport, route) => {
    console.log(`Checking ${name}: ${route}`);
    const html = await readFile(path.join(site, route.endsWith('/') ? `${route}index.html` : route), 'utf8');
    const redirect = html.match(/<meta http-equiv="refresh" content="\d+;url=([^"]+)"/i);
    const response = await page.goto(base + route, { waitUntil: 'networkidle' });
    if (!response?.ok()) throw new Error(`Failed to load ${route}`);
    // Astro's static redirects navigate after the initial document loads.
    // Read their target from the built file, since the browser can discard the
    // original response during navigation. Inspect only the loaded destination.
    if (redirect) {
      await page.waitForURL(new URL(redirect[1], response.url()).href, { waitUntil: 'networkidle' });
    }
    await page.evaluate(() => document.fonts.ready);
    const heading = await page.locator('h1').first().innerText();
    if (!heading.trim()) throw new Error(`Missing page heading: ${route}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (overflow) throw new Error(`Horizontal overflow on ${name}: ${route}`);
    for (const link of await page.locator('a[href]').evaluateAll(links => links.map(a => a.getAttribute('href')).filter(href => href.startsWith('/') && !href.startsWith('//')))) {
      if (!await linkWorks(new URL(link, base).href)) throw new Error(`Broken internal link on ${route}: ${link}`);
    }
    // Lazy illustrations can enter view after fonts settle. Wait for visible images.
    await page.evaluate(() => Promise.all(Array.from(document.images)
      .filter(img => { const box = img.getBoundingClientRect(); return box.top < innerHeight && box.bottom > 0; })
      .map(img => img.decode())));
    const filename = `${name}-${createHash('sha256').update(route).digest('hex').slice(0,16)}.png`;
    const bytes = await page.screenshot({ path: path.join(output, filename), fullPage: false });
    if (route === '/') await writeFile(path.join(output, `${name}.png`), bytes);
    return { name, viewport, route, heading, picture: {file: filename, sha256: createHash('sha256').update(bytes).digest('hex')} };
  };
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['phone', { width: 390, height: 844 }]]) {
    const results = [];
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(TABS, routes.length) }, async () => {
      const page = await openTab(name, viewport);
      try {
        while (next < routes.length) { const index = next++; results[index] = await check(page, name, viewport, routes[index]); }
      } finally { await page.close(); }
    }));
    evidence.push(...results);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const pictures = {};
  for (const name of ['desktop', 'phone']) pictures[name] = createHash('sha256').update(await readFile(path.join(output, `${name}.png`))).digest('hex');
  await writeFile(path.join(output, 'evidence.json'), JSON.stringify({ digest, pictures, sourceCommit: manifest.sourceCommit, capturedAt: new Date().toISOString(), mode: 'offline prototype; map address/directions fallback exercised; external requests blocked', rerun: `pnpm release:capture -- ${digest}`, evidence, errors }, null, 2));
  console.log(`Screenshots and checks: ${output}`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
