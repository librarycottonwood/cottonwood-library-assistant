import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
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
let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) { try { await access('/usr/bin/chromium'); executablePath = '/usr/bin/chromium'; } catch {} }
let browser;
const errors = [], evidence = [];
try {
  browser = await chromium.launch({ executablePath, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['phone', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`${name}: ${message.text()}`); });
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      // Exercise the real address/directions fallback in offline cloud captures.
      // Live map rendering is checked separately with the provider available.
      if (url.hostname === 'tiles.openfreemap.org') return route.fulfill({ contentType: 'application/json', body: '{}' });
      return url.origin === base ? route.continue() : route.abort();
    });
    for (const file of manifest.files.filter(file => file.path.endsWith('.html') && file.path !== '404.html')) {
      const route = '/' + file.path.replace(/index\.html$/, '');
      const response = await page.goto(base + route, { waitUntil: 'networkidle' });
      if (!response?.ok()) throw new Error(`Failed to load ${route}`);
      await page.evaluate(() => document.fonts.ready);
      const heading = await page.locator('h1').first().innerText();
      if (!heading.trim()) throw new Error(`Missing page heading: ${route}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (overflow) throw new Error(`Horizontal overflow on ${name}: ${route}`);
      for (const link of await page.locator('a[href]').evaluateAll(links => links.map(a => a.getAttribute('href')).filter(href => href.startsWith('/') && !href.startsWith('//')))) {
        const target = new URL(link, base);
        const check = await page.request.get(target.href);
        if (!check.ok()) throw new Error(`Broken internal link on ${route}: ${link}`);
      }
      if (route === '/') {
        // Lazy illustrations can enter view after fonts settle. Wait for visible images.
        await page.evaluate(() => Promise.all(Array.from(document.images)
          .filter(img => { const box = img.getBoundingClientRect(); return box.top < innerHeight && box.bottom > 0; })
          .map(img => img.decode())));
        await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: false });
      }
      evidence.push({ name, viewport, route, heading });
    }
    await page.close();
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const pictures = {};
  for (const name of ['desktop', 'phone']) pictures[name] = createHash('sha256').update(await readFile(path.join(output, `${name}.png`))).digest('hex');
  await writeFile(path.join(output, 'evidence.json'), JSON.stringify({ digest, pictures, sourceCommit: manifest.sourceCommit, capturedAt: new Date().toISOString(), mode: 'offline prototype; map address/directions fallback exercised; external requests blocked', rerun: `pnpm assistant:capture -- ${digest}`, evidence, errors }, null, 2));
  console.log(`Screenshots and checks: ${output}`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
