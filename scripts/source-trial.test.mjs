import test from 'node:test';
import assert from 'node:assert/strict';
import {checkRun,checkMerge,checkContent,checkStaticFiles} from './source-trial.mjs';
import {digestOf} from './release.mjs';
import {contentDigest} from './cms.mjs';
import {revisionDigest} from './cms-publishing.mjs';
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
  const snapshot={documents:[{_id:'event',_type:'event',_rev:'one',title:'Approved'}]};
  const pins={contentDigest:contentDigest(snapshot),revisionDigest:revisionDigest(snapshot)};
  checkContent(pins,snapshot);
  assert.throws(()=>checkContent(pins,{documents:[{...snapshot.documents[0],title:'Changed'}]}));
  assert.throws(()=>checkContent(pins,{documents:[{...snapshot.documents[0],_rev:'two'}]}));
});
test('artifact hosting never executes a PR Worker or trusts routing configuration',()=>{
  const files=[{path:'index.html',sha256:'d'.repeat(64)}];
  checkStaticFiles(files,digestOf(files));
  for(const name of ['_worker.js','_worker.js/index.js','_redirects','_headers','functions/api.js','.git/config','../escape','node_modules/package/index.js']) {
    const bad=[{...files[0],path:name}];
    assert.throws(()=>checkStaticFiles(bad,digestOf(bad)));
  }
});
