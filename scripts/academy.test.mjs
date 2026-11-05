// Run after pnpm build. Exercise the shipped HTML/JS, not a second rendering of the lessons.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { launchBrowser } from './browser.mjs';

const root = path.resolve('dist');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };

test('academy navigation, copy/fallback, tool directory, privacy and print views', async () => {
  const server = createServer(async (req, res) => {
    let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (!path.extname(file)) file = path.join(file, 'index.html');
    try { res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream'); res.end(await readFile(file)); }
    catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const errors = [];
  await mkdir('output/academy', { recursive: true });
  try {
    browser = await launchBrowser();
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin + '/academy/');
    const routes = await page.locator('a[href^="/academy/"]').evaluateAll(links => [...new Set(links.map(a => a.getAttribute('href')))]);
    assert.equal(routes.length, 9, 'home, six lessons, handbook and desk guide');
    assert.equal(await page.locator('main img').count(), 0, 'the guide index has no decorative imagery');
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of routes) {
        const response = await page.goto(origin + route);
        assert.ok(response.ok(), route);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('h1').count(), 1, route);
        assert.equal(await page.locator('.lesson-menu').getAttribute('open') !== null, width >= 768, 'sidebar is open on desktop and collapsed on phone');
        if (route !== '/academy/print/' && route !== '/academy/quick-reference/') {
          const title = await page.locator('h1').boundingBox();
          assert.ok(title.y < 180, 'content starts near the top, without a hero');
          assert.equal(await page.locator('.academy-sidebar a[aria-current="page"]').count(), 1, 'current guide is identified in navigation');
        }

        assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}: ${route}`);
        const text = await page.locator('body').innerText();
        assert.doesNotMatch(text, /librarycottonwood@gmail\.com|toddhaines7@gmail\.com|170378|ACCOUNT-REGISTER|pluginrel_/, 'private handoff data must not enter public HTML');
        for (const href of await page.locator('a[href^="/academy/"]').evaluateAll(links => links.map(a => a.getAttribute('href')))) {
          assert.ok((await page.request.get(origin + href)).ok(), `internal academy link ${href}`);
        }
        if (route === '/academy/' || route === '/academy/when-something-goes-wrong/' || route === '/academy/accounts-and-tools/' || route === '/academy/quick-reference/' || route === '/academy/everyday-jobs/') {
          const name = route.split('/').filter(Boolean).at(-1);
          await page.screenshot({ path: `output/academy/${width}-${name}.png`, fullPage: true });
        }
      }
    }
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ['/components/', '/components/ui/', '/components/type-sizes/']) {
        assert.ok((await page.goto(origin + route)).ok());
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}: ${route}`);
        const name = route.split('/').filter(Boolean).join('-');
        await page.screenshot({ path: `output/academy/${width}-${name}.png`, fullPage: true });
        await page.locator('.catalog-index summary').click();
        assert.equal(await page.locator('.catalog-nav a').last().isVisible(), true);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}: expanded catalog`);
      }
    }
    await page.goto(origin + '/academy/accounts-and-tools/');
    assert.equal(await page.locator('article.service-card').count(), 15);
    assert.equal(await page.locator('main details').count(), 0, 'service information is visible without opening anything');
    assert.equal(await page.locator('.service-open').count(), 15);
    for (const link of await page.locator('.service-open').all()) assert.equal(await link.isVisible(), true);
    assert.equal(await page.locator('.service-icon img').count(), 10);
    assert.equal(await page.locator('.service-icon img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), true, 'service logos load locally');
    for (const name of ['ChatGPT', 'Codex', 'Sanity', 'GitHub', 'Cloudflare', 'Squarespace', 'Google Analytics', 'Givebutter', 'Buffer', 'Facebook & Instagram', 'Google Drive', 'Gmail', 'Follett Destiny', 'Square', 'Spaceship']) {
      assert.equal(await page.getByRole('heading', { name, exact: true }).count(), 1, `explains ${name}`);
    }
    assert.doesNotMatch(await page.locator('main').innerText(), /Zoom/);
    for (const anchor of await page.locator('.platform-overview a[href^="#"], .service-group-links a').evaluateAll(links => links.map(a => a.getAttribute('href')))) {
      assert.equal(await page.locator(anchor).count(), 1, 'platform explanation links to the named service');
    }
    assert.equal(await page.locator('.academy-sidebar').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 255, 255)');
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto(origin + '/academy/practice-with-a-buddy/');
    await page.getByText('Browse lessons', { exact: true }).click();
    assert.equal(await page.locator('.lesson-menu a').last().isVisible(), true);
    await page.getByText('Browse lessons', { exact: true }).click();
    await page.getByRole('button', { name: 'Copy message' }).first().click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(copied.startsWith('Let’s practice.'));
    assert.match(copied, /without changing the website or sending anything/);
    assert.match(await page.getByRole('status').first().innerText(), /Copied/);
    await page.evaluate(() => { Object.defineProperty(navigator.clipboard, 'writeText', { value: async () => { throw new Error('Denied'); } }); });
    await page.getByRole('button', { name: 'Copy message' }).first().click();
    assert.match(await page.getByRole('status').first().innerText(), /Select and copy the message/);
    await page.goto(origin + '/academy/quick-reference/');
    await page.evaluate(() => { window.print = () => { document.body.dataset.printCalled = 'yes'; }; });
    await page.getByRole('button', { name: 'Print or save a PDF' }).click();
    assert.equal(await page.locator('body').getAttribute('data-print-called'), 'yes');
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.academy-header').isVisible(), false);
    assert.equal(await page.locator('.desk-guide').isVisible(), true);
    await page.goto(origin + '/academy/print/');
    assert.equal(await page.locator('.print-lesson').count(), 6);
    assert.equal(await page.locator('.service-card').count(), 15);
    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 844 } });
    const plain = await noJS.newPage();
    await plain.goto(origin + '/academy/practice-with-a-buddy/');
    assert.equal(await plain.locator('.lesson-menu a').last().isVisible(), true, 'navigation works without JavaScript');
    assert.ok(await plain.locator('[data-prompt-text]').first().isVisible());
    assert.equal(await plain.locator('[data-copy-prompt]').first().isVisible(), false);
    await plain.goto(origin + '/academy/accounts-and-tools/');
    assert.equal(await plain.locator('.service-open').first().isVisible(), true);
    assert.equal(await plain.locator('main details').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
});
