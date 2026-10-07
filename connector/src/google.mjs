import { PROPERTY, ReportError, reportRequest } from './reports.mjs';
import { normalizeReport } from './format.mjs';
import { userAccessToken, clearUserTokenCache, recoveryError } from './google-user.mjs';
export function clearTokenCache() { clearUserTokenCache(); }
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
  const access=await userAccessToken(env,(url,init)=>retryFetch(url,init,fetcher));
  if(!access)throw recoveryError('reader_missing',env);
  return access;
}
export async function runReport(args, env, fetcher=fetch) {
  const request=reportRequest(args);
  for (let attempt=0;attempt<2;attempt++) {
    const access=await token(env,fetcher);
    const response=await retryFetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY}:runReport`,{method:'POST',headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},body:JSON.stringify(request.body)},fetcher);
    if (response.status===401 && attempt===0) { clearTokenCache();continue; }
    if (response.status===401) throw recoveryError('google_grant_revoked',env);
    if ([403,404].includes(response.status)) throw recoveryError('reader_access_removed',env);
    if (!response.ok) throw new ReportError('report_unavailable','Google could not return that report. Please try a shorter date range.');
    return normalizeReport(await response.json(),request);
  }
}
