import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const analytics = JSON.parse(await readFile('assistant/analytics.json', 'utf8'));
assert.equal(analytics.websiteHost, 'cottonwood-library-trial-preview.pages.dev', 'Tracking must cover the library-owned trial');
const host = 'https://trial.' + analytics.websiteHost;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  let googleRequests = 0;
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname.includes('google')) {
      googleRequests++;
      await route.fulfill({ contentType: 'text/javascript', body: '' });
      return;
    }
    if (url.origin !== host) { await route.abort(); return; }
    let file = url.pathname;
    if (!path.extname(file)) file += 'index.html';
    const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.woff2':'font/woff2', '.webp':'image/webp' };
    await route.fulfill({ body: await readFile(path.join('dist', file)), contentType: types[path.extname(file)] || 'application/octet-stream' });
  });
  const page = await context.newPage();
  await page.goto(host + '/?email=private@example.com');
  await page.locator('#statistics-choice').waitFor({ state: 'visible' });
  assert.equal(googleRequests, 0, 'No Google requests before consent');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('#statistics-deny').click();
  await page.reload();
  assert.equal(await page.locator('#statistics-choice').isVisible(), false);
  assert.equal(googleRequests, 0, 'Declining remains effective after reload');
  await page.locator('#privacy-choices').click();
  await page.locator('#statistics-allow').click();
  await page.waitForFunction(() => document.querySelector('#library-google-tag'));
  await page.waitForLoadState('networkidle');
  assert.equal(googleRequests, 1);
  const queue = () => page.evaluate(() => window.dataLayer.map(entry => Array.from(entry)));
  let events = await queue();
  const view = events.find(entry => entry[0] === 'event' && entry[1] === 'page_view');
  assert.equal(view[2].page_location, host + '/');
  assert.equal(JSON.stringify(events).includes('private@example.com'), false);
  await page.locator('[data-analytics-event="catalog_quick"]').evaluate(element => {
    element.addEventListener('click', event => event.preventDefault()); element.click();
  });
  events = await queue();
  assert(events.some(entry => entry[1] === 'catalog_quick'));
  await context.addCookies([{name:'_ga',value:'test',url:host,secure:true},{name:'_ga_TEST',value:'test',url:host,secure:true}]);
  await page.locator('#privacy-choices').click();
  await Promise.all([page.waitForNavigation(), page.locator('#statistics-deny').click()]);
  await page.waitForLoadState('networkidle');
  assert.equal(googleRequests, 1, 'Withdrawal does not reload Google');
  assert.equal((await context.cookies()).filter(cookie=>cookie.name.startsWith('_ga')).length, 0);
  assert.equal(await page.locator('#library-google-tag').count(), 0);
  await page.screenshot({path:'output/analytics-consent-phone.png'});
  console.log('Passed: no tracking before consent; persisted refusal; opt-in; clean URLs; catalog event; withdrawal and cookie removal; mobile width.');
} finally { await browser.close(); }
