import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {launchBrowser} from './browser.mjs';

// Exercise the actual production bundle, rather than the source config under
// Node (where whole-object process.env access works and concealed the bug).
// Run immediately after studio build:offline. Nothing contacts a real account.
test('production Studio uses its compiled configuration and displays publishing guidance', {timeout: 45000}, async () => {
  const directory = path.resolve(process.env.STUDIO_TEST_BUNDLE_DIR || 'studio/dist');
  await readFile(path.join(directory, 'index.html'));
  const mime = {'.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.woff2':'font/woff2'};
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let file = path.resolve(directory, '.' + pathname);
      if (file !== directory && !file.startsWith(directory + path.sep)) {response.writeHead(403).end(); return;}
      if (!path.extname(file)) file = path.join(file, 'index.html');
      response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'}).end(await readFile(file));
    } catch {response.writeHead(404).end('Not found');}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const observed = [];
  const pageErrors = [];
  try {
    // Network interception is the first barrier; DNS blocking also prevents a
    // real provider connection if a browser code path bypasses interception.
    browser = await launchBrowser({args:['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1']});
    const context = await browser.newContext({serviceWorkers:'block'});
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      observed.push({host:url.hostname, path:url.pathname, query:url.search});
      // Synthetic read-only metadata lets native authentication/config loading
      // progress far enough to observe which dataset the bundled client uses.
      // It does not establish actual authentication, API access, or publishing.
      if (['api.sanity.io', 'cmscheck.api.sanity.io'].includes(url.hostname)) {
        if (route.request().method() !== 'GET') return route.fulfill({status:403, json:{error:'Synthetic regression: remote writes forbidden'}});
        if (url.pathname.includes('/users/me/keyvalue')) return route.fulfill({json:[]});
        if (url.pathname.endsWith('/users/me')) return route.fulfill({json:{id:'studio-regression-user',name:'Synthetic Studio regression',email:'fixture@example.invalid',roles:[{name:'administrator',title:'Fixture administrator'}]}});
        if (url.pathname.includes('/projects/cmscheck/datasets')) return route.fulfill({json:[{name:'validation',aclMode:'public'}]});
        if (url.pathname.includes('/projects/cmscheck')) return route.fulfill({json:{id:'cmscheck',displayName:'Synthetic Studio regression',members:[],features:[]}});
        if (url.pathname.includes('/data/query/validation')) return route.fulfill({json:{result:[]}});
        return route.fulfill({status:401,json:{error:'Synthetic regression: unavailable account endpoint'}});
      }
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    const datasetRequest = page.waitForRequest(request => {
      const url = new URL(request.url());
      return url.hostname === 'cmscheck.api.sanity.io' && /\/data\/(?:query|listen|doc)\/validation(?:\/|$)/.test(url.pathname);
    }, {timeout:15000});
    await page.goto(origin, {waitUntil:'domcontentloaded'});
    let datasetUsed = false;
    try {await datasetRequest; datasetUsed = true;} catch {}
    const body = await page.locator('body').innerText();
    assert.ok(!body.includes('The library Sanity account is not connected.'), body.slice(0,1200));
    assert.ok(!pageErrors.some(message => /not connected|SANITY_STUDIO_PROJECT_ID|SANITY_STUDIO_DATASET|process is not defined/.test(message)), pageErrors.join('\n'));
    assert.ok(observed.some(request => request.host === 'cmscheck.api.sanity.io' || request.path.includes('/projects/cmscheck')), `Compiled project was not used. Requests: ${JSON.stringify(observed)}; page errors: ${pageErrors.join('; ')}; body: ${body.slice(0,1200)}`);
    assert.ok(datasetUsed, `Compiled dataset was not used. Requests: ${JSON.stringify(observed)}; page errors: ${pageErrors.join('; ')}; body: ${body.slice(0,1200)}`);
    // The native Studio must actually mount the configured layout. Configuring
    // the component at the wrong level still builds, but drops this guidance.
    const guidance = page.getByRole('note').filter({hasText:'Publishing here saves content in the library CMS.'});
    await guidance.waitFor({state:'visible', timeout:15000});
    assert.match(await guidance.innerText(), /The website updates after its separate checks and approval\. Confirm the website update before saying it is live\./);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
