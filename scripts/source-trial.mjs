// PR builds have no secrets. This runner is executed only from trusted main;
// downloaded PR artifacts are data and are never imported or executed.
import {readFile, writeFile, mkdir, mkdtemp, rm, cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readSnapshot, contentDigest} from './cms.mjs';
import {fetchSanitySnapshot, sanityConfig} from '../src/content/sanity.mjs';
import {inventory} from './release.mjs';
import {revisionDigest, recordBuild, verifyBundle, preview, stageRelease, previousStage, promoteWithRollback, deploy, waitForHosted, checkHosting, checkFileInventory} from './cms-publishing.mjs';
import {verifyPublisher} from '../cms-publisher/src/deployment-readiness.mjs';
import {REPOSITORY, TRIAL_ORIGIN, sourcePattern, operationIdPattern} from '../cms-publisher/src/contract.mjs';

export const ARTIFACT = 'library-pr-checked-preview';
const fail = message => {throw Error(message);};
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const writeJson = async (file, data) => {await mkdir(path.dirname(file), {recursive:true}); await writeFile(file, JSON.stringify(data,null,2)+'\n');};
const git = (...args) => execFileSync('git',args,{encoding:'utf8'}).trim();
const api = async (route, env=process.env) => {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/${route}`, {headers:{Authorization:`Bearer ${env.GH_TOKEN}`,Accept:'application/vnd.github+json','User-Agent':'Cottonwood-PR-workflow'},redirect:'error',signal:AbortSignal.timeout(30000)});
  if (!response.ok) fail(`GitHub verification failed (${response.status}).`);
  return response.json();
};

export function checkRun(run, head) {
  if (run.path !== '.github/workflows/check.yml' || run.event !== 'pull_request' || run.status !== 'completed' || run.conclusion !== 'success' || run.head_sha !== head || run.head_repository?.full_name !== REPOSITORY || run.repository?.full_name !== REPOSITORY) fail('A successful library PR check for this exact head is required.');
}
export function checkMerge(pr, mainSha, headTree, mainTree) {
  if (!pr.merged || pr.base?.ref !== 'main' || pr.base?.repo?.full_name !== REPOSITORY || pr.head?.repo?.full_name !== REPOSITORY || pr.merge_commit_sha !== mainSha || headTree !== mainTree) fail('The merged tree differs from the preview. Update the branch and review a fresh preview before saving.');
}
export function checkContent(operation, snapshot) {
  if (operation.contentDigest !== contentDigest(snapshot) || operation.revisionDigest !== revisionDigest(snapshot)) fail('Published content changed after preview. Prepare and review a fresh preview before saving.');
}
export function checkStaticFiles(files, digest) {
  checkFileInventory(files,digest);
  if (files.some(({path:name}) => name.split('/').some(part => part.startsWith('.') || ['_worker.js','_redirects','_headers','functions','node_modules'].includes(part)))) fail('PR previews must contain static assets only, without hosting configuration or executable Workers.');
}

async function bundle(env) {
  if (['SANITY_READ_TOKEN','SANITY_WRITE_TOKEN','CLOUDFLARE_API_TOKEN','CMS_WORKFLOW_TOKEN','GH_TOKEN'].some(name=>env[name])) fail('PR build must not receive account or deployment credentials.');
  const snapshot = await readSnapshot('output/cms/snapshot.json',sanityConfig(env));
  const document = snapshot.documents.find(item=>item._rev && !item._type.startsWith('sanity.'));
  if (!document) fail('No published library document was captured.');
  const operation = {schemaVersion:1,mode:'preview',operationId:randomUUID(),sourceSha:git('rev-parse','HEAD'),sourceTree:git('rev-parse','HEAD^{tree}'),
    documentId:document._id,documentRevision:document._rev,operation:'update',contentDigest:contentDigest(snapshot),revisionDigest:revisionDigest(snapshot)};
  await writeJson('output/cms/operation.json',operation);
  await recordBuild(operation,env);
}

async function download(run, env) {
  const artifacts = await api(`actions/runs/${run.id}/artifacts?per_page=100`,env);
  const artifact = artifacts.artifacts?.find(item=>item.name===ARTIFACT && !item.expired);
  if (!artifact || artifact.size_in_bytes>100*1024*1024) fail('The checked PR artifact is missing, expired or too large. Prepare a fresh preview.');
  const folder=await mkdtemp(path.join(tmpdir(),'library-pr-artifact-'));
  try {
    execFileSync('gh',['run','download',String(run.id),'--repo',REPOSITORY,'--name',ARTIFACT,'--dir',folder],{env,stdio:'pipe'});
    // inventory rejects symlinks before anything is copied into the trusted checkout.
    const files=await inventory(folder);
    if(files.length>5000 || files.some(file=>! /^(cms\/(operation|snapshot)\.json|releases\/[a-f0-9]{64}\/(manifest\.json|site\/.+)|playwright\/[a-f0-9]{64}\/(evidence\.json|(?:desktop|phone)(?:-[a-f0-9]{16})?\.png))$/.test(file.path))) fail('Unexpected files in the PR preview artifact.');
    for(const name of ['cms','releases','playwright']) {
      await rm(`output/${name}`,{recursive:true,force:true});
      await cp(path.join(folder,name),`output/${name}`,{recursive:true});
    }
    const operation=await readJson('output/cms/operation.json');
    if(operation.sourceSha!==run.head_sha || operation.previewRunId!==String(run.id) || !sourcePattern.test(operation.sourceTree||'') || !operationIdPattern.test(operation.operationId||'')) fail('PR artifact source/run identity does not match GitHub.');
    const commit=await api(`git/commits/${run.head_sha}`,env);
    if(operation.sourceTree!==commit.tree?.sha)fail('PR source tree does not match GitHub.');
    const {manifest}=await verifyBundle(operation);
    checkStaticFiles(manifest.files,operation.releaseDigest);
    return operation;
  } finally {await rm(folder,{recursive:true,force:true});}
}

async function currentContent(operation,env) {
  checkContent(operation,await fetchSanitySnapshot(sanityConfig(env),{token:env.SANITY_READ_TOKEN}));
}
async function mainIs(sha,env) {
  if((await api('git/ref/heads/main',env)).object?.sha!==sha)fail('Main changed. Preserve the newer work and prepare a fresh preview.');
}
async function publish(operation,pr,mainSha,env) {
  const recheck=async()=>{
    await mainIs(mainSha,env);
    const latest=await api(`pulls/${pr.number}`,env);
    const commit=await api(`git/commits/${mainSha}`,env);
    checkMerge(latest,mainSha,operation.sourceTree,commit.tree?.sha);
    if(latest.head.sha!==operation.sourceSha)fail('The approved PR head changed.');
    await currentContent(operation,env);
  };
  await verifyPublisher(mainSha,{attempts:90});
  await recheck();
  await checkHosting(env);
  // The source save shares the existing CMS trial lock and exact-asset rollback.
  const response=await fetch(`${TRIAL_ORIGIN}/_review/status.json`,{headers:{'Cache-Control':'no-cache'},redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!response.ok)fail('Cannot retain the current saved trial for rollback.');
  const previous=await response.json();
  const previousOperation={...previous,releaseDigest:previous.digest};
  const rollback=await previousStage(previousOperation);
  const stage=await stageRelease(operation);
  try {
    // Keep the preview's sourceSha and bytes; record the identical merged tree separately.
    const status=await readJson(path.join(stage,'_review/status.json'));
    await writeJson(path.join(stage,'_review/status.json'),{...status,mergedSourceSha:mainSha,pullRequest:pr.number});
    await recheck();
    const result=await promoteWithRollback({stage,previous:{stage:rollback,operation:previousOperation},operation,
      deployer:(folder,version)=>deploy(folder,'cms-trial',version,env),verifier:folder=>waitForHosted(folder,TRIAL_ORIGIN)});
    await writeJson('output/cms/publish-result.json',{...result,sourceSha:operation.sourceSha,mergedSourceSha:mainSha,pullRequest:pr.number,releaseDigest:operation.releaseDigest,websiteUrl:TRIAL_ORIGIN});
    if(result.status!=='deployed_verified')fail(result.summary);
    // Record the verified source release in the existing CMS ledger. This endpoint
    // has no deployment capability and cannot grant approval for another release.
    const recorded=await fetch(`${env.CMS_PUBLISHER_ORIGIN}/source-release`,{method:'POST',headers:{Authorization:`Bearer ${env.CMS_WORKFLOW_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({mergedSourceSha:mainSha,sourceSha:operation.sourceSha,operationId:operation.operationId,contentDigest:operation.contentDigest,revisionDigest:operation.revisionDigest,releaseDigest:operation.releaseDigest,previewRunId:operation.previewRunId,previewUrl:operation.previewUrl}),redirect:'error',signal:AbortSignal.timeout(30000)});
    if(!recorded.ok)fail('Trial files are verified, but the CMS release record needs reconciliation. Do not claim the full save finished.');
  } finally {await rm(stage,{recursive:true,force:true});await rm(rollback,{recursive:true,force:true});}
}

async function deliver(env) {
  if(env.GITHUB_REPOSITORY!==REPOSITORY || env.GITHUB_REF!=='refs/heads/main' || env.GITHUB_WORKFLOW_REF!==`${REPOSITORY}/.github/workflows/source-trial.yml@refs/heads/main`)fail('Hosting is restricted to the trusted main workflow.');
  const event=await readJson(env.GITHUB_EVENT_PATH);
  const trigger=event.workflow_run;
  if(trigger?.path!=='.github/workflows/check.yml' || trigger.conclusion!=='success' || trigger.head_repository?.full_name!==REPOSITORY)fail('Untrusted verification trigger.');
  let pr,run,mainSha;
  if(trigger.event==='pull_request') {
    const matches=await api(`commits/${trigger.head_sha}/pulls?per_page=100`,env);
    pr=matches.find(item=>item.state==='open' && item.head.sha===trigger.head_sha && item.base.ref==='main' && item.head.repo?.full_name===REPOSITORY);
    if(!pr)fail('This PR head is no longer open; no preview uploaded.');
    run=await api(`actions/runs/${trigger.id}`,env);
  } else if(trigger.head_branch==='main' && ['push','workflow_dispatch'].includes(trigger.event)) {
    mainSha=trigger.head_sha;
    await mainIs(mainSha,env);
    const matches=await api(`commits/${mainSha}/pulls?per_page=100`,env);
    const candidate=matches.find(item=>item.merged_at && item.merge_commit_sha===mainSha && item.base.ref==='main');
    if(!candidate) {console.log('No approved PR merge at this main commit. Trial unchanged.');return;}
    pr=await api(`pulls/${candidate.number}`,env);
    const runs=await api(`actions/workflows/check.yml/runs?event=pull_request&head_sha=${pr.head.sha}&per_page=100`,env);
    run=runs.workflow_runs?.find(item=>item.conclusion==='success' && item.head_sha===pr.head.sha);
    if(!run)fail('The merged PR has no successful exact-head preview. Trial unchanged.');
  } else {console.log('This check does not request a website preview or save.');return;}
  checkRun(run,pr.head.sha);
  const operation=await download(run,env);
  await currentContent(operation,env);
  if(mainSha){
    const commit=await api(`git/commits/${mainSha}`,env);
    checkMerge(pr,mainSha,operation.sourceTree,commit.tree?.sha);
  }
  // Upload the same immutable bytes even during first installation. No rebuild
  // after approval: the approved PR's checked artifact is the only source.
  const checked=await preview(operation,env);
  if(mainSha)await publish(checked,pr,mainSha,env);
  const result={pullRequest:pr.number,sourceSha:checked.sourceSha,releaseDigest:checked.releaseDigest,previewRunId:checked.previewRunId,previewUrl:checked.previewUrl,savedTrial:mainSha?TRIAL_ORIGIN:null};
  await writeJson('output/source-trial-result.json',result);
  if(env.GITHUB_STEP_SUMMARY)await writeFile(env.GITHUB_STEP_SUMMARY,`[Website preview](${checked.previewUrl})\n\nPR #${pr.number}; checked source ${checked.sourceSha}.\n\n${mainSha?'Saved trial verified: '+TRIAL_ORIGIN:'Ready for review. Merge only after explicit chat approval.'}\n`,{flag:'a'});
  console.log(JSON.stringify(result,null,2));
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const action=process.argv[2];
  (action==='bundle'?bundle(process.env):action==='deliver'?deliver(process.env):Promise.reject(Error('Use source-trial.mjs bundle|deliver.'))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
