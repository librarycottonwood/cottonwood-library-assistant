import assert from 'node:assert/strict';
import test from 'node:test';
import { SANITY_API_VERSION, SANITY_QUERY, fetchSanitySnapshot, safeHref, sanityConfig, validateSanitySnapshot } from '../src/content/sanity.mjs';
const picture = { legacyKey: 'exterior', alt: 'The library entrance.' };
const fixture = () => ({ schemaVersion: 1, projectId: 'testproject', dataset: 'rehearsal', documents: [
  { _id:'library-settings',_type:'siteSettings', library:{name:'Test library',phone:'(530) 555-0100',phoneHref:'tel:+15305550100',email:'hello@example.org',address:'1 Main Street',locality:'Cottonwood, CA',mailingAddress:'PO Box 1',timezone:'America/Los_Angeles',hoursSummary:'Saturday 11–2',hours:[{days:'Saturday',hours:'11–2'}],catalogUrl:'https://catalog.example.org/',directionsUrl:'https://maps.example.org/',instagramUrl:'https://instagram.com/example',donationUrl:null},navigation:[{label:'Events',href:'/librarynews/'}],hero:{eyebrow:'Welcome',heading:['Your library.','Your community.'],introduction:'Come visit.',image:picture},services:[{id:'computers',title:'Computers',description:'Use a computer.',icon:'computer'}],borrowing:[{question:'How?',answer:'Ask us.'}],story:{heading:'Our story',paragraphs:['Built by neighbors.'],image:picture},support:{title:'Help',introduction:'Volunteer.',image:picture,volunteerFileUrl:'/documents/application.pdf',materials:'Books',bookSale:'During opening hours',wowPoints:'Ask the cashier'},currentNewsletter:{_ref:'newsletter-summer-2026'}},
  {_id:'library-giving',_type:'givingSettings',campaigns:[],updates:[],initiatives:[]},
  {_id:'program-reading',_type:'program',slug:{current:'reading'},title:'Reading together',audience:'adults',schedule:'Wednesday',description:'Bring a book.',details:'No assigned book.',image:picture},
  {_id:'event-sale',_type:'event',slug:{current:'spring-sale'},title:'Spring sale',summary:'Find a book.',sessions:[{_key:'friday',startsAt:'2027-03-05T10:00:00-08:00',endsAt:'2027-03-05T14:00:00-08:00'},{_key:'saturday',startsAt:'2027-03-06T10:00:00-08:00',endsAt:'2027-03-06T14:00:00-08:00'}],program:{_ref:'program-reading'},image:picture},
  {_id:'post-news',_type:'post',slug:{current:'spring-news'},title:'Spring news',publishedAt:'2027-02-20',category:'News',summary:'Sale announced.',image:picture,eventRefs:[{_ref:'event-sale'}],body:[{_key:'paragraph',_type:'block',style:'normal',markDefs:[{_key:'info',_type:'link',href:'/events/spring-sale/'}],children:[{_key:'text',_type:'span',text:'Visit the sale.',marks:['strong','info']}]}]},
  {_id:'newsletter-summer-2026',_type:'newsletter',issue:'Summer 2026',title:'Summer news',summary:'Our summer issue.',legacyFileUrl:'/documents/summer-2026.pdf',cover:picture},
  {_id:'notice-holiday',_type:'notice',slug:{current:'holiday'},message:'Closed for the holiday.',startsOn:'2027-01-01',endsOn:'2027-01-01'},
] });
const doc = (snapshot, type) => snapshot.documents.find(item => item._type === type);

test('one published event document becomes consistent sessions and post references', () => {
  const result = validateSanitySnapshot(fixture());
  assert.equal(result.events.length,2);
  assert.deepEqual(result.events.map(event => event.href),['/events/spring-sale/','/events/spring-sale/']);
  assert.deepEqual(result.events.map(event => event.id),['spring-sale--friday','spring-sale--saturday']);
  assert.equal(result.events[0].programId,'reading');
  assert.equal(result.posts[0].eventIds[0],result.events[0].documentId);
  assert.equal(result.posts[0].body[0].markDefs[0].href,result.events[0].href);
  assert.equal(result.home.newsletter.fileUrl,result.newsletters[0].fileUrl);
});
test('a correction changes every occurrence derived from that record without duplicate source records', () => {
  const snapshot=fixture();doc(snapshot,'event').title='Corrected sale title';doc(snapshot,'event').sessions[0].startsAt='2027-03-05T11:00:00-08:00';
  const result=validateSanitySnapshot(snapshot);
  assert.equal(result.events[0].startsAt,'2027-03-05T11:00:00-08:00');
  assert.ok(result.events.every(event=>event.title==='Corrected sale title'));
  assert.equal(result.posts[0].eventIds.length,1);
});
test('post publication dates follow the Pacific calendar across evening, midnight, year and DST boundaries', () => {
  const cases = [
    ['2026-10-20', '2026-10-20'],
    ['2026-10-21T02:00:00Z', '2026-10-20'],
    ['2026-10-20T19:00:00-07:00', '2026-10-20'],
    ['2026-10-21T07:00:00Z', '2026-10-21'],
    ['2027-01-01T03:00:00Z', '2026-12-31'],
    ['2027-01-15T07:30:00Z', '2027-01-14'],
    ['2027-01-15T08:00:00Z', '2027-01-15'],
    // Spring forward: 11:30 p.m., midnight, and both sides of the skipped hour.
    ['2027-03-14T07:30:00Z', '2027-03-13'],
    ['2027-03-14T08:00:00Z', '2027-03-14'],
    ['2027-03-14T09:30:00Z', '2027-03-14'],
    ['2027-03-14T10:30:00Z', '2027-03-14'],
    // Fall back: 11:30 p.m., midnight, and both occurrences of 1:30 a.m.
    ['2026-11-01T06:30:00Z', '2026-10-31'],
    ['2026-11-01T07:00:00Z', '2026-11-01'],
    ['2026-11-01T08:30:00Z', '2026-11-01'],
    ['2026-11-01T09:30:00Z', '2026-11-01'],
  ];
  for (const [input, expected] of cases) {
    const snapshot = fixture();
    doc(snapshot, 'post').publishedAt = input;
    assert.equal(validateSanitySnapshot(snapshot).posts[0].publishedAt, expected, input);
  }
});
test('hours summary and call links derive from single editable facts, ignoring stale migration fields', () => {
  const s=fixture();const library=doc(s,'siteSettings').library;
  library.phone='530-555-0123';library.phoneHref='tel:+19999999999';
  library.hours=[{days:'Monday',hours:'10–4'},{days:'Tuesday',hours:'Closed'}];library.hoursSummary='Outdated';
  const result=validateSanitySnapshot(s).home.library;
  assert.equal(result.phoneHref,'tel:+15305550123');
  assert.equal(result.hoursSummary,'Monday 10–4');
});
test('Sanity mode requires project/dataset and rejects incompatible API versions', () => {
  assert.throws(()=>sanityConfig({}),/SANITY_PROJECT_ID/);
  assert.throws(()=>sanityConfig({SANITY_PROJECT_ID:'testproject'}),/SANITY_DATASET/);
  assert.throws(()=>sanityConfig({SANITY_PROJECT_ID:'testproject',SANITY_DATASET:'rehearsal',SANITY_API_VERSION:'2020-01-01'}),/pinned/);
  assert.equal(sanityConfig({SANITY_PROJECT_ID:'testproject',SANITY_DATASET:'rehearsal'}).apiVersion,SANITY_API_VERSION);
});
test('unavailable or malformed published responses fail instead of substituting local content', async () => {
  const config=sanityConfig({SANITY_PROJECT_ID:'testproject',SANITY_DATASET:'rehearsal'});
  await assert.rejects(fetchSanitySnapshot(config,{fetch:async()=>new Response('outage',{status:503})}),/failed \(503\)/);
  await assert.rejects(fetchSanitySnapshot(config,{fetch:async()=>new Response('{broken')}),/not JSON/);
  await assert.rejects(fetchSanitySnapshot(config,{fetch:async()=>new Response(JSON.stringify({result:[]}))}),/singleton/);
});
test('fetch uses the published perspective, pinned API, fresh API host, and server-only bearer', async()=>{
  let request;
  const snapshot=fixture();
  const result=await fetchSanitySnapshot(sanityConfig({SANITY_PROJECT_ID:'testproject',SANITY_DATASET:'rehearsal'}),{token:'test-read-token',fetch:async(url,options)=>{request={url,options};return new Response(JSON.stringify({result:snapshot.documents}));}});
  assert.equal(request.url.hostname,'testproject.api.sanity.io');
  assert.equal(request.url.searchParams.get('perspective'),'published');
  assert.equal(request.url.searchParams.get('query'),SANITY_QUERY);
  assert.equal(request.options.headers.Authorization,'Bearer test-read-token');
  assert.equal(request.options.redirect,'error');
  assert.ok(!JSON.stringify(result).includes('test-read-token'));
});
test('drafts, releases, duplicate ids, cross-project snapshots and missing published refs are rejected',()=>{
  for(const prefix of ['drafts.','versions.release.']){const s=fixture();s.documents.push({_id:`${prefix}hidden`,_type:'post'});assert.throws(()=>validateSanitySnapshot(s),/unpublished/);}
  const duplicate=fixture();duplicate.documents.push(duplicate.documents[0]);assert.throws(()=>validateSanitySnapshot(duplicate),/duplicate/);
  assert.throws(()=>validateSanitySnapshot(fixture(),{projectId:'other',dataset:'rehearsal'}),/different project/);
  const missing=fixture();missing.documents=missing.documents.filter(item=>item._id!=='event-sale');assert.throws(()=>validateSanitySnapshot(missing),/missing published event/);
});
test('unpublishing clears the actual records when no strong references remain',()=>{
  const s=fixture();doc(s,'post').eventRefs=[];s.documents=s.documents.filter(item=>item._type!=='event');
  assert.deepEqual(validateSanitySnapshot(s).events,[]);
  const noNewsletter=fixture();delete doc(noNewsletter,'siteSettings').currentNewsletter;assert.equal(validateSanitySnapshot(noNewsletter).home.newsletter,null);
});
test('unsafe links, incorrect dates, unsupported rich text and route collisions fail closed',()=>{
  for(const href of ['javascript:alert(1)','data:text/html,x','//evil.example/x','https://good.example\\@evil.example/','https://user:password@evil.example/','mailto:test@example.org?body=%0d%0aBcc:evil'])assert.throws(()=>safeHref(href));
  for(const modify of [s=>doc(s,'siteSettings').navigation[0].href='javascript:alert(1)',s=>doc(s,'event').sessions[0].startsAt='2027-02-30T10:00:00Z',s=>doc(s,'event').sessions[0].endsAt='2020-01-01T10:00:00Z',s=>doc(s,'post').body[0].markDefs[0].href='javascript:alert(1)',s=>doc(s,'post').body[0]._type='html',s=>doc(s,'post').slug.current='newsletter']){const s=fixture();modify(s);assert.throws(()=>validateSanitySnapshot(s));}
});
test('uploaded assets retain alt and real dimensions; malicious CDN URLs and spoofed dimensions are rejected',()=>{
  const s=fixture();doc(s,'post').image={asset:{_ref:'image-abc123-1200x800-jpg'},alt:'People choosing books.',caption:'Sale day.'};
  s.documents.push({_id:'image-abc123-1200x800-jpg',_type:'sanity.imageAsset',url:'https://cdn.sanity.io/images/testproject/rehearsal/abc123-1200x800.jpg',metadata:{dimensions:{width:1200,height:800}}});
  const image=validateSanitySnapshot(s).posts[0].image;
  assert.equal(image.width,1200);assert.equal(image.height,800);assert.equal(image.alt,'People choosing books.');assert.ok(image.url.startsWith('https://cdn.sanity.io/images/testproject/'));
  for(const url of ['https://cdn.sanity.io.evil.example/images/testproject/rehearsal/abc123-1200x800.jpg','https://cdn.sanity.io/images/other/rehearsal/abc123-1200x800.jpg','https://cdn.sanity.io/images/testproject/rehearsal/abc123-1200x800.jpg?redirect=https://evil.example']){const bad=structuredClone(s);doc(bad,'sanity.imageAsset').url=url;assert.throws(()=>validateSanitySnapshot(bad),/Sanity CDN/);}
  const wrong=structuredClone(s);doc(wrong,'sanity.imageAsset').metadata.dimensions.width=600;assert.throws(()=>validateSanitySnapshot(wrong),/disagree/);
  const noAlt=structuredClone(s);delete doc(noAlt,'post').image.alt;assert.throws(()=>validateSanitySnapshot(noAlt),/alt/);
});
test('uploaded newsletter PDFs resolve only through their matching project file asset',()=>{
  const s=fixture();doc(s,'newsletter').file={asset:{_ref:'file-abc123-pdf'}};s.documents.push({_id:'file-abc123-pdf',_type:'sanity.fileAsset',mimeType:'application/pdf',url:'https://cdn.sanity.io/files/testproject/rehearsal/abc123.pdf'});
  assert.equal(validateSanitySnapshot(s).home.newsletter.fileUrl,'https://cdn.sanity.io/files/testproject/rehearsal/abc123.pdf');
  doc(s,'sanity.fileAsset').mimeType='text/html';assert.throws(()=>validateSanitySnapshot(s),/PDF/);
});
