// Trusted deployment job only; never run inside a content-drafting environment.
import {execFileSync} from 'node:child_process';
import {verifyPublisher, verifyReportingOnly} from './src/deployment-readiness.mjs';
const sha=process.env.CHECKED_SHA;
if(!/^[a-f0-9]{40}$/.test(sha || ''))throw Error('A checked main source commit is required.');
const health='https://cottonwood-library-cms-publisher.librarycottonwood.workers.dev/health';
async function status(){
  const r=await fetch(health,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('Publisher health unavailable.');
  return r.json();
}
try{const current=await status();if(current.sourceSha===sha && current.status==='configured'){
  console.log('This checked publisher version is already deployed.');process.exit(0);
}}catch{}
const invoke=(...args)=>execFileSync('npx',['--no-install','wrangler',...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
await verifyReportingOnly();
const previousHealth=await status();
const current=JSON.parse(invoke('deployments','status','--json'));
const previous=current.versions?.length===1 && current.versions[0].percentage===100 ? current.versions[0].version_id : null;
if(!previous)throw Error('An existing complete Worker version is required for rollback.');
let deployed=false;
try{
  invoke('deploy','--message','Checked library source '+sha,'--var','BUILD_SOURCE_SHA:'+sha);
  deployed=true;
  await verifyPublisher(sha);
  console.log('Checked CMS publisher deployed and its source/configuration verified. Website publication requires its separate approval.');
}catch(error){
  if(deployed){
    console.error(error.message);
    try{invoke('rollback',previous,'--message','Restore previous publisher after failed verification');await verifyPublisher(previousHealth.sourceSha);console.error('Publisher verification failed. Its previous Worker version was restored; publishing needs attention.');}
    catch{console.error('Publisher verification and rollback need administrator attention.');}
  }else console.error('Publisher deployment failed; its previous Worker version is retained.');
  process.exitCode=1;
}
