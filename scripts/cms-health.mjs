import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const TRIAL='https://cms-trial.cottonwood-library-trial-preview.pages.dev';
const sha=/^[a-f0-9]{40}$/,digest=/^[a-f0-9]{64}$/;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const failed=new Set(['build_failed','deploy_failed','connection_failed','preview_dispatch_uncertain','deploy_dispatch_uncertain']);
export async function checkCmsHealth({env=process.env,fetcher=fetch}={}) {
  let origin;
  try {
    const url=new URL(env.CMS_PUBLISHER_ORIGIN);
    if(url.protocol!=='https:' || url.origin!==env.CMS_PUBLISHER_ORIGIN || url.username || url.password)throw Error();
    origin=url.origin;
  }catch{throw Error('CMS setup pending: configure the library publisher origin.');}
  if(!env.CMS_STATUS_TOKEN || env.CMS_STATUS_TOKEN.length<32)throw Error('CMS setup pending: configure the private status connection.');
  async function json(url,authenticated=false){
    const response=await fetcher(url,{method:authenticated?'POST':'GET',headers:authenticated?{Authorization:`Bearer ${env.CMS_STATUS_TOKEN}`}:{},redirect:'error',signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error(`CMS health could not verify ${authenticated?'the private publisher':'the hosted trial'} (${response.status}). Reconnect or inspect its current report.`);
    const text=await response.text();
    if(Buffer.byteLength(text)>1024*1024)throw Error('CMS health response exceeded its limit.');
    try{return JSON.parse(text);}catch{throw Error('CMS health response was invalid.');}
  }
  const reconciliation=await json(`${origin}/reconcile`,true);
  if(typeof reconciliation.status!=='string')throw Error('CMS reconciliation did not confirm its result.');
  const monitor=await json(`${origin}/monitor`,true);
  if(!Array.isArray(monitor.operations) || monitor.operations.length>100)throw Error('CMS publisher status was invalid.');
  const operations=monitor.operations.map(item=>{
    if(!uuid.test(item.id??'') || typeof item.status!=='string')throw Error('CMS operation status was invalid.');
    return {id:item.id,status:item.status,sourceSha:sha.test(item.sourceSha??'')?item.sourceSha:null,
      contentDigest:digest.test(item.contentDigest??'')?item.contentDigest:null,
      releaseDigest:digest.test(item.releaseDigest??'')?item.releaseDigest:null,
      reviewUrl:`${origin}/review/${item.id}`};
  });
  const last=monitor.lastVerified;
  let hostedVerified=false;
  if(last){
    if(last.websiteUrl!==TRIAL || !uuid.test(last.operationId??'') || !sha.test(last.sourceSha??'') || !digest.test(last.contentDigest??'') || !digest.test(last.releaseDigest??''))throw Error('CMS verified-version record was invalid.');
    const status=await json(`${TRIAL}/_review/status.json`);
    if(status.operationId!==last.operationId || status.sourceSha!==last.sourceSha || status.contentDigest!==last.contentDigest || status.digest!==last.releaseDigest)throw Error('The hosted CMS trial differs from the last verified version. The website needs attention.');
    for(const route of ['/','/_review/desktop.png','/_review/phone.png']){
      const response=await fetcher(TRIAL+route,{redirect:'error',signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw Error('The verified CMS trial or its review pictures could not be reached.');
      await response.body?.cancel();
    }
    hostedVerified=true;
  }
  // Older failed operations can be superseded by a successful newer preview.
  // The reconciliation operation represents the current complete content/source.
  const current=reconciliation.operation;
  const needsAttention=failed.has(reconciliation.status) || (current && failed.has(current.status));
  return {sourceSha:env.GITHUB_SHA??null,checkedAt:new Date().toISOString(),
    result:needsAttention?'needs_attention':hostedVerified?'checked':'awaiting_first_verified_deployment',
    hostedVerified,lastVerified:last?{operationId:last.operationId,sourceSha:last.sourceSha,contentDigest:last.contentDigest,releaseDigest:last.releaseDigest,websiteUrl:TRIAL,verifiedAt:last.verifiedAt}:null,
    reconciliation:{status:reconciliation.status,changed:reconciliation.changed===true},operations,
    scope:'Published revision reconciliation and private publisher status; hosted marker/reachability checked when a verified release exists. This is not a ChatGPT connection test, new approval, full hosted asset audit or production launch.'};
}
async function main(){
  const report=await checkCmsHealth();
  await mkdir('output/cms-health',{recursive:true});
  await writeFile('output/cms-health/publisher.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
  const summary=report.result==='needs_attention'?'The current CMS update needs attention.':report.hostedVerified?'The saved CMS trial matches its verified version.':'The CMS connection is responding; its first website release still needs review and verification.';
  console.log(summary);
  if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,summary+'\n',{flag:'a'});
  if(report.result==='needs_attention')process.exitCode=1;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(()=>{console.error('The CMS health check could not finish. Check the connection and current publishing report; no successful website update is claimed.');process.exitCode=1;});
