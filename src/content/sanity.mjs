/** Public content boundary shared by the Astro adapter and controlled publisher.
 * Snapshot files contain the exact published documents used by one build. No credentials.
 */
export const SANITY_API_VERSION = '2026-10-01';
export const SANITY_DOCUMENT_TYPES = ['siteSettings', 'givingSettings', 'program', 'event', 'post', 'newsletter', 'notice', 'sanity.imageAsset', 'sanity.fileAsset'];
export const SANITY_QUERY = '*[!(_id in path("drafts.**")) && !(_id in path("versions.**")) && _type in ["siteSettings","givingSettings","program","event","post","newsletter","notice","sanity.imageAsset","sanity.fileAsset"]]';
const LEGACY_IMAGES = new Set(['exterior','computerLab','storytime','books','interior','newsletter','watercolor','mainStreetReaders','bookClub','bookDonation','bookSale','childrensBookSale','holidayMarket','firstFive','communityFoundation','founders']);
const fail = message => { throw new Error(`Sanity content: ${message}`); };
const object = (value, at) => value && typeof value === 'object' && !Array.isArray(value) ? value : fail(`${at} must be an object`);
const array = (value, at) => Array.isArray(value) && value.length <= 10000 ? value : fail(`${at} must be an array with at most 10000 entries`);
const text = (value, at, allowEmpty = false) => typeof value === 'string' && (allowEmpty || value.trim()) && value.length <= 200000 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) ? value : fail(`${at} must be plain text`);
const optionalText = (value, at) => value == null || value === '' ? undefined : text(value, at);
const oneOf = (value, values, at) => values.includes(value) ? value : fail(`${at} is not supported`);
const slug = (value, at) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 96 ? value : fail(`${at} must be a lowercase URL slug`);
const id = (value, at) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : fail(`${at} must be a plain identifier`);
const unique = (items, key, at) => { const seen = new Set(); for (const item of items) { if (seen.has(item[key])) fail(`${at} has duplicate ${key}: ${item[key]}`); seen.add(item[key]); } return items; };
export function safeHref(value, at = 'link') {
  const link = text(value, at);
  if (/[\s\\\u007f]/.test(link) || /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(link)) fail(`${at} contains unsafe characters`);
  if (/^\/(?!\/)/.test(link) && !link.includes('..')) return link;
  if (/^#[a-zA-Z0-9_-]+$/.test(link)) return link;
  if (/^mailto:[^?@]+@[^?@]+(?:\?[^\r\n]*)?$/.test(link) || /^tel:\+?[\d()-]+$/.test(link)) return link;
  let url; try { url = new URL(link); } catch { fail(`${at} must be a local link or HTTPS URL`); }
  if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.includes('.')) fail(`${at} must be a local link or HTTPS URL`);
  return link;
}
const httpsHref = (value, at) => { const link = safeHref(value, at); if (!link.startsWith('https://')) fail(`${at} must use HTTPS`); return link; };
function day(value, at) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T12:00:00Z`)) || !new Date(`${value}T12:00:00Z`).toISOString().startsWith(value)) fail(`${at} must be a real YYYY-MM-DD date`);
  return value;
}
function instant(value, at) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) fail(`${at} must include a valid date, time, and timezone`);
  day(value.slice(0, 10), at);
  return value;
}
// Sanity stores datetimes in UTC; publication labels follow the library's local
// calendar day, including the differing UTC offsets on either side of DST.
function publicationDay(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return day(value, 'post.publishedAt');
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(instant(value, 'post.publishedAt')));
  const part = type => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function sanityConfig(env = process.env) {
  const projectId = env.SANITY_PROJECT_ID;
  const dataset = env.SANITY_DATASET;
  if (typeof projectId !== 'string' || !/^[a-z0-9]{1,32}$/.test(projectId)) fail('SANITY_PROJECT_ID is required in sanity mode');
  if (typeof dataset !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(dataset)) fail('SANITY_DATASET is required in sanity mode');
  if (env.SANITY_API_VERSION && env.SANITY_API_VERSION !== SANITY_API_VERSION) fail(`SANITY_API_VERSION must be pinned to ${SANITY_API_VERSION}`);
  return { projectId, dataset, apiVersion: SANITY_API_VERSION };
}
/** Fetch one published-only snapshot directly from the API, never the stale CDN. */
export async function fetchSanitySnapshot(config, { fetch: fetcher = globalThis.fetch, token } = {}) {
  const url = new URL(`https://${config.projectId}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${config.dataset}`);
  url.searchParams.set('query', SANITY_QUERY);
  url.searchParams.set('perspective', 'published');
  const response = await fetcher(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(30000), redirect: 'error' });
  if (!response.ok) fail(`published content request failed (${response.status}); current website must be retained`);
  const raw = await response.text();
  if (Buffer.byteLength(raw) > 25 * 1024 * 1024) fail('published content response exceeds 25 MB');
  let body; try { body = JSON.parse(raw); } catch { fail('published content response is not JSON'); }
  if (body.error || !Array.isArray(body.result)) fail('published content response has no result');
  const snapshot = { schemaVersion: 1, projectId: config.projectId, dataset: config.dataset, documents: body.result };
  validateSanitySnapshot(snapshot, config);
  return snapshot;
}
export function validateSanitySnapshot(snapshot, expected) {
  object(snapshot, 'snapshot');
  if (snapshot.schemaVersion !== 1) fail('snapshot schemaVersion must be 1');
  const config = sanityConfig({ SANITY_PROJECT_ID: snapshot.projectId, SANITY_DATASET: snapshot.dataset });
  if (expected && (config.projectId !== expected.projectId || config.dataset !== expected.dataset)) fail('snapshot belongs to a different project or dataset');
  const docs = unique(array(snapshot.documents, 'documents').map(doc => {
    object(doc, 'document'); text(doc._id, 'document._id');
    if (doc._id.startsWith('drafts.') || doc._id.startsWith('versions.')) fail(`unpublished document ${doc._id} is forbidden`);
    oneOf(doc._type, SANITY_DOCUMENT_TYPES, `document ${doc._id} type`);
    if (doc._rev != null) text(doc._rev, 'document._rev');
    return doc;
  }), '_id', 'documents');
  const byId = new Map(docs.map(doc => [doc._id, doc]));
  function reference(value, type, at) {
    const ref = object(value, at)._ref;
    text(ref, `${at}._ref`);
    const target = byId.get(ref);
    if (!target || target._type !== type) fail(`${at} references a missing published ${type}`);
    return target;
  }
  function cdnAsset(asset, kind, at) {
    const url = httpsHref(asset.url, `${at}.url`);
    const parsed = new URL(url);
    const prefix = `/${kind}/${config.projectId}/${config.dataset}/`;
    if (parsed.hostname !== 'cdn.sanity.io' || parsed.port || parsed.search || parsed.hash || !parsed.pathname.startsWith(prefix) || parsed.pathname.slice(prefix.length).includes('/') || !/^[A-Za-z0-9_-]+\.[a-z0-9]+$/.test(parsed.pathname.slice(prefix.length))) fail(`${at} must use this project's Sanity CDN`);
    return url;
  }
  function image(value, at) {
    object(value, at);
    const base = { alt: text(value.alt, `${at}.alt`), ...(value.caption ? { caption: text(value.caption, `${at}.caption`) } : {}), ...(value.fit ? { fit: oneOf(value.fit, ['cover','contain'], `${at}.fit`) } : {}) };
    if (value.asset) {
      const asset = reference(value.asset, 'sanity.imageAsset', `${at}.asset`);
      const url = cdnAsset(asset, 'images', at);
      const dimensions = object(object(asset.metadata, `${at}.metadata`).dimensions, `${at}.dimensions`);
      const { width, height } = dimensions;
      if (![width,height].every(size => Number.isInteger(size) && size > 0 && size <= 50000)) fail(`${at} needs real image dimensions`);
      const match = /^image-([A-Za-z0-9]+)-(\d+)x(\d+)-(jpg|jpeg|png|webp|avif)$/.exec(asset._id);
      if (!match || Number(match[2]) !== width || Number(match[3]) !== height || new URL(url).pathname.split('/').pop() !== `${match[1]}-${width}x${height}.${match[4]}`) fail(`${at} image URL, id, and dimensions disagree`);
      return { ...base, url, width, height };
    }
    if (!LEGACY_IMAGES.has(value.legacyKey)) fail(`${at} needs an uploaded image or known migration legacyKey`);
    return { ...base, key: value.legacyKey };
  }
  function file(value, legacy, at) {
    if (value) {
      const asset = reference(object(value, at).asset, 'sanity.fileAsset', `${at}.asset`);
      if (asset.mimeType !== 'application/pdf' || !/^file-[A-Za-z0-9]+-pdf$/.test(asset._id)) fail(`${at} must be a PDF`);
      const url = cdnAsset(asset, 'files', at);
      if (new URL(url).pathname.split('/').pop() !== `${asset._id.slice(5,-4)}.pdf`) fail(`${at} file URL and id disagree`);
      return url;
    }
    const link = safeHref(legacy, at);
    if (!/^\/documents\/[a-zA-Z0-9_-]+\.pdf$/.test(link)) fail(`${at} migration fallback must be a local PDF`);
    return link;
  }
  const strings = (value, at) => array(value, at).map((item, index) => text(item, `${at}[${index}]`));
  const withImage = (value, at) => ({ image: image(value.image, `${at}.image`), ...(value.gallery ? { gallery: array(value.gallery, `${at}.gallery`).map((item,index) => image(item, `${at}.gallery[${index}]`)) } : {}) });
  const singleton = (key, type) => { const doc = byId.get(key); if (!doc || doc._type !== type) fail(`required ${type} singleton ${key} is missing`); if (docs.filter(item => item._type === type).length !== 1) fail(`only ${key} may be ${type}`); return doc; };
  const settings = singleton('library-settings', 'siteSettings');
  const giving = singleton('library-giving', 'givingSettings');
  const l = object(settings.library, 'settings.library');
  const email = text(l.email, 'library.email'); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('library.email must be an email address');
  const phone = text(l.phone, 'library.phone');
  const phoneDigits = phone.replace(/[^0-9]/g, '');
  if (!/^(?:1)?[0-9]{10}$/.test(phoneDigits)) fail('library.phone must be a US phone number');
  const hours = array(l.hours,'library.hours').map(row => ({ days: text(row.days,'hours.days'), hours: text(row.hours,'hours.hours') }));
  const hoursSummary = hours.filter(row => !/^closed$/i.test(row.hours.trim())).map(row => `${row.days} ${row.hours}`).join(' · ') || 'Closed';
  const library = {
    name: text(l.name, 'library.name'), phone, phoneHref: `tel:+${phoneDigits.length === 10 ? '1' : ''}${phoneDigits}`, email,
    address: text(l.address,'library.address'), locality: text(l.locality,'library.locality'), mailingAddress: text(l.mailingAddress,'library.mailingAddress'),
    timezone: oneOf(l.timezone,['America/Los_Angeles'],'library.timezone'), hoursSummary, hours,
    catalogUrl: httpsHref(l.catalogUrl,'library.catalogUrl'), directionsUrl: httpsHref(l.directionsUrl,'library.directionsUrl'), instagramUrl: httpsHref(l.instagramUrl,'library.instagramUrl'),
    donationUrl: l.donationUrl ? httpsHref(l.donationUrl,'library.donationUrl') : null,
    givebutter: l.givebutter ? { account: id(l.givebutter.account,'library.givebutter.account'), campaign: id(l.givebutter.campaign,'library.givebutter.campaign') } : null,
  };
  const programs = unique(docs.filter(doc => doc._type === 'program').sort((a,b) => (a.orderRank ?? 0) - (b.orderRank ?? 0) || String(a.title).localeCompare(String(b.title)) || a._id.localeCompare(b._id)).map(doc => ({
    id: slug(doc.slug?.current,'program.slug'), title: text(doc.title,'program.title'), audience: oneOf(doc.audience,['children','adults'],'program.audience'), schedule: text(doc.schedule,'program.schedule'), description: text(doc.description,'program.description'), details: text(doc.details,'program.details'), image: image(doc.image,'program.image'),
  })), 'id', 'programs');
  const newsletters = unique(docs.filter(doc => doc._type === 'newsletter').map(doc => ({ id: slug(doc.slug?.current ?? doc._id.replace(/^newsletter-/, ''),'newsletter.slug'), issue: text(doc.issue,'newsletter.issue'), title: text(doc.title,'newsletter.title'), summary: text(doc.summary,'newsletter.summary'), fileUrl: file(doc.file,doc.legacyFileUrl,'newsletter.file'), cover: image(doc.cover,'newsletter.cover') })), 'id', 'newsletters');
  const current = settings.currentNewsletter ? reference(settings.currentNewsletter,'newsletter','settings.currentNewsletter') : undefined;
  const currentNewsletter = current ? newsletters.find(item => item.id === (current.slug?.current ?? current._id.replace(/^newsletter-/, ''))) : null;
  const h = object(settings.hero,'settings.hero');
  const headings = strings(h.heading,'hero.heading'); if (headings.length !== 2) fail('hero.heading needs two lines');
  const st = object(settings.story,'settings.story'), su = object(settings.support,'settings.support');
  const home = {
    library, navigation: array(settings.navigation,'settings.navigation').map(item => ({ label: text(item.label,'navigation.label'), href: safeHref(item.href,'navigation.href') })),
    hero: { eyebrow: text(h.eyebrow,'hero.eyebrow'), heading: headings, introduction: text(h.introduction,'hero.introduction'), image: image(h.image,'hero.image') }, programs,
    ...(settings.serviceImage ? { serviceImage: image(settings.serviceImage, 'settings.serviceImage') } : {}),
    ...(settings.givingImage ? { givingImage: image(settings.givingImage, 'settings.givingImage') } : {}),
    services: unique(array(settings.services,'settings.services').map(item => ({ id: slug(item.id,'service.id'), title: text(item.title,'service.title'), description: text(item.description,'service.description'), icon: oneOf(item.icon,['book','computer','printer'],'service.icon') })), 'id', 'services'),
    borrowing: array(settings.borrowing,'settings.borrowing').map(item => ({ question: text(item.question,'borrowing.question'), answer: text(item.answer,'borrowing.answer') })), newsletter: currentNewsletter,
    story: { heading: text(st.heading,'story.heading'), paragraphs: strings(st.paragraphs,'story.paragraphs'), image: image(st.image,'story.image') },
    support: { title: text(su.title,'support.title'), introduction: text(su.introduction,'support.introduction'), image: image(su.image,'support.image'), volunteerFileUrl: safeHref(su.volunteerFileUrl,'support.volunteerFileUrl'), materials: text(su.materials,'support.materials'), bookSale: text(su.bookSale,'support.bookSale'), wowPoints: text(su.wowPoints,'support.wowPoints') },
  };
  const support = {
    updates: unique(array(giving.updates,'giving.updates').map(item => ({ id: slug(item.id,'update.id'), title: text(item.title,'update.title'), body: text(item.body,'update.body'), category: text(item.category,'update.category'), ...withImage(item,'update'), href: safeHref(item.href,'update.href'), linkLabel: text(item.linkLabel,'update.linkLabel') })), 'id', 'updates'),
    initiatives: unique(array(giving.initiatives,'giving.initiatives').map(item => ({ id: slug(item.id,'initiative.id'), title: text(item.title,'initiative.title'), category: oneOf(item.category,['giving','volunteering','community'],'initiative.category'), label: text(item.label,'initiative.label'), summary: text(item.summary,'initiative.summary'), ...withImage(item,'initiative'), paragraphs: strings(item.paragraphs,'initiative.paragraphs'), steps: strings(item.steps,'initiative.steps'), action: { label: text(item.action?.label,'initiative.action.label'), href: safeHref(item.action?.href,'initiative.action.href'), ...(item.action?.download === true ? { download: true } : {}) } })), 'id', 'initiatives'),
    campaigns: unique(array(giving.campaigns,'giving.campaigns').map(item => {
      const gb = object(item.givebutter,'campaign.givebutter');
      return { id: slug(item.id,'campaign.id'), title: text(item.title,'campaign.title'), description: text(item.description,'campaign.description'), url: httpsHref(item.url,'campaign.url'), givebutter: { formWidgetId: id(gb.formWidgetId,'campaign.formWidgetId'), ...(gb.account ? { account: id(gb.account,'campaign.account') } : {}), ...(gb.campaign ? { campaign: id(gb.campaign,'campaign.code') } : {}) }, ...(item.endsOn ? { endsOn: day(item.endsOn,'campaign.endsOn') } : {}), ...(item.image ? { image: image(item.image,'campaign.image') } : {}) };
    }), 'id', 'campaigns'),
  };
  function richText(value) {
    return array(value,'post.body').map(block => {
      object(block,'post.body block'); oneOf(block._type,['block'],'post.body block type');
      const markDefs = array(block.markDefs ?? [],'post.body markDefs').map(mark => ({ _key: text(mark._key,'link key'), _type: oneOf(mark._type,['link'],'annotation'), href: safeHref(mark.href,'post.body link') }));
      const known = new Set(['strong','em','underline','strike-through','code',...markDefs.map(mark => mark._key)]);
      const children = array(block.children,'post.body children').map(child => ({ _key: text(child._key,'span key'), _type: oneOf(child._type,['span'],'span type'), text: text(child.text,'span text',true), marks: array(child.marks ?? [],'span marks').map(mark => known.has(mark) ? mark : fail('unsupported text mark')) }));
      return { _key: text(block._key,'block key'), _type: 'block', style: oneOf(block.style ?? 'normal',['normal','h2','h3','blockquote'],'block style'), children, markDefs, ...(block.listItem ? { listItem: oneOf(block.listItem,['bullet','number'],'list type'), level: block.level === 1 || block.level == null ? 1 : fail('nested lists are not supported') } : {}) };
    });
  }
  const eventDocuments = docs.filter(doc => doc._type === 'event');
  unique(eventDocuments.map(doc => ({ slug: slug(doc.slug?.current, 'event.slug') })), 'slug', 'events');
  const events = unique(eventDocuments.flatMap(doc => {
    const eventSlug = slug(doc.slug?.current,'event.slug');
    if (doc.href) safeHref(doc.href,'event.href');
    const program = doc.program ? reference(doc.program,'program','event.program') : undefined;
    const sessions = unique(array(doc.sessions,'event.sessions').map(session => { const start = instant(session.startsAt,'event.startsAt'); const end = session.endsAt ? instant(session.endsAt,'event.endsAt') : undefined; if (end && Date.parse(end) < Date.parse(start)) fail('event ends before it starts'); return { _key: id(session._key,'session._key'), startsAt: start, ...(end ? { endsAt: end } : {}) }; }), '_key', 'sessions');
    if (!sessions.length) fail('event requires at least one session');
    return sessions.map(session => ({ id: `${eventSlug}--${session._key}`, documentId: doc._id, slug: eventSlug, title: text(doc.title,'event.title'), summary: text(doc.summary,'event.summary'), href: `/events/${eventSlug}/`, startsAt: session.startsAt, ...(session.endsAt ? { endsAt: session.endsAt } : {}), ...(doc.image ? { image: image(doc.image,'event.image') } : {}), ...(doc.location ? { location: text(doc.location,'event.location') } : {}), ...(program ? { programId: slug(program.slug?.current,'event.program.slug') } : {}) }));
  }), 'id', 'events');
  const posts = unique(docs.filter(doc => doc._type === 'post').map(doc => {
    const postSlug = slug(doc.slug?.current,'post.slug');
    const body = richText(doc.body ?? []);
    const publishedAt = doc.publishedAt ? publicationDay(doc.publishedAt) : null;
    return { id: postSlug, title: text(doc.title,'post.title'), publishedAt, ...(doc.dateLabel ? { dateLabel: text(doc.dateLabel,'post.dateLabel') } : {}), category: text(doc.category,'post.category'), summary: text(doc.summary,'post.summary'), href: `/librarynews/${postSlug}/`, paragraphs: body.filter(block => !block.listItem).map(block => block.children.map(child => child.text).join('')), body, ...(doc.image ? { image: image(doc.image,'post.image') } : {}), ...(doc.gallery ? { gallery: array(doc.gallery,'post.gallery').map((item,index) => image(item,`post.gallery[${index}]`)) } : {}), ...(doc.externalUrl ? { externalUrl: httpsHref(doc.externalUrl,'post.externalUrl') } : {}), ...(doc.sourceLabel ? { sourceLabel: text(doc.sourceLabel,'post.sourceLabel') } : {}), eventIds: array(doc.eventRefs ?? [],'post.eventRefs').map(ref => reference(ref,'event','post.eventRefs')._id) };
  }), 'id', 'posts');
  const occupied = new Set(['newsletter', ...programs.map(item => item.id)]);
  for (const post of posts) { if (occupied.has(post.id)) fail(`post slug ${post.id} conflicts with an existing route`); occupied.add(post.id); }
  const notices = unique(docs.filter(doc => doc._type === 'notice').map(doc => {
    const startsOn = day(doc.startsOn,'notice.startsOn'), endsOn = day(doc.endsOn,'notice.endsOn'); if (endsOn < startsOn) fail('notice ends before it starts');
    return { id: slug(doc.slug?.current ?? doc.id ?? doc._id,'notice.slug'), message: text(doc.message,'notice.message'), startsOn, endsOn, ...(doc.link ? { link: { label: text(doc.link.label,'notice.link.label'), href: safeHref(doc.link.href,'notice.link.href') } } : {}) };
  }), 'id', 'notices');
  return { home, support, events, posts, notices, newsletters };
}
