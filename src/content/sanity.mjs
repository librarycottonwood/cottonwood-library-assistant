/** Public content boundary shared by the Astro adapter and controlled publisher.
 * Snapshot files contain the exact published documents used by one build. No credentials.
 *
 * Small, unambiguous mistakes (stray spaces, phone links typed with punctuation, free-text
 * identifiers, blank list entries, indented bullets, a hand-typed wrong UTC offset) are corrected
 * here with a warning instead of blocking every build. Unsafe or unclear content still fails, with a
 * message naming the document and the field so staff know exactly what to fix.
 */
import { SLUG_PATTERN, normalizeDay, normalizeIdentifier, normalizeInstant, normalizeLink, normalizePhone } from './rules.mjs';
export const SANITY_API_VERSION = '2026-10-01';
export const SANITY_DOCUMENT_TYPES = ['siteSettings', 'givingSettings', 'program', 'event', 'post', 'newsletter', 'notice', 'sanity.imageAsset', 'sanity.fileAsset'];
export const SANITY_QUERY = '*[!(_id in path("drafts.**")) && !(_id in path("versions.**")) && _type in ["siteSettings","givingSettings","program","event","post","newsletter","notice","sanity.imageAsset","sanity.fileAsset"]]';
const LEGACY_IMAGES = new Set(['exterior','computerLab','storytime','books','interior','newsletter','watercolor','mainStreetReaders','bookClub','bookDonation','bookSale','childrensBookSale','holidayMarket','firstFive','communityFoundation','founders']);
const PREFIX = 'Sanity content: ';
const fail = message => { throw new Error(`${PREFIX}${message}`); };

// A field location: `label` is what staff see in Studio, `path` is the stored field name.
const field = (label, path) => ({ label, path });
const sub = (at, label, key) => ({ label: `${at.label} › ${label}`, path: `${at.path}.${key}` });
const item = (at, index) => ({ label: `${at.label} › item ${index + 1}`, path: `${at.path}[${index}]` });
const where = at => typeof at === 'string' ? at : `${at.label} (${at.path})`;
const problem = (at, message) => fail(`${where(at)}: ${message}`);

const object = (value, at) => value && typeof value === 'object' && !Array.isArray(value) ? value : problem(at, 'This is missing or is not a group of fields.');
const array = (value, at) => Array.isArray(value) && value.length <= 10000 ? value : problem(at, 'This list is missing or has more than 10000 entries.');
const plain = value => typeof value === 'string' && value.length <= 200000 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
/** Trimmed plain text. Span text inside rich text keeps its spaces (`keepSpaces`) because words join across spans. */
function text(value, at, { allowEmpty = false, keepSpaces = false } = {}) {
  if (value == null || (typeof value === 'string' && !value.trim() && !allowEmpty)) problem(at, 'This field is empty. Fill it in.');
  if (!plain(value)) problem(at, 'This must be plain text (no hidden control characters, under 200,000 characters).');
  return keepSpaces ? value : value.trim();
}
const oneOf = (value, values, at) => values.includes(typeof value === 'string' ? value.trim() : value) ? value.trim() : problem(at, `This is ${value == null || value === '' ? 'empty' : JSON.stringify(value)}, which is not supported. Choose one of: ${values.join(', ')}.`);
const id = (value, at) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value.trim()) ? value.trim() : problem(at, `${JSON.stringify(value ?? '')} must be a plain identifier: letters, numbers, - or _ only, up to 64 characters.`);
const day = (value, at) => { const result = normalizeDay(value); return result.ok ? result.value : problem(at, result.reason); };
function unique(items, key, at, describe = value => `${key} "${value}"`) {
  const seen = new Set();
  for (const entry of items) { if (seen.has(entry[key])) fail(`${where(at)}: duplicate ${describe(entry[key])}. Each entry needs its own.`); seen.add(entry[key]); }
  return items;
}
export function safeHref(value, at = 'link', warn) {
  const result = normalizeLink(value);
  if (!result.ok) problem(at, result.reason);
  if (result.note && warn) warn(`${where(at)}: ${result.note}`);
  return result.value;
}
const httpsHref = (value, at, warn) => { const link = safeHref(value, at, warn); if (!link.startsWith('https://')) problem(at, `The link ${JSON.stringify(link)} must be a full https:// address.`); return link; };
const documentLabels = { siteSettings: 'Library settings', givingSettings: 'Giving and acknowledgments', event: 'event', post: 'blog post', program: 'regular program', newsletter: 'newsletter', notice: 'notice' };
function documentLabel(doc) {
  const name = typeof doc.title === 'string' && doc.title.trim() ? doc.title.trim() : typeof doc.message === 'string' && doc.message.trim() ? doc.message.trim().slice(0, 60) : '';
  const kind = documentLabels[doc._type] ?? doc._type;
  return `${doc._type === 'siteSettings' || doc._type === 'givingSettings' ? kind : `the ${kind}${name ? ` "${name}"` : ''}`} (document ${doc._id})`;
}

let printed = new Set();
const defaultWarn = message => { if (printed.size > 1000) printed = new Set(); if (!printed.has(message)) { printed.add(message); console.warn(`Sanity content warning: ${message}`); } };

/** Pacific wall-clock time is what staff mean; see normalizeInstant in rules.mjs. */
function instant(value, at, warn) {
  const result = normalizeInstant(value);
  if (!result.ok) problem(at, result.reason);
  if (result.note) warn(`${where(at)}: ${result.note}`);
  return result.value;
}
// Sanity stores datetimes in UTC; publication labels follow the library's local
// calendar day, including the differing UTC offsets on either side of DST.
function publicationDay(value, at, warn) {
  if (typeof value === 'string' && /^\s*\d{4}-\d{2}-\d{2}\s*$/.test(value)) return day(value, at);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(instant(value, at, warn)));
  const part = type => parts.find(entry => entry.type === type).value;
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
export async function fetchSanitySnapshot(config, { fetch: fetcher = globalThis.fetch, token, warn } = {}) {
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
  validateSanitySnapshot(snapshot, config, { warn });
  return snapshot;
}
/** Validates and normalizes one snapshot. Corrections are reported through `warn` (default: console.warn,
 * each message once per process) and returned as `warnings`. */
export function validateSanitySnapshot(snapshot, expected, { warn: report = defaultWarn } = {}) {
  const warnings = [];
  let current = '';
  const warn = message => { const full = `In ${current}: ${message}`; warnings.push(full); report(full); };
  /** Run `build` for one document; any failure is reported as "In <document>: <field> ...". */
  function within(doc, build) {
    const previous = current; current = documentLabel(doc);
    try { return build(); } catch (error) {
      if (error instanceof Error && error.message.startsWith(PREFIX) && !error.message.startsWith(`${PREFIX}In `)) throw new Error(`${PREFIX}In ${current}: ${error.message.slice(PREFIX.length)}`, { cause: error });
      throw error;
    } finally { current = previous; }
  }
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) fail('snapshot must be an object');
  if (snapshot.schemaVersion !== 1) fail('snapshot schemaVersion must be 1');
  const config = sanityConfig({ SANITY_PROJECT_ID: snapshot.projectId, SANITY_DATASET: snapshot.dataset });
  if (expected && (config.projectId !== expected.projectId || config.dataset !== expected.dataset)) fail('snapshot belongs to a different project or dataset');
  const docs = unique(array(snapshot.documents, 'documents').map(doc => {
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) fail('every document must be an object');
    if (typeof doc._id !== 'string' || !doc._id.trim()) fail('every document needs an _id');
    if (doc._id.startsWith('drafts.') || doc._id.startsWith('versions.')) fail(`unpublished document ${doc._id} is forbidden`);
    if (!SANITY_DOCUMENT_TYPES.includes(doc._type)) fail(`document ${doc._id} type ${JSON.stringify(doc._type)} is not supported`);
    if (doc._rev != null && !plain(doc._rev)) fail(`document ${doc._id} has an invalid _rev`);
    return doc;
  }), '_id', 'documents');
  const byId = new Map(docs.map(doc => [doc._id, doc]));
  const kinds = { program: 'regular program', event: 'event', newsletter: 'newsletter', 'sanity.imageAsset': 'uploaded picture', 'sanity.fileAsset': 'uploaded file' };
  function reference(value, type, at) {
    const ref = object(value, at)._ref;
    if (typeof ref !== 'string' || !ref) problem(at, 'This reference is empty. Choose an item or remove it.');
    const target = byId.get(ref);
    if (!target || target._type !== type) problem(at, `This references a missing published ${type} (${ref}). Publish that ${kinds[type] ?? type}, or remove or change this reference.`);
    return target;
  }
  /** A document slug or a free-text identifier. Valid values are kept exactly; anything else is slugified with a warning. */
  function slug(value, at) {
    if (typeof value === 'string' && SLUG_PATTERN.test(value) && value.length <= 96) return value;
    const result = normalizeIdentifier(value);
    if (!result.ok) problem(at, result.reason);
    if (result.note) warn(`${where(at)}: ${result.note}`);
    return result.value;
  }
  function cdnAsset(asset, kind, at) {
    const url = httpsHref(asset.url, sub(at, 'file address', 'url'));
    const parsed = new URL(url);
    const prefix = `/${kind}/${config.projectId}/${config.dataset}/`;
    if (parsed.hostname !== 'cdn.sanity.io' || parsed.port || parsed.search || parsed.hash || !parsed.pathname.startsWith(prefix) || parsed.pathname.slice(prefix.length).includes('/') || !/^[A-Za-z0-9_-]+\.[a-z0-9]+$/.test(parsed.pathname.slice(prefix.length))) problem(at, "This must use this project's Sanity CDN. Upload the file in Studio instead of linking to it.");
    return url;
  }
  function image(value, at) {
    object(value, at);
    const base = { alt: text(value.alt, sub(at, 'Picture description', 'alt')), ...(value.caption && String(value.caption).trim() ? { caption: text(value.caption, sub(at, 'Caption', 'caption')) } : {}), ...(value.fit ? { fit: oneOf(value.fit, ['cover','contain'], sub(at, 'Picture display', 'fit')) } : {}) };
    if (value.asset) {
      const asset = reference(value.asset, 'sanity.imageAsset', sub(at, 'uploaded picture', 'asset'));
      const url = cdnAsset(asset, 'images', at);
      const dimensions = object(object(asset.metadata, sub(at, 'picture metadata', 'asset.metadata')).dimensions, sub(at, 'picture size', 'asset.metadata.dimensions'));
      const { width, height } = dimensions;
      if (![width,height].every(size => Number.isInteger(size) && size > 0 && size <= 50000)) problem(at, 'This picture needs real image dimensions. Re-upload the picture.');
      const match = /^image-([A-Za-z0-9]+)-(\d+)x(\d+)-(jpg|jpeg|png|webp|avif)$/.exec(asset._id);
      if (!match || Number(match[2]) !== width || Number(match[3]) !== height || new URL(url).pathname.split('/').pop() !== `${match[1]}-${width}x${height}.${match[4]}`) problem(at, 'The image URL, id, and dimensions disagree. Re-upload the picture.');
      // Uploaded pictures are shown by shape, so nobody has to choose: landscape fills the frame,
      // portrait or square (posters, logos, covers) shows whole. A saved fit from an older picture is ignored.
      return { ...base, fit: width >= 1.2 * height ? 'cover' : 'contain', url, width, height };
    }
    if (!LEGACY_IMAGES.has(value.legacyKey)) problem(at, 'This needs an uploaded picture (or a known migration legacyKey).');
    return { ...base, key: value.legacyKey };
  }
  function file(value, legacy, at) {
    if (value) {
      const asset = reference(object(value, at).asset, 'sanity.fileAsset', sub(at, 'uploaded file', 'asset'));
      if (asset.mimeType !== 'application/pdf' || !/^file-[A-Za-z0-9]+-pdf$/.test(asset._id)) problem(at, 'This must be a PDF. Upload the newsletter as a PDF file.');
      const url = cdnAsset(asset, 'files', at);
      if (new URL(url).pathname.split('/').pop() !== `${asset._id.slice(5,-4)}.pdf`) problem(at, 'The file URL and id disagree. Re-upload the PDF.');
      return url;
    }
    const link = safeHref(legacy, field('Imported PDF address', 'legacyFileUrl'), warn);
    if (!/^\/documents\/[a-zA-Z0-9_-]+\.pdf$/.test(link)) problem(at, 'This needs an uploaded PDF (the migration fallback must be a local /documents/ PDF).');
    return link;
  }
  /** Lists of paragraphs or steps: blank entries are left off rather than failing the build. */
  const strings = (value, at) => array(value, at).flatMap((entry, index) => {
    if (entry == null || (typeof entry === 'string' && !entry.trim())) { warn(`${where(item(at, index))}: This entry is empty and was left off the website. Delete the empty entry to remove this message.`); return []; }
    return [text(entry, item(at, index))];
  });
  const withImage = (value, at) => ({ image: image(value.image, sub(at, 'Picture', 'image')), ...(value.gallery ? { gallery: array(value.gallery, sub(at, 'More pictures', 'gallery')).map((entry,index) => image(entry, item(sub(at, 'More pictures', 'gallery'), index))) } : {}) });
  const singleton = (key, type) => { const doc = byId.get(key); if (!doc || doc._type !== type) fail(`required ${type} singleton ${key} is missing`); if (docs.filter(entry => entry._type === type).length !== 1) fail(`only ${key} may be ${type}`); return doc; };
  const settings = singleton('library-settings', 'siteSettings');
  const giving = singleton('library-giving', 'givingSettings');

  const programs = unique(docs.filter(doc => doc._type === 'program').sort((a,b) => (a.orderRank ?? 0) - (b.orderRank ?? 0) || String(a.title).localeCompare(String(b.title)) || a._id.localeCompare(b._id)).map(doc => within(doc, () => ({
    id: slug(doc.slug?.current, field('Page address', 'slug')), title: text(doc.title, field('Program name', 'title')), audience: oneOf(doc.audience, ['children','adults'], field('Audience', 'audience')), schedule: text(doc.schedule, field('Regular schedule', 'schedule')), description: text(doc.description, field('Short description', 'description')), details: text(doc.details, field('More information', 'details')), image: image(doc.image, field('Picture', 'image')),
  }))), 'id', 'regular programs', value => `page address "${value}"`);
  const newsletterId = doc => slug(doc.slug?.current ?? doc._id.replace(/^newsletter-/, ''), field('Page address', 'slug'));
  const newsletters = unique(docs.filter(doc => doc._type === 'newsletter').map(doc => within(doc, () => ({ id: newsletterId(doc), issue: text(doc.issue, field('Issue', 'issue')), title: text(doc.title, field('Title', 'title')), summary: text(doc.summary, field('Short description', 'summary')), fileUrl: file(doc.file, doc.legacyFileUrl, field('Newsletter PDF', 'file')), cover: image(doc.cover, field('Cover picture', 'cover')) }))), 'id', 'newsletters', value => `page address "${value}"`);

  const home = within(settings, () => {
    const currentRef = settings.currentNewsletter ? reference(settings.currentNewsletter, 'newsletter', field('Current newsletter', 'currentNewsletter')) : undefined;
    const currentId = currentRef ? within(currentRef, () => newsletterId(currentRef)) : undefined;
    const lAt = field('Library contact and hours', 'library');
    const l = object(settings.library, lAt);
    const email = text(l.email, sub(lAt, 'Email', 'email')); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problem(sub(lAt, 'Email', 'email'), `${JSON.stringify(email)} must be an email address such as cottonlib@shasta.com.`);
    const phoneAt = sub(lAt, 'Phone number', 'phone');
    const phone = text(l.phone, phoneAt);
    const phoneLink = normalizePhone(phone, { requireUS: true });
    if (!phoneLink.ok) problem(phoneAt, phoneLink.reason);
    const hoursAt = sub(lAt, 'Opening hours', 'hours');
    const hours = array(l.hours, hoursAt).map((row, index) => ({ days: text(row?.days, sub(item(hoursAt, index), 'Day or days', 'days')), hours: text(row?.hours, sub(item(hoursAt, index), 'Hours', 'hours')) }));
    const hoursSummary = hours.filter(row => !/^closed$/i.test(row.hours)).map(row => `${row.days} ${row.hours}`).join(' · ') || 'Closed';
    const gb = l.givebutter ? object(l.givebutter, sub(lAt, 'General Givebutter donations', 'givebutter')) : null;
    const library = {
      name: text(l.name, sub(lAt, 'Library name', 'name')), phone, phoneHref: phoneLink.value, email,
      address: text(l.address, sub(lAt, 'Street address', 'address')), locality: text(l.locality, sub(lAt, 'City, state and ZIP', 'locality')), mailingAddress: text(l.mailingAddress, sub(lAt, 'Mailing address', 'mailingAddress')),
      timezone: oneOf(l.timezone, ['America/Los_Angeles'], sub(lAt, 'Library timezone', 'timezone')), hoursSummary, hours,
      catalogUrl: httpsHref(l.catalogUrl, sub(lAt, 'Catalog address', 'catalogUrl'), warn), directionsUrl: httpsHref(l.directionsUrl, sub(lAt, 'Directions address', 'directionsUrl'), warn), instagramUrl: httpsHref(l.instagramUrl, sub(lAt, 'Instagram address', 'instagramUrl'), warn), facebookUrl: httpsHref(l.facebookUrl, sub(lAt, 'Facebook address', 'facebookUrl'), warn),
      donationUrl: l.donationUrl && String(l.donationUrl).trim() ? httpsHref(l.donationUrl, sub(lAt, 'Approved donation page', 'donationUrl'), warn) : null,
      givebutter: gb ? { account: id(gb.account, sub(lAt, 'Givebutter account ID', 'givebutter.account')), campaign: id(gb.campaign, sub(lAt, 'General donation campaign code', 'givebutter.campaign')) } : null,
    };
    const hAt = field('Homepage introduction', 'hero');
    const h = object(settings.hero, hAt);
    const headings = strings(h.heading, sub(hAt, 'Heading lines', 'heading')); if (headings.length !== 2) problem(sub(hAt, 'Heading lines', 'heading'), `The homepage heading needs exactly two lines (found ${headings.length}).`);
    const stAt = field('Library story', 'story'), suAt = field('Supporting the library', 'support');
    const st = object(settings.story, stAt), su = object(settings.support, suAt);
    const navAt = field('Main navigation', 'navigation'), servicesAt = field('Library services', 'services'), borrowingAt = field('Borrowing and computer information', 'borrowing');
    return {
      library, navigation: array(settings.navigation, navAt).map((entry, index) => ({ label: text(entry?.label, sub(item(navAt, index), 'Label', 'label')), href: safeHref(entry?.href, sub(item(navAt, index), 'Destination', 'href'), warn) })),
      hero: { eyebrow: text(h.eyebrow, sub(hAt, 'Small introductory line', 'eyebrow')), heading: headings, introduction: text(h.introduction, sub(hAt, 'Introduction', 'introduction')), image: image(h.image, sub(hAt, 'Picture', 'image')) }, programs,
      ...(settings.serviceImage ? { serviceImage: image(settings.serviceImage, field('Services picture', 'serviceImage')) } : {}),
      ...(settings.givingImage ? { givingImage: image(settings.givingImage, field('Giving picture', 'givingImage')) } : {}),
      services: unique(array(settings.services, servicesAt).map((entry, index) => { const at = item(servicesAt, index); return { id: slug(entry?.id, sub(at, 'Service identifier', 'id')), title: text(entry?.title, sub(at, 'Title', 'title')), description: text(entry?.description, sub(at, 'Short description', 'description')), icon: oneOf(entry?.icon, ['book','computer','printer'], sub(at, 'Service symbol', 'icon')) }; }), 'id', servicesAt, value => `identifier "${value}"`),
      borrowing: array(settings.borrowing, borrowingAt).map((entry, index) => ({ question: text(entry?.question, sub(item(borrowingAt, index), 'Question', 'question')), answer: text(entry?.answer, sub(item(borrowingAt, index), 'Answer', 'answer')) })),
      newsletter: currentId ? newsletters.find(entry => entry.id === currentId) : null,
      story: { heading: text(st.heading, sub(stAt, 'Heading', 'heading')), paragraphs: strings(st.paragraphs, sub(stAt, 'Story paragraphs', 'paragraphs')), image: image(st.image, sub(stAt, 'Picture', 'image')) },
      support: { title: text(su.title, sub(suAt, 'Heading', 'title')), introduction: text(su.introduction, sub(suAt, 'Introduction', 'introduction')), image: image(su.image, sub(suAt, 'Picture', 'image')), volunteerFileUrl: safeHref(su.volunteerFileUrl, sub(suAt, 'Volunteer application PDF', 'volunteerFileUrl'), warn), materials: text(su.materials, sub(suAt, 'Donating books and DVDs', 'materials')), bookSale: text(su.bookSale, sub(suAt, 'Ongoing book sales', 'bookSale')), wowPoints: text(su.wowPoints, sub(suAt, 'WOW points', 'wowPoints')) },
    };
  });
  const support = within(giving, () => {
    const updatesAt = field('Community acknowledgments', 'updates'), initiativesAt = field('Ways to help', 'initiatives'), campaignsAt = field('Approved fundraising campaigns', 'campaigns');
    return {
      updates: unique(array(giving.updates, updatesAt).map((entry, index) => { const at = item(updatesAt, index); return { id: slug(entry?.id, sub(at, 'Identifier', 'id')), title: text(entry?.title, sub(at, 'Title', 'title')), body: text(entry?.body, sub(at, 'Thank-you text', 'body')), category: text(entry?.category, sub(at, 'Category', 'category')), ...withImage(entry ?? {}, at), href: safeHref(entry?.href, sub(at, 'Destination', 'href'), warn), linkLabel: text(entry?.linkLabel, sub(at, 'Link label', 'linkLabel')) }; }), 'id', updatesAt, value => `identifier "${value}"`),
      initiatives: unique(array(giving.initiatives, initiativesAt).map((entry, index) => { const at = item(initiativesAt, index); const actionAt = sub(at, 'Action link', 'action'); return { id: slug(entry?.id, sub(at, 'Identifier', 'id')), title: text(entry?.title, sub(at, 'Title', 'title')), category: oneOf(entry?.category, ['giving','volunteering','community'], sub(at, 'Kind', 'category')), label: text(entry?.label, sub(at, 'Short label', 'label')), summary: text(entry?.summary, sub(at, 'Short description', 'summary')), ...withImage(entry ?? {}, at), paragraphs: strings(entry?.paragraphs, sub(at, 'Details', 'paragraphs')), steps: strings(entry?.steps, sub(at, 'How to help', 'steps')), action: { label: text(entry?.action?.label, sub(actionAt, 'Link label', 'label')), href: safeHref(entry?.action?.href, sub(actionAt, 'Destination', 'href'), warn), ...(entry?.action?.download === true ? { download: true } : {}) } }; }), 'id', initiativesAt, value => `identifier "${value}"`),
      campaigns: unique(array(giving.campaigns, campaignsAt).map((entry, index) => {
        const at = item(campaignsAt, index), gbAt = sub(at, 'Givebutter form', 'givebutter');
        const gb = object(entry?.givebutter, gbAt);
        return { id: slug(entry?.id, sub(at, 'Identifier', 'id')), title: text(entry?.title, sub(at, 'Title', 'title')), ...(entry?.badgeLabel && String(entry.badgeLabel).trim() ? { badgeLabel: text(entry.badgeLabel, sub(at, 'Homepage badge text', 'badgeLabel')) } : {}), description: text(entry?.description, sub(at, 'Short description', 'description')), url: httpsHref(entry?.url, sub(at, 'Approved donation page', 'url'), warn), givebutter: { formWidgetId: id(gb.formWidgetId, sub(gbAt, 'Form widget ID', 'formWidgetId')), ...(gb.account && String(gb.account).trim() ? { account: id(gb.account, sub(gbAt, 'Account ID override', 'account')) } : {}), ...(gb.campaign && String(gb.campaign).trim() ? { campaign: id(gb.campaign, sub(gbAt, 'Campaign code', 'campaign')) } : {}) }, ...(entry?.endsOn ? { endsOn: day(entry.endsOn, sub(at, 'Last day to show', 'endsOn')) } : {}), ...(entry?.image ? { image: image(entry.image, sub(at, 'Campaign picture', 'image')) } : {}) };
      }), 'id', campaignsAt, value => `identifier "${value}"`),
    };
  });
  function richText(value) {
    const bodyAt = field('Post text', 'body');
    let parentList;
    return array(value, bodyAt).map((block, index) => {
      const at = item(bodyAt, index);
      object(block, at); oneOf(block._type, ['block'], sub(at, 'block type', '_type'));
      const markDefs = array(block.markDefs ?? [], sub(at, 'links', 'markDefs')).map((mark, markIndex) => ({ _key: text(mark?._key, sub(item(sub(at, 'links', 'markDefs'), markIndex), 'key', '_key')), _type: oneOf(mark?._type, ['link'], sub(item(sub(at, 'links', 'markDefs'), markIndex), 'kind', '_type')), href: safeHref(mark?.href, sub(item(sub(at, 'links', 'markDefs'), markIndex), 'Link address', 'href'), warn) }));
      const known = new Set(['strong','em','underline','strike-through','code',...markDefs.map(mark => mark._key)]);
      const children = array(block.children, sub(at, 'text', 'children')).map((child, childIndex) => { const childAt = item(sub(at, 'text', 'children'), childIndex); return { _key: text(child?._key, sub(childAt, 'key', '_key')), _type: oneOf(child?._type, ['span'], sub(childAt, 'kind', '_type')), text: text(child?.text, childAt, { allowEmpty: true, keepSpaces: true }), marks: array(child?.marks ?? [], sub(childAt, 'formatting', 'marks')).map(mark => known.has(mark) ? mark : problem(sub(childAt, 'formatting', 'marks'), `This text uses formatting ${JSON.stringify(mark)} that the website doesn't support (or a link that was deleted). Remove that formatting.`)) }; });
      let list = {};
      if (block.listItem) {
        let listItem = oneOf(block.listItem, ['bullet','number'], sub(at, 'list type', 'listItem'));
        const level = block.level == null ? 1 : block.level;
        if (!Number.isInteger(level) || level < 1) problem(sub(at, 'list level', 'level'), 'The list level must be a whole number of 1 or more.');
        // The website shows one list level. Indented items join their parent list instead of failing the build.
        if (level > 1) { if (parentList) listItem = parentList; warn(`${where(at)}: This is an indented list item; the website shows it as part of the main list. Remove the indent (Shift+Tab) to remove this message.`); }
        else parentList = listItem;
        list = { listItem, level: 1 };
      } else parentList = undefined;
      return { _key: text(block._key, sub(at, 'key', '_key')), _type: 'block', style: oneOf(block.style ?? 'normal', ['normal','h2','h3','blockquote'], sub(at, 'text style', 'style')), children, markDefs, ...list };
    });
  }
  const eventDocuments = docs.filter(doc => doc._type === 'event');
  const eventSlugs = eventDocuments.map(doc => within(doc, () => ({ slug: slug(doc.slug?.current, field('Page address', 'slug')), title: doc.title })));
  unique(eventSlugs, 'slug', 'events', value => `page address "${value}" (${eventSlugs.filter(entry => entry.slug === value).map(entry => JSON.stringify(entry.title)).join(' and ')})`);
  const events = unique(eventDocuments.flatMap((doc, docIndex) => within(doc, () => {
    const eventSlug = eventSlugs[docIndex].slug;
    if (doc.href) safeHref(doc.href, field('Optional destination link', 'href'), warn);
    const program = doc.program ? reference(doc.program, 'program', field('Related regular program', 'program')) : undefined;
    const sessionsAt = field('Confirmed dates', 'sessions');
    const sessions = unique(array(doc.sessions, sessionsAt).map((session, index) => {
      const at = item(sessionsAt, index);
      const start = instant(session?.startsAt, sub(at, 'Starts (Pacific time)', 'startsAt'), warn);
      const end = instant(session?.endsAt, sub(at, 'Ends (Pacific time)', 'endsAt'), warn);
      if (Date.parse(end) <= Date.parse(start)) problem(at, 'The event end time must be later than its start time. Fix the start or end of this date.');
      return { _key: id(session._key, sub(at, 'key', '_key')), startsAt: start, endsAt: end };
    }), '_key', sessionsAt);
    if (!sessions.length) problem(sessionsAt, 'The event requires at least one session. Add a confirmed date.');
    const title = text(doc.title, field('Event name', 'title')), summary = text(doc.summary, field('Short description', 'summary'));
    const eventImage = doc.image ? image(doc.image, field('Event picture', 'image')) : undefined;
    const location = doc.location && String(doc.location).trim() ? text(doc.location, field('Location', 'location')) : undefined;
    const programId = program ? within(program, () => slug(program.slug?.current, field('Page address', 'slug'))) : undefined;
    return sessions.map(session => ({ id: `${eventSlug}--${session._key}`, documentId: doc._id, slug: eventSlug, title, summary, href: `/events/${eventSlug}/`, startsAt: session.startsAt, endsAt: session.endsAt, ...(eventImage ? { image: eventImage } : {}), ...(location ? { location } : {}), ...(programId ? { programId } : {}) }));
  })), 'id', 'events');
  const posts = unique(docs.filter(doc => doc._type === 'post').map(doc => within(doc, () => {
    const postSlug = slug(doc.slug?.current, field('Page address', 'slug'));
    const body = richText(doc.body ?? []);
    const publishedAt = doc.publishedAt ? publicationDay(doc.publishedAt, field('Article date', 'publishedAt'), warn) : null;
    return { id: postSlug, title: text(doc.title, field('Title', 'title')), publishedAt, ...(doc.dateLabel && String(doc.dateLabel).trim() ? { dateLabel: text(doc.dateLabel, field('Alternative date label', 'dateLabel')) } : {}), category: text(doc.category, field('Category', 'category')), summary: text(doc.summary, field('Short description', 'summary')), href: `/librarynews/${postSlug}/`, paragraphs: body.filter(block => !block.listItem).map(block => block.children.map(child => child.text).join('')), body, ...(doc.image ? { image: image(doc.image, field('Cover picture', 'image')) } : {}), ...(doc.gallery ? { gallery: array(doc.gallery, field('More pictures', 'gallery')).map((entry,index) => image(entry, item(field('More pictures', 'gallery'), index))) } : {}), ...(doc.externalUrl ? { externalUrl: httpsHref(doc.externalUrl, field('Original article link', 'externalUrl'), warn) } : {}), ...(doc.sourceLabel && String(doc.sourceLabel).trim() ? { sourceLabel: text(doc.sourceLabel, field('Original publisher', 'sourceLabel')) } : {}), eventIds: array(doc.eventRefs ?? [], field('Related events', 'eventRefs')).map((ref, index) => reference(ref, 'event', item(field('Related events', 'eventRefs'), index))._id) };
  })), 'id', 'blog posts', value => `page address "${value}"`);
  const occupied = new Set(['newsletter', ...programs.map(entry => entry.id)]);
  for (const post of posts) { if (occupied.has(post.id)) fail(`blog post "${post.title}" uses the page address "${post.id}", which conflicts with an existing route (a regular program or the newsletter page). Choose a different page address.`); occupied.add(post.id); }
  const notices = unique(docs.filter(doc => doc._type === 'notice').map(doc => within(doc, () => {
    const startsOn = day(doc.startsOn, field('First day to show', 'startsOn')), endsOn = day(doc.endsOn, field('Last day to show', 'endsOn'));
    if (endsOn < startsOn) problem(field('Last day to show', 'endsOn'), `The notice ends (${endsOn}) before it starts (${startsOn}). Fix one of the dates.`);
    const linkAt = field('Optional link', 'link');
    return { id: slug(doc.slug?.current ?? doc.id ?? doc._id, field('Page address', 'slug')), message: text(doc.message, field('Banner message', 'message')), startsOn, endsOn, ...(doc.link ? { link: { label: text(doc.link.label, sub(linkAt, 'Label', 'label')), href: safeHref(doc.link.href, sub(linkAt, 'Destination', 'href'), warn) } } : {}) };
  })), 'id', 'notices');
  return { home, support, events, posts, notices, newsletters, warnings };
}
