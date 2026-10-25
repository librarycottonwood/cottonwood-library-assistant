import {REPOSITORY, WORKFLOW, TRUSTED_REF, TRIAL_ORIGIN, CONTENT_TYPES, operationIdPattern, sourcePattern, digestPattern, previewUrlValid, pinsMatch, publicOperation, parseEvent, revisionVector} from './contract.mjs';
import {sha256, sameSecret, encode} from './security.mjs';

const githubHeaders = env => ({
  Accept: 'application/vnd.github+json', Authorization: `Bearer ${env.GITHUB_DISPATCH_TOKEN}`,
  'User-Agent': 'Cottonwood-Library-CMS', 'X-GitHub-Api-Version': '2022-11-28',
});
const timeout = () => AbortSignal.timeout(5000);
const json = (body, status = 200) => Response.json(body, {status, headers: {'Cache-Control': 'no-store'}});
export class CmsFault extends Error {
  constructor(code, status = 409) { super(code); this.code = code; this.status = status; }
}

async function currentRevision(event, env) {
  const url = `https://${env.SANITY_PROJECT_ID}.api.sanity.io/v2026-10-01/data/doc/${encodeURIComponent(env.SANITY_DATASET)}/${encodeURIComponent(event.documentId)}`;
  const response = await fetch(url, {
    headers: env.SANITY_READ_TOKEN ? {Authorization: `Bearer ${env.SANITY_READ_TOKEN}`} : {},
    signal: timeout(), redirect: 'manual',
  });
  if (!response.ok) throw new CmsFault('content_connection_unavailable', 503);
  const value = await response.json();
  if (!Array.isArray(value.documents)) throw new CmsFault('content_connection_unavailable', 503);
  if (value.omitted?.some(item => item.reason !== 'existence') ||
      value.documents.some(document => document._id !== event.documentId)) throw new CmsFault('content_connection_unavailable', 503);
  const found = value.documents.find(document => document._id === event.documentId);
  if (event.operation === 'delete') return !found;
  return found?._rev === event.documentRevision;
}

async function trustedSource(env) {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/git/ref/heads/${TRUSTED_REF}`, {
    headers: githubHeaders(env), signal: timeout(), redirect: 'manual',
  });
  if (!response.ok) throw new CmsFault('build_connection_unavailable', 503);
  const value = await response.json();
  if (!sourcePattern.test(value.object?.sha || '') || value.object.type !== 'commit') throw new CmsFault('build_connection_unavailable', 503);
  return value.object.sha;
}

async function dispatch(operation, mode, env) {
  const inputs = {
    mode, operation_id: operation.id,
    document_id: operation.event.documentId, document_revision: operation.event.documentRevision,
    source_sha: operation.sourceSha, callback_url: `${env.PUBLIC_ORIGIN}/operations/${operation.id}/result`,
  };
  if (mode === 'publish') Object.assign(inputs, {
    content_digest: operation.contentDigest, release_digest: operation.releaseDigest,
    preview_run_id: operation.previewRunId,
  });
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: 'POST', headers: {...githubHeaders(env), 'Content-Type': 'application/json'},
    body: JSON.stringify({ref: TRUSTED_REF, inputs}), signal: timeout(), redirect: 'manual',
  });
  if (response.status !== 204) throw new CmsFault('dispatch_not_confirmed', 503);
}

export class CmsLedger {
  constructor(state, env) { this.state = state; this.storage = state.storage; this.env = env; }

  async fetch(request) {
    // All publication transitions share one SQLite-backed object. KV eventual consistency
    // is unsuitable for duplicate deliveries and simultaneous approvals.
    return this.state.blockConcurrencyWhile(async () => {
      try {
        const url = new URL(request.url);
        const body = request.method === 'POST' ? await request.json() : null;
        if (url.pathname === '/accept') return await this.accept(body);
        if (url.pathname === '/oauth/start') return await this.startOAuth(body);
        if (url.pathname === '/oauth/finish') return await this.finishOAuth(body);
        if (url.pathname === '/monitor') return await this.monitor();
        if (url.pathname === '/reconcile') return await this.reconcile();
        if (url.pathname === '/source-release') return await this.sourceRelease(body);
        const match = url.pathname.match(/^\/operation\/([a-f0-9-]{36})(?:\/(result|approve|authorization|context|refresh))?$/);
        if (!match) return json({error: 'not_found'}, 404);
        const operation = await this.storage.get(`operation:${match[1]}`);
        if (!operation) return json({error: 'not_found'}, 404);
        if (match[2] === 'result') return await this.result(operation, body);
        if (match[2] === 'approve') return await this.approve(operation, body);
        if (match[2] === 'authorization') return await this.authorization(operation);
        if (match[2] === 'context') return json({...publicOperation(operation), operation: operation.event.operation});
        if (match[2] === 'refresh') return await this.refresh(operation, body);
        return json(publicOperation(operation));
      } catch (error) {
        return json({error: error instanceof CmsFault ? error.code : 'connection_unavailable'}, error instanceof CmsFault ? error.status : 503);
      }
    });
  }

  async save(operation) {
    operation.updatedAt = new Date().toISOString();
    await this.storage.put(`operation:${operation.id}`, operation);
  }

  async accept(event, {contextKey = null, sourceSha = null, retryKnownFailure = false} = {}) {
    const key = await sha256(JSON.stringify({event, contextKey}));
    const existing = await this.storage.get(`event:${key}`);
    if (existing) {
      const operation = await this.storage.get(`operation:${existing}`);
      if (operation) {
        if (retryKnownFailure && operation.status === 'connection_failed' && operation.attempts < 2) await this.launchPreview(operation, sourceSha);
        return json({...publicOperation(operation), duplicate: true}, 200);
      }
    }
    const operation = {
      id: crypto.randomUUID(), event, eventKey: key, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      status: 'received', sourceSha: null, contentDigest: null, revisionDigest: null, releaseDigest: null, previewRunId: null,
      previewUrl: null, verifiedUrl: null, approval: null,
      attempts: 0,
      summary: 'Your content is saved. The website update has not been checked yet.',
    };
    // Persist deduplication before external I/O, including ambiguous dispatch failures.
    await this.storage.put({
      [`operation:${operation.id}`]: operation, [`event:${key}`]: operation.id,
      [`history:${Date.now().toString().padStart(16, '0')}:${operation.id}`]: operation.id,
    });
    await this.prune();
    await this.launchPreview(operation, sourceSha);
    return json({...publicOperation(operation), duplicate: false}, 202);
  }

  async launchPreview(operation, sourceSha = null) {
    operation.attempts++;
    try {
      if (!(await currentRevision(operation.event, this.env))) {
        operation.status = 'superseded';
        operation.summary = 'A newer change exists. This older website update was not used.';
      } else {
        operation.sourceSha = sourceSha || await trustedSource(this.env);
        operation.status = 'preview_dispatching';
        await this.save(operation);
        // Dispatch can succeed even if the response is lost. Never retry blindly.
        await dispatch(operation, 'preview', this.env);
        operation.status = 'preview_queued';
        operation.summary = 'Your content is saved. Its website preview is being checked.';
      }
    } catch {
      operation.status = operation.status === 'preview_dispatching' ? 'preview_dispatch_uncertain' : 'connection_failed';
      operation.summary = 'Your content is saved, but the website check could not be confirmed. Your current website remains available.';
    }
    await this.save(operation);
  }

  // Trusted workflow callback records an already verified PR deployment. It
  // cannot dispatch a save or approve any CMS operation.
  async sourceRelease(value) {
    if (!value || !sourcePattern.test(value.sourceSha || '') || !sourcePattern.test(value.mergedSourceSha || '') ||
        !operationIdPattern.test(value.operationId || '') || !digestPattern.test(value.contentDigest || '') ||
        !digestPattern.test(value.revisionDigest || '') || !digestPattern.test(value.releaseDigest || '') ||
        !/^[1-9][0-9]{0,19}$/.test(value.previewRunId || '') || !previewUrlValid(value.previewUrl, this.env)) throw new CmsFault('invalid_source_release');
    if (await trustedSource(this.env) !== value.mergedSourceSha) throw new CmsFault('source_changed');
    const tree = async sha => {
      const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/git/commits/${sha}`, {headers: githubHeaders(this.env), signal: timeout(), redirect: 'manual'});
      if (!response.ok) throw new CmsFault('source_verification_unavailable', 503);
      const commit = await response.json();
      if (!sourcePattern.test(commit.tree?.sha || '')) throw new CmsFault('source_verification_unavailable', 503);
      return commit.tree.sha;
    };
    if (await tree(value.sourceSha) !== await tree(value.mergedSourceSha)) throw new CmsFault('source_tree_changed');
    const response = await fetch(`${TRIAL_ORIGIN}/_review/status.json`, {headers: {'Cache-Control': 'no-cache'}, signal: timeout(), redirect: 'manual'});
    if (!response.ok) throw new CmsFault('hosted_verification_failed', 503);
    const hosted = await response.json();
    for (const key of ['sourceSha','mergedSourceSha','operationId','contentDigest','revisionDigest','previewRunId','previewUrl']) {
      if (hosted[key] !== value[key]) throw new CmsFault('hosted_verification_failed', 503);
    }
    if (hosted.digest !== value.releaseDigest) throw new CmsFault('hosted_verification_failed', 503);
    await this.storage.put('last_verified', {...value, websiteUrl: TRIAL_ORIGIN, verifiedAt: new Date().toISOString()});
    return json({status: 'deployed_verified', websiteUrl: TRIAL_ORIGIN});
  }

  async reconcile({forceFresh = false} = {}) {
    const url = new URL(`https://${this.env.SANITY_PROJECT_ID}.api.sanity.io/v2026-10-01/data/query/${this.env.SANITY_DATASET}`);
    url.search = new URLSearchParams({
      query: `*[!(_id in path("drafts.**")) && !(_id in path("versions.**")) && _type in ${JSON.stringify(CONTENT_TYPES)}]{_id,_type,_rev}`,
      perspective: 'published',
    }).toString();
    const response = await fetch(url, {headers: this.env.SANITY_READ_TOKEN ? {Authorization: `Bearer ${this.env.SANITY_READ_TOKEN}`} : {}, signal: timeout(), redirect: 'manual'});
    if (!response.ok) throw new CmsFault('content_connection_unavailable', 503);
    const raw = await response.text();
    if (new TextEncoder().encode(raw).length > 2 * 1024 * 1024) throw new CmsFault('content_inventory_too_large', 503);
    const value = JSON.parse(raw);
    if (!Array.isArray(value.result) || value.result.length > 10000 || !value.result.length) throw new CmsFault('content_setup_pending', 503);
    const revisions = revisionVector(value.result);
    if (new Set(revisions.map(item => item._id)).size !== revisions.length) throw new CmsFault('invalid_content_inventory', 503);
    const fingerprint = await sha256(JSON.stringify(revisions));
    const sourceSha = await trustedSource(this.env);
    const previous = await this.storage.get('reconciliation');
    const verified = await this.storage.get('last_verified');
    if (!forceFresh && (verified?.mergedSourceSha || verified?.sourceSha) === sourceSha && verified.revisionDigest === fingerprint) {
      await this.storage.put('reconciliation', {fingerprint, sourceSha, revisions, operationId: verified.operationId, checkedAt: new Date().toISOString()});
      const summary = 'This exact content and website source were already verified on the saved CMS trial.';
      return json({status: 'deployed_verified', changed: false, reused: true, inventoryOnly: true,
        operation: {id: verified.operationId, status: 'deployed_verified', sourceSha, contentDigest: verified.contentDigest,
          revisionDigest: fingerprint, releaseDigest: verified.releaseDigest, previewRunId: verified.previewRunId,
          previewUrl: verified.previewUrl, verifiedUrl: verified.websiteUrl, deployedVerified: true, summary}, summary});
    }
    // A webhook may already have checked or deployed this complete snapshot before
    // the first scheduled scan. Reuse that proof instead of asking for approval of
    // an identical website again. Superseded/unchecked operations are not proof.
    const history = forceFresh ? [] : [...(await this.storage.list({prefix: 'history:', reverse: true, limit: 500})).values()];
    for (const id of history) {
      const checked = await this.storage.get(`operation:${id}`);
      if (checked?.sourceSha === sourceSha && checked.revisionDigest === fingerprint &&
          ['review_required', 'publish_dispatching', 'publish_queued', 'publish_dispatch_uncertain', 'deploy_failed', 'deployed_verified'].includes(checked.status)) {
        await this.storage.put('reconciliation', {fingerprint, sourceSha, revisions, operationId: checked.id, checkedAt: new Date().toISOString()});
        return json({status: checked.status, changed: false, reused: true, operation: publicOperation(checked), summary: checked.summary, inventoryOnly: true});
      }
    }
    if (!forceFresh && previous?.fingerprint === fingerprint && previous?.sourceSha === sourceSha) {
      const operation = await this.storage.get(`operation:${previous.operationId}`);
      if (operation) {
        if (operation.status === 'connection_failed' && operation.attempts < 2) await this.launchPreview(operation, sourceSha);
        return json({status: operation.status, changed: false, operation: publicOperation(operation), summary: operation.summary, inventoryOnly: true});
      }
    }
    const changed = revisions.find(document => !previous?.revisions.some(old => old._id === document._id && old._rev === document._rev)) ||
      previous?.revisions.find(old => !revisions.some(document => document._id === old._id)) || revisions[0];
    const event = parseEvent({projectId: this.env.SANITY_PROJECT_ID, dataset: this.env.SANITY_DATASET,
      documentId: changed._id, documentType: changed._type, documentRevision: changed._rev,
      operation: revisions.some(document => document._id === changed._id) ? 'update' : 'delete'}, this.env);
    // One coalesced build covers the entire current dataset. Its context includes the
    // complete revision vector and code SHA so missed webhooks/code repairs get a new
    // preview, while daily identical scans and uncertain launches do not fan out jobs.
    const accepted = await this.accept(event, {contextKey: `${fingerprint}:${sourceSha}${forceFresh ? ':' + crypto.randomUUID() : ''}`, sourceSha, retryKnownFailure: true});
    const operation = await accepted.json();
    await this.storage.put('reconciliation', {fingerprint, sourceSha, revisions, operationId: operation.id, checkedAt: new Date().toISOString()});
    return json({status: operation.status, changed: previous?.fingerprint !== fingerprint || previous?.sourceSha !== sourceSha,
      operation, summary: operation.summary, inventoryOnly: true,
      scope: 'Published revision reconciliation; the separate workflow validates full content and hosted results.'});
  }

  async refresh(operation, value) {
    if (value?.subject !== '338888442') throw new CmsFault('library_sign_in_required', 403);
    if (operation.refreshedOperationId) {
      const existing = await this.storage.get(`operation:${operation.refreshedOperationId}`);
      if (existing) return json(publicOperation(existing));
    }
    if (!['review_required', 'build_failed', 'deploy_failed', 'connection_failed', 'preview_dispatch_uncertain', 'superseded'].includes(operation.status)) {
      throw new CmsFault('wait_for_current_publication');
    }
    const previousRefresh = await this.storage.get('last_human_refresh');
    if (previousRefresh && Date.now() - previousRefresh < 60000) throw new CmsFault('refresh_try_later', 429);
    await this.storage.put('last_human_refresh', Date.now());
    const refreshed = await (await this.reconcile({forceFresh: true})).json();
    operation.status = 'superseded'; operation.approval = null;
    operation.refreshedOperationId = refreshed.operation.id;
    operation.summary = 'A fresh website preview was requested. This earlier preview can no longer be approved or published.';
    await this.save(operation);
    return json(refreshed.operation);
  }

  async result(operation, value) {
    if (!value || !pinsMatch(operation, value) ||
        !['preview_ready', 'build_failed', 'deploy_failed', 'deployed_verified'].includes(value.stage)) {
      throw new CmsFault('result_does_not_match_checked_version');
    }
    const fingerprint = await sha256(JSON.stringify(value));
    if (operation.lastResultFingerprint === fingerprint) return json(publicOperation(operation));
    if (value.stage === 'preview_ready') {
      if (!['preview_dispatching', 'preview_queued', 'preview_dispatch_uncertain'].includes(operation.status) ||
          !digestPattern.test(value.contentDigest || '') || !digestPattern.test(value.releaseDigest || '') ||
          !digestPattern.test(value.revisionDigest || '') ||
          !/^[1-9][0-9]{0,19}$/.test(String(value.previewRunId || '')) || !previewUrlValid(value.previewUrl, this.env)) {
        throw new CmsFault('invalid_preview_result');
      }
      if (!(await currentRevision(operation.event, this.env))) {
        operation.status = 'superseded';
        operation.summary = 'A newer change exists. Review a fresh preview before publishing.';
        await this.save(operation);
        throw new CmsFault('document_revision_changed');
      }
      Object.assign(operation, {
        status: 'review_required', contentDigest: value.contentDigest, revisionDigest: value.revisionDigest, releaseDigest: value.releaseDigest,
        previewRunId: String(value.previewRunId), previewUrl: value.previewUrl,
        summary: 'Your website preview is checked and ready for library approval. It is not live yet.',
      });
    } else if (value.stage === 'build_failed') {
      if (!['preview_dispatching', 'preview_queued', 'preview_dispatch_uncertain'].includes(operation.status)) throw new CmsFault('invalid_transition');
      operation.status = 'build_failed';
      operation.summary = 'Your content is saved, but its website check failed. Your current website remains available.';
    } else if (value.stage === 'deploy_failed') {
      if (!operation.approval || !['publish_dispatching', 'publish_queued', 'publish_dispatch_uncertain'].includes(operation.status)) throw new CmsFault('invalid_transition');
      operation.status = 'deploy_failed';
      operation.summary = 'Your approved website update could not be verified. The library assistant needs to check the saved trial website before reporting it as updated.';
      if (value.rollback === 'restored_verified') {
        const previous = await this.storage.get('last_verified');
        const response = await fetch(`${TRIAL_ORIGIN}/_review/status.json`, {headers: {'Cache-Control': 'no-cache'}, signal: timeout(), redirect: 'manual'});
        if (!response.ok) throw new CmsFault('restoration_verification_failed', 503);
        const hosted = await response.json();
        if (!previous || hosted.operationId !== previous.operationId || hosted.sourceSha !== previous.sourceSha ||
            hosted.contentDigest !== previous.contentDigest || hosted.digest !== previous.releaseDigest) throw new CmsFault('restoration_verification_failed', 503);
        operation.summary = 'The update could not be verified. The earlier checked CMS trial website was restored and verified. Your content remains saved.';
      }
    } else {
      if (!operation.approval || !['publish_dispatching', 'publish_queued', 'publish_dispatch_uncertain'].includes(operation.status) ||
          value.websiteUrl !== TRIAL_ORIGIN || !pinsMatch(operation.approval, {...value, documentRevision: operation.event.documentRevision}, false)) {
        throw new CmsFault('approval_required');
      }
      const response = await fetch(`${TRIAL_ORIGIN}/_review/status.json`, {
        headers: {'Cache-Control': 'no-cache'}, signal: timeout(), redirect: 'manual',
      });
      if (!response.ok) throw new CmsFault('hosted_verification_failed', 503);
      const hosted = await response.json();
      if (hosted.operationId !== operation.id || hosted.sourceSha !== operation.sourceSha ||
          hosted.contentDigest !== operation.contentDigest || hosted.digest !== operation.releaseDigest) {
        throw new CmsFault('hosted_verification_failed', 503);
      }
      operation.status = 'deployed_verified';
      operation.verifiedUrl = TRIAL_ORIGIN;
      operation.summary = 'This approved version is verified on the saved CMS trial website. The public library domain has not changed.';
      await this.storage.put('last_verified', {
        operationId: operation.id, sourceSha: operation.sourceSha,
        contentDigest: operation.contentDigest, revisionDigest: operation.revisionDigest, releaseDigest: operation.releaseDigest,
        websiteUrl: TRIAL_ORIGIN, previewUrl: operation.previewUrl, previewRunId: operation.previewRunId,
        verifiedAt: new Date().toISOString(),
      });
    }
    operation.lastResultFingerprint = fingerprint;
    await this.save(operation);
    return json(publicOperation(operation));
  }

  async approve(operation, value) {
    if (!value || value.subject !== '338888442' || !pinsMatch(operation, value) ||
        value.contentDigest !== operation.contentDigest || value.releaseDigest !== operation.releaseDigest ||
        String(value.previewRunId) !== operation.previewRunId || !operation.contentDigest || !operation.releaseDigest) {
      throw new CmsFault('approval_does_not_match_preview');
    }
    if (operation.approval) return json(publicOperation(operation));
    if (operation.status !== 'review_required') throw new CmsFault('preview_not_ready');
    if (!(await currentRevision(operation.event, this.env)) || await trustedSource(this.env) !== operation.sourceSha) {
      operation.status = 'superseded';
      operation.summary = 'Content or website code changed after this preview. Review a fresh preview before publishing.';
      await this.save(operation);
      throw new CmsFault('preview_superseded');
    }
    operation.approval = {
      subject: value.subject, reviewedAt: new Date().toISOString(), sourceSha: operation.sourceSha,
      event: {documentRevision: operation.event.documentRevision}, contentDigest: operation.contentDigest,
      revisionDigest: operation.revisionDigest, releaseDigest: operation.releaseDigest, previewRunId: operation.previewRunId,
    };
    operation.status = 'publish_dispatching';
    operation.summary = 'The library approved this exact preview. Its saved trial update is starting.';
    await this.save(operation);
    try {
      await dispatch(operation, 'publish', this.env);
      operation.status = 'publish_queued';
      operation.summary = 'Your approved trial website update is being published and checked.';
    } catch {
      operation.status = 'publish_dispatch_uncertain';
      operation.summary = 'Your approval is saved, but publishing could not be confirmed. The library assistant will check its status before retrying.';
    }
    await this.save(operation);
    return json(publicOperation(operation));
  }

  async authorization(operation) {
    if (!operation.approval || !['publish_dispatching', 'publish_queued', 'publish_dispatch_uncertain'].includes(operation.status)) {
      return json({approved: false, status: operation.status}, 409);
    }
    if (await trustedSource(this.env) !== operation.sourceSha || !(await currentRevision(operation.event, this.env))) {
      return json({approved: false, status: 'superseded'}, 409);
    }
    return json({
      approved: true, operationId: operation.id, sourceSha: operation.sourceSha,
      documentId: operation.event.documentId, documentRevision: operation.event.documentRevision,
      contentDigest: operation.contentDigest, releaseDigest: operation.releaseDigest,
      revisionDigest: operation.revisionDigest,
      previewRunId: operation.previewRunId, reviewedAt: operation.approval.reviewedAt,
      publicationScope: 'cms-trial-only', websiteUrl: TRIAL_ORIGIN,
      previousVerified: await this.storage.get('last_verified') || null,
    });
  }

  async startOAuth({operationId}) {
    const operation = await this.storage.get(`operation:${operationId}`);
    if (!operation) throw new CmsFault('not_found', 404);
    const now = Date.now();
    const limit = await this.storage.get(`login-limit:${operationId}`);
    if (limit && limit.startedAt + 600000 > now && limit.count >= 10) throw new CmsFault('sign_in_try_later', 429);
    await this.storage.put(`login-limit:${operationId}`, limit && limit.startedAt + 600000 > now ?
      {...limit, count: limit.count + 1} : {startedAt: now, count: 1});
    const state = crypto.randomUUID();
    const verifier = crypto.randomUUID() + crypto.randomUUID();
    await this.storage.put(`oauth:${state}`, {operationId, verifier, expiresAt: Date.now() + 600000});
    const challenge = encode(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    const url = new URL('https://github.com/login/oauth/authorize');
    url.search = new URLSearchParams({
      client_id: this.env.REVIEW_GITHUB_CLIENT_ID, redirect_uri: `${this.env.PUBLIC_ORIGIN}/review/callback`,
      state, code_challenge: challenge, code_challenge_method: 'S256', login: 'librarycottonwood',
    }).toString();
    return json({state, url: url.href});
  }

  async finishOAuth({state, cookieState, code}) {
    if (!state || !(await sameSecret(state, cookieState))) throw new CmsFault('sign_in_expired', 403);
    const pending = await this.storage.get(`oauth:${state}`);
    if (!pending || pending.expiresAt <= Date.now()) throw new CmsFault('sign_in_expired', 403);
    await this.storage.delete(`oauth:${state}`);
    if (!code || typeof code !== 'string' || code.length > 512) throw new CmsFault('sign_in_failed', 403);
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: {Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        client_id: this.env.REVIEW_GITHUB_CLIENT_ID, client_secret: this.env.REVIEW_GITHUB_CLIENT_SECRET,
        code, redirect_uri: `${this.env.PUBLIC_ORIGIN}/review/callback`, code_verifier: pending.verifier,
      }), signal: timeout(), redirect: 'manual',
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || typeof token.access_token !== 'string') throw new CmsFault('sign_in_failed', 403);
    const identityResponse = await fetch('https://api.github.com/user', {
      headers: {Accept: 'application/vnd.github+json', Authorization: `Bearer ${token.access_token}`, 'User-Agent': 'Cottonwood-Library-CMS'},
      signal: timeout(), redirect: 'manual',
    });
    const identity = await identityResponse.json();
    if (!identityResponse.ok || identity.login !== 'librarycottonwood' || String(identity.id) !== '338888442') {
      throw new CmsFault('library_sign_in_required', 403);
    }
    // The upstream GitHub token is discarded. The browser receives no repository/API token.
    return json({operationId: pending.operationId, subject: '338888442', login: 'librarycottonwood'});
  }

  async monitor() {
    const recent = [...(await this.storage.list({prefix: 'history:', reverse: true, limit: 20})).values()];
    const operations = [];
    for (const id of recent) {
      const operation = await this.storage.get(`operation:${id}`);
      if (operation) operations.push(publicOperation(operation));
    }
    return json({
      scope: 'CMS publishing ledger; this does not itself test ChatGPT or reconnect accounts.',
      lastVerified: await this.storage.get('last_verified') || null, operations,
    });
  }

  async prune() {
    const history = [...(await this.storage.list({prefix: 'history:'})).entries()];
    const cutoff = Date.now() - 90 * 86400000;
    for (let index = 0; index < history.length; index++) {
      const [key, id] = history[index];
      if (index >= history.length - 500 && Number(key.split(':')[1]) >= cutoff) continue;
      const operation = await this.storage.get(`operation:${id}`);
      // Never remove an operation still waiting for a check or review.
      if (operation && ['received', 'preview_dispatching', 'preview_queued', 'review_required', 'publish_dispatching', 'publish_queued'].includes(operation.status)) continue;
      const currentEvent = operation ? await this.storage.get(`event:${operation.eventKey}`) : null;
      await this.storage.delete([key, `operation:${id}`, `login-limit:${id}`, ...(currentEvent === id ? [`event:${operation.eventKey}`] : [])]);
    }
    // One-time login state needs bounded retention too; no long-running timer or paid queue.
    for (const [key, pending] of await this.storage.list({prefix: 'oauth:'})) {
      if (pending.expiresAt <= Date.now()) await this.storage.delete(key);
    }
  }
}
