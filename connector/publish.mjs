// Trusted publisher only. The repair container never receives this credential,
// can never modify this file, and cannot modify the Worker configuration.
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { publisherReadiness } from './src/deployment-readiness.mjs';
function record(state) {
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`state=${state}\n`);
}
const origin='https://cottonwood-library-analytics.librarycottonwood.workers.dev';
const sha=process.env.CHECKED_SHA;
if(!/^[0-9a-f]{40}$/.test(sha || ''))throw Error('A checked source commit is required.');
const blocked=publisherReadiness(process.env,()=>spawnSync(process.execPath,['check-live.mjs'],{encoding:'utf8'}));
if(blocked){record(blocked.state);console.log(blocked.message);process.exit(0);}
const invoke=(...args)=>execFileSync('npx',['--no-install','wrangler',...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
const current=JSON.parse(invoke('deployments','status','--json'));
const previous=current.versions?.length===1 && current.versions[0].percentage===100 ? current.versions[0].version_id : null;
if(!previous)throw Error('An existing complete deployment is required for safe rollback.');
let deployed=false;
try {
  invoke('deploy','--strict','--message','Checked library source '+sha,'--var','BUILD_SOURCE_SHA:'+sha);
  deployed=true;
  const response=await fetch(origin+'/health',{signal:AbortSignal.timeout(20000)});
  const health=await response.json();
  if(!response.ok || health.sourceSha!==sha)throw Error('The hosted source did not match the checked source.');
  execFileSync(process.execPath,['check-live.mjs'],{stdio:'pipe'});
  record('deployed_verified');
  console.log('The checked library Analytics connector was deployed and its read-only connection passed.');
}catch {
  if(deployed) {
    try {
      invoke('rollback',previous,'--message','Restore previous library connector after failed verification');
      record('rolled_back');
      console.error('The connector update failed verification; its previous deployment was restored.');
    }catch {
      record('rollback_attention');
      console.error('The connector update needs administrator attention; automatic rollback could not finish.');
    }
  }else {record('not_deployed');console.error('The connector could not be updated. Its previous deployment is retained.');}
  process.exitCode=1;
}
