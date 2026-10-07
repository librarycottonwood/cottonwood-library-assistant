import { PROPERTY, ReportError, reportRequest } from './reports.mjs';
import { normalizeReport } from './format.mjs';
const enc = new TextEncoder();
const b64 = value => btoa(String.fromCharCode(...new Uint8Array(value))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
let tokenState;
let pending;
export function clearTokenCache() { tokenState = undefined; pending = undefined; }
export async function retryFetch(url, init, fetcher = fetch, sleep = ms => new Promise(r => setTimeout(r, ms))) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try { response = await fetcher(url, { ...init, signal: AbortSignal.timeout(15000) }); }
    catch { if (attempt === 2) throw new ReportError('temporarily_unavailable','The visitor reports are temporarily unavailable. Please try again shortly.'); }
    if (response && ![429,500,502,503,504].includes(response.status)) return response;
    if (attempt < 2) await sleep(250 * 2 ** attempt + Math.floor(Math.random()*100));
  }
  throw new ReportError('temporarily_unavailable','The visitor reports are temporarily unavailable. Please try again shortly.');
}
async function token(env, fetcher) {
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) throw new ReportError('account_attention','The library administrator needs to reconnect the Google service-account credential for visitor reports.');
  if (tokenState?.email === env.GOOGLE_SERVICE_ACCOUNT_EMAIL && tokenState.expires > Date.now()+60000) return tokenState.value;
  if (pending) return pending;
  pending = (async () => {
    const now = Math.floor(Date.now()/1000);
    const head = b64(enc.encode(JSON.stringify({alg:'RS256',typ:'JWT'})));
    const body = b64(enc.encode(JSON.stringify({iss:env.GOOGLE_SERVICE_ACCOUNT_EMAIL,scope:'https://www.googleapis.com/auth/analytics.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})));
    const pem = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/-----[^-]+-----|\s/g,'');
    let key;
    try { key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem),c=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']); }
    catch { throw new ReportError('account_attention','The library administrator needs to reconnect the Google service-account credential for visitor reports.'); }
    const signature = b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,enc.encode(`${head}.${body}`)));
    const response = await retryFetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${head}.${body}.${signature}`})},fetcher);
    if (!response.ok) throw new ReportError('account_attention','The visitor report connection needs the library administrator to check its Google service account.');
    const data = await response.json();
    if (!data.access_token) throw new ReportError('account_attention','The visitor report connection needs the library administrator to check its Google service account.');
    tokenState={email:env.GOOGLE_SERVICE_ACCOUNT_EMAIL,value:data.access_token,expires:Date.now()+Number(data.expires_in || 3600)*1000};
    return tokenState.value;
  })();
  try { return await pending; } finally { pending=undefined; }
}
export async function runReport(args, env, fetcher=fetch) {
  const request=reportRequest(args);
  for (let attempt=0;attempt<2;attempt++) {
    const access=await token(env,fetcher);
    const response=await retryFetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY}:runReport`,{method:'POST',headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},body:JSON.stringify(request.body)},fetcher);
    if (response.status===401 && attempt===0) { clearTokenCache();continue; }
    if ([401,403].includes(response.status)) throw new ReportError('account_attention','The visitor report connection needs the library administrator to restore read-only access to the library Analytics property.');
    if (!response.ok) throw new ReportError('report_unavailable','Google could not return that report. Please try a shorter date range.');
    return normalizeReport(await response.json(),request);
  }
}
