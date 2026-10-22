import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyPublisher} from '../src/deployment-readiness.mjs';
const sha='a'.repeat(40);
test('publisher waits for edge propagation instead of immediately rolling back',async()=>{
  let requests=0;
  await verifyPublisher(sha,{attempts:3,sleep:async()=>{},fetcher:async()=>Response.json({status:'configured',sourceSha:++requests===3?sha:'b'.repeat(40)})});
  assert.equal(requests,3);
});
test('bounded publisher failure reports actual public source and configuration',async()=>{
  await assert.rejects(verifyPublisher(sha,{attempts:2,sleep:async()=>{},fetcher:async()=>Response.json({status:'setup_pending',sourceSha:sha})}),/status=setup_pending/);
  await assert.rejects(verifyPublisher(sha,{attempts:1,fetcher:async()=>new Response('',{status:403})}),/HTTP 403/);
});
