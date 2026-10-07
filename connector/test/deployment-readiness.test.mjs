import test from 'node:test';
import assert from 'node:assert/strict';
import {publisherReadiness,verifyHostedSource} from '../src/deployment-readiness.mjs';
const env={CLOUDFLARE_API_TOKEN:'fixture',LIBRARY_ANALYTICS_MONITOR_TOKEN:'fixture'};
test('publisher leaves existing deployment untouched while credentials or Google approval are missing',()=>{
  assert.equal(publisherReadiness({},()=>{throw Error('Probe must not receive missing credentials');}).state,'publisher_setup_pending');
  assert.equal(publisherReadiness(env,()=>({status:1,stderr:'account_attention\n'})).state,'account_setup_pending');
  assert.equal(publisherReadiness(env,()=>({status:1,stderr:'private-fixture-error'})).state,'connection_attention');
  assert.ok(!JSON.stringify(publisherReadiness(env,()=>({status:1,stderr:'private-fixture-error'}))).includes('private-fixture-error'));
  assert.equal(publisherReadiness(env,()=>({status:0})),null);
});
test('publisher waits for exact source propagation and rejects a persistently wrong version',async()=>{
  let calls=0,waits=0;
  const sleep=async ms=>{assert.equal(ms,2000);waits++;};
  await verifyHostedSource('https://fixture.test/health','checked',{sleep,fetcher:async()=>Response.json({sourceSha:++calls===3?'checked':'previous'})});
  assert.equal(calls,3);assert.equal(waits,2);
  calls=0;waits=0;
  await assert.rejects(()=>verifyHostedSource('https://fixture.test/health','checked',{sleep,fetcher:async()=>{calls++;return Response.json({sourceSha:'wrong'});}}),/did not match/);
  assert.equal(calls,6);assert.equal(waits,5);
});
