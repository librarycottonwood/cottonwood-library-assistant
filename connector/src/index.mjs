import OAuthProvider, { authorizationErrorRedirect } from '@cloudflare/workers-oauth-provider';
import { runReport } from './google.mjs';
import { credentialFreeMcpCall } from './reports.mjs';
import {handleLibraryMcp} from './library-mcp.mjs';
import { handleReconnect } from './reconnect.mjs';
import { connectionStatus } from './recovery.mjs';
import { userOAuthReady } from './google-user.mjs';
const ORIGIN='https://cottonwood-library-analytics.librarycottonwood.workers.dev';
const escape=s=>String(s).replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
const scopes=['analytics:read','website:read','website:save','offline_access'];
const defaultHandler={async fetch(request,env) {
  const url=new URL(request.url);
  const oauth=env.OAUTH_PROVIDER;
  try {
    const reconnect=await handleReconnect(request,env);if(reconnect)return reconnect;
    if (url.pathname==='/health') return Response.json({status:'ok',service:'Cottonwood Library Analytics',version:'0.3.0',publishingTools:Boolean(env.CMS_PUBLISHER),sourceSha:env.BUILD_SOURCE_SHA || null},{headers:{'Cache-Control':'no-store'}});
    if (url.pathname==='/monitor' && request.method==='POST') {
      const presented=request.headers.get('Authorization')?.replace(/^Bearer /,'') || '';
      if (!env.MONITOR_TOKEN || presented.length!==env.MONITOR_TOKEN.length || [...presented].reduce((diff,c,i)=>diff | c.charCodeAt(0)^env.MONITOR_TOKEN.charCodeAt(i),0)!==0) return new Response('Unauthorized.',{status:401});
      const yesterday=new Date(Date.now()-86400000).toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'});
      const status=await connectionStatus(()=>runReport({report:'visitors',start_date:yesterday,end_date:yesterday},env),userOAuthReady(env));
      return Response.json(status,{status:status.status==='ok'?200:503,headers:{'Cache-Control':'no-store'}});
    }
    if (url.pathname==='/authorize' && request.method==='GET') {
      const original=await oauth.parseAuthRequest(request);
      const details=await oauth.describeConsent(original);
      const consent=await oauth.beginConsent(original);
      const website=original.scope.includes('website:read');
      const save=original.scope.includes('website:save');
      consent.headers.set('Content-Type','text/html; charset=utf-8');
      return new Response(`<!doctype html><meta charset="utf-8"><title>Connect your library assistant</title><h1>Connect your library assistant</h1><p>Allow <strong>${escape(details.clientName)}</strong> to read the library's tracked demo website statistics: visits, popular pages, button clicks, locations, traffic sources and devices. ${website?'It can also show checked website previews in chat. ':''}${save?'When you approve saving in chat, it can save that exact checked version to the trial website. It cannot change the public domain.':'These requested permissions cannot save website updates.'} It cannot change Analytics settings.</p><p>Access goes to <strong>${escape(details.redirectHost)}</strong>. ${details.clientDomain?'Client published by '+escape(details.clientDomain):'This client registered its own name.'}</p>${details.redirectIsLoopback?'<p>This sends access to an app on your computer. Continue only if you started that app.</p>':''}<p>The connection stays signed in and renews automatically. Sign in with the library GitHub account to continue.</p><form method="post"><input type="hidden" name="handle" value="${escape(consent.handle)}"><button name="decision" value="approve">Connect library assistant</button> <button name="decision" value="deny">Cancel</button></form>`,{headers:consent.headers});
    }
    if (url.pathname==='/authorize' && request.method==='POST') {
      const form=await request.formData();
      if (form.get('decision')!=='approve') { const denied=await oauth.denyConsent(request,String(form.get('handle')));return new Response(null,{status:302,headers:denied.headers}); }
      const approved=await oauth.approveConsent(request,String(form.get('handle')));
      const verifier=crypto.randomUUID()+crypto.randomUUID();
      const {state,headers}=await oauth.beginUpstream(approved.request,{data:{verifier},headers:approved.headers});
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
      const challenge=btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
      const next=new URL('https://github.com/login/oauth/authorize');
      next.search=new URLSearchParams({client_id:env.GITHUB_CLIENT_ID,redirect_uri:ORIGIN+'/callback',state,code_challenge:challenge,code_challenge_method:'S256',login:'librarycottonwood'}).toString();
      // No GitHub scopes: this only proves identity, it never requests repository access.
      headers.set('Location',next.href);return new Response(null,{status:302,headers});
    }
    if (url.pathname==='/callback' && request.method==='GET') {
      const {request:original,data,headers}=await oauth.finishUpstream(request);
      if (!url.searchParams.get('code') || url.searchParams.has('error')) {headers.set('Location',authorizationErrorRedirect(original,'access_denied'));return new Response(null,{status:302,headers});}
      const response=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code:url.searchParams.get('code'),redirect_uri:ORIGIN+'/callback',code_verifier:data.verifier}),signal:AbortSignal.timeout(15000)});
      const result=await response.json();
      if (!response.ok || !result.access_token) return new Response('The library GitHub connection could not finish. Return to your library assistant for the next account step; repeated sign-in will not fix missing connection settings.',{status:503});
      const identity=await fetch('https://api.github.com/user',{headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${result.access_token}`,'User-Agent':'Cottonwood-Library-Analytics'},signal:AbortSignal.timeout(15000)});
      const user=await identity.json();
      if (!identity.ok || user.login!=='librarycottonwood' || String(user.id)!=='338888442') return new Response('Please use the library GitHub account to connect these reports.',{status:403,headers});
      // Upstream token is discarded; renewable MCP tokens carry only the verified library identity.
      const {redirectTo}=await oauth.completeAuthorization({request:original,userId:String(user.id),metadata:{label:'Cottonwood Library Assistant'},scope:original.scope,props:{login:user.login}});
      headers.set('Location',redirectTo);return new Response(null,{status:302,headers});
    }
    if (url.pathname==='/') return new Response('Cottonwood Community Library private website reports. Connect through the library ChatGPT account.',{headers:{'Content-Type':'text/plain; charset=utf-8'}});
    return new Response('Not found.',{status:404});
  } catch { return new Response('The library report connection could not finish. Return to your library assistant for the next step. Do not repeatedly request account verification.',{status:503,headers:{'Cache-Control':'no-store'}}); }
}};
export default new OAuthProvider({
  apiRoute:'/mcp',apiHandler:{fetch(request,env,ctx) {
    if (!ctx.auth?.scope?.includes('analytics:read') || ctx.props?.login !== 'librarycottonwood') return new Response('Library authorization required.',{status:403});
    const safe=credentialFreeMcpCall(request,ctx);
    return handleLibraryMcp(safe.request,safe.context,args=>runReport(args,env),()=>{
      const yesterday=new Date(Date.now()-86400000).toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'});
      return connectionStatus(()=>runReport({report:'visitors',start_date:yesterday,end_date:yesterday},env),userOAuthReady(env));
    }, env.CMS_PUBLISHER);
  }},defaultHandler,
  authorizeEndpoint:'/authorize',tokenEndpoint:'/oauth/token',clientRegistrationEndpoint:'/oauth/register',
  scopesSupported:scopes,requiredScopes:['analytics:read'],
  resourceMetadata:{resource:ORIGIN+'/mcp',authorization_servers:[ORIGIN]},
  clientIdMetadataDocumentEnabled:true,accessTokenTTL:3600,
  refreshTokenTTL:31536000,refreshTokenIdleTTL:31536000,
});
