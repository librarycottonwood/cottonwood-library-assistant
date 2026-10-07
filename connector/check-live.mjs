// The daily runner has only a monitor credential, never the Google key or
// Worker publishing credential. This probe returns status, not visitor figures.
const origin='https://cottonwood-library-analytics.librarycottonwood.workers.dev';
async function main() {
  const health=await fetch(origin+'/health',{signal:AbortSignal.timeout(20000)});
  if(!health.ok)throw Error('connection_unavailable');
  const denied=await fetch(origin+'/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'}),signal:AbortSignal.timeout(20000)});
  if(denied.status!==401)throw Error('authorization_check_failed');
  if(!process.env.LIBRARY_ANALYTICS_MONITOR_TOKEN)throw Error('monitor_not_configured');
  const live=await fetch(origin+'/monitor',{method:'POST',headers:{Authorization:'Bearer '+process.env.LIBRARY_ANALYTICS_MONITOR_TOKEN},signal:AbortSignal.timeout(55000)});
  const result=await live.json();
  if(!live.ok || result.status!=='ok')throw Error(result.status==='account_attention'?'account_attention':'connection_unavailable');
  console.log('Library Analytics connection and read-only access passed.');
}
main().catch(e=>{const code=['account_attention','authorization_check_failed','monitor_not_configured'].includes(e.message)?e.message:'connection_unavailable';console.error(code);process.exitCode=1;});
