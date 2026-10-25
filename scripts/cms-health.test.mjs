import test from 'node:test';
import assert from 'node:assert/strict';
import {checkCmsHealth} from './cms-health.mjs';
const origin='https://cms-library.example';
const env={CMS_PUBLISHER_ORIGIN:origin,CMS_STATUS_TOKEN:'synthetic-status-token-12345678901234567890',GITHUB_SHA:'a'.repeat(40)};
const id='11111111-1111-4111-8111-111111111111';
const last={operationId:id,sourceSha:'a'.repeat(40),contentDigest:'b'.repeat(64),releaseDigest:'c'.repeat(64),websiteUrl:'https://cottonwood-library.pages.dev',verifiedAt:'2026-10-20T10:00:00Z'};
function service({record=last,reconcile='review_required',wrongHosted=false,oldFailures=false}={}){
  const calls=[];
  const fetcher=async(url,options={})=>{
    calls.push({url,options});
    if(url.startsWith(origin)){
      assert.equal(options.method,'POST');assert.equal(options.headers.Authorization,`Bearer ${env.CMS_STATUS_TOKEN}`);assert.equal(options.redirect,'error');
      if(url.endsWith('/reconcile'))return Response.json({status:reconcile,changed:false,operation:{id,status:reconcile}});
      if(url.endsWith('/monitor'))return Response.json({lastVerified:record,operations:oldFailures?[{id,status:'build_failed'}]:[{id,status:reconcile,sourceSha:last.sourceSha}]});
      throw Error('Unexpected privileged destination');
    }
    assert.ok(!options.headers?.Authorization,'private status token must never reach public hosting');
    assert.ok(url.startsWith(last.websiteUrl));
    if(url.endsWith('/_review/status.json'))return Response.json({operationId:id,sourceSha:last.sourceSha,contentDigest:last.contentDigest,digest:wrongHosted?'d'.repeat(64):last.releaseDigest});
    return new Response('synthetic hosted page or picture');
  };
  return {calls,fetcher};
}
test('daily CMS health reconciles missed changes and matches actual hosted marker without leaking status credentials',async()=>{
  const mock=service();const report=await checkCmsHealth({env,fetcher:mock.fetcher});
  assert.equal(report.result,'checked');assert.equal(report.hostedVerified,true);
  assert.equal(report.operations[0].reviewUrl,`${origin}/review/${id}`);
  assert.equal(mock.calls.length,6);
  assert.ok(!JSON.stringify(report).includes(env.CMS_STATUS_TOKEN));
});
test('initial account connection and pending review never claim a verified website',async()=>{
  const mock=service({record:null,reconcile:'preview_queued'});
  const report=await checkCmsHealth({env,fetcher:mock.fetcher});
  assert.equal(report.result,'awaiting_first_verified_deployment');assert.equal(report.hostedVerified,false);assert.equal(mock.calls.length,2);
});
test('a verified record from the retired trial address is not treated as a verified live website',async()=>{
  const mock=service({record:{...last,websiteUrl:'https://cms-trial.cottonwood-library-trial-preview.pages.dev'}});
  const report=await checkCmsHealth({env,fetcher:mock.fetcher});
  assert.equal(report.result,'awaiting_first_verified_deployment');assert.equal(report.hostedVerified,false);assert.equal(report.lastVerified,null);
  assert.equal(mock.calls.length,2,'the retired address is never fetched');
  await assert.rejects(checkCmsHealth({env,fetcher:service({record:{...last,websiteUrl:'https://unrelated.example'}}).fetcher}),/record was invalid/);
});
test('current failed operation needs attention but superseded failure does not replace a current pending review',async()=>{
  assert.equal((await checkCmsHealth({env,fetcher:service({reconcile:'build_failed'}).fetcher})).result,'needs_attention');
  assert.equal((await checkCmsHealth({env,fetcher:service({oldFailures:true}).fetcher})).result,'checked');
});
test('wrong hosted version, broken authentication, malformed status and missing setup cannot report healthy',async()=>{
  await assert.rejects(checkCmsHealth({env,fetcher:service({wrongHosted:true}).fetcher}),/differs/);
  await assert.rejects(checkCmsHealth({env,fetcher:async()=>new Response('',{status:401})}),/could not verify/);
  await assert.rejects(checkCmsHealth({env,fetcher:async()=>Response.json({status:'review_required'})}),/status was invalid/);
  for(const bad of [{},{...env,CMS_PUBLISHER_ORIGIN:'http://cms-library.example'},{...env,CMS_PUBLISHER_ORIGIN:origin+'/extra'},{...env,CMS_STATUS_TOKEN:''}])await assert.rejects(checkCmsHealth({env:bad,fetcher:async()=>assert.fail('should not call network')}),/setup pending/);
});
