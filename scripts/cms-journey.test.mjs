/** Isolated offline rehearsal: real CMS adapter + Astro build + hosted-file results.
 * It does not claim library Sanity credentials, ChatGPT, publication, or live service access.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { seedSnapshot, saveSnapshot } from './cms.mjs';

const config={projectId:'cmsrehearsal',dataset:'offline'};
const marker='CMS rehearsal book swap';
const plain = html => html.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ');
const digest = value => createHash('sha256').update(value).digest('hex');
async function filesUnder(folder) {
  const files=[];
  for(const item of await readdir(folder,{withFileTypes:true})){
    const file=path.join(folder,item.name);
    if(item.isDirectory())files.push(...await filesUnder(file));else files.push(file);
  }
  return files;
}
function runBuild(env) {
  const result=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:process.cwd(),env:{...process.env,...env},encoding:'utf8',timeout:120000,maxBuffer:5*1024*1024});
  return {...result,log:`${result.stdout ?? ''}\n${result.stderr ?? ''}`};
}

test('CMS request rehearsal renders the same edited event, rich post, hours, notice and newsletter in the real built site', {timeout:180000}, async()=>{
  await mkdir('output/cms',{recursive:true});
  const folder=await mkdtemp(path.resolve('output/cms/journey-'));
  try {
    const snapshot=await seedSnapshot(config);
    const settings=snapshot.documents.find(doc=>doc._type==='siteSettings');
    const giving=snapshot.documents.find(doc=>doc._type==='givingSettings');
    const event=snapshot.documents.find(doc=>doc._type==='event');
    event.slug.current='cms-rehearsal-book-swap';event.title=marker;event.summary='Bring one book and find another.';
    event.image=structuredClone(settings.hero.image);
    event.sessions=[{_key:'friday',_type:'eventSession',startsAt:'2099-04-17T10:00:00-07:00',endsAt:'2099-04-17T14:00:00-07:00'},
      {_key:'saturday',_type:'eventSession',startsAt:'2099-04-18T11:00:00-07:00',endsAt:'2099-04-18T15:00:00-07:00'}];
    const post=snapshot.documents.find(doc=>doc._type==='post');
    post.slug.current='cms-rehearsal-report';post.title='CMS rehearsal photo report';post.publishedAt='2099-04-01';post.summary='A rehearsal report with real rich text.';
    post.image=structuredClone(settings.hero.image);post.gallery=[structuredClone(settings.programs?.[0]?.image ?? settings.story.image)];
    post.eventRefs=[{_type:'reference',_ref:event._id}];
    post.body=[{_key:'heading',_type:'block',style:'h2',markDefs:[],children:[{_type:'span',_key:'heading-text',text:'Our rehearsal report heading',marks:[]}]},
      {_key:'paragraph',_type:'block',style:'normal',markDefs:[{_key:'event-link',_type:'link',href:'/events/cms-rehearsal-book-swap/'}],children:[{_type:'span',_key:'bold',text:'Volunteer-approved rehearsal wording. ',marks:['strong']},{_type:'span',_key:'link',text:'See this event.',marks:['event-link']}]},
      {_key:'safe-text',_type:'block',style:'normal',markDefs:[],children:[{_type:'span',_key:'plain-text',text:'<script>window.cmsInjected = true</script>',marks:[]}]},
      {_key:'list',_type:'block',style:'normal',listItem:'bullet',level:1,markDefs:[],children:[{_type:'span',_key:'list-text',text:'A real list item',marks:[]}]}];
    settings.library.phone='530-555-0199';settings.library.phoneHref='tel:+19999999999';settings.library.hours=[{days:'Monday',hours:'10 a.m.–4 p.m.'},{days:'Tuesday',hours:'Closed'}];settings.library.hoursSummary='STALE HOURS SHOULD NEVER APPEAR';
    const newsletter=snapshot.documents.find(doc=>doc._type==='newsletter');
    newsletter.issue='Current rehearsal issue';newsletter.title='Current rehearsal newsletter';
    snapshot.documents.push({...structuredClone(newsletter),_id:'newsletter-archive-rehearsal',slug:{current:'archive-rehearsal'},issue:'Earlier rehearsal issue',title:'Archive rehearsal newsletter'});
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    snapshot.documents.push({_id:'notice-rehearsal',_type:'notice',slug:{current:'cms-rehearsal'},message:'CMS rehearsal notice is active.',startsOn:today,endsOn:today});
    // No preexisting campaign should inject synthetic donation totals into a rehearsal.
    giving.campaigns=[];
    // CMS photo changes can leave imported local originals unused. Reuse one
    // real source image so the actual Astro build exercises that output path.
    function replacePictures(value) {
      if (!value || typeof value !== 'object') return;
      if (value._type === 'libraryImage' && value.legacyKey) value.legacyKey = 'exterior';
      for (const child of Object.values(value)) replacePictures(child);
    }
    replacePictures(snapshot.documents);
    const snapshotFile=path.join(folder,'snapshot.json');
    const approved=await saveSnapshot(snapshot,snapshotFile);
    const output=path.join(folder,'site');
    const environment={LIBRARY_CONTENT_SOURCE:'sanity',SANITY_PROJECT_ID:config.projectId,SANITY_DATASET:config.dataset,SANITY_SNAPSHOT_PATH:snapshotFile,CMS_BUILD_OUT_DIR:output,SANITY_READ_TOKEN:'CMS_REHEARSAL_SECRET_MUST_NOT_REACH_BROWSER'};
    const built=runBuild(environment);
    assert.equal(built.status,0,built.log);
    const home=await readFile(path.join(output,'index.html'),'utf8');
    const events=await readFile(path.join(output,'librarynews/index.html'),'utf8');
    const detail=await readFile(path.join(output,'events/cms-rehearsal-book-swap/index.html'),'utf8');
    for(const [label,html] of [['home',home],['events',events],['detail',detail]]){
      assert.ok(plain(html).includes(marker),`${label} should show the requested event title`);
      assert.ok(html.includes('2099-04-17T10:00:00-07:00'),`${label} should show the first corrected session`);
      assert.ok(html.includes('2099-04-18T11:00:00-07:00'),`${label} should show the second corrected session`);
      assert.ok(plain(html).includes('Bring one book and find another.'),`${label} should show the one canonical summary`);
      assert.ok(!html.includes('October 16–17 · 10 a.m.–2 p.m.'),`${label} must not carry the hardcoded sale promotion`);
    }
    assert.match(events,/data-agenda-day="2099-04-17"/);
    assert.match(events,/data-agenda-day="2099-04-18"/);
    assert.match(events,/href="\/events\/cms-rehearsal-book-swap\/"/);
    assert.match(home,/href="\/events\/cms-rehearsal-book-swap\/"/);
    const article=await readFile(path.join(output,'librarynews/cms-rehearsal-report/index.html'),'utf8');
    assert.match(article,/<h2>Our rehearsal report heading<\/h2>/);
    assert.match(article,/<strong>Volunteer-approved rehearsal wording\. <\/strong>/);
    assert.match(article,/<a href="\/events\/cms-rehearsal-book-swap\/">See this event\.<\/a>/);
    assert.match(article,/<ul><li>A real list item<\/li><\/ul>/);
    assert.ok(article.includes('&lt;script&gt;window.cmsInjected = true&lt;/script&gt;'));
    assert.ok(!article.includes('<script>window.cmsInjected'));
    assert.ok((article.match(/<img /g)??[]).length>=4,'post should have cover, gallery, and shared logos');
    assert.ok(article.includes('/_astro/') && article.includes('.webp'),'post images must use Astro optimized assets');
    assert.ok(plain(events).includes(post.title),'edited post belongs in the actual news feed');
    const visit=await readFile(path.join(output,'visit/index.html'),'utf8');
    for(const html of [home,visit]){
      assert.ok(plain(html).includes('Monday 10 a.m.–4 p.m.'));
      assert.ok(html.includes('tel:+15305550199'));
      assert.ok(!html.includes('STALE HOURS SHOULD NEVER APPEAR'));
      assert.ok(!html.includes('tel:+19999999999'));
      assert.ok(plain(html).includes('CMS rehearsal notice is active.'));
    }
    const current=await readFile(path.join(output,'librarynews/newsletter/index.html'),'utf8');
    const archive=await readFile(path.join(output,'newsletters/archive-rehearsal/index.html'),'utf8');
    assert.ok(plain(current).includes('Current rehearsal issue'));
    assert.ok(current.includes('/newsletters/archive-rehearsal/'));
    assert.ok(plain(archive).includes('Archive rehearsal newsletter'));
    assert.ok(archive.includes(newsletter.legacyFileUrl));
    const version=JSON.parse(await readFile(path.join(output,'_content/version.json'),'utf8'));
    assert.equal(version.provider,'sanity');assert.equal(version.contentDigest,approved.contentDigest);
    for(const file of await filesUnder(output)){
      if(/\.(html|js|json)$/.test(file))assert.ok(!(await readFile(file,'utf8')).includes(environment.SANITY_READ_TOKEN),`read token leaked into ${file}`);
      if(file.endsWith('.html')) {
        for (const [, asset] of (await readFile(file,'utf8')).matchAll(/(?:src|srcset)="[^"\n]*?(\/_astro\/[^\s",]+\.(?:webp|png|jpe?g))/g)) {
          assert.ok((await stat(path.join(output, asset))).isFile(), `rendered picture missing: ${asset}`);
        }
      }
      if(/\.(webp|png|jpe?g)$/i.test(file))assert.ok((await stat(file)).size<=300000,`unoptimized browser image ${file}`);
    }
    // A later malformed publication must fail before replacing the checked site.
    const retained=digest(await readFile(path.join(output,'index.html')));
    const invalid=structuredClone(snapshot);invalid.documents.find(doc=>doc._type==='siteSettings').navigation[0].href='javascript:alert(1)';
    const invalidFile=path.join(folder,'invalid.json');await writeFile(invalidFile,JSON.stringify(invalid));
    const rejected=runBuild({...environment,SANITY_SNAPSHOT_PATH:invalidFile});
    assert.notEqual(rejected.status,0,'unsafe CMS publication must fail');
    assert.match(rejected.log,/navigation.href/);
    assert.equal(digest(await readFile(path.join(output,'index.html'))),retained,'last verified website must survive invalid content');
    const missing=runBuild({...environment,SANITY_PROJECT_ID:'',SANITY_SNAPSHOT_PATH:''});
    assert.notEqual(missing.status,0,'Sanity mode with no configuration must fail');assert.match(missing.log,/SANITY_PROJECT_ID/);
    assert.equal(digest(await readFile(path.join(output,'index.html'))),retained,'missing credentials/config must never replace the site with seed data');
  } finally {await rm(folder,{recursive:true,force:true});}
});
