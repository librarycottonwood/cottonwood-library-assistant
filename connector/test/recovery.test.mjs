import test from 'node:test';
import assert from 'node:assert/strict';
import { recoveryDetail, connectionStatus } from '../src/recovery.mjs';
import { userAccessToken, saveGrant, readGrant, clearUserTokenCache, recoveryError } from '../src/google-user.mjs';
import { handleReconnect } from '../src/reconnect.mjs';
import { runReport,clearTokenCache } from '../src/google.mjs';
import { handleMcp } from '../src/mcp.mjs';
const origin='https://cottonwood-library-analytics.librarycottonwood.workers.dev';
function fixture() {
  const data=new Map();
  const env={GOOGLE_OAUTH_CLIENT_ID:'fixture-client',GOOGLE_OAUTH_CLIENT_SECRET:'fixture-client-secret',GOOGLE_OAUTH_PUBLISHING_STATUS:'production',GOOGLE_OAUTH_TOKEN_KEY:Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'),OAUTH_KV:{get:async key=>data.get(key)||null,put:async(key,value)=>data.set(key,value),delete:async key=>data.delete(key)}};
  return {env,data};
}
async function flow(env) {
  const begin=await handleReconnect(new Request(origin+'/reconnect'),env);
  assert.equal(begin.status,200);const html=await begin.text();
  const state=html.match(/name="state" value="([^"]+)"/)[1];
  const cookie=begin.headers.get('set-cookie').split(';')[0];
  const response=await handleReconnect(new Request(origin+'/reconnect',{method:'POST',headers:{Origin:origin,Cookie:cookie},body:new URLSearchParams({state})}),env);
  assert.equal(response.status,302);
  const target=new URL(response.headers.get('location'));
  assert.equal(target.origin,'https://accounts.google.com');
  assert.equal(target.searchParams.get('code_challenge_method'),'S256');
  assert.equal(target.searchParams.get('login_hint'),'librarycottonwood@gmail.com');
  assert.equal(target.searchParams.get('scope'),'openid email https://www.googleapis.com/auth/analytics.readonly');
  return {cookie,state,callback:new Request(origin+'/google/callback?code=fixture-code&state='+state,{headers:{Cookie:cookie}})};
}
test('recovery distinguishes identity, key, grant, client and permissions; never invents readiness',()=>{
  assert.equal(recoveryDetail('reader_key_rejected').nextStep.kind,'administrator_setup');
  assert.match(recoveryDetail('reader_key_rejected').nextStep.instruction,/Signing in alone cannot/);
  assert.equal(recoveryDetail('reader_key_rejected',true).nextStep.kind,'google_reconnect');
  assert.equal(recoveryDetail('google_client_rejected',true).nextStep.kind,'administrator_setup');
  assert.equal(recoveryDetail('reader_access_removed').nextStep.kind,'property_access');
  assert.equal(recoveryDetail('chatgpt_signin_expired').nextStep.url,'https://chatgpt.com/plugins');
  assert.equal(recoveryDetail('SECRET-RAW-ERROR').reason,'temporary');
});
test('browser reconnect is disabled for absent clients and seven-day Testing grants',async()=>{
  for(const env of [{}, {...fixture().env,GOOGLE_OAUTH_PUBLISHING_STATUS:'testing'}]) {
    const response=await handleReconnect(new Request(origin+'/reconnect'),env);
    assert.equal(response.status,503);const text=await response.text();
    assert.match(text,/not finished setup/);assert.ok(!text.includes('<form'));assert.ok(!text.includes('fixture-client-secret'));
  }
});
test('temporary Google tokens renew quietly; revoked grants and invalid clients give distinct safe steps',async()=>{
  const {env,data}=fixture();clearUserTokenCache();
  await saveGrant({email:'librarycottonwood@gmail.com',refreshToken:'fixture-private-refresh'},env);
  assert.ok(!JSON.stringify([...data.values()]).includes('fixture-private-refresh'));
  let count=0;const fetcher=async()=>{count++;return Response.json({access_token:'temporary-'+count,expires_in:3600});};
  assert.equal(await userAccessToken(env,fetcher),'temporary-1');
  assert.equal(await userAccessToken(env,fetcher),'temporary-1');assert.equal(count,1);
  const originalNow=Date.now;
  try {Date.now=()=>originalNow()+3601000;assert.equal(await userAccessToken(env,fetcher),'temporary-2');}finally{Date.now=originalNow;}
  for(const [error,reason] of [['invalid_grant','google_grant_revoked'],['invalid_client','google_client_rejected']]) {
    clearUserTokenCache();
    await assert.rejects(()=>userAccessToken(env,async()=>Response.json({error,error_description:'fixture-client-secret fixture-private-refresh'},{status:400})),e=>e.recovery.reason===reason&&!JSON.stringify(e.recovery).includes('fixture-'));
  }
  assert.equal((await readGrant(env)).refreshToken,'fixture-private-refresh');
});
test('browser rejects forgery, expired state, cancelled consent and wrong account without replacing old grant',async()=>{
  const {env}=fixture();await saveGrant({email:'librarycottonwood@gmail.com',refreshToken:'old-private-refresh'},env);
  let requests=0;const never=async()=>{requests++;throw Error('Unexpected network');};
  const forged=await handleReconnect(new Request(origin+'/reconnect',{method:'POST',headers:{Origin:'https://attacker.example'},body:new URLSearchParams({state:'forged'})}),env,never);assert.equal(forged.status,403);
  const expired=await handleReconnect(new Request(origin+'/google/callback?code=fixture&state=expired',{headers:{Cookie:'library_google_recovery=expired'}}),env,never);assert.equal(expired.status,403);
  const cancelled=await flow(env);
  assert.equal((await handleReconnect(new Request(origin+'/google/callback?error=access_denied&state='+cancelled.state,{headers:{Cookie:cancelled.cookie}}),env,never)).status,403);assert.equal(requests,0);
  const wrong=await flow(env);let calls=0;
  const response=await handleReconnect(wrong.callback,env,async()=>++calls===1?Response.json({access_token:'private-access',refresh_token:'wrong-refresh'}):Response.json({email:'other@example.test',email_verified:true}));
  assert.equal(response.status,403);assert.equal((await readGrant(env)).refreshToken,'old-private-refresh');
  assert.ok(!(await response.text()).includes('private-access'));
  assert.equal((await handleReconnect(wrong.callback,env,never)).status,403);
});
test('read access is checked before replacement; denial preserves old grant and real success restores reports',async()=>{
  const {env}=fixture();await saveGrant({email:'librarycottonwood@gmail.com',refreshToken:'old-private-refresh'},env);
  for(const status of [403,401,503,200]) {
    const current=await flow(env);let calls=0;
    const response=await handleReconnect(current.callback,env,async(url,init)=>{
      calls++;
      if(calls===1)return Response.json({access_token:'private-new-access',refresh_token:'new-private-refresh'});
      if(calls===2)return Response.json({email:'librarycottonwood@gmail.com',email_verified:true});
      assert.equal(url,'https://analyticsdata.googleapis.com/v1beta/properties/557596091:runReport');
      assert.deepEqual(JSON.parse(init.body).metrics,[{name:'activeUsers'}]);
      return Response.json(status===200?{}:{error:{message:'private-new-access'}},{status});
    });
    const html=await response.text();assert.ok(!html.includes('private-new-access'));assert.ok(!html.includes('new-private-refresh'));
    assert.equal(response.status,status===200?200:503);
    assert.equal((await readGrant(env)).refreshToken,status===200?'new-private-refresh':'old-private-refresh');
    if(status===200)assert.match(html,/real read-only library report succeeded/);
  }
  clearTokenCache();
  const report=await runReport({report:'visitors',start_date:'2026-10-01',end_date:'2026-10-02'},env,async url=>url==='https://oauth2.googleapis.com/token'?Response.json({access_token:'fresh',expires_in:3600}):Response.json({metricHeaders:[{name:'activeUsers'}],rows:[{metricValues:[{value:'2'}]}]}));
  assert.equal(report.rows[0].activeUsers,2);
});
test('removed reader access fails as access loss; restoring it validates actual report, not login alone',async()=>{
  const {env}=fixture();await saveGrant({email:'librarycottonwood@gmail.com',refreshToken:'fixture'},env);clearTokenCache();
  let allowed=false;
  const probe=()=>runReport({report:'visitors',start_date:'2026-10-01',end_date:'2026-10-02'},env,async url=>url==='https://oauth2.googleapis.com/token'?Response.json({access_token:'fixture',expires_in:3600}):Response.json({}, {status:allowed?200:403}));
  const denied=await connectionStatus(probe,true);assert.equal(denied.realReportVerified,false);assert.equal(denied.recovery.reason,'reader_access_removed');
  allowed=true;const restored=await connectionStatus(probe,true);assert.equal(restored.status,'ok');assert.equal(restored.realReportVerified,true);
});
test('connection diagnostic MCP tool accepts no mutation arguments or secret-bearing errors',async()=>{
  const ctx={auth:{scope:['analytics:read']},props:{login:'librarycottonwood'}};
  const rpc=args=>new Request(origin+'/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'library_report_connection_status',arguments:args}})});
  const checker=()=>connectionStatus(async()=>{throw recoveryError('google_grant_revoked');},true);
  const result=await (await handleMcp(rpc({}),{},ctx,undefined,checker)).json();assert.equal(result.result.structuredContent.recovery.nextStep.kind,'google_reconnect');
  assert.equal((await (await handleMcp(rpc({replace_key:'secret'}),{},ctx,undefined,checker)).json()).error.code,-32602);
});
test('revoked service-account key is diagnosed separately; restored key must pass an actual report',async()=>{
  clearTokenCache();
  const key=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
  const privateKey=Buffer.from(await crypto.subtle.exportKey('pkcs8',key.privateKey)).toString('base64');
  const env={GOOGLE_SERVICE_ACCOUNT_EMAIL:'fixture@example.test',GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:privateKey};
  let restored=false,reportCalls=0;
  const probe=()=>runReport({report:'visitors',start_date:'2026-10-01',end_date:'2026-10-02'},env,async url=>{
    if(url==='https://oauth2.googleapis.com/token')return restored?Response.json({access_token:'fixture',expires_in:3600}):Response.json({error:'invalid_grant',error_description:privateKey},{status:400});
    reportCalls++;return Response.json({});
  });
  const failed=await connectionStatus(probe);assert.equal(failed.recovery.reason,'reader_key_rejected');assert.equal(reportCalls,0);assert.ok(!JSON.stringify(failed).includes(privateKey));
  restored=true;clearTokenCache();const success=await connectionStatus(probe);assert.equal(success.realReportVerified,true);assert.equal(reportCalls,1);
});
