// What a website save will actually put live. Pure helpers, no dependencies:
// trusted publish-live code and the PR build both import this file.
import {createHash} from 'node:crypto';

// Every save writes its own file so two open saves never touch the same path.
// The old shared file is still accepted for saves opened before the change.
export const LEGACY_UPDATE_PATH = 'assistant/website-update.json';
export const UPDATE_PATTERN = /^content-updates\/\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.json$/;
export const isContentUpdatePath = file => file === LEGACY_UPDATE_PATH || UPDATE_PATTERN.test(file);
export const COMMENT_MARKER = '<!-- cottonwood-content-changes -->';

const slug = value => String(value).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/, '');
export function contentUpdatePath(day, name) {
  const file = `content-updates/${day}-${slug(name) || 'save'}.json`;
  if (!UPDATE_PATTERN.test(file)) throw Error('Use a YYYY-MM-DD date and a short name.');
  return file;
}

/** Content-update file: {request, sanityDocuments:[{id, revision?, fields?}], requestedInChat}. */
export function parseContentUpdate(text) {
  let value;
  try { value = JSON.parse(text); } catch { throw Error('is not valid JSON'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('must be a JSON object');
  if (typeof value.request !== 'string' || !value.request.trim()) throw Error('needs a one-sentence "request"');
  if (!Array.isArray(value.sanityDocuments)) throw Error('needs a "sanityDocuments" list');
  const ids = value.sanityDocuments.map((item, index) => {
    const id = typeof item === 'string' ? item : item?.id;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,199}$/.test(id) || id.startsWith('drafts.') || id.startsWith('versions.')) throw Error(`sanityDocuments[${index}] needs the published document "id"`);
    return id;
  });
  if (value.requestedInChat != null && !/^\d{4}-\d{2}-\d{2}$/.test(value.requestedInChat)) throw Error('"requestedInChat" must be YYYY-MM-DD');
  return {request: value.request.trim(), documentIds: ids, requestedInChat: value.requestedInChat ?? null};
}

const isAsset = doc => doc._type === 'sanity.imageAsset' || doc._type === 'sanity.fileAsset';
function references(value, found = new Set()) {
  if (Array.isArray(value)) for (const item of value) references(item, found);
  else if (value && typeof value === 'object') {
    if (typeof value._ref === 'string') found.add(value._ref);
    for (const item of Object.values(value)) references(item, found);
  }
  return found;
}
/** Documents that can change the website: everything except uploads nothing uses yet. */
export function siteDocuments(snapshot) {
  const used = references(snapshot.documents.filter(doc => !isAsset(doc)));
  return snapshot.documents.filter(doc => !isAsset(doc) || used.has(doc._id));
}
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
/** Digest of website-relevant content; an unused picture upload does not change it. */
export function siteDigest(snapshot) {
  const documents = [...siteDocuments(snapshot)].sort((a, b) => a._id < b._id ? -1 : a._id > b._id ? 1 : 0);
  return createHash('sha256').update(JSON.stringify(canonical({schemaVersion: 1, projectId: snapshot.projectId, dataset: snapshot.dataset, documents}))).digest('hex');
}

const TYPE_NAMES = {siteSettings: 'Library settings', givingSettings: 'Giving page', program: 'Program', event: 'Event', post: 'News post', newsletter: 'Newsletter', notice: 'Notice', 'sanity.imageAsset': 'Picture', 'sanity.fileAsset': 'File'};
const clip = (value, size) => value.length > size ? value.slice(0, size - 1) + '…' : value;
export function label(doc) {
  if (isAsset(doc)) return null;
  const name = [doc.title, doc.issue, doc.message, doc.name].find(item => typeof item === 'string' && item.trim());
  return name ? clip(name.trim().replace(/\s+/g, ' '), 80) : null;
}
/** Published on the website as _content/revisions.json so the next save can compare. */
export function revisionList(snapshot) {
  return siteDocuments(snapshot).map(doc => ({id: doc._id, type: doc._type, rev: doc._rev ?? null, ...(label(doc) ? {label: label(doc)} : {})}))
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
export function parseRevisions(value) {
  if (value?.schemaVersion !== 1 || !Array.isArray(value.documents) || value.documents.some(item => typeof item?.id !== 'string' || typeof item.type !== 'string')) return null;
  return value.documents;
}

/**
 * Every website-relevant document that differs from the live website, and
 * whether this save's content-update file(s) list it. Pictures and files used
 * by a listed document count as listed.
 * live: revisions list from the live website, or null when unavailable.
 * liveCheckedAt: fallback time (ms) the live content was captured, compared with _updatedAt.
 */
export function compareContent({live, current, liveCheckedAt = null, listed = [], updateFiles = [], problems = []}) {
  const site = siteDocuments(current);
  const byId = new Map(site.map(doc => [doc._id, doc]));
  const covered = new Set(listed);
  for (const id of listed) for (const ref of references(byId.get(id) ?? {})) if (byId.get(ref) && isAsset(byId.get(ref))) covered.add(ref);
  const entry = (doc, change) => ({id: doc._id ?? doc.id, type: doc._type ?? doc.type, typeName: TYPE_NAMES[doc._type ?? doc.type] ?? 'Document',
    label: (doc._id ? label(doc) : doc.label) ?? (isAsset({_type: doc._type ?? doc.type}) ? doc.originalFilename ?? null : null), change, listed: covered.has(doc._id ?? doc.id)});
  let basis, changes = [];
  if (live) {
    basis = 'live-revisions';
    const before = new Map(live.map(item => [item.id, item]));
    for (const doc of site) {
      const old = before.get(doc._id);
      if (!old) changes.push(entry(doc, 'added'));
      else if (old.rev !== (doc._rev ?? null)) changes.push(entry(doc, 'changed'));
    }
    for (const old of live) if (!byId.has(old.id)) changes.push(entry(old, 'removed'));
  } else if (Number.isFinite(liveCheckedAt)) {
    basis = 'updated-after-live';
    changes = site.filter(doc => Date.parse(doc._updatedAt) > liveCheckedAt).map(doc => entry(doc, 'changed'));
  } else basis = 'unknown';
  changes.sort((a, b) => Number(a.listed) - Number(b.listed) || a.typeName.localeCompare(b.typeName) || String(a.label ?? a.id).localeCompare(String(b.label ?? b.id)));
  const notListed = changes.filter(item => !item.listed);
  const missing = listed.filter(id => !changes.some(item => item.id === id));
  return {schemaVersion: 1, basis, updateFiles, listedDocuments: listed, changes, notListed, listedButUnchanged: missing, problems};
}

const describe = item => `${item.typeName}${item.label ? ` "${item.label}"` : ''} (${item.change}) \`${item.id}\``;
/** ≤140 characters for the commit status the assistant reads first. */
export function statusDescription(result, {contentMoved = false} = {}) {
  const others = result.notListed.length;
  let text;
  if (contentMoved) text = 'Content changed while preparing. Refresh before saving. See PR comment.';
  else if (result.basis === 'unknown') text = 'Preview ready. Could not compare with live site; ask before saving. See PR comment.';
  else if (others) text = `Preview ready. ALSO puts ${others} other change${others === 1 ? '' : 's'} live. Read PR comment and ask first.`;
  else if (!result.updateFiles.length && result.changes.length === 0) text = 'Preview ready. No content differences from the live website.';
  else text = 'Preview ready. Only this save\'s listed content changes go live.';
  return clip(text, 140);
}

export function commentBody(result, {previewUrl, contentMoved = false, sha}) {
  const lines = [COMMENT_MARKER, '### What this save puts on the live website', ''];
  if (previewUrl) lines.push(`Preview: ${previewUrl}`, '');
  if (sha) lines.push(`Checked version: \`${sha.slice(0, 7)}\``, '');
  if (contentMoved) lines.push('**Website content changed while this preview was being prepared.** Saving now would stop with "Published content changed after preview". Make a fresh preview first (push a new commit to this branch), then check this list again.', '');
  for (const problem of result.problems) lines.push(`**Problem:** ${problem}`, '');
  if (result.basis === 'unknown') lines.push('**I could not compare this preview with the live website.** Check the preview carefully and ask the volunteer before saving.', '');
  else if (result.basis === 'updated-after-live') lines.push('_Compared by edit time, because the live website does not list its content yet. Deleted documents are not shown._', '');
  const listed = result.changes.filter(item => item.listed);
  lines.push(`**Part of this save** (${result.updateFiles.length ? result.updateFiles.map(file => `\`${file}\``).join(', ') : 'no content-update file in this PR'}):`);
  lines.push(...(listed.length ? listed.map(item => `- ${describe(item)}`) : ['- Nothing listed differs from the live website.']));
  if (result.listedButUnchanged.length) lines.push('', `Listed but already the same as the live website: ${result.listedButUnchanged.map(id => `\`${id}\``).join(', ')}`);
  lines.push('');
  if (result.notListed.length) {
    lines.push('**Heads up: these other changes will ALSO go live if this is saved.** They are published in the website editor but are not part of this save (often an unfinished or abandoned save):');
    lines.push(...result.notListed.map(item => `- ${describe(item)}`));
    lines.push('', 'Ask the volunteer before saving: "This save will also put these other changes live: … Is that OK?" If not, undo them in the editor first, then make a fresh preview.');
  } else if (result.basis !== 'unknown') lines.push('No other changes will go live with this save.');
  lines.push('', '<details><summary>Details for the assistant</summary>', '', '```json', JSON.stringify({basis: result.basis, notListed: result.notListed, listed: listed, listedButUnchanged: result.listedButUnchanged, contentMoved}, null, 1), '```', '</details>');
  return lines.join('\n');
}
