import test from 'node:test';
import assert from 'node:assert/strict';
import {checkRun,checkMerge,checkContent,sameContent,checkStaticFiles,route,failedJobs,failureDescription,failureComment,updateFiles,kindOf,NO_WEBSITE_CHANGE} from './publish-live.mjs';
import {changeKind} from './content-changes.mjs';
import {prKind} from './change-kind.mjs';
import {digestOf} from './release.mjs';
const repo='librarycottonwood/cottonwood-library-assistant';
const head='a'.repeat(40),main='b'.repeat(40),tree='c'.repeat(40);
const run={path:'.github/workflows/check.yml',event:'pull_request',status:'completed',conclusion:'success',head_sha:head,head_repository:{full_name:repo},repository:{full_name:repo}};
test('only a successful same-repository exact-head PR check can supply a release',()=>{
  checkRun(run,head);
  for(const patch of [{event:'workflow_dispatch'},{conclusion:'failure'},{head_sha:main},{head_repository:{full_name:'attacker/fork'}},{path:'.github/workflows/other.yml'}])assert.throws(()=>checkRun({...run,...patch},head));
});
test('merge approval cannot silently include concurrent main changes',()=>{
  const pr={merged:true,base:{ref:'main',repo:{full_name:repo}},head:{repo:{full_name:repo}},merge_commit_sha:main};
  checkMerge(pr,main,tree,tree);
  assert.throws(()=>checkMerge(pr,main,tree,head));
  assert.throws(()=>checkMerge({...pr,merged:false},main,tree,tree));
  assert.throws(()=>checkMerge(pr,head,tree,tree));
});
test('content and revisions must still be exactly the reviewed snapshot',()=>{
  const snapshot={projectId:'2ou0xy2r',dataset:'production',documents:[{_id:'event',_type:'event',_rev:'one',title:'Approved'}]};
  checkContent(snapshot,structuredClone(snapshot));
  assert.throws(()=>checkContent(snapshot,{...snapshot,documents:[{...snapshot.documents[0],title:'Changed'}]}),/Published content changed after preview/);
  assert.throws(()=>checkContent(snapshot,{...snapshot,documents:[{...snapshot.documents[0],_rev:'two'}]}));
  assert.throws(()=>checkContent(snapshot,{...snapshot,dataset:'other'}));
});
test('uploading a picture nothing uses yet does not invalidate a reviewed preview',()=>{
  const snapshot={projectId:'2ou0xy2r',dataset:'production',documents:[{_id:'event',_type:'event',_rev:'one',title:'Approved'}]};
  const upload={_id:'image-abc-10x10-jpg',_type:'sanity.imageAsset',_rev:'u1'};
  assert.ok(sameContent(snapshot,{...snapshot,documents:[...snapshot.documents,upload]}));
  assert.ok(!sameContent(snapshot,{...snapshot,documents:[{...snapshot.documents[0],image:{asset:{_ref:upload._id}}},upload]}));
});
const trigger={id:7,path:'.github/workflows/check.yml',head_repository:{full_name:repo},head_sha:head,event:'pull_request',conclusion:'success',head_branch:'content/x'};
const openPr={number:5,state:'open',head:{sha:head,repo:{full_name:repo}},base:{ref:'main'}};
const fakeGet=({pulls=[openPr],jobs=[{name:'verify',conclusion:'success'},{name:'pr-preview',conclusion:'success'},{name:'cms-live',conclusion:'skipped'}],files=[{filename:'content-updates/2026-10-27-a.json'}]}={})=>async route=>
  route.startsWith('commits/')?pulls:route.startsWith('actions/runs/')?{jobs}:route.startsWith('pulls/5/files')?files:assert.fail(`unexpected ${route}`);
test('only instructions-only PRs skip the website build; anything unclear is a website change',async()=>{
  assert.equal(changeKind(['AGENTS.md','assistant/HANDOVER.md','plugins/cottonwood-library/skills/news/SKILL.md','docs/staff-guide.md','.claude/skills/x/SKILL.md']),'docs');
  assert.equal(changeKind(['content-updates/2026-10-27-a.json','assistant/HANDOVER.md']),'content');
  assert.equal(changeKind(['assistant/website-update.json']),'content');
  for(const files of [[],['src/pages/index.astro'],['assistant/HANDOVER.md','scripts/build.mjs'],['src/design-system/README.md'],['.github/workflows/check.yml'],['content-updates/latest.json'],['test/check.txt']])
    assert.equal(changeKind(files),'code',files.join());
  // A file moved out of src/ still changes the website.
  assert.equal(await kindOf(5,{},fakeGet({files:[{filename:'docs/old.md',previous_filename:'src/pages/old.md'}]})),'code');
  assert.equal(await kindOf(5,{},async()=>{throw Error('GitHub down');}),'code');
  const files=[{filename:'AGENTS.md'}];
  assert.equal(await kindOf(5,{},fakeGet({files})),'docs');
  assert.equal(await prKind({repository:repo,base:main,head,token:'t'},{fetcher:async()=>({ok:true,json:async()=>({files})})}),'docs');
  assert.equal(await prKind({repository:repo,base:main,head,token:'t'},{fetcher:async()=>({ok:false})}),'code');
  assert.equal(await prKind({repository:repo,base:main,head,token:'t'},{fetcher:async()=>({ok:true,json:async()=>({files:Array(300).fill({filename:'AGENTS.md'})})})}),'code','an incomplete list runs every check');
  assert.equal(await prKind({repository:repo,base:'',head,token:'t'},{fetcher:async()=>assert.fail('no request')}),'code');
});
test('routing: an instructions-only PR gets a "no website change" status instead of a preview or a save',async()=>{
  const files=[{filename:'assistant/HANDOVER.md'}];
  assert.deepEqual(await route(trigger,{},{get:fakeGet({files,jobs:[{name:'verify',conclusion:'success'},{name:'pr-preview',conclusion:'success'}]})}),
    {action:'docs',pr:5,sha:head,context:'Website preview',description:NO_WEBSITE_CHANGE.preview});
  const failed=await route({...trigger,conclusion:'failure'},{},{get:fakeGet({files,jobs:[{name:'verify',conclusion:'failure'}]})});
  assert.equal(failed.action,'fail');
  const push={...trigger,event:'push',head_branch:'main',head_sha:main};
  const merged=[{number:5,merged_at:'2026-10-27T00:00:00Z',merge_commit_sha:main,base:{ref:'main'}}];
  assert.deepEqual(await route(push,{},{get:fakeGet({pulls:merged,files})}),{action:'docs',pr:5,sha:main,context:'Live website',description:NO_WEBSITE_CHANGE.live});
  for(const text of Object.values(NO_WEBSITE_CHANGE))assert.ok(text.length<=140);
});
test('routing: a passing PR check previews, a superseded or cancelled one quietly stops',async()=>{
  assert.deepEqual(await route(trigger,{},{get:fakeGet()}),{action:'preview',pr:5,sha:head});
  assert.equal((await route({...trigger,conclusion:'cancelled'},{},{get:fakeGet()})).action,'skip');
  const gone=await route(trigger,{},{get:fakeGet({pulls:[{...openPr,head:{...openPr.head,sha:main}}]})});
  assert.equal(gone.action,'skip');
  assert.match(gone.reason,/Superseded/);
  const failed=await route({...trigger,conclusion:'failure'},{},{get:fakeGet({jobs:[{name:'verify',conclusion:'failure'},{name:'pr-preview',conclusion:'success'}]})});
  assert.equal(failed.action,'fail');
  assert.equal(failed.context,'Website preview');
  await assert.rejects(route({...trigger,path:'.github/workflows/other.yml'},{},{get:fakeGet()}));
  await assert.rejects(route({...trigger,head_repository:{full_name:'attacker/fork'}},{},{get:fakeGet()}));
});
test('routing: a merge publishes when the source check passed, even if a health job failed',async()=>{
  const push={...trigger,event:'push',head_branch:'main',head_sha:main,conclusion:'failure'};
  const merged=[{number:5,merged_at:'2026-10-27T00:00:00Z',merge_commit_sha:main,base:{ref:'main'}}];
  assert.deepEqual(await route(push,{},{get:fakeGet({pulls:merged,jobs:[{name:'verify',conclusion:'success'},{name:'cms-live',conclusion:'failure'},{name:'record-result',conclusion:'failure'}]})}),{action:'publish',pr:5,sha:main});
  const broken=await route(push,{},{get:fakeGet({pulls:merged,jobs:[{name:'verify',conclusion:'failure'}]})});
  assert.equal(broken.action,'fail');
  assert.equal(broken.context,'Live website');
  assert.equal((await route(push,{},{get:fakeGet({pulls:[]})})).action,'skip');
  assert.equal((await route({...push,event:'schedule'},{},{get:async()=>assert.fail('no API call for scheduled checks')})).action,'skip');
});
test('failed saves get a short plain status and recovery steps',()=>{
  assert.deepEqual(failedJobs([{name:'verify',conclusion:'success'}],['verify','pr-preview']),['pr-preview']);
  for(const message of ['Published content changed after preview. Prepare and review a fresh preview before saving.','Main changed. Preserve the newer work and prepare a fresh preview.','Live website files are verified, but the CMS release record needs reconciliation.','x'.repeat(300)]) assert.ok(failureDescription(message).length<=140);
  assert.match(failureDescription('Published content changed after preview.'),/refresh save/);
  assert.match(failureComment('Published content changed after preview.','https://run'),/content\/refresh-/);
});
test('content-update files in a PR decide which documents the save covers',async()=>{
  const body=value=>({content:Buffer.from(value).toString('base64')});
  const get=async route=>route.startsWith('pulls/5/files')?[{filename:'content-updates/2026-10-27-a.json',status:'added'},{filename:'assistant/website-update.json',status:'modified'},{filename:'content-updates/2026-10-20-old.json',status:'removed'},{filename:'src/x.astro',status:'modified'}]
    :route.startsWith('contents/content-updates/2026-10-27-a.json')?body(JSON.stringify({request:'A',sanityDocuments:[{id:'event-a'}]}))
    :route.startsWith('contents/assistant/website-update.json')?body('not json'):assert.fail(route);
  const result=await updateFiles(5,head,{},{get});
  assert.deepEqual(result.updateFiles,['content-updates/2026-10-27-a.json','assistant/website-update.json']);
  assert.deepEqual(result.listed,['event-a']);
  assert.equal(result.problems.length,1);
});
test('artifact hosting never executes a PR Worker or trusts routing configuration',()=>{
  const files=[{path:'index.html',sha256:'d'.repeat(64)}];
  checkStaticFiles(files,digestOf(files));
  for(const name of ['_worker.js','_worker.js/index.js','_redirects','_headers','functions/api.js','.git/config','../escape','node_modules/package/index.js']) {
    const bad=[{...files[0],path:name}];
    assert.throws(()=>checkStaticFiles(bad,digestOf(bad)));
  }
});
