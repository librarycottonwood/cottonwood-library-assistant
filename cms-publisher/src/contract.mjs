export const REPOSITORY = 'librarycottonwood/cottonwood-library-assistant';
export const WORKFLOW = 'cms.yml';
export const TRUSTED_REF = 'main';
export const TRIAL_ORIGIN = 'https://cms-trial.cottonwood-library-trial-preview.pages.dev';
export const CONTENT_TYPES = ['siteSettings', 'givingSettings', 'program', 'event', 'post', 'newsletter', 'notice', 'sanity.imageAsset', 'sanity.fileAsset'];
export const operationIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export const sourcePattern = /^[a-f0-9]{40}$/;
export const digestPattern = /^[a-f0-9]{64}$/;
export const revisionPattern = /^[A-Za-z0-9_-]{1,200}$/;
export const idPattern = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,199}$/;

export function readiness(env) {
  const webhook = /^[a-z0-9]{3,32}$/.test(env.SANITY_PROJECT_ID || '') &&
    /^[a-z0-9][a-z0-9_-]{0,63}$/.test(env.SANITY_DATASET || '') &&
    typeof env.SANITY_WEBHOOK_SECRET === 'string' && env.SANITY_WEBHOOK_SECRET.length >= 32 &&
    typeof env.GITHUB_DISPATCH_TOKEN === 'string' && env.GITHUB_DISPATCH_TOKEN.length >= 20 &&
    typeof env.CMS_WORKFLOW_TOKEN === 'string' && env.CMS_WORKFLOW_TOKEN.length >= 32 &&
    typeof env.CMS_STATUS_TOKEN === 'string' && env.CMS_STATUS_TOKEN.length >= 32 &&
    env.CMS_STATUS_TOKEN !== env.CMS_WORKFLOW_TOKEN &&
    originValid(env.PUBLIC_ORIGIN) && Boolean(env.CMS_LEDGER);
  const review = webhook && Boolean(env.REVIEW_GITHUB_CLIENT_ID) &&
    typeof env.REVIEW_GITHUB_CLIENT_SECRET === 'string' && env.REVIEW_GITHUB_CLIENT_SECRET.length >= 20 &&
    typeof env.REVIEW_SESSION_SECRET === 'string' && env.REVIEW_SESSION_SECRET.length >= 32;
  return {webhook, review};
}

function originValid(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.origin === value && !url.username && !url.password;
  } catch { return false; }
}

export function parseEvent(value, env) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      value.projectId !== env.SANITY_PROJECT_ID || value.dataset !== env.SANITY_DATASET ||
      !idPattern.test(value.documentId || '') || value.documentId.startsWith('drafts.') || value.documentId.startsWith('versions.') ||
      !revisionPattern.test(value.documentRevision || '') ||
      !CONTENT_TYPES.includes(value.documentType) ||
      !['create', 'update', 'delete'].includes(value.operation)) throw new Error('invalid_event');
  // Only these identity fields affect replay detection; unsigned delivery headers do not.
  return {
    projectId: value.projectId, dataset: value.dataset,
    documentId: value.documentId, documentRevision: value.documentRevision,
    documentType: value.documentType, operation: value.operation,
  };
}

export function previewUrlValid(value, env) {
  try {
    const url = new URL(value);
    const suffix = env.PREVIEW_HOST_SUFFIX || 'cottonwood-library-trial-preview.pages.dev';
    const label = url.hostname.slice(0, -(suffix.length + 1));
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      url.hostname === `${label}.${suffix}` && /^[a-f0-9]{8}$/.test(label) &&
      url.pathname === '/' && !url.search && !url.hash;
  } catch { return false; }
}

export function revisionVector(documents) {
  if (!Array.isArray(documents) || documents.length > 10000) throw new Error('invalid_revision_vector');
  return documents.map(document => {
    if (!idPattern.test(document?._id || '') || document._id.startsWith('drafts.') || document._id.startsWith('versions.') ||
        !CONTENT_TYPES.includes(document._type) || !revisionPattern.test(document._rev || '')) throw new Error('invalid_revision_vector');
    return {_id: document._id, _type: document._type, _rev: document._rev};
  }).sort((a, b) => a._id.localeCompare(b._id));
}

export function pinsMatch(operation, value, requirePreview = true) {
  return value.sourceSha === operation.sourceSha && value.documentRevision === operation.event.documentRevision &&
    (!operation.contentDigest || value.contentDigest === operation.contentDigest) &&
    (!operation.revisionDigest || value.revisionDigest === operation.revisionDigest) &&
    (!operation.releaseDigest || value.releaseDigest === operation.releaseDigest) &&
    (!requirePreview || !operation.previewRunId || String(value.previewRunId) === operation.previewRunId);
}

export function publicOperation(operation) {
  const {id, status, createdAt, updatedAt, sourceSha, contentDigest, revisionDigest, releaseDigest, previewRunId, previewUrl, verifiedUrl, approval, summary} = operation;
  return {id, status, createdAt, updatedAt, sourceSha, contentDigest, revisionDigest, releaseDigest, previewRunId, previewUrl, verifiedUrl,
    documentId: operation.event.documentId, documentRevision: operation.event.documentRevision,
    approval: approval ? {reviewedAt: approval.reviewedAt, subject: approval.subject} : null,
    contentPublished: operation.event.operation !== 'delete', contentState: operation.event.operation === 'delete' ? 'unpublished' : 'published',
    deployedVerified: status === 'deployed_verified', summary};
}
