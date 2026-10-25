import test from 'node:test';
import assert from 'node:assert/strict';
import { Miniflare } from 'miniflare';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const origin='https://cottonwood-library-analytics.librarycottonwood.workers.dev';
test('real Workers runtime enforces OAuth discovery, PKCE, consent cookies and CSRF',async()=>{
  execFileSync('npx',['--no-install','wrangler','deploy','--dry-run','--outdir','dist'],{stdio:'pipe',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
  const mf=new Miniflare({telemetry:{enabled:false},workers:[{config:{
    name:'analytics-test',compatibilityDate:'2026-10-06',compatibilityFlags:['global_fetch_strictly_public'],
    manifest:{mainModule:'index.js',modulesRoot:process.cwd(),modules:{'index.js':{type:'esm',contents:readFileSync('dist/index.js','utf8')}}},
    env:{OAUTH_KV:{type:'kv',id:'analytics-test'},GITHUB_CLIENT_ID:{type:'text',value:'fixture-client'}},
    exports:{},
  },dev:{rootPath:process.cwd()}}]});
  try {
    const resource=await mf.dispatchFetch(origin+'/.well-known/oauth-protected-resource/mcp');assert.equal(resource.status,200);assert.deepEqual((await resource.json()).scopes_supported,['analytics:read']);
    const denied=await mf.dispatchFetch(origin+'/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})});assert.equal(denied.status,401);assert.match(denied.headers.get('www-authenticate'),/resource_metadata/);
    const reg=await mf.dispatchFetch(origin+'/oauth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_name:'<img src=x onerror=alert(1)>',redirect_uris:['https://chatgpt.com/connector_platform_oauth_redirect'],grant_types:['authorization_code','refresh_token'],response_types:['code'],token_endpoint_auth_method:'none'})});assert.equal(reg.status,201);
    const client=await reg.json();
    const url=new URL(origin+'/authorize');url.search=new URLSearchParams({client_id:client.client_id,redirect_uri:'https://chatgpt.com/connector_platform_oauth_redirect',response_type:'code',resource:origin+'/mcp',scope:'analytics:read offline_access',state:'fixture-state',code_challenge:'A'.repeat(43),code_challenge_method:'S256'}).toString();
    const consent=await mf.dispatchFetch(url.href);assert.equal(consent.status,200);const html=await consent.text();assert.ok(!html.includes('<img src=x'));assert.match(html,/&#60;img/);assert.match(consent.headers.get('content-security-policy'),/frame-ancestors 'none'/);
    const handle=html.match(/name="handle" value="([^"]+)"/)[1];
    const cookie=consent.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);
    const forged=await mf.dispatchFetch(origin+'/authorize',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({handle,decision:'approve'}).toString()});assert.notEqual(forged.status,302);assert.equal(forged.headers.get('location'),null);
    const approved=await mf.dispatchFetch(origin+'/authorize',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:cookie.split(';')[0]},body:new URLSearchParams({handle,decision:'approve'}).toString()});assert.equal(approved.status,302);const next=new URL(approved.headers.get('location'));assert.equal(next.origin,'https://github.com');assert.equal(next.searchParams.get('scope'),null);assert.equal(next.searchParams.get('code_challenge_method'),'S256');
    const forgedCallback=await mf.dispatchFetch(origin+'/callback?code=fixture&state=forged');assert.notEqual(forgedCallback.status,302);
  } finally {await mf.dispose();}
});
