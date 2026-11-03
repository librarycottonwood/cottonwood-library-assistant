// Human-initiated, keyless reconnection. No account settings or permissions API.
import { userOAuthReady, saveGrant, recoveryError } from './google-user.mjs';
import { recoveryDetail } from './recovery.mjs';
const ORIGIN='https://cottonwood-library-analytics.librarycottonwood.workers.dev';
const EMAIL='librarycottonwood@gmail.com';
const REDIRECT=ORIGIN+'/google/callback';
const COOKIE='library_google_recovery';
const escape=s=>String(s).replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
const b64=data=>btoa(String.fromCharCode(...new Uint8Array(data))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const cookie=request=>request.headers.get('Cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
function page(message,next,status=200,headers={}) {
  return new Response(`<!doctype html><meta charset="utf-8"><title>Reconnect library visitor reports</title><h1>Library visitor reports</h1><p>${escape(message)}</p>${next||''}`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; form-action 'self' https://accounts.google.com; base-uri 'none'; frame-ancestors 'none'",'Referrer-Policy':'strict-origin',...headers}});
}
function problem(reason,status=503) {
  const detail=recoveryDetail(reason);
  return page(detail.message,`<p>${escape(detail.nextStep.instruction)}</p>${detail.nextStep.url?`<p><a href="${escape(detail.nextStep.url)}">Open the next step</a></p>`:''}`,status);
}
export async function handleReconnect(request,env,fetcher=fetch) {
  const url=new URL(request.url);
  if(url.pathname==='/privacy' && request.method==='GET')return page('Cottonwood Library visitor reports privacy information.', '<p>This library-owned connection reads aggregate visitor reports from the fixed Cottonwood Library website Analytics property and provides requested answers to the library account in ChatGPT. It cannot edit Analytics, accounts or the website.</p><p>Google sign-in is limited to the library email. The server stores a protected, encrypted renewable Google connection in the library’s Cloudflare account. Passwords and private files are not requested in chat. Daily checks store status and source evidence, not visitor figures. Report answers can be present in the library’s ChatGPT conversations.</p><p>Google data is used only to provide and check the requested library report connection, not for advertising or sale. Use and transfer of information received from Google APIs follows the Google API Services User Data Policy, including Limited Use requirements.</p><p>You can remove this app’s access in your Google account’s third-party connections. Contact the library administrator at librarycottonwood@gmail.com to remove its stored connection or ask about this service.</p>');
  if(url.pathname==='/terms' && request.method==='GET')return page('Cottonwood Library visitor reports connection terms.', '<p>This private connection is for authorized library use. It provides read-only website reports on request; it does not publish website changes. Counts reflect recorded consented visits and can be delayed or unavailable.</p><p>Only the library Google and GitHub identities can connect. Do not share passwords, approval codes or private files in chat. An administrator can disconnect the Google permission or remove the stored library connection. Ask the library administrator at librarycottonwood@gmail.com about access.</p>');
  if(!['/reconnect','/google/callback'].includes(url.pathname))return null;
  if(!userOAuthReady(env))return page('The library’s secure Google reconnect option has not finished setup. Signing in again cannot finish that setup.', '<p>Return to your library assistant and ask: “Help me finish setting up visitor reports.” You do not need to download or paste any private files.</p>',503);
  if(url.pathname==='/reconnect' && request.method==='GET') {
    const state=b64(crypto.getRandomValues(new Uint8Array(32)));
    await env.OAUTH_KV.put('google-recovery:'+state,JSON.stringify({phase:'begin'}),{expirationTtl:600});
    return page('Reconnect with the library Google account. Google will ask permission to read visitor reports; this cannot change your website or report settings.',`<form method="post"><input type="hidden" name="state" value="${state}"><button>Reconnect with Google</button></form><p>Choose ${EMAIL}. If Google asks for phone approval, ask Donna once and wait. No passwords, codes or private files belong in your chat.</p>`,200,{'Set-Cookie':`${COOKIE}=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`});
  }
  if(url.pathname==='/reconnect' && request.method==='POST') {
    if(request.headers.get('Origin')!==ORIGIN)return page('Please start reconnection from the library connection page.',null,403);
    const form=await request.formData();const state=String(form.get('state')||'');
    const raw=state===cookie(request)?await env.OAUTH_KV.get('google-recovery:'+state):null;
    if(!raw || JSON.parse(raw).phase!=='begin')return page('That reconnection request expired. Return to the library assistant before starting a fresh request.',null,403);
    const verifier=b64(crypto.getRandomValues(new Uint8Array(48)));
    await env.OAUTH_KV.put('google-recovery:'+state,JSON.stringify({phase:'google',verifier}),{expirationTtl:600});
    const target=new URL('https://accounts.google.com/o/oauth2/v2/auth');
    target.search=new URLSearchParams({client_id:env.GOOGLE_OAUTH_CLIENT_ID,redirect_uri:REDIRECT,response_type:'code',scope:'openid email https://www.googleapis.com/auth/analytics.readonly',access_type:'offline',prompt:'consent',login_hint:EMAIL,state,code_challenge:b64(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))),code_challenge_method:'S256'}).toString();
    return new Response(null,{status:302,headers:{Location:target.href,'Cache-Control':'no-store','Referrer-Policy':'strict-origin'}});
  }
  if(url.pathname==='/google/callback' && request.method==='GET') {
    const state=url.searchParams.get('state');const key='google-recovery:'+state;
    const raw=state && state===cookie(request)?await env.OAUTH_KV.get(key):null;
    if(!raw || JSON.parse(raw).phase!=='google')return page('That reconnection request could not be verified. Return to your library assistant.',null,403);
    await env.OAUTH_KV.delete(key);
    if(url.searchParams.has('error')||!url.searchParams.get('code'))return page('Google reconnection was not approved. Nothing was replaced. Ask your library assistant when you are ready to continue.',null,403);
    try {
      const flow=JSON.parse(raw);
      const response=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code:url.searchParams.get('code'),client_id:env.GOOGLE_OAUTH_CLIENT_ID,client_secret:env.GOOGLE_OAUTH_CLIENT_SECRET,redirect_uri:REDIRECT,code_verifier:flow.verifier}),signal:AbortSignal.timeout(15000)});
      const tokens=await response.json();
      if(!response.ok)throw recoveryError(tokens.error==='invalid_client'?'google_client_rejected':'google_grant_revoked');
      if(!tokens.access_token||!tokens.refresh_token)throw recoveryError('google_grant_revoked');
      const identity=await fetcher('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+tokens.access_token},signal:AbortSignal.timeout(15000)});
      const user=await identity.json();
      if(!identity.ok||user.email!==EMAIL||user.email_verified!==true)return page('Please use librarycottonwood@gmail.com. The saved connection was not replaced.',null,403);
      // Validate fixed-property read access before replacing the old grant.
      const yesterday=new Date(Date.now()-86400000).toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'});
      const checked=await fetcher('https://analyticsdata.googleapis.com/v1beta/properties/557596091:runReport',{method:'POST',headers:{Authorization:'Bearer '+tokens.access_token,'Content-Type':'application/json'},body:JSON.stringify({dateRanges:[{startDate:yesterday,endDate:yesterday}],metrics:[{name:'activeUsers'}],limit:'1'}),signal:AbortSignal.timeout(15000)});
      if([403,404].includes(checked.status))throw recoveryError('reader_access_removed');
      if(!checked.ok)throw recoveryError(checked.status===401?'google_grant_revoked':'temporary');
      await saveGrant({email:EMAIL,refreshToken:tokens.refresh_token,connectedAt:new Date().toISOString()},env);
      return page('Google visitor reports are reconnected. A real read-only library report succeeded.', '<p>Return to the library assistant and ask your visitor question again. ChatGPT’s own report-plugin sign-in is separate.</p>',200,{'Set-Cookie':`${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`});
    }catch(e){return problem(e.recovery?.reason||'temporary');}
  }
  return page('That action is not available.',null,405);
}
