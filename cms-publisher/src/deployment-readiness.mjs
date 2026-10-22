// Retry edge propagation, preserving only public diagnostic fields.
export async function verifyPublisher(sha, {fetcher=fetch,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),attempts=12}={}) {
  let observed='No response';
  for(let attempt=0;attempt<attempts;attempt++) {
    try {
      const response=await fetcher('https://cottonwood-library-cms-publisher.librarycottonwood.workers.dev/health', {cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
      observed=`HTTP ${response.status}`;
      if(response.ok) {
        const value=await response.json();
        observed=`status=${['configured','setup_pending'].includes(value.status)?value.status:'invalid'} source=${/^[a-f0-9]{40}$/.test(value.sourceSha||'')?value.sourceSha:'missing'}`;
        if(value.sourceSha===sha && value.status==='configured')return;
      }
    } catch {observed='Health request failed';}
    if(attempt+1<attempts)await sleep(2000);
  }
  throw Error(`Publisher readiness did not match checked source ${sha}: ${observed}.`);
}

// Remove the caller's binding before deleting the target RPC entrypoint.
// Once reporting-only is deployed, future publisher updates have no SHA coupling.
export async function verifyReportingOnly({fetcher=fetch,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),attempts=45}={}) {
  for(let attempt=0;attempt<attempts;attempt++) {
    try {
      const response=await fetcher('https://cottonwood-library-analytics.librarycottonwood.workers.dev/health',{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
      if(response.ok) {
        const value=await response.json();
        if(value.status==='ok' && value.publishingTools===false)return;
      }
    } catch { /* Wait for the independent reporting deployment within the bound. */ }
    if(attempt+1<attempts)await sleep(2000);
  }
  throw Error('The reporting connector still exposes website publishing. Verify its reporting-only deployment before retiring the publisher entrypoint.');
}
