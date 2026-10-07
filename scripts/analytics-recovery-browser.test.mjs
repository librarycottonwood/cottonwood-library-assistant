import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {chromium} from 'playwright';
import {handleReconnect} from '../connector/src/reconnect.mjs';

test('real browser preserves recovery cookie and follows only the allowed Google redirect',async()=>{
  const origin='https://cottonwood-library-analytics.librarycottonwood.workers.dev';
  const data=new Map();
  const env={GOOGLE_OAUTH_CLIENT_ID:'fixture',GOOGLE_OAUTH_CLIENT_SECRET:'fixture',GOOGLE_OAUTH_TOKEN_KEY:Buffer.alloc(32,1).toString('base64'),GOOGLE_OAUTH_PUBLISHING_STATUS:'production',OAUTH_KV:{get:async k=>data.get(k),put:async(k,v)=>data.set(k,v),delete:async k=>data.delete(k)}};
  let executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if(!executablePath){try{await access('/usr/bin/chromium');executablePath='/usr/bin/chromium';}catch{}}
  // DNS cannot resolve external hosts, even if an interception regresses.
  const browser=await chromium.launch({executablePath,headless:true,args:['--host-resolver-rules=MAP * ~NOTFOUND']});
  let googleAuthorization=0,postStatus;
  try {
    const context=await browser.newContext();const page=await context.newPage();
    const cdp=await context.newCDPSession(page);
    // CDP intercepts each redirect hop; Playwright route() handles only the
    // initial request in a redirect chain. No real Google requests are possible.
    await cdp.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
    cdp.on('Fetch.requestPaused',async event=>{
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
    });
    await page.goto(origin+'/reconnect');
    await Promise.all([page.waitForURL('https://accounts.google.com/**',{timeout:10000}),page.getByRole('button',{name:'Reconnect with Google'}).click()]);
    assert.equal(postStatus,302);assert.equal(googleAuthorization,1);
  }finally{await browser.close();}
});
