import test from 'node:test';
import assert from 'node:assert/strict';
import {publisherReadiness} from '../src/deployment-readiness.mjs';
const env={CLOUDFLARE_API_TOKEN:'fixture',LIBRARY_ANALYTICS_MONITOR_TOKEN:'fixture'};
test('publisher leaves existing deployment untouched while credentials or Google approval are missing',()=>{
  assert.equal(publisherReadiness({},()=>{throw Error('Probe must not receive missing credentials');}).state,'publisher_setup_pending');
  assert.equal(publisherReadiness(env,()=>({status:1,stderr:'account_attention\n'})).state,'account_setup_pending');
  assert.equal(publisherReadiness(env,()=>({status:1,stderr:'private-fixture-error'})).state,'connection_attention');
  assert.ok(!JSON.stringify(publisherReadiness(env,()=>({status:1,stderr:'private-fixture-error'}))).includes('private-fixture-error'));
  assert.equal(publisherReadiness(env,()=>({status:0})),null);
});
