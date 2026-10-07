// Trusted publisher preflight; no credentials or raw probe errors in records.
export function publisherReadiness(env,probe) {
  if(!env.CLOUDFLARE_API_TOKEN || !env.LIBRARY_ANALYTICS_MONITOR_TOKEN)return {
    state:'publisher_setup_pending',message:'The library administrator must finish storing the existing maintenance credentials. The current connector is retained.'};
  const result=probe();
  if(result.status===0)return null;
  if(result.stderr?.trim()==='account_attention')return {
    state:'account_setup_pending',message:'The library Google report connection needs approval or recovery. The current connector is retained; open the existing visitor report connection check for its next step.'};
  return {state:'connection_attention',message:'The current visitor report connection could not be verified. Publishing is waiting; the current connector is retained.'};
}

// Cloudflare can briefly serve the previous version after a successful upload.
export async function verifyHostedSource(url,sha,{fetcher=fetch,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),attempts=6}={}) {
  for(let attempt=0;attempt<attempts;attempt++) {
    try {
      const response=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(20000)});
      if(response.ok && (await response.json()).sourceSha===sha)return;
    }catch { /* Retry transient propagation/network failures within the bound. */ }
    if(attempt+1<attempts)await sleep(2000);
  }
  throw Error('The hosted source did not match the checked source.');
}
