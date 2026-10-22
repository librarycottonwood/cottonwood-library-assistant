import {WorkerEntrypoint} from 'cloudflare:workers';
import {signSession, readSigned, limitedBody} from './security.mjs';
import {operationIdPattern, previewUrlValid} from './contract.mjs';

// RPC-only entrypoint. It has no public HTTP route. The library's OAuth connector
// authenticates the human and checks scopes before invoking this service binding.
export class ChatPublishing extends WorkerEntrypoint {
  async #call(path, body) {
    const durable = this.env.CMS_LEDGER.get(this.env.CMS_LEDGER.idFromName('library-cms-v1'));
    const response = await durable.fetch(`https://ledger.internal${path}`, body === undefined ? {} : {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'website_check_unavailable');
    return result;
  }
  #identity(subject) {
    if (subject !== '338888442') throw new Error('library_sign_in_required');
  }
  async status(subject) {
    this.#identity(subject);
    const result = await this.#call('/monitor', {});
    return {savedWebsite: result.lastVerified?.websiteUrl || null, updates: result.operations.map(item => ({
      update_id: item.id, status: item.status, summary: item.summary, preview_url: item.previewUrl,
      saved_url: item.verifiedUrl, created_at: item.createdAt,
    }))};
  }
  async prepare(subject, updateId) {
    this.#identity(subject);
    if (updateId !== undefined && !operationIdPattern.test(updateId)) throw new Error('preview_not_available');
    const result = updateId ? await this.#call(`/operation/${updateId}/refresh`, {subject}) : await this.#call('/reconcile', {});
    return {update_id: result.operation?.id || result.id, status: result.status, summary: result.summary};
  }
  async preview(subject, updateId, view = 'desktop', route = '/') {
    this.#identity(subject);
    if (!['desktop', 'phone'].includes(view)) throw new Error('invalid_view');
    if (!updateId) {
      const result = await this.#call('/monitor', {});
      updateId = result.operations[0]?.id;
    }
    if (!operationIdPattern.test(updateId || '')) throw new Error('preview_not_available');
    const operation = await this.#call(`/operation/${updateId}`);
    if (!operation.previewUrl || !previewUrlValid(operation.previewUrl, this.env) ||
        !['review_required', 'deployed_verified', 'publish_queued', 'publish_dispatching', 'publish_dispatch_uncertain'].includes(operation.status)) {
      return {update_id: updateId, status: operation.status, summary: operation.summary};
    }
    // The screenshot comes from the actual checked immutable release, never a
    // rebuilt page or an agent-supplied URL. Match its digest and evidence hash.
    const options = {redirect: 'manual', signal: AbortSignal.timeout(15000)};
    const evidenceResponse = await fetch(`${operation.previewUrl}_review/evidence.json`, options);
    if (!evidenceResponse.ok) throw new Error('preview_pictures_unavailable');
    const evidence = JSON.parse(await limitedBody(evidenceResponse, 524288));
    if (evidence.digest !== operation.releaseDigest || !Array.isArray(evidence.errors) || evidence.errors.length) throw new Error('preview_pictures_unverified');
    const item = evidence.evidence?.find(item => item.name === view && item.route === route);
    if (route !== '/' && !item?.picture) throw new Error('preview_page_unavailable');
    const filename = item?.picture?.file || `${view}.png`;
    if (!(new RegExp(`^${view}-[a-f0-9]{16}\\.png$`).test(filename) || filename === `${view}.png`)) throw new Error('preview_pictures_unverified');
    const picture = await fetch(`${operation.previewUrl}_review/${filename}`, options);
    if (!picture.ok) throw new Error('preview_pictures_unavailable');
    // Images are intentionally bounded before base64 encoding or RPC delivery.
    const bytes = new Uint8Array(await boundedBytes(picture, 4 * 1024 * 1024));
    const signature = [137,80,78,71,13,10,26,10];
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (!signature.every((byte, index) => bytes[index] === byte) || hash !== (item?.picture?.sha256 || evidence.pictures?.[view])) throw new Error('preview_pictures_unverified');
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    const result = {update_id: updateId, status: operation.status, summary: operation.summary,
      preview_url: new URL(route, operation.previewUrl).href, image_url: `${operation.previewUrl}_review/${filename}`, view, route,
      available_pages: (evidence.evidence || []).filter(item => item.name === view).map(item => ({route:item.route,title:item.heading})), image: {type: 'image', mimeType: 'image/png', data: btoa(binary)}};
    if (operation.status === 'review_required') result.version = await signSession({
      kind: 'chat-preview', subject, expiresAt: Date.now() + 3600000, updateId,
      sourceSha: operation.sourceSha, documentRevision: operation.documentRevision,
      contentDigest: operation.contentDigest, revisionDigest: operation.revisionDigest,
      releaseDigest: operation.releaseDigest, previewRunId: operation.previewRunId,
    }, this.env.REVIEW_SESSION_SECRET);
    return result;
  }
  async save(subject, version) {
    this.#identity(subject);
    const reviewed = await readSigned(version, this.env.REVIEW_SESSION_SECRET);
    if (!reviewed || reviewed.kind !== 'chat-preview' || reviewed.subject !== subject ||
        !Number.isSafeInteger(reviewed.expiresAt) || reviewed.expiresAt <= Date.now() ||
        reviewed.expiresAt > Date.now() + 3600000 || !operationIdPattern.test(reviewed.updateId || '')) throw new Error('preview_expired_or_invalid');
    const result = await this.#call(`/operation/${reviewed.updateId}/approve`, {...reviewed, subject});
    return {update_id: result.id, status: result.status, summary: result.summary, saved_url: result.verifiedUrl};
  }
}

async function boundedBytes(response, maximum) {
  if (Number(response.headers.get('Content-Length')) > maximum) throw new Error('preview_picture_too_large');
  const reader = response.body.getReader();
  const chunks = []; let length = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    length += value.length;
    if (length > maximum) {await reader.cancel(); throw new Error('preview_picture_too_large');}
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.length;}
  return bytes;
}
