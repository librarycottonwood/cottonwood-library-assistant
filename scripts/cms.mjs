import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SANITY_API_VERSION, sanityConfig, fetchSanitySnapshot, validateSanitySnapshot } from '../src/content/sanity.mjs';

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
export function contentDigest(snapshot) {
  return createHash('sha256').update(JSON.stringify(canonical({ schemaVersion:1, projectId:snapshot.projectId, dataset:snapshot.dataset,
    documents:[...snapshot.documents].sort((a,b)=>a._id<b._id?-1:a._id>b._id?1:0) }))).digest('hex');
}
export async function saveSnapshot(snapshot, filename) {
  validateSanitySnapshot(snapshot);
  const result = { ...snapshot, contentDigest:contentDigest(snapshot) };
  await mkdir(path.dirname(path.resolve(filename)),{recursive:true});
  await writeFile(filename,JSON.stringify(result,null,2)+'\n',{mode:0o600});
  return result;
}
export async function readSnapshot(filename, expected) {
  const bytes = await readFile(filename);
  if (bytes.length > 25*1024*1024) throw Error('CMS snapshot exceeds 25 MB.');
  const snapshot = JSON.parse(bytes);
  validateSanitySnapshot(snapshot,expected);
  if (snapshot.contentDigest && snapshot.contentDigest !== contentDigest(snapshot)) throw Error('CMS snapshot changed after capture.');
  return snapshot;
}
async function localContent(root) {
  const { default:ts } = await import('typescript');
  const folder = await mkdtemp(path.join(tmpdir(),'cottonwood-cms-seed-'));
  try {
    for (const name of ['seed','support','editorial','notices']) {
      const source = await readFile(path.join(root,'src/content',name+'.ts'),'utf8');
      const javascript = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
      // These four known local data modules have only relative runtime imports.
      const rewritten = javascript.replace(/from ['"]\.\/(seed|support|editorial|notices)['"]/g, "from './$1.mjs'");
      await writeFile(path.join(folder,name+'.mjs'),rewritten);
    }
    const [home,support,editorial,notices] = await Promise.all(['seed','support','editorial','notices'].map(name=>import(pathToFileURL(path.join(folder,name+'.mjs')).href)));
    return {home:home.homeContent,support:support.supportContent,events:editorial.libraryEvents,posts:editorial.libraryPosts,notices:notices.libraryNotices};
  } finally { await rm(folder,{recursive:true,force:true}); }
}
const slug = value => value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
function migrated(value, field='', parentField='') {
  if (Array.isArray(value)) {
    const types = {hours:'hoursRow',navigation:'navigationLink',services:'libraryService',borrowing:'borrowingAnswer',updates:'supportUpdate',initiatives:'supportInitiative',campaigns:'fundraisingCampaign',sessions:'eventSession'};
    return value.map((item,i)=>item && typeof item==='object' ? {_key:`item${i}`,...(types[field]?{_type:types[field]}:{}),...migrated(item,field,parentField)} : item);
  }
  if (!value || typeof value!=='object') return value;
  if (typeof value.key==='string' && typeof value.alt==='string') {
    const {key,...rest}=value;
    return {_type:'libraryImage',legacyKey:key,...rest};
  }
  const types={givebutter:parentField==='library'?'givebutterAccount':'donationWidget',action:'initiativeAction',link:'navigationLink'};
  return {...(types[field]?{_type:types[field]}:{}),...Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([key,item])=>[key,migrated(item,key,field)]))};
}
export async function seedSnapshot(config,{root=process.cwd()}={}) {
  const source=await localContent(root);
  const {programs,newsletter,...settings}=source.home;
  const docs=[{_id:'library-settings',_type:'siteSettings',...migrated(settings),currentNewsletter:{_type:'reference',_ref:'newsletter-current'}},
    {_id:'library-giving',_type:'givingSettings',...migrated(source.support)},
    {_id:'newsletter-current',_type:'newsletter',...migrated({...newsletter,legacyFileUrl:newsletter.fileUrl,fileUrl:undefined}),slug:{_type:'slug',current:slug(newsletter.issue)}}];
  for (const [orderRank,{id,...program}] of programs.entries()) docs.push({_id:`program-${id}`,_type:'program',...migrated(program),orderRank,slug:{_type:'slug',current:id}});
  const grouped=new Map();
  for (const event of source.events) {
    const key=slug(event.title);
    if (!grouped.has(key)) grouped.set(key,{_id:`event-${key}`,_type:'event',slug:{_type:'slug',current:key},title:event.title,summary:event.summary,href:event.href,sessions:[]});
    grouped.get(key).sessions.push({_key:event.id,_type:'eventSession',startsAt:event.startsAt,endsAt:event.endsAt});
  }
  docs.push(...grouped.values());
  for (const post of source.posts.filter(post=>post.id!=='newsletter')) {
    const {id,paragraphs,...rest}=post;
    docs.push({_id:`post-${id}`,_type:'post',...migrated(rest),slug:{_type:'slug',current:id},
      body:paragraphs.map((text,i)=>({_type:'block',_key:`paragraph${i}`,style:'normal',markDefs:[],children:[{_type:'span',_key:`span${i}`,text,marks:[]}]}))});
  }
  for (const notice of source.notices) docs.push({_id:`notice-${notice.id}`,_type:'notice',...migrated(notice),slug:{_type:'slug',current:notice.id}});
  // This is a migration preview, not evidence that the source copy is approved.
  for (const doc of docs) {doc._rev='migration-preview';doc.migrationSource='existing website prototype; review before publishing';}
  const snapshot={schemaVersion:1,projectId:config.projectId,dataset:config.dataset,documents:docs};
  validateSanitySnapshot(snapshot,config);
  return snapshot;
}
async function legacyFiles(root) {
  const {default:ts}=await import('typescript');
  const filename=path.join(root,'src/content/images.ts');
  const parsed=ts.createSourceFile(filename,await readFile(filename,'utf8'),ts.ScriptTarget.Latest,true);
  const files={};
  for (const statement of parsed.statements) if (ts.isImportDeclaration(statement) && statement.importClause?.name && ts.isStringLiteral(statement.moduleSpecifier)) {
    files[statement.importClause.name.text]=path.resolve(path.dirname(filename),statement.moduleSpecifier.text);
  }
  return files;
}
async function request(config,route,{token,fetcher=fetch,method='GET',body,contentType='application/json'}={}) {
  const response=await fetcher(`https://${config.projectId}.api.sanity.io/v${SANITY_API_VERSION}${route}`,{
    method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{'Content-Type':contentType}:{})},
    ...(body?{body:contentType==='application/json'?JSON.stringify(body):body}:{}),redirect:'error',signal:AbortSignal.timeout(60000)});
  if (!response.ok) throw Error(`Sanity ${method} failed (${response.status}); no successful import claimed.`);
  return response.json();
}
/** Explicit setup command only: import as drafts and never overwrite existing work. */
export async function importDrafts(snapshot,{token,fetcher=fetch,root=process.cwd(),uploadAssets=true}={}) {
  if (!token) throw Error('SANITY_WRITE_TOKEN is required for the explicitly requested draft import.');
  const config=sanityConfig({SANITY_PROJECT_ID:snapshot.projectId,SANITY_DATASET:snapshot.dataset});
  validateSanitySnapshot(snapshot,config);
  const docs=structuredClone(snapshot.documents.filter(doc=>!doc._type.startsWith('sanity.')));
  const ids=docs.flatMap(doc=>[doc._id,`drafts.${doc._id}`]);
  const params=new URLSearchParams({query:'*[_id in $ids]{_id}','$ids':JSON.stringify(ids),perspective:'raw'});
  const existing=await request(config,`/data/query/${config.dataset}?${params}`,{token,fetcher});
  if (!Array.isArray(existing.result)) throw Error('Cannot confirm existing CMS records; import stopped.');
  const seen=new Set(existing.result.map(doc=>doc._id.replace(/^drafts\./,'')));
  const pending=docs.filter(doc=>!seen.has(doc._id));
  const localImages=uploadAssets?await legacyFiles(root):{};
  const uploaded=new Map();
  async function upload(filename,kind) {
    const cacheKey=`${kind}:${filename}`;
    if (uploaded.has(cacheKey)) return uploaded.get(cacheKey);
    const bytes=await readFile(filename);
    if (bytes.length>5*1024*1024) throw Error('Migration asset exceeds 5 MB; prepare it before import.');
    const extension=path.extname(filename).toLowerCase();
    const type=({'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf'})[extension];
    if (!type) throw Error('Unsupported migration asset format.');
    const result=await request(config,`/assets/${kind}/${config.dataset}?filename=${encodeURIComponent(path.basename(filename))}`,{token,fetcher,method:'POST',body:bytes,contentType:type});
    if (!result.document?._id || result.document._type!==(kind==='images'?'sanity.imageAsset':'sanity.fileAsset')) throw Error('Asset upload did not return a valid reference.');
    uploaded.set(cacheKey,result.document._id);
    return result.document._id;
  }
  async function visit(value) {
    if (Array.isArray(value)) {for (const item of value) await visit(item);return;}
    if (!value || typeof value!=='object') return;
    if (value.legacyKey && uploadAssets) {
      const filename=localImages[value.legacyKey];
      if (!filename) throw Error(`Unknown migration image ${value.legacyKey}.`);
      value.asset={_type:'reference',_ref:await upload(filename,'images')};
      delete value.legacyKey;
    }
    if (value.legacyFileUrl && uploadAssets) {
      if (!/^\/documents\/[a-zA-Z0-9._-]+\.pdf$/.test(value.legacyFileUrl)) throw Error('Only existing library document PDFs can be migrated.');
      value.file={_type:'file',asset:{_type:'reference',_ref:await upload(path.join(root,'public',value.legacyFileUrl),'files')}};
      delete value.legacyFileUrl;
    }
    if (value._type==='reference' && !value._ref.startsWith('image-') && !value._ref.startsWith('file-')) value._weak=true;
    for (const item of Object.values(value)) await visit(item);
  }
  for (const doc of pending) await visit(doc);
  for (let i=0;i<pending.length;i+=25) {
    const mutations=pending.slice(i,i+25).map(({_rev,_createdAt,_updatedAt,...doc})=>({createIfNotExists:{...doc,_id:`drafts.${doc._id}`}}));
    const result=await request(config,`/data/mutate/${config.dataset}?returnIds=true`,{token,fetcher,method:'POST',body:{mutations}});
    const expectedIds=new Set(mutations.map(mutation=>mutation.createIfNotExists._id));
    if(result.error || !Array.isArray(result.results) || result.results.length!==expectedIds.size || new Set(result.results.map(item=>item.id)).size!==expectedIds.size || result.results.some(item=>!expectedIds.has(item.id))) throw Error('Sanity did not confirm every draft mutation; inspect the account before retrying. Existing work is preserved.');
  }
  return {status:'drafts_imported',created:pending.length,skipped:docs.length-pending.length,assets:uploaded.size,published:0};
}

async function main() {
  const args=process.argv.slice(2).filter(arg=>arg!=='--');
  const action=args[0];
  const value=name=>{const at=args.indexOf(name);return at<0?undefined:args[at+1];};
  const output=value('--out')??'output/cms/snapshot.json';
  if (action==='seed') {
    const config=sanityConfig({SANITY_PROJECT_ID:value('--project')??process.env.SANITY_PROJECT_ID,SANITY_DATASET:value('--dataset')??process.env.SANITY_DATASET});
    const snapshot=await saveSnapshot(await seedSnapshot(config),output);
    console.log(JSON.stringify({status:'migration_preview_only',documents:snapshot.documents.length,contentDigest:snapshot.contentDigest,output}));
  } else if (action==='snapshot') {
    const config=sanityConfig();
    const snapshot=await fetchSanitySnapshot(config,{token:process.env.SANITY_READ_TOKEN});
    const document=value('--document'),revision=value('--revision');
    if (document && revision) {
      const observed=snapshot.documents.find(doc=>doc._id===document);
      if (revision==='deleted'?!!observed:observed?._rev!==revision) throw Error('The requested CMS revision was superseded; prepare a fresh preview.');
    }
    const saved=await saveSnapshot(snapshot,output);
    console.log(JSON.stringify({status:'snapshot_verified',documents:saved.documents.length,contentDigest:saved.contentDigest,output}));
  } else if (action==='verify') {
    const snapshot=await readSnapshot(value('--file')??output);
    if (value('--digest') && contentDigest(snapshot)!==value('--digest')) throw Error('CMS content differs from the approved snapshot.');
    console.log(JSON.stringify({status:'snapshot_verified',contentDigest:contentDigest(snapshot)}));
  } else if (action==='import') {
    const config=sanityConfig();
    const snapshot=await readSnapshot(value('--file')??output,config);
    if (!args.includes('--write-drafts')) throw Error('Import is disabled without --write-drafts. Review the migration snapshot first.');
    console.log(JSON.stringify(await importDrafts(snapshot,{token:process.env.SANITY_WRITE_TOKEN,uploadAssets:!args.includes('--keep-legacy-assets')})));
  } else if (action==='doctor') {
    if (process.env.LIBRARY_CONTENT_SOURCE!=='sanity') {
      console.log(JSON.stringify({status:'setup_pending',detail:'Local prototype active. No library-owned Sanity project has been configured or verified.'}));process.exitCode=2;return;
    }
    const config=sanityConfig();
    await fetchSanitySnapshot(config,{token:process.env.SANITY_READ_TOKEN});
    console.log(JSON.stringify({status:'published_content_read_verified',projectId:config.projectId,dataset:config.dataset,livePublishingVerified:false}));
  } else throw Error('Usage: cms.mjs seed|snapshot|verify|import|doctor. See assistant/CMS.md.');
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(error=>{console.error(error.message);process.exitCode=1;});
