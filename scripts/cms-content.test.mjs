import assert from 'node:assert/strict';
import test from 'node:test';
import { SANITY_API_VERSION, SANITY_QUERY, fetchSanitySnapshot, safeHref, sanityConfig, validateSanitySnapshot } from '../src/content/sanity.mjs';
import { upcomingEvents } from '../src/content/feeds.ts';
const picture = { legacyKey: 'exterior', alt: 'The library entrance.' };
const fixture = () => ({ schemaVersion: 1, projectId: 'testproject', dataset: 'rehearsal', documents: [
  { _id:'library-settings',_type:'siteSettings', library:{name:'Test library',phone:'(530) 555-0100',phoneHref:'tel:+15305550100',email:'hello@example.org',address:'1 Main Street',locality:'Cottonwood, CA',mailingAddress:'PO Box 1',timezone:'America/Los_Angeles',hoursSummary:'Saturday 11–2',hours:[{days:'Saturday',hours:'11–2'}],catalogUrl:'https://catalog.example.org/',directionsUrl:'https://maps.example.org/',instagramUrl:'https://instagram.com/example',facebookUrl:'https://facebook.com/example',donationUrl:null},navigation:[{label:'Events',href:'/librarynews/'}],hero:{eyebrow:'Welcome',heading:['Your library.','Your community.'],introduction:'Come visit.',image:picture},services:[{id:'computers',title:'Computers',description:'Use a computer.',icon:'computer'}],borrowing:[{question:'How?',answer:'Ask us.'}],story:{heading:'Our story',paragraphs:['Built by neighbors.'],image:picture},support:{title:'Help',introduction:'Volunteer.',image:picture,volunteerFileUrl:'/documents/application.pdf',materials:'Books',bookSale:'During opening hours',wowPoints:'Ask the cashier'},currentNewsletter:{_ref:'newsletter-summer-2026'}},
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
test('an event keeps its own page and carries its optional outside link separately', () => {
  assert.equal(validateSanitySnapshot(fixture()).events[0].link, undefined);
  const snapshot = fixture(); doc(snapshot, 'event').href = 'https://givebutter.com/c/underoneroof';
  const result = validateSanitySnapshot(snapshot);
  assert.deepEqual(result.events.map(event => event.href), ['/events/spring-sale/', '/events/spring-sale/']);
  assert.deepEqual(result.events.map(event => event.link), ['https://givebutter.com/c/underoneroof', 'https://givebutter.com/c/underoneroof']);
  const internal = fixture(); doc(internal, 'event').href = '/fundraising-events/book-sale/';
  assert.equal(validateSanitySnapshot(internal).events[0].link, undefined);
  const unsafe = fixture(); doc(unsafe, 'event').href = 'javascript:alert(1)';
  assert.throws(() => validateSanitySnapshot(unsafe));
});
test('a correction changes every occurrence derived from that record without duplicate source records', () => {
  const snapshot=fixture();doc(snapshot,'event').title='Corrected sale title';doc(snapshot,'event').sessions[0].startsAt='2027-03-05T11:00:00-08:00';
  const result=validateSanitySnapshot(snapshot);
  assert.equal(result.events[0].startsAt,'2027-03-05T11:00:00-08:00');
  assert.ok(result.events.every(event=>event.title==='Corrected sale title'));
  assert.equal(result.posts[0].eventIds.length,1);
});
test('published event sessions cannot omit an end time or end at or before their start', () => {
  for (const endsAt of [undefined, null, '', 'not a date', '2027-03-05T10:00:00-08:00', '2027-03-05T09:00:00-08:00']) {
    const snapshot = fixture();
    doc(snapshot, 'event').sessions[0].endsAt = endsAt;
    assert.throws(() => validateSanitySnapshot(snapshot), /endsAt|end time must be later/);
  }
});
test('upcoming events remain listed during the event and expire after the required end time', () => {
  const [event] = validateSanitySnapshot(fixture()).events;
  assert.deepEqual(upcomingEvents([event], Date.parse('2027-03-05T12:00:00-08:00')), [event]);
  assert.deepEqual(upcomingEvents([event], Date.parse('2027-03-05T14:00:01-08:00')), []);
  assert.throws(() => upcomingEvents([{...event, endsAt: undefined}]), /Invalid event dates/);
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

// Small content mistakes typed in Studio, or written by the assistant through the API (where Studio
// validation never runs), are corrected with a warning instead of blocking every preview and publish.
const quiet = () => { const warnings = []; return { warnings, options: { warn: message => warnings.push(message) } }; };
const initiative = (overrides = {}) => ({ id: 'book-sale', title: 'Book sale', category: 'giving', label: 'Shop', summary: 'Buy books.', image: picture, paragraphs: ['Every Saturday.'], steps: ['Come by.'], action: { label: 'Visit', href: '/#visit' }, ...overrides });
const campaign = (overrides = {}) => ({ id: 'auction', title: 'Online auction', description: 'Bid on items.', url: 'https://givebutter.com/auction', givebutter: { formWidgetId: 'jwyYlq' }, ...overrides });

test('phone links typed with spaces, punctuation or a country code become one dialable tel: link', () => {
  for (const [href, expected] of [['tel:(208) 555-0142', 'tel:+12085550142'], ['tel:+1 208 555 0142', 'tel:+12085550142'], ['tel:208-555-0142', 'tel:+12085550142'], ['tel:+15303474818', 'tel:+15303474818'], ['tel:(530) 555-0173 ext. 2', 'tel:+15305550173,2'], ['tel:211', 'tel:211']]) {
    const s = fixture(); doc(s, 'siteSettings').navigation[0].href = href;
    const { options } = quiet();
    assert.equal(validateSanitySnapshot(s, undefined, options).home.navigation[0].href, expected, href);
    assert.equal(safeHref(expected), expected, 'normalized links stay stable when rendered');
  }
  const bad = fixture(); doc(bad, 'siteSettings').navigation[0].href = 'tel:call us';
  assert.throws(() => validateSanitySnapshot(bad, undefined, quiet().options), /Library settings.*Main navigation › item 1 › Destination \(navigation\[0\]\.href\).*phone/);
});
test('links with stray leading or trailing spaces are trimmed everywhere, including https-only fields', () => {
  const s = fixture();
  doc(s, 'givingSettings').campaigns = [campaign({ url: 'https://givebutter.com/auction ' })];
  doc(s, 'siteSettings').navigation[0].href = '  /librarynews/ ';
  doc(s, 'post').body[0].markDefs[0].href = ' /events/spring-sale/';
  const result = validateSanitySnapshot(s, undefined, quiet().options);
  assert.equal(result.support.campaigns[0].url, 'https://givebutter.com/auction');
  assert.equal(result.home.navigation[0].href, '/librarynews/');
  assert.equal(result.posts[0].body[0].markDefs[0].href, '/events/spring-sale/');
});
test('a fundraiser keeps its optional homepage badge text; blank badge text is left off', () => {
  const s = fixture();
  doc(s, 'givingSettings').campaigns = [campaign({ badgeLabel: ' Help us afford a new roof ' }), campaign({ id: 'second', badgeLabel: '  ' })];
  const [first, second] = validateSanitySnapshot(s, undefined, quiet().options).support.campaigns;
  assert.equal(first.badgeLabel, 'Help us afford a new roof');
  assert.equal('badgeLabel' in second, false);
});
test('unsafe links still fail, with plain English naming the document title and the field', () => {
  const cases = [
    [s => { doc(s, 'event').href = 'https://localhost/x'; }, /In the event "Spring sale" \(document event-sale\): Optional destination link \(href\): The link "https:\/\/localhost\/x" points to "localhost", which isn't a public website/],
    [s => { doc(s, 'siteSettings').navigation[0].href = '/visit/../events/'; }, /In Library settings \(document library-settings\): Main navigation › item 1 › Destination \(navigation\[0\]\.href\): The link "\/visit\/\.\.\/events\/" uses "\." or "\.\." in the page path/],
    [s => { doc(s, 'givingSettings').campaigns = [campaign({ url: 'http://givebutter.com/auction' })]; }, /In Giving and acknowledgments.*Approved fundraising campaigns › item 1 › Approved donation page \(campaigns\[0\]\.url\): .*Use the secure https:\/\/ address/],
    [s => { doc(s, 'post').body[0].markDefs[0].href = 'javascript:alert(1)'; }, /In the blog post "Spring news".*Post text › item 1 › links › item 1 › Link address/],
    [s => { doc(s, 'siteSettings').library.catalogUrl = 'https://192.168.1.20/catalog'; }, /Catalog address \(library\.catalogUrl\).*isn't a public website/],
  ];
  for (const [modify, message] of cases) { const s = fixture(); modify(s); assert.throws(() => validateSanitySnapshot(s, undefined, quiet().options), message); }
});
test('free-text identifiers become stable URL ids; existing valid ids are never changed', () => {
  const s = fixture();
  doc(s, 'siteSettings').services = [{ id: 'Printing & Copies', title: 'Printing', description: 'Print pages.', icon: 'printer' }, { id: 'computers', title: 'Computers', description: 'Use a computer.', icon: 'computer' }, { id: 'borrowing', title: 'Borrowing', description: 'Borrow books.', icon: 'book' }];
  doc(s, 'givingSettings').initiatives = [initiative({ id: 'bookDonations' }), initiative({ id: 'book-sale' }), initiative({ id: ' Library Fund ' })];
  const { warnings, options } = quiet();
  const result = validateSanitySnapshot(s, undefined, options);
  assert.deepEqual(result.home.services.map(item => item.id), ['printing-copies', 'computers', 'borrowing']);
  assert.deepEqual(result.support.initiatives.map(item => item.id), ['book-donations', 'book-sale', 'library-fund']);
  assert.equal(warnings.length, 3);
  assert.match(warnings[0], /Library settings.*Library services › item 1 › Service identifier \(services\[0\]\.id\): "Printing & Copies" is used on the website as "printing-copies"/);
  // Two entries that normalize to the same id still fail rather than silently sharing a page.
  const clash = fixture(); doc(clash, 'givingSettings').initiatives = [initiative({ id: 'Book Sale' }), initiative({ id: 'book-sale' })];
  assert.throws(() => validateSanitySnapshot(clash, undefined, quiet().options), /Ways to help.*duplicate identifier "book-sale"/);
  const empty = fixture(); doc(empty, 'siteSettings').services[0].id = '&&&';
  assert.throws(() => validateSanitySnapshot(empty, undefined, quiet().options), /Service identifier \(services\[0\]\.id\): The identifier "&&&" has no letters or numbers/);
});
test('identifier normalization leaves every already-valid slug exactly as it is', async () => {
  const { slugify, SLUG_PATTERN } = await import('../src/content/rules.mjs');
  for (const value of ['book-sale', 'borrowing', 'wow-points', 'first-five', 'summer-2026', '424afbea-07cb-447c-a77f-6f3172fd2b85', 'a', '2026']) assert.equal(slugify(value), value);
  for (const value of ['Printing & Copies', 'bookDonations', 'WOWPoints', 'Café Nights', ' spaced ', 'Kids’ Corner', 'a--b']) assert.match(slugify(value), SLUG_PATTERN, value);
  assert.equal(slugify('Kids’ Corner'), 'kids-corner');
});
test('blank story paragraphs and blank steps are left off instead of failing the build', () => {
  const s = fixture();
  doc(s, 'siteSettings').story.paragraphs = ['Built by neighbors.', '', '   ', null, 'Still growing.'];
  doc(s, 'givingSettings').initiatives = [initiative({ paragraphs: ['Every Saturday.', ''], steps: ['', 'Come by.', '\n'] })];
  const { warnings, options } = quiet();
  const result = validateSanitySnapshot(s, undefined, options);
  assert.deepEqual(result.home.story.paragraphs, ['Built by neighbors.', 'Still growing.']);
  assert.deepEqual(result.support.initiatives[0].paragraphs, ['Every Saturday.']);
  assert.deepEqual(result.support.initiatives[0].steps, ['Come by.']);
  assert.equal(warnings.length, 6);
  assert.match(warnings[0], /Library story › Story paragraphs › item 2 \(story\.paragraphs\[1\]\): This entry is empty/);
});
test('library phone numbers with an extension keep the extension in the call link', () => {
  for (const [phone, href] of [['(530) 555-0173 ext. 2', 'tel:+15305550173,2'], ['530-555-0173 x12', 'tel:+15305550173,12'], ['1 (530) 347-4818', 'tel:+15303474818'], ['+1 530 347 4818', 'tel:+15303474818']]) {
    const s = fixture(); doc(s, 'siteSettings').library.phone = phone;
    const library = validateSanitySnapshot(s, undefined, quiet().options).home.library;
    assert.equal(library.phoneHref, href, phone); assert.equal(library.phone, phone);
  }
  const local = fixture(); doc(local, 'siteSettings').library.phone = '347-4818';
  assert.throws(() => validateSanitySnapshot(local, undefined, quiet().options), /Phone number \(library\.phone\): The phone number "347-4818" needs to be a 10-digit US number/);
});
test('a hand-typed winter offset on a summer date keeps the Pacific wall-clock time and warns', () => {
  const s = fixture();
  doc(s, 'event').sessions = [{ _key: 'halloween', startsAt: '2026-10-31T10:00:00-08:00', endsAt: '2026-10-31T12:00:00-08:00' }];
  const { warnings, options } = quiet();
  const [event] = validateSanitySnapshot(s, undefined, options).events;
  assert.equal(event.startsAt, '2026-10-31T10:00:00-07:00');
  assert.equal(event.endsAt, '2026-10-31T12:00:00-07:00');
  assert.equal(Date.parse(event.startsAt), Date.parse('2026-10-31T17:00:00Z'), '10 a.m. Pacific, not 11 a.m.');
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /In the event "Spring sale" \(document event-sale\): Confirmed dates › item 1 › Starts \(Pacific time\) \(sessions\[0\]\.startsAt\): "2026-10-31T10:00:00-08:00" uses the winter \(PST, -08:00\) offset, but on 2026-10-31 Pacific time is -07:00/);
  // The reverse mistake: summer offset on a winter date.
  const winter = fixture(); doc(winter, 'event').sessions = [{ _key: 'dec', startsAt: '2026-12-05T10:00:00-07:00', endsAt: '2026-12-05T12:00:00-07:00' }];
  assert.equal(validateSanitySnapshot(winter, undefined, quiet().options).events[0].startsAt, '2026-12-05T10:00:00-08:00');
});
test('event times without seconds are accepted; Studio UTC times and correct offsets are untouched', () => {
  const s = fixture();
  doc(s, 'event').sessions = [
    { _key: 'auction', startsAt: '2026-11-14T00:00-08:00', endsAt: '2026-11-14T23:59-08:00' },
    { _key: 'studio', startsAt: '2026-11-07T18:00:00.000Z', endsAt: '2026-11-07T20:00:00.000Z' },
    { _key: 'october', startsAt: '2026-10-16T10:00:00-07:00', endsAt: '2026-10-16T14:00:00-07:00' },
    // Both 1:30 a.m. on the fall-back night are real Pacific times.
    { _key: 'early', startsAt: '2026-11-01T01:30:00-07:00', endsAt: '2026-11-01T01:45:00-07:00' },
    { _key: 'repeat', startsAt: '2026-11-01T01:30:00-08:00', endsAt: '2026-11-01T01:45:00-08:00' },
  ];
  const { warnings, options } = quiet();
  const events = validateSanitySnapshot(s, undefined, options).events;
  assert.deepEqual(events.map(event => [event.startsAt, event.endsAt]), [
    ['2026-11-14T00:00:00-08:00', '2026-11-14T23:59:00-08:00'], ['2026-11-07T18:00:00.000Z', '2026-11-07T20:00:00.000Z'],
    ['2026-10-16T10:00:00-07:00', '2026-10-16T14:00:00-07:00'], ['2026-11-01T01:30:00-07:00', '2026-11-01T01:45:00-07:00'], ['2026-11-01T01:30:00-08:00', '2026-11-01T01:45:00-08:00'],
  ]);
  assert.deepEqual(warnings, []);
  const noZone = fixture(); doc(noZone, 'event').sessions[0].startsAt = '2027-03-05T09:00';
  const result = quiet();
  assert.equal(validateSanitySnapshot(noZone, undefined, result.options).events[0].startsAt, '2027-03-05T09:00:00-08:00');
  assert.match(result.warnings[0], /has no timezone, so it is read as 9:00 a\.m\. on 2027-03-05 Pacific time/);
  const nonsense = fixture(); doc(nonsense, 'event').sessions[0].startsAt = 'next Tuesday';
  assert.throws(() => validateSanitySnapshot(nonsense, undefined, quiet().options), /In the event "Spring sale".*Starts \(Pacific time\) \(sessions\[0\]\.startsAt\): The date and time "next Tuesday" must be a real date and time/);
});
test('indented (nested) list items join the parent list instead of failing the build', () => {
  const s = fixture();
  const li = (key, text, listItem, level) => ({ _key: key, _type: 'block', style: 'normal', markDefs: [], listItem, level, children: [{ _key: `${key}s`, _type: 'span', text, marks: [] }] });
  doc(s, 'post').body = [li('a', 'Bring a bag', 'bullet', 1), li('b', 'Paper or cloth', 'bullet', 2), li('c', 'Ask at the desk', 'number', 3), li('d', 'Pay at the counter', 'bullet', 1)];
  const { warnings, options } = quiet();
  const body = validateSanitySnapshot(s, undefined, options).posts[0].body;
  assert.deepEqual(body.map(block => [block.listItem, block.level]), [['bullet', 1], ['bullet', 1], ['bullet', 1], ['bullet', 1]]);
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /In the blog post "Spring news".*Post text › item 2 \(body\[1\]\): This is an indented list item/);
});
test('correction warnings print once per message by default and are returned with the content', () => {
  const s = fixture(); doc(s, 'siteSettings').services[0].id = 'Computer Lab';
  const original = console.warn; const printed = [];
  console.warn = message => printed.push(message);
  try {
    assert.equal(validateSanitySnapshot(s).warnings.length, 1);
    assert.equal(validateSanitySnapshot(s).warnings.length, 1);
  } finally { console.warn = original; }
  assert.equal(printed.length, 1);
  assert.match(printed[0], /^Sanity content warning: In Library settings/);
});
