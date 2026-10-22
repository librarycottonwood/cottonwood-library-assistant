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
