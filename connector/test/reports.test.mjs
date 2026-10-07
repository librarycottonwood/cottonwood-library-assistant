import test from 'node:test';
import assert from 'node:assert/strict';
import { reportRequest, credentialFreeMcpCall } from '../src/reports.mjs';
import { normalizeReport } from '../src/format.mjs';
import { handleMcp } from '../src/mcp.mjs';
import { saveGrant } from '../src/google-user.mjs';
import { retryFetch, runReport, clearTokenCache } from '../src/google.mjs';
const dates={start_date:'2026-09-29',end_date:'2026-10-05'};
test('repairable protocol receives no credentials in headers or context',async()=>{
  const request=new Request('https://example.com/mcp',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer fixture-secret',Cookie:'fixture-cookie','X-Other-Credential':'fixture'},body:'{}'});
  const safe=credentialFreeMcpCall(request,{auth:{scope:['analytics:read'],token:'fixture-secret'},props:{login:'librarycottonwood',extraSecret:'fixture-secret'}});
  assert.equal(safe.request.headers.get('authorization'),null);assert.equal(safe.request.headers.get('cookie'),null);assert.equal(safe.request.headers.get('x-other-credential'),null);
  assert.equal(safe.context.auth.token,undefined);assert.equal(safe.context.props.extraSecret,undefined);assert.equal(await safe.request.text(),'{}');
});
test('missing Google grant reports account attention, never zero',async()=>{
  clearTokenCache();
  await assert.rejects(()=>runReport(dates,{},async()=>{throw Error('Network should not be reached');}),e=>e.code==='account_attention'&&e.recovery.reason==='reader_missing');
});
test('only aggregate reports and fixed property inputs are accepted',()=>{
  assert.deepEqual(reportRequest({...dates,report:'visitors'}).body.metrics.map(m=>m.name),['activeUsers','totalUsers','sessions','screenPageViews']);
  for(const bad of [{property:'123'},{report:'users'},{start_date:'2026-02-30'},{end_date:'2026-01-01'},{limit:999},{compare_start_date:'2026-09-01'}]) assert.throws(()=>reportRequest({...dates,...bad}));
  assert.equal(reportRequest({...dates,report:'directions'}).body.dimensionFilter.filter.stringFilter.value,'directions_click');
});
test('comparison dates and missing data stay explicit',()=>{
  const req=reportRequest({...dates,compare_start_date:'2026-09-22',compare_end_date:'2026-09-28'});
  const data=normalizeReport({},req);
  assert.equal(data.noRecordedData,true);assert.equal(data.dateRanges.length,2);assert.equal(data.rows.length,0);
  assert.match(data.trackingScope,/demo/);assert.ok(data.warnings.some(w=>w.includes('no defined percentage')));
  const result=normalizeReport({dimensionHeaders:[{name:'dateRange'}],metricHeaders:[{name:'activeUsers'}],rows:[{dimensionValues:[{value:'requested'}],metricValues:[{value:'1'}]}],metadata:{subjectToThresholding:true}},req);
  assert.equal(result.rows[0].activeUsers,1);assert.equal(result.rows[0].dateRange,'requested');assert.ok(result.warnings.some(w=>w.includes('thresholds')));
});
test('temporary failures retry with a bound, permission failures do not',async()=>{
  let attempts=0;
  const response=await retryFetch('https://example.com',{},async()=>{attempts++;return new Response('',{status:attempts<3?503:200});},async()=>{});
  assert.equal(response.status,200);assert.equal(attempts,3);
  attempts=0;await assert.rejects(()=>retryFetch('https://example.com',{},async()=>{attempts++;throw Error('private token should never appear');},async()=>{}),e=>e.code==='temporarily_unavailable'&&!e.message.includes('private'));
  assert.equal(attempts,3);
  attempts=0;await retryFetch('https://example.com',{},async()=>{attempts++;return new Response('',{status:403});},async()=>{});assert.equal(attempts,1);
});
const ctx={auth:{scope:['analytics:read']},props:{login:'librarycottonwood'}};
const rpc=(method,params)=>new Request('https://example.com/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
test('unauthorized clients never reach reporting',async()=>{
  let called=false;
  const reporter=async()=>{called=true;};
  assert.equal((await handleMcp(rpc('tools/list'),{},{} ,reporter)).status,403);
  assert.equal((await handleMcp(rpc('tools/list'),{}, {...ctx,props:{login:'other'}},reporter)).status,403);
  assert.equal(called,false);
});
test('MCP initialization, safe metadata, report errors and unavailable methods',async()=>{
  const init=await (await handleMcp(rpc('initialize',{protocolVersion:'2025-06-18'}),{},ctx)).json();
  assert.equal(init.result.protocolVersion,'2025-06-18');
  const list=await (await handleMcp(rpc('tools/list'),{},ctx)).json();assert.equal(list.result.tools.length,1);assert.equal(list.result.tools[0].annotations.readOnlyHint,true);
  const failed=await (await handleMcp(rpc('tools/call',{name:'library_website_report',arguments:dates}),{},ctx,async()=>{throw Error('SECRET');})).json();
  assert.equal(failed.result.isError,true);assert.ok(!JSON.stringify(failed).includes('SECRET'));assert.ok(!JSON.stringify(failed).includes('"rows"'));
  assert.equal((await (await handleMcp(rpc('settings/change'),{},ctx)).json()).error.code,-32601);
});
test('Google auth renews on 401 and permits only the library report endpoint',async()=>{
  clearTokenCache();
  const data=new Map();
  const env={GOOGLE_OAUTH_CLIENT_ID:'fixture-client',GOOGLE_OAUTH_CLIENT_SECRET:'fixture-secret',GOOGLE_OAUTH_PUBLISHING_STATUS:'production',GOOGLE_OAUTH_TOKEN_KEY:Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'),OAUTH_KV:{get:async key=>data.get(key)||null,put:async(key,value)=>data.set(key,value)}};
  await saveGrant({email:'librarycottonwood@gmail.com',refreshToken:'fixture-refresh'},env);
  let tokens=0,reports=0;
  const fetcher=async(url,init)=>{
    if(url==='https://oauth2.googleapis.com/token'){tokens++;return Response.json({access_token:'fixture-token',expires_in:3600});}
    assert.equal(url,'https://analyticsdata.googleapis.com/v1beta/properties/557596091:runReport');assert.equal(init.method,'POST');reports++;
    if(reports===1)return new Response('',{status:401});
    return Response.json({metricHeaders:[{name:'activeUsers'}],rows:[{metricValues:[{value:'1'}]}]});
  };
  const result=await runReport(dates,env,fetcher);assert.equal(result.rows[0].activeUsers,1);assert.equal(tokens,2);assert.equal(reports,2);
  await runReport(dates,env,fetcher);assert.equal(tokens,2);
  clearTokenCache();
});
