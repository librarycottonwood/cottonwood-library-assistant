/** Actual browser results from a built offline CMS snapshot, with a controlled
 * visitor clock. No library account, content writes, or deployment is involved.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { seedSnapshot, saveSnapshot } from './cms.mjs';
import { launchBrowser } from './browser.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json'};

test('expired CMS events stop being promoted in actual browser pages without a new build or content change', {timeout:180000}, async()=>{
  await mkdir('output/cms',{recursive:true});
  const folder=await mkdtemp(path.resolve('output/cms/event-browser-'));
  let server,browser;
  try {
    const config={projectId:'cmsrehearsal',dataset:'offline'};
    const snapshot=await seedSnapshot(config);
    const settings=snapshot.documents.find(doc=>doc._type==='siteSettings');
    const event=snapshot.documents.find(doc=>doc._type==='event');
    event.title='Browser rehearsal event';event.slug.current='browser-rehearsal';event.image=structuredClone(settings.hero.image);
    event.sessions=[{_key:'first',startsAt:'2099-04-17T10:00:00-07:00',endsAt:'2099-04-17T14:00:00-07:00'},
      {_key:'second',startsAt:'2099-04-18T11:00:00-07:00',endsAt:'2099-04-18T15:00:00-07:00'}];
    snapshot.documents.push({...structuredClone(event),_id:'event-afternoon',title:'Afternoon companion event',slug:{current:'afternoon-companion'},sessions:[{_key:'afternoon',startsAt:'2099-04-17T15:00:00-07:00',endsAt:'2099-04-17T16:00:00-07:00'}]});
    snapshot.documents.push({...structuredClone(event),_id:'event-evening',title:'Final evening event',slug:{current:'evening-event'},sessions:[{_key:'evening',startsAt:'2099-04-18T16:00:00-07:00',endsAt:'2099-04-18T17:00:00-07:00'}]});
    const snapshotFile=path.join(folder,'snapshot.json');await saveSnapshot(snapshot,snapshotFile);
    const output=path.join(folder,'site');
    const build=spawnSync(process.execPath,['scripts/build.mjs'],{encoding:'utf8',timeout:120000,maxBuffer:5*1024*1024,env:{...process.env,LIBRARY_CONTENT_SOURCE:'sanity',SANITY_PROJECT_ID:config.projectId,SANITY_DATASET:config.dataset,SANITY_SNAPSHOT_PATH:snapshotFile,CMS_BUILD_OUT_DIR:output}});
    assert.equal(build.status,0,`${build.stdout}\n${build.stderr}`);
    const beforeHash=hash(await readFile(path.join(output,'index.html')));
    server=createServer(async(req,res)=>{
      try {
        let filename=path.resolve(output,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
        if(filename!==output&&!filename.startsWith(output+path.sep)){res.writeHead(403).end();return;}
        if(!path.extname(filename))filename=path.join(filename,'index.html');
        res.writeHead(200,{'Content-Type':mime[path.extname(filename)]??'application/octet-stream'}).end(await readFile(filename));
      }catch{res.writeHead(404).end('Not found');}
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base=`http://127.0.0.1:${server.address().port}`;
    browser=await launchBrowser();
    const errors=[];
    for(const [viewportName,viewport] of [['desktop',{width:1440,height:1000}],['phone',{width:390,height:844}]]){
      for(const route of ['/','/events/']){
        const page=await browser.newPage({viewport});
        page.on('pageerror',error=>errors.push(`${viewportName} ${route}: ${error.message}`));
        await page.route('**/*',request=>new URL(request.request().url()).origin===base?request.continue():request.abort());
        await page.clock.install({time:new Date('2099-04-17T20:59:59Z')});
        const response=await page.goto(base+route,{waitUntil:'networkidle'});assert.equal(response.status(),200);
        const list=page.locator('[data-event-list]').first();
        const active=()=>list.locator('[data-event-expires]:visible');
        // The first session has a photo, so it leads both pages as the featured event and the cards list the rest.
        assert.equal(await active().count(),3,`${viewportName} ${route} before expiry`);
        // Wait for the featured photo instead of checking once; it can appear a moment after load.
        await page.locator('[data-event-feature-expires]').waitFor({state:'visible',timeout:10000});
        if(route==='/events/'){
          assert.match(await list.locator('[data-event-day="2099-04-17"]').first().innerText(),/^Today/);
          assert.match(await list.locator('[data-event-day="2099-04-18"]').first().innerText(),/^Tomorrow/);
        }
        // The normal 30-second timer removes the ended session in an open tab.
        await page.clock.fastForward(30000);
        assert.equal(await active().count(),3);
        assert.equal(await list.locator('[data-event-expires="2099-04-17T14:00:00-07:00"]').isVisible(),false);
        assert.equal(await active().filter({hasText:'Final evening event'}).count(),1,'the fourth occurrence shows within the three-item limit');
        assert.equal(await page.locator('[data-event-feature-expires]').isVisible(),false,'expired featured photo is no longer promoted');
        const advance=async when=>{await page.clock.setSystemTime(new Date(when));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));};
        // Resuming an older/background tab refreshes against the same source dates.
        await advance('2099-04-17T23:00:01Z');assert.equal(await active().count(),2);
        await advance('2099-04-18T22:00:01Z');assert.equal(await active().count(),1);
        assert.match(await active().innerText(),/Final evening event/);
        if(route==='/events/')assert.equal(await active().locator('a').getAttribute('href'),'/events/evening-event/');
        // An event that has started stays listed until its confirmed end.
        await advance('2099-04-18T23:30:00Z');assert.equal(await active().count(),1);
        await advance('2099-04-19T00:00:01Z');assert.equal(await active().count(),0);
        // The homepage fills open spots with regular programs, so it never goes empty; the events page says so.
        if(route==='/'){assert.equal(await list.locator('[data-event-card]:visible').count(),3,'regular programs fill the homepage once events end');assert.equal(await list.locator('[data-event-empty]').isVisible(),false);}
        else{assert.equal(await list.locator('[data-event-empty]').isVisible(),true);assert.match(await list.locator('[data-event-empty]').innerText(),/No special events are scheduled/);}
        // A fresh page load also hides the same expired records immediately.
        await page.reload({waitUntil:'networkidle'});assert.equal(await active().count(),0);assert.equal(await list.locator('[data-event-empty]').isVisible(),route!=='/');
        await page.close();
      }
    }
    assert.deepEqual(errors,[]);
    assert.equal(hash(await readFile(path.join(output,'index.html'))),beforeHash,'browser expiry must not mutate or rebuild the release');
    assert.equal((await pageRequest(base+'/events/browser-rehearsal/')).status,200,'event details remain accessible as a historical page');
  } finally {
    await browser?.close();
    if(server)await new Promise(resolve=>server.close(resolve));
    await rm(folder,{recursive:true,force:true});
  }
});
async function pageRequest(url){return fetch(url);}
