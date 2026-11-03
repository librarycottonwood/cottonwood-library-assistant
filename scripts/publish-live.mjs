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
import {revisionDigest, recordBuild, verifyBundle, preview, stageRelease, previousStage, promoteWithRollback, deploy, waitForHosted, checkHosting, checkFileInventory, LIVE_BRANCH} from './cms-publishing.mjs';
import {verifyPublisher} from '../cms-publisher/src/deployment-readiness.mjs';
import {REPOSITORY, LIVE_ORIGIN, sourcePattern, operationIdPattern} from '../cms-publisher/src/contract.mjs';
import {siteDigest, compareContent, parseContentUpdate, isContentUpdatePath, parseRevisions, statusDescription, commentBody, checkPages, COMMENT_MARKER} from './content-changes.mjs';

export const ARTIFACT = 'library-pr-checked-preview';
const fail = message => {throw Error(message);};
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const writeJson = async (file, data) => {await mkdir(path.dirname(file), {recursive:true}); await writeFile(file, JSON.stringify(data,null,2)+'\n');};
const git = (...args) => execFileSync('git',args,{encoding:'utf8'}).trim();
const request = async (route, env=process.env, {method='GET', body}={}) => {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/${route}`, {method,headers:{Authorization:`Bearer ${env.GH_TOKEN}`,Accept:'application/vnd.github+json','User-Agent':'Cottonwood-PR-workflow',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(30000)});
  if (!response.ok) fail(`GitHub ${method==='GET'?'verification':'update'} failed (${response.status}).`);
  return response.status===204?null:response.json();
};
const api = (route, env) => request(route, env);
const runUrl = env => `https://github.com/${REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;
const clip = (text, size) => text.length>size?text.slice(0,size-1)+'…':text;
export const PREVIEW = 'Website preview', LIVE = 'Live website';

// Commit statuses let the library chat read the preview/live result with its
// GitHub tools. Recording problems are logged and never block a verified save.
const setStatus = async (sha, context, url, description, env, state='success') => {
  try {
    await request(`statuses/${sha}`,env,{method:'POST',body:{state,context,target_url:url,description:clip(description,140)}});
    // Tells the workflow's fallback step this context already has a final result.
    if (state!=='pending') await mkdir('output',{recursive:true}).then(()=>writeFile(`output/status-${context===LIVE?'live':'preview'}`,state+'\n'));
  } catch (error) {console.warn(`Could not record the ${context} status: ${error.message}`);}
};
// One comment per marker on the PR, updated in place so the newest list is the only one.
async function upsertComment(number, marker, body, env) {
  try {
    const comments = await api(`issues/${number}/comments?per_page=100`,env);
    const mine = comments.find(item=>item.user?.type==='Bot' && item.body?.includes(marker));
    if (mine) await request(`issues/comments/${mine.id}`,env,{method:'PATCH',body:{body}});
    else await request(`issues/${number}/comments`,env,{method:'POST',body:{body}});
  } catch (error) {console.warn(`Could not update the PR comment: ${error.message}`);}
}

export function checkRun(run, head) {
  if (run.path !== '.github/workflows/check.yml' || run.event !== 'pull_request' || run.status !== 'completed' || run.conclusion !== 'success' || run.head_sha !== head || run.head_repository?.full_name !== REPOSITORY || run.repository?.full_name !== REPOSITORY) fail('A successful library PR check for this exact head is required.');
}
export function checkMerge(pr, mainSha, headTree, mainTree) {
  if (!pr.merged || pr.base?.ref !== 'main' || pr.base?.repo?.full_name !== REPOSITORY || pr.head?.repo?.full_name !== REPOSITORY || pr.merge_commit_sha !== mainSha || headTree !== mainTree) fail('The merged tree differs from the preview. Update the branch and review a fresh preview before saving.');
}
// Compares what the website would show; an unused picture upload is not a change.
export function sameContent(reviewed, current) {
  return reviewed.projectId===current.projectId && reviewed.dataset===current.dataset && siteDigest(reviewed)===siteDigest(current);
}
export function checkContent(reviewed, current) {
  if (!sameContent(reviewed, current)) fail('Published content changed after preview. Prepare and review a fresh preview before saving.');
}
// Only these check jobs decide a preview or a save; record/health jobs never block it.
export const NEEDED_JOBS = {preview:['verify','pr-preview'], publish:['verify']};
export const failedJobs = (jobs, names) => names.filter(name => jobs.find(job => job.name===name)?.conclusion!=='success');
export function failureDescription(message) {
  if (/^Live website files are verified/.test(message)) return 'Live website updated, but its save record needs an administrator. See PR comment.';
  if (/Published content changed after preview/.test(message)) return 'Not saved: website content changed after the preview. Live site unchanged. Make a refresh save (see PR comment).';
  if (/^Main changed/.test(message)) return 'Not saved: another save reached main first. Live site unchanged. Make a refresh save (see PR comment).';
  if (/merged tree differs/.test(message)) return 'Not saved: the merged version differs from the preview. Live site unchanged. Make a refresh save (see PR comment).';
  return clip(`Not saved: ${message}`, 140);
}
export function failureComment(message, url) {
  return ['<!-- cottonwood-live-failure -->','### This save did not reach the live website','',`Reason: ${message}`,'',
    'The PR is merged, but the live website was **not** updated with it (unless the reason above says the live files were verified). Nothing is lost: the content is still published in the website editor.','',
    'First open https://cottonwood-library.pages.dev/ : if a later save already put this change live, it is saved and nothing else is needed.','',
    '**How to finish it (library assistant):**',
    '1. Make a new branch from current `main` named `content/refresh-<short-name>`.',
    '2. Add `content-updates/<today>-refresh-<short-name>.json` with `request` ("Refresh: <the original request>"), the same `sanityDocuments` as this PR\'s content-update file, and `requestedInChat` (today).',
    '3. Open a PR, wait for **Website preview**, read its "What this save puts on the live website" comment, share the preview and ask **"Ready to save?"**',
    '4. After a clear yes, merge it and wait for **Live website** on the merge commit.','',
    `If the reason mentions failed website checks, or the refresh stops the same way, tell the volunteer the website is unchanged and ask a library administrator to look at ${url}.`].join('\n');
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

const freshContent=env=>fetchSanitySnapshot(sanityConfig(env),{token:env.SANITY_READ_TOKEN});
async function mainIs(sha,env) {
  if((await api('git/ref/heads/main',env)).object?.sha!==sha)fail('Main changed. Preserve the newer work and prepare a fresh preview.');
}
async function publish(operation,reviewed,pr,mainSha,env) {
  const recheck=async()=>{
    await mainIs(mainSha,env);
    const latest=await api(`pulls/${pr.number}`,env);
    const commit=await api(`git/commits/${mainSha}`,env);
    checkMerge(latest,mainSha,operation.sourceTree,commit.tree?.sha);
    if(latest.head.sha!==operation.sourceSha)fail('The approved PR head changed.');
    checkContent(reviewed,await freshContent(env));
  };
  await verifyPublisher(mainSha,{attempts:90});
  await recheck();
  await checkHosting(env);
  // The source save shares the CMS live-publishing lock and exact-asset rollback.
  const response=await fetch(`${LIVE_ORIGIN}/_review/status.json`,{headers:{'Cache-Control':'no-cache'},redirect:'error',signal:AbortSignal.timeout(30000)}).catch(()=>null);
  let previousOperation=null,rollback=null;
  if(response?.ok){
    const previous=await response.json();
    previousOperation={...previous,releaseDigest:previous.digest};
    rollback=await previousStage(previousOperation);
  } else {
    // First live publication only: the authenticated inventory must show that no
    // production deployment exists. Otherwise an unreadable live site blocks saving.
    try {await checkHosting(env,{requireNoLive:true});}
    catch(error){fail('Cannot retain the current live website for rollback. '+error.message);}
  }
  const stage=await stageRelease(operation);
  try {
    // Keep the preview's sourceSha and bytes; record the identical merged tree separately.
    const status=await readJson(path.join(stage,'_review/status.json'));
    await writeJson(path.join(stage,'_review/status.json'),{...status,mergedSourceSha:mainSha,pullRequest:pr.number});
    await recheck();
    const result=await promoteWithRollback({stage,previous:rollback?{stage:rollback,operation:previousOperation}:null,operation,
      deployer:(folder,version)=>deploy(folder,LIVE_BRANCH,version,env),verifier:folder=>waitForHosted(folder,LIVE_ORIGIN)});
    await writeJson('output/cms/publish-result.json',{...result,sourceSha:operation.sourceSha,mergedSourceSha:mainSha,pullRequest:pr.number,releaseDigest:operation.releaseDigest,websiteUrl:LIVE_ORIGIN});
    if(result.status!=='deployed_verified')fail(result.summary);
    // Record the verified source release in the existing CMS ledger. This endpoint
    // has no deployment capability and cannot grant approval for another release.
    const recorded=await fetch(`${env.CMS_PUBLISHER_ORIGIN}/source-release`,{method:'POST',headers:{Authorization:`Bearer ${env.CMS_WORKFLOW_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({mergedSourceSha:mainSha,sourceSha:operation.sourceSha,operationId:operation.operationId,contentDigest:operation.contentDigest,revisionDigest:operation.revisionDigest,releaseDigest:operation.releaseDigest,previewRunId:operation.previewRunId,previewUrl:operation.previewUrl}),redirect:'error',signal:AbortSignal.timeout(30000)});
    if(!recorded.ok)fail('Live website files are verified, but the CMS release record needs reconciliation. Do not claim the full save finished.');
  } finally {await rm(stage,{recursive:true,force:true});if(rollback)await rm(rollback,{recursive:true,force:true});}
}

// Which pull request (and job results) this check result is about. Runs before any
// lock or credential; scheduled checks, superseded heads and direct pushes stop here.
export async function route(trigger, env, {get=api}={}) {
  if(trigger?.path!=='.github/workflows/check.yml' || trigger.head_repository?.full_name!==REPOSITORY)fail('Untrusted verification trigger.');
  const jobs=async()=>(await get(`actions/runs/${trigger.id}/jobs?per_page=100`,env)).jobs??[];
  if(trigger.event==='pull_request') {
    if(['cancelled','skipped'].includes(trigger.conclusion))return {action:'skip',reason:'Superseded: a newer commit replaced this check. Nothing to preview.'};
    const matches=await get(`commits/${trigger.head_sha}/pulls?per_page=100`,env);
    const pr=matches.find(item=>item.state==='open' && item.head.sha===trigger.head_sha && item.base.ref==='main' && item.head.repo?.full_name===REPOSITORY);
    if(!pr)return {action:'skip',reason:'Superseded: this commit is no longer the head of an open PR. Nothing to preview.'};
    const failed=failedJobs(await jobs(),NEEDED_JOBS.preview);
    if(failed.length)return {action:'fail',pr:pr.number,sha:trigger.head_sha,context:PREVIEW,
      description:`No preview: the website check (${failed.join(', ')}) failed. Read the check log, fix it and push again.`};
    return {action:'preview',pr:pr.number,sha:trigger.head_sha};
  }
  if(trigger.head_branch==='main' && ['push','workflow_dispatch'].includes(trigger.event)) {
    const matches=await get(`commits/${trigger.head_sha}/pulls?per_page=100`,env);
    const candidate=matches.find(item=>item.merged_at && item.merge_commit_sha===trigger.head_sha && item.base.ref==='main');
    if(!candidate)return {action:'skip',reason:'No approved PR merge at this main commit. Live website unchanged.'};
    if(trigger.conclusion==='cancelled')return {action:'fail',pr:candidate.number,sha:trigger.head_sha,context:LIVE,
      description:'Not saved: the website check on main was cancelled. Live site unchanged. Make a refresh save (see PR comment).'};
    const failed=failedJobs(await jobs(),NEEDED_JOBS.publish);
    if(failed.length)return {action:'fail',pr:candidate.number,sha:trigger.head_sha,context:LIVE,
      description:'Not saved: website checks failed on the saved version. Live site unchanged. An administrator must fix the check.'};
    return {action:'publish',pr:candidate.number,sha:trigger.head_sha};
  }
  return {action:'skip',reason:'This check does not request a website preview or save.'};
}

async function trustedTrigger(env) {
  if(env.GITHUB_REPOSITORY!==REPOSITORY || env.GITHUB_REF!=='refs/heads/main' || env.GITHUB_WORKFLOW_REF!==`${REPOSITORY}/.github/workflows/publish-live.yml@refs/heads/main`)fail('Hosting is restricted to the trusted main workflow.');
  return (await readJson(env.GITHUB_EVENT_PATH)).workflow_run;
}
const summary=async(text,env)=>{if(env.GITHUB_STEP_SUMMARY)await writeFile(env.GITHUB_STEP_SUMMARY,text+'\n',{flag:'a'});};

async function routeStep(env) {
  const decision=await route(await trustedTrigger(env),env);
  if(decision.action==='fail') {
    await setStatus(decision.sha,decision.context,runUrl(env),decision.description,env,'failure');
    if(decision.context===LIVE)await upsertComment(decision.pr,'<!-- cottonwood-live-failure -->',failureComment(decision.description,runUrl(env)),env);
  }
  // Shows a waiting save, including one GitHub cancels while it waits for the live lock.
  if(decision.action==='publish')await setStatus(decision.sha,LIVE,runUrl(env),'Not live yet: waiting to publish this save.',env,'pending');
  if(env.GITHUB_OUTPUT)await writeFile(env.GITHUB_OUTPUT,`action=${decision.action}\npr=${decision.pr??'none'}\n`,{flag:'a'});
  await summary(decision.reason??decision.description??`${decision.action} for PR #${decision.pr}`,env);
  console.log(JSON.stringify(decision));
}

async function liveContent(env) {
  const read=async route=>{
    const response=await fetch(`${LIVE_ORIGIN}/${route}`,{headers:{'Cache-Control':'no-cache'},redirect:'error',signal:AbortSignal.timeout(30000)}).catch(()=>null);
    return response?.ok?response.json().catch(()=>null):null;
  };
  const live=parseRevisions(await read('_content/revisions.json'));
  if(live)return {live};
  // Live releases from before revisions.json: compare edit times with when that preview ran.
  const status=await read('_review/status.json');
  if(!/^[1-9][0-9]{0,19}$/.test(String(status?.previewRunId||'')))return {live:null};
  const run=await api(`actions/runs/${status.previewRunId}`,env).catch(()=>null);
  return {live:null,liveCheckedAt:Date.parse(run?.run_started_at??run?.created_at)};
}
export async function updateFiles(pr,sha,env,{get=api}={}) {
  const files=[];
  for(let page=1;page<=30;page++){const batch=await get(`pulls/${pr}/files?per_page=100&page=${page}`,env);files.push(...batch);if(batch.length<100)break;}
  const result={updateFiles:[],listed:[],problems:[]};
  for(const file of files.filter(item=>isContentUpdatePath(item.filename) && item.status!=='removed')) {
    result.updateFiles.push(file.filename);
    try {
      const body=await get(`contents/${file.filename.split('/').map(encodeURIComponent).join('/')}?ref=${sha}`,env);
      result.listed.push(...parseContentUpdate(Buffer.from(body.content??'','base64').toString('utf8')).documentIds);
    } catch(error){result.problems.push(`\`${file.filename}\` ${error.message}.`);}
  }
  result.listed=[...new Set(result.listed)];
  return result;
}
async function contentChanges(pr,sha,reviewed,env) {
  try {
    const result=compareContent({...await liveContent(env),current:reviewed,...await updateFiles(pr,sha,env)});
    await writeJson('output/content-changes.json',{pullRequest:pr,sourceSha:sha,...result});
    return result;
  } catch(error) {
    console.warn(`Could not list the content changes: ${error.message}`);
    return compareContent({live:null,current:reviewed,problems:['The list of content changes could not be prepared.']});
  }
}

async function deliver(env) {
  const mode=env.LIBRARY_DELIVER;
  if(!['preview','publish'].includes(mode))fail('Set LIBRARY_DELIVER to preview or publish.');
  const trigger=await trustedTrigger(env);
  const decision=await route(trigger,env);
  if(decision.action!==mode){console.log(`Nothing to ${mode}: ${decision.reason??decision.action}`);return;}
  const pr=await api(`pulls/${decision.pr}`,env);
  if(mode==='preview' && pr.head.sha!==decision.sha){console.log('Superseded: a newer commit replaced this PR head. Nothing to preview.');return;}
  let run,mainSha;
  try {
    if(mode==='preview') run=await api(`actions/runs/${trigger.id}`,env);
    else {
      mainSha=decision.sha;
      await mainIs(mainSha,env);
      const runs=await api(`actions/workflows/check.yml/runs?event=pull_request&head_sha=${pr.head.sha}&per_page=100`,env);
      run=runs.workflow_runs?.find(item=>item.conclusion==='success' && item.head_sha===pr.head.sha);
      if(!run)fail('The merged PR has no successful exact-head preview. Live website unchanged.');
    }
    checkRun(run,pr.head.sha);
    const operation=await download(run,env);
    const reviewed=await readSnapshot('output/cms/snapshot.json',sanityConfig(env));
    // Preview: a content change while preparing is a warning. Save: it must match exactly.
    const fresh=await freshContent(env);
    const contentMoved=!sameContent(reviewed,fresh);
    if(mainSha){
      checkContent(reviewed,fresh);
      const commit=await api(`git/commits/${mainSha}`,env);
      checkMerge(pr,mainSha,operation.sourceTree,commit.tree?.sha);
    }
    // Upload the same immutable bytes even during first installation. No rebuild
    // after approval: the approved PR's checked artifact is the only source.
    const checked=await preview(operation,env);
    const changes=await contentChanges(pr.number,pr.head.sha,reviewed,env);
    // Open each listed page on the preview, so the link given to the volunteer is one that works.
    const pages=mainSha?[]:await checkPages(changes,checked.previewUrl);
    const broken=pages.some(page=>!page.ok);
    if(mainSha)await setStatus(pr.head.sha,PREVIEW,checked.previewUrl,'Checked preview of the saved version.',env);
    else {
      await upsertComment(pr.number,COMMENT_MARKER,commentBody(changes,{previewUrl:checked.previewUrl,contentMoved,sha:pr.head.sha,pages}),env);
      await setStatus(pr.head.sha,PREVIEW,pages.length===1&&!broken?pages[0].url:checked.previewUrl,statusDescription(changes,{contentMoved,pages}),env,broken?'failure':'success');
    }
    if(mainSha){await publish(checked,reviewed,pr,mainSha,env);await setStatus(mainSha,LIVE,LIVE_ORIGIN,'Saved and verified on the live website.',env);}
    const result={pullRequest:pr.number,sourceSha:checked.sourceSha,releaseDigest:checked.releaseDigest,previewRunId:checked.previewRunId,previewUrl:checked.previewUrl,liveWebsite:mainSha?LIVE_ORIGIN:null,contentMoved,otherChangesGoingLive:changes.notListed.length,pages};
    await writeJson('output/publish-live-result.json',result);
    await summary(`[Website preview](${checked.previewUrl})\n\nPR #${pr.number}; checked source ${checked.sourceSha}.\n\n${mainSha?'Live website verified: '+LIVE_ORIGIN:statusDescription(changes,{contentMoved})}\n`,env);
    console.log(JSON.stringify(result,null,2));
  } catch(error) {
    if(mainSha){
      await setStatus(mainSha,LIVE,runUrl(env),failureDescription(error.message),env,'failure');
      await upsertComment(pr.number,'<!-- cottonwood-live-failure -->',failureComment(error.message,runUrl(env)),env);
    } else await setStatus(decision.sha,PREVIEW,runUrl(env),`No preview: ${error.message}`,env,'failure');
    throw error;
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const action=process.argv[2];
  (action==='bundle'?bundle(process.env):action==='route'?routeStep(process.env):action==='deliver'?deliver(process.env):Promise.reject(Error('Use publish-live.mjs bundle|route|deliver.'))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
