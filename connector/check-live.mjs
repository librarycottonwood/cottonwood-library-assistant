// Trusted daily probe: status only; never store visitor figures or credentials.
import { appendFileSync } from 'node:fs';
import { recoveryDetail, maintenanceAction } from './src/recovery.mjs';
const origin='https://cottonwood-library-analytics.librarycottonwood.workers.dev';
let hostedSourceSha='';
let recoveryReason='';
let reconnectReady='false';
function output(status) {
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,
    `status=${status}\nhostedSourceSha=${hostedSourceSha}\nrecoveryReason=${recoveryReason}\nreconnectReady=${reconnectReady}\nhumanAction=${JSON.stringify(maintenanceAction(status,recoveryReason,reconnectReady==='true'))}\n`);
}
async function main() {
  const health=await fetch(origin+'/health',{signal:AbortSignal.timeout(20000)});
  if(!health.ok)throw Error('connection_unavailable');
  const metadata=await health.json();
  if(/^[0-9a-f]{40}$/.test(metadata.sourceSha||''))hostedSourceSha=metadata.sourceSha;
  const denied=await fetch(origin+'/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'}),signal:AbortSignal.timeout(20000)});
  if(denied.status!==401)throw Error('authorization_check_failed');
  if(!process.env.LIBRARY_ANALYTICS_MONITOR_TOKEN)throw Error('monitor_not_configured');
  const live=await fetch(origin+'/monitor',{method:'POST',headers:{Authorization:'Bearer '+process.env.LIBRARY_ANALYTICS_MONITOR_TOKEN},signal:AbortSignal.timeout(55000)});
  const result=await live.json();
  if(result.recovery?.reason && recoveryDetail(result.recovery.reason).reason===result.recovery.reason)recoveryReason=result.recovery.reason;
  reconnectReady=result.keylessReconnectReady===true?'true':'false';
  if(!live.ok || result.status!=='ok')throw Error(result.status==='account_attention'?'account_attention':'connection_unavailable');
  output('ok');
  console.log('Library Analytics connection and read-only access passed.');
}
main().catch(e=>{const code=['account_attention','authorization_check_failed','monitor_not_configured'].includes(e.message)?e.message:'connection_unavailable';output(code);console.error(code);process.exitCode=1;});
