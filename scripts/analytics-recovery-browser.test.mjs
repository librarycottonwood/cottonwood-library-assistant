import test from 'node:test';
import assert from 'node:assert/strict';
import {launchBrowser} from './browser.mjs';
import {handleReconnect} from '../connector/src/reconnect.mjs';

test('real browser preserves recovery cookie and follows only the allowed Google redirect',async()=>{
  const origin='https://cottonwood-library-analytics.librarycottonwood.workers.dev';
  const data=new Map();
  const env={GOOGLE_OAUTH_CLIENT_ID:'fixture',GOOGLE_OAUTH_CLIENT_SECRET:'fixture',GOOGLE_OAUTH_TOKEN_KEY:Buffer.alloc(32,1).toString('base64'),GOOGLE_OAUTH_PUBLISHING_STATUS:'production',OAUTH_KV:{get:async k=>data.get(k),put:async(k,v)=>data.set(k,v),delete:async k=>data.delete(k)}};
  // DNS cannot resolve external hosts, even if an interception regresses.
  const browser=await launchBrowser({args:['--host-resolver-rules=MAP * ~NOTFOUND']});
  let googleAuthorization=0,postStatus,cdp,interceptFailure,onPaused;
  const pending=new Set();
  try {
    const context=await browser.newContext();const page=await context.newPage();
    cdp=await context.newCDPSession(page);
    // CDP intercepts each redirect hop; Playwright route() handles only the
    // initial request in a redirect chain. No real Google requests are possible.
    await cdp.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
    const fulfill=async event=>{
      const r=event.request;const url=new URL(r.url);
      let status=404,body='Blocked fixture request',headers={'content-type':'text/plain'};
      if(url.origin==='https://accounts.google.com' && url.pathname==='/o/oauth2/v2/auth'){
        googleAuthorization++;assert.equal(url.searchParams.get('code_challenge_method'),'S256');
        assert.equal(url.searchParams.get('scope'),'openid email https://www.googleapis.com/auth/analytics.readonly');
        status=200;body='<p>Intercepted Google fixture.</p>';headers={'content-type':'text/html'};
      }else if(url.origin===origin && url.pathname==='/reconnect'){
        const request=new Request(r.url,{method:r.method,headers:r.headers,...(r.method==='POST'?{body:r.postData}: {})});
        const response=await handleReconnect(request,env,()=>{throw Error('External requests forbidden');});
        if(r.method==='POST')postStatus=response.status;
        status=response.status;headers=Object.fromEntries(response.headers);body=await response.text();
      }
      await cdp.send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:status,responseHeaders:Object.entries(headers).map(([name,value])=>({name,value})),body:Buffer.from(body).toString('base64')});
    };
    onPaused=event=>{
      const task=fulfill(event).catch(error=>{interceptFailure ||= error;}).finally(()=>pending.delete(task));
      pending.add(task);
    };
    cdp.on('Fetch.requestPaused',onPaused);
    await page.goto(origin+'/reconnect');
    await Promise.all([page.waitForURL('https://accounts.google.com/**',{timeout:10000}),page.getByRole('button',{name:'Reconnect with Google'}).click()]);
    // URL changes at navigation start; wait for the intercepted response to
    // render before asserting success and shutting the browser down.
    await page.getByText('Intercepted Google fixture.').waitFor();
    await Promise.all([...pending]);
    if(interceptFailure)throw interceptFailure;
    assert.equal(postStatus,302);assert.equal(googleAuthorization,1);
  }finally{
    if(cdp && onPaused)cdp.removeListener('Fetch.requestPaused',onPaused);
    await Promise.all([...pending]);
    await browser.close();
  }
});
