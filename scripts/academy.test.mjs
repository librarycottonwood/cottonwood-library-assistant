// Run after pnpm build. Exercise the shipped HTML/JS, not a second rendering of the lessons.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { launchBrowser } from './browser.mjs';

test('assistant wiki stays in sync with the whole academy', () => {
  execFileSync(process.execPath, ['scripts/academy-wiki.mjs', '--check']);
});

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
    assert.equal(routes.length, 14, 'home, eleven lessons, handbook and desk guide');
    assert.deepEqual(await page.locator('.lesson-nav-title').allTextContents(), ['Start here', 'Library tasks', 'Behind the scenes']);
    assert.equal(await page.locator('main img').count(), 0, 'the guide index has no decorative imagery');
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of routes) {
        const response = await page.goto(origin + route);
        assert.ok(response.ok(), route);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('h1').count(), 1, route);
        for (const example of await page.locator('[data-prompt]').all()) {
          const open = example.locator('[data-open-prompt]');
          assert.equal(await open.count(), 1, 'every example has its own ChatGPT link');
          const destination = new URL(await open.getAttribute('href'));
          assert.equal(destination.origin, 'https://chatgpt.com');
          assert.equal(destination.pathname, '/');
          assert.equal(destination.searchParams.get('surface'), 'work');
          assert.equal(destination.searchParams.get('prompt'), await example.locator('[data-prompt-text]').innerText(), 'full example survives URL encoding');
          assert.deepEqual([...destination.searchParams.keys()].sort(), ['prompt', 'surface']);
          assert.equal(await open.getAttribute('target'), '_blank');
          assert.match(await open.getAttribute('rel'), /noopener/);
        }

        assert.equal(await page.locator('.lesson-menu').getAttribute('open') !== null, width >= 768, 'sidebar is open on desktop and collapsed on phone');
        if (route !== '/academy/print/' && route !== '/academy/quick-reference/') {
          const title = await page.locator('h1').boundingBox();
          const header = await page.locator('.academy-header').boundingBox();
          assert.ok(title.y < header.height + 120, 'content starts just below the header and mobile menu');
          assert.equal(await page.locator('.academy-sidebar a[aria-current="page"]').count(), 1, 'current guide is identified in navigation');
        }

        for (const figure of await page.locator('.lesson-screenshot').all()) {
          const image = figure.locator('img');
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(img => img.decode());
          assert.ok((await image.getAttribute('alt')).length > 20, 'screenshot explains the real control');
          assert.equal(await figure.locator('a').count(), 0, 'screenshots have no fullscreen link');
        }
        if (route === '/academy/start-here/') assert.equal(await page.locator('.lesson-screenshot').count(), 2);
        if (['/academy/start-here/', '/academy/print/'].includes(route)) {
          const sequence = await page.locator('#first-message > .steps, #first-message > .lesson-screenshot').evaluateAll(nodes => nodes.map(node => node.tagName === 'OL' ? `steps-${node.start}` : node.dataset.view));
          assert.deepEqual(sequence, ['steps-1', 'navigation', 'steps-2', 'message', 'steps-3'], 'New chat and Send illustrations appear before their own steps');
        }
        for (const section of await page.locator('.lesson-part').all()) {
          let next = 1;
          for (const list of await section.locator(':scope > ol.steps').all()) {
            assert.equal(await list.evaluate(node => node.start), next, 'step numbers continue across illustrations');
            next += await list.locator(':scope > li').count();
          }
          const prompt = section.locator(':scope > .prompt');
          const steps = section.locator(':scope > .steps');
          if (await prompt.count() && await steps.count()) assert.ok(await prompt.evaluate(node => !!(node.compareDocumentPosition(node.parentElement.querySelector('.steps')) & Node.DOCUMENT_POSITION_FOLLOWING)), 'the example is available before instructions refer to its reply');
        }

        if (route === '/academy/library-assistant/') assert.equal(await page.locator('.lesson-screenshot').count(), 1);
        await page.evaluate(() => window.scrollTo(0, 0));
        assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}: ${route}`);
        const text = await page.locator('body').innerText();
        assert.doesNotMatch(text, /librarycottonwood@gmail\.com|toddhaines7@gmail\.com|170378|ACCOUNT-REGISTER|pluginrel_/, 'private handoff data must not enter public HTML');
        for (const href of await page.locator('a[href^="/academy/"]').evaluateAll(links => links.map(a => a.getAttribute('href')))) {
          assert.ok((await page.request.get(origin + href)).ok(), `internal academy link ${href}`);
        }
        if (['/academy/chatgpt-tour/', '/academy/files-and-links/', '/academy/facebook-posts/'].includes(route) || route === '/academy/' || route === '/academy/when-something-goes-wrong/' || route === '/academy/accounts-and-tools/' || route === '/academy/quick-reference/' || route === '/academy/everyday-jobs/' || route === '/academy/start-here/' || route === '/academy/library-assistant/' || route === '/academy/website-systems/' || route === '/academy/practice-with-a-buddy/') {
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
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin + '/academy/when-something-goes-wrong/');
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `header fits ${width}px`);
      assert.equal(await page.locator('.academy-sidebar a[href$="/print/"], .academy-sidebar a[href$="/quick-reference/"]').count(), 0, 'print links have one home');
      const printToggle = page.locator('.academy-print-menu summary');
      await printToggle.focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.getByRole('link', { name: 'Full handbook', exact: true }).isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.academy-print-menu').getAttribute('open'), null);
      assert.equal(await printToggle.evaluate(node => node === document.activeElement), true, 'Escape returns focus to Print');
      await printToggle.click();
      await page.locator('.academy-header').click({ position: { x: 2, y: 2 } });
      assert.equal(await page.locator('.academy-print-menu').getAttribute('open'), null, 'outside click dismisses Print');
      await page.locator('.lesson-topics a').first().click();
      const header = await page.locator('.academy-header').boundingBox();
      const anchor = await page.locator('.lesson-part').first().boundingBox();
      assert.ok(Math.abs(header.y) < 1, 'header stays at the top after scrolling');
      assert.ok(anchor.y >= header.height, 'section links land below the sticky header');
      const topicLinks = page.locator('.lesson-topics a');
      const middleHref = await topicLinks.nth(2).getAttribute('href');
      await page.evaluate(href => document.querySelector(href).scrollIntoView(), middleHref);
      await page.waitForFunction(href => document.querySelector('.lesson-topics a[aria-current="location"]')?.getAttribute('href') === href, middleHref);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const lastHref = await topicLinks.last().getAttribute('href');
      await page.waitForFunction(href => document.querySelector('.lesson-topics a[aria-current="location"]')?.getAttribute('href') === href, lastHref);
      await page.evaluate(() => window.scrollTo(0, 0));
      const firstHref = await topicLinks.first().getAttribute('href');
      await page.waitForFunction(href => document.querySelector('.lesson-topics a[aria-current="location"]')?.getAttribute('href') === href, firstHref);
      assert.equal(await page.locator('.lesson-topics a[aria-current="location"]').count(), 1, 'one current section follows scrolling in both directions');
      await page.screenshot({ path: `output/academy/${width}-library-header.png` });
      // Bounds of the real controls in the 1200-by-900 logical Safari capture.
      const screenshotControls = {
        navigation: [6, 112, 271, 35], message: [1081, 495, 36, 36],
        modes: [629, 60, 224, 36], attachment: [367, 552, 230, 36], helper: [367, 840, 270, 36],
      };
      for (const lesson of ['start-here', 'library-assistant', 'files-and-links', 'chatgpt-tour']) {
        await page.goto(`${origin}/academy/${lesson}/`);
        for (const [i, figure] of (await page.locator('.lesson-screenshot').all()).entries()) {
          await figure.scrollIntoViewIfNeeded();
          await figure.locator('img').evaluate(img => img.decode());
          const view = await figure.getAttribute('data-view');
          if (!screenshotControls[view]) continue;
          const canvas = await figure.locator('.screenshot-window').boundingBox();
          const backdrop = await figure.locator('.screenshot-canvas').boundingBox();
          assert.ok(backdrop.height >= (backdrop.width <= 550 ? 320 : 360), 'screenshots retain a tall canvas');
          const image = await figure.locator('img').boundingBox();
          const [x, y, w, h] = screenshotControls[view].map(n => n * image.width / 1200);
          assert.ok(image.x + x >= canvas.x && image.y + y >= canvas.y && image.x + x + w <= canvas.x + canvas.width && image.y + y + h <= canvas.y + canvas.height, `${width}px ${view}: teaching control remains fully visible`);
          if (view === 'message') assert.ok(Math.abs(image.x + image.width - canvas.x - canvas.width) < 1, 'message screenshot reaches the right canvas edge');
          if (view === 'modes') assert.ok(Math.abs(image.y - canvas.y - (canvas.width <= 550 ? 16 : 24)) < 1, 'mode screenshot has only the intended top inset');
          if (view === 'navigation') assert.ok(Math.abs((image.x - canvas.x) - (image.y - canvas.y)) < 1, 'corner insets are equal');
          if (view === 'helper') {
            const inset = await figure.locator('.screenshot-canvas').evaluate(node => parseFloat(getComputedStyle(node).getPropertyValue('--shot-inset')));
            assert.ok(Math.abs(canvas.y + canvas.height - image.y - image.height - inset) < 1, 'helper screenshot leaves only its intended bottom inset');
          }
          assert.equal(await figure.locator('.screenshot-window').evaluate(node => getComputedStyle(node).overflow), 'visible', 'there is no inner screenshot crop');
          if ([390, 1440].includes(width)) await figure.screenshot({ path: `output/academy/${width}-${view}-${i}-review.png` });
        }
      }
    }
    // Check the actual teaching controls in each new full-window capture.
    const workflowViews = {
      'website-request': [0.30, 0.46, 0.63, 0.05],
      newsletter: [0.06, 0.89, 0.14, 0.03],
      'buffer-queue': [0.22, 0.145, 0.045, 0.025],
      'buffer-editor': [0.28, 0.89, 0.05, 0.025],
      'buffer-timing': [0.64, 0.74, 0.15, 0.10],
      'tour-sidebar': [0.008, 0.10, 0.14, 0.27],
      'tour-explore': [0.165, 0.23, 0.098, 0.215],
      'tour-library': [0.20, 0.135, 0.235, 0.023],
      'tour-plugins': [0.32, 0.255, 0.18, 0.145],
      'tour-scheduled': [0.37, 0.067, 0.20, 0.21],
      'tour-account': [0.008, 0.72, 0.14, 0.21],
      'givebutter-email': [0,0,1,1],
      'givebutter-templates': [0,0,1,1],
      'givebutter-donation': [0,0,1,1],
      'givebutter-subscribers': [0.525,0.34,0.155,0.13],
    };
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const lesson of ['preview-and-save', 'facebook-posts', 'chatgpt-tour', 'everyday-jobs']) {
        await page.goto(`${origin}/academy/${lesson}/`);
        for (const figure of await page.locator('.lesson-screenshot').all()) {
          await figure.scrollIntoViewIfNeeded();
          await figure.locator('img').evaluate(img => img.decode());
          const view = await figure.getAttribute('data-view');
          const image = await figure.locator('img').boundingBox();
          const canvas = await figure.locator('.screenshot-window').boundingBox();
          if (!workflowViews[view]) continue;
          if (await figure.getAttribute('data-framing') === 'full') {
            // The window follows the image; use the outer canvas to verify the actual padding.
            const outer = await figure.locator('.screenshot-canvas').boundingBox();
            const gaps = [image.x - outer.x, outer.x + outer.width - image.x - image.width, image.y - outer.y, outer.y + outer.height - image.y - image.height];
            assert.ok(gaps.every(gap => gap >= 15), `${view}: full screenshot has padding on every side`);
            assert.ok(Math.abs(gaps[0] - gaps[1]) < 1 && Math.abs(gaps[2] - gaps[3]) < 1, `${view}: full screenshot is centered`);
            if ([390,1440].includes(width)) await figure.screenshot({path:`output/academy/${width}-${view}-review.png`});
            continue;
          }
          const [x,y,w,h] = workflowViews[view];
          const inset = canvas.width <= 550 ? 16 : 24;
          if (view === 'website-request') assert.ok(Math.abs(image.x + image.width - canvas.x - canvas.width) < 1, 'website request reaches the right edge');
          if (view === 'newsletter') assert.ok(image.x <= canvas.x && image.y <= canvas.y && image.x + image.width >= canvas.x + canvas.width && image.y + image.height >= canvas.y + canvas.height - 1, 'webpage capture fills the canvas without exposed viewport edges');
          if (view === 'buffer-timing') {
            const sideGap = view === 'newsletter' ? image.x - canvas.x : canvas.x + canvas.width - image.x - image.width;
            const bottomGap = canvas.y + canvas.height - image.y - image.height;
            assert.ok(Math.abs(sideGap - inset) < 1 && Math.abs(bottomGap - inset) < 1, `${view}: equal small corner insets`);
          }
          assert.ok(image.x+x*image.width >= canvas.x-1 && image.y+y*image.height >= canvas.y-1 && image.x+(x+w)*image.width <= canvas.x+canvas.width+1 && image.y+(y+h)*image.height <= canvas.y+canvas.height+1, `${width}px ${view}: relevant control stays visible`);
          if ([390,1440].includes(width)) await figure.screenshot({path:`output/academy/${width}-${view}-review.png`});
        }
      }
    }
    const directory = {
      'accounts-and-tools': ['ChatGPT', 'Givebutter', 'Buffer'],
      'website-systems': ['Codex', 'Sanity', 'GitHub', 'Cloudflare', 'Squarespace', 'Google Analytics', 'Google Cloud'],
    };
    let logoCount = 0;
    for (const [slug, names] of Object.entries(directory)) {
      await page.goto(origin + `/academy/${slug}/`);
      assert.equal(await page.locator('article.service-card').count(), names.length);
      assert.equal(await page.locator('main details').count(), 0, 'service information is visible without opening anything');
      for (const link of await page.locator('.service-open').all()) assert.equal(await link.isVisible(), true);
      logoCount += await page.locator('.service-icon img').count();
      assert.equal(await page.locator('.service-icon img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), true, 'service logos load locally');
      for (const name of names) assert.equal(await page.getByRole('heading', { name, exact: true }).count(), 1, `explains ${name}`);
      assert.doesNotMatch(await page.locator('main').innerText(), /Zoom/);
      for (const anchor of await page.locator('.lesson-topics a').evaluateAll(links => links.map(a => a.getAttribute('href')))) {
        assert.equal(await page.locator(anchor).count(), 1, 'index points to an existing section');
      }
    }
    assert.equal(logoCount, 7);
    assert.equal(await page.locator('.academy-sidebar').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 255, 255)');
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto(origin + '/academy/practice-with-a-buddy/');
    await page.getByText('Browse lessons', { exact: true }).click();
    assert.equal(await page.locator('.lesson-menu a').last().isVisible(), true);
    await page.getByText('Browse lessons', { exact: true }).click();
    await page.getByRole('button', { name: 'Copy message' }).first().click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(copied, await page.locator('[data-prompt-text]').first().innerText());
    assert.equal(await page.getByRole('heading', { name: 'Examples', exact: true }).count(), 1);
    assert.equal(await page.locator('.example-card').count(), 16);
    assert.match(await page.locator('[data-prompt-text]').last().innerText(), /Let’s practice.*without changing the website or sending anything/);
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
    assert.equal(await page.locator('.print-lesson').count(), 11);
    assert.equal((await page.locator('main').innerText()).match(/Todd/g)?.length, 1, 'one current contact in the handbook');
    assert.equal(await page.locator('.prompt-actions').first().isVisible(), false, 'print hides interactive actions');
    assert.equal(await page.locator('.service-card').count(), 10);
    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 844 } });
    const plain = await noJS.newPage();
    await plain.goto(origin + '/academy/practice-with-a-buddy/');
    assert.equal(await plain.locator('.lesson-menu a').last().isVisible(), true, 'navigation works without JavaScript');
    assert.ok(await plain.locator('[data-prompt-text]').first().isVisible());
    assert.equal(await plain.locator('[data-copy-prompt]').first().isVisible(), false);
    assert.equal(await plain.locator('[data-open-prompt]').first().isVisible(), true, 'prefill links work without JavaScript');
    await plain.goto(origin + '/academy/accounts-and-tools/');
    assert.equal(await plain.locator('.service-open').first().isVisible(), true);
    assert.equal(await plain.locator('main details').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
});
