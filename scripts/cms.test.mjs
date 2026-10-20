import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { contentDigest, seedSnapshot, importDrafts, saveSnapshot, readSnapshot } from './cms.mjs';

const config={projectId:'cmslocal',dataset:'production'};
test('migration preserves library facts and groups dated sessions without creating recurrence dates',async()=>{
  const snapshot=await seedSnapshot(config);
  const settings=snapshot.documents.find(doc=>doc._type==='siteSettings');
  assert.equal(settings.library.address,'3427 Main Street');
  assert.equal(settings.library.givebutter,null);
  assert.equal(settings.currentNewsletter._ref,'newsletter-current');
  const events=snapshot.documents.filter(doc=>doc._type==='event');
  assert.equal(events.length,1);
  assert.deepEqual(events[0].sessions.map(session=>session.startsAt),['2026-10-16T10:00:00-07:00','2026-10-17T10:00:00-07:00']);
  assert.equal(snapshot.documents.filter(doc=>doc._type==='program').length,3);
  assert.deepEqual(snapshot.documents.filter(doc=>doc._type==='program').map(doc=>doc.orderRank),[0,1,2]);
  assert.equal(settings.hero.image._type,'libraryImage');
  assert.equal(settings.library.hours[0]._type,'hoursRow');
});
test('snapshot fingerprint is stable across object/document ordering and changes with CMS revisions',async()=>{
  const snapshot=await seedSnapshot(config);
  assert.equal(contentDigest(snapshot),contentDigest({...snapshot,documents:[...snapshot.documents].reverse()}));
  const changed=structuredClone(snapshot);changed.documents[0]._rev='another-revision';
  assert.notEqual(contentDigest(snapshot),contentDigest(changed));
});
test('snapshot export validates and detects subsequent content tampering',async()=>{
  const folder=await mkdtemp(path.join(tmpdir(),'cms-export-test-'));
  try {
    const filename=path.join(folder,'snapshot.json');
    const saved=await saveSnapshot(await seedSnapshot(config),filename);
    assert.equal((await readSnapshot(filename,config)).contentDigest,saved.contentDigest);
    const value=JSON.parse(await readFile(filename,'utf8'));
    value.documents[0].library.name='Changed after review';
    const {writeFile}=await import('node:fs/promises');await writeFile(filename,JSON.stringify(value));
    await assert.rejects(readSnapshot(filename,config),/changed after capture/);
  } finally {await rm(folder,{recursive:true,force:true});}
});
test('explicit import uses draft-only createIfNotExists and preserves both existing drafts and published records',async()=>{
  const snapshot=await seedSnapshot(config);
  const calls=[];
  const fakeFetch=async(url,options)=>{
    calls.push({url,options});
    if(options.method==='GET') return Response.json({result:[{_id:'library-settings'},{_id:'drafts.library-giving'}]});
    return Response.json({results:JSON.parse(options.body).mutations.map(item=>({id:item.createIfNotExists._id}))});
  };
  const result=await importDrafts(snapshot,{token:'test-only-token',fetcher:fakeFetch,uploadAssets:false});
  assert.equal(result.skipped,2);assert.equal(result.published,0);
  const mutations=calls.filter(call=>call.options.method==='POST').flatMap(call=>JSON.parse(call.options.body).mutations);
  assert.equal(mutations.length,snapshot.documents.length-2);
  assert.ok(mutations.every(item=>Object.keys(item).join(',')==='createIfNotExists' && item.createIfNotExists._id.startsWith('drafts.')));
  assert.ok(mutations.every(item=>!['_rev','_createdAt','_updatedAt'].some(key=>key in item.createIfNotExists)));
  assert.ok(calls.every(call=>call.url.startsWith('https://cmslocal.api.sanity.io/')));
});
test('missing import credentials and ambiguous existing-record response fail before any mutation',async()=>{
  const snapshot=await seedSnapshot(config);let writes=0;
  await assert.rejects(importDrafts(snapshot),/WRITE_TOKEN/);
  await assert.rejects(importDrafts(snapshot,{token:'test-only',uploadAssets:false,fetcher:async(_url,options)=>{if(options.method==='POST')writes++;return Response.json({});}}),/confirm existing/);
  assert.equal(writes,0);
});
test('migration uploads actual prepared image/PDF bytes once and places their returned references in drafts',async()=>{
  const snapshot=await seedSnapshot(config), uploads=[],created=[];
  const result=await importDrafts(snapshot,{token:'synthetic-setup-token',fetcher:async(url,options)=>{
    assert.equal(options.headers.Authorization,'Bearer synthetic-setup-token');
    if(options.method==='GET')return Response.json({result:[]});
    if(url.includes('/assets/')){
      assert.ok(Buffer.isBuffer(options.body) && options.body.length>100,'upload actual library asset bytes');
      const kind=url.includes('/images/')?'image':'file';
      const id=`${kind}-testasset${uploads.length}-${kind==='image'?'1200x800-jpg':'pdf'}`;
      uploads.push({url,options,id});
      return Response.json({document:{_id:id,_type:`sanity.${kind}Asset`}});
    }
    const mutations=JSON.parse(options.body).mutations;created.push(...mutations.map(item=>item.createIfNotExists));
    return Response.json({results:mutations.map(item=>({id:item.createIfNotExists._id}))});
  }});
  assert.equal(result.published,0);
  assert.equal(result.assets,uploads.length);
  assert.equal(new Set(uploads.map(item=>item.url)).size,uploads.length,'shared image uploaded once');
  assert.ok(uploads.some(item=>item.options.headers['Content-Type']==='application/pdf'));
  const settings=created.find(doc=>doc._id==='drafts.library-settings');
  assert.ok(uploads.some(item=>item.id===settings.hero.image.asset._ref));
  assert.equal(settings.currentNewsletter._weak,true);
  const newsletter=created.find(doc=>doc._id==='drafts.newsletter-current');
  assert.ok(uploads.some(item=>item.id===newsletter.file.asset._ref));
  assert.ok(created.every(doc=>doc._id.startsWith('drafts.')));
});
test('ambiguous or failed mutations never return a successful import result',async()=>{
  const snapshot=await seedSnapshot(config);
  for(const body of [{error:{description:'rejected'}},{results:[]},{results:[{id:'unexpected'}]}]){
    await assert.rejects(importDrafts(snapshot,{token:'synthetic',uploadAssets:false,fetcher:async(_url,options)=>Response.json(options.method==='GET'?{result:[]}:body)}),/did not confirm/);
  }
  await assert.rejects(importDrafts(snapshot,{token:'synthetic',uploadAssets:false,fetcher:async(_url,options)=>Response.json(options.method==='GET'?{result:[]}:{results:JSON.parse(options.body).mutations.map(()=>({id:'drafts.library-settings'}))})}),/did not confirm/);
});
