import {isValidSignature, decodeSignatureHeader, SIGNATURE_HEADER_NAME} from '@sanity/webhook';
import {readiness, parseEvent, operationIdPattern} from './contract.mjs';
import {authorized, limitedBody, readSession, signSession, sameSecret, cookie, setCookie, escape} from './security.mjs';
export {CmsLedger} from './ledger.mjs';

const json = (value, status = 200) => Response.json(value, {status, headers: {'Cache-Control': 'no-store'}});
const setupPending = () => json({status: 'setup_pending', summary: 'The library CMS connection is waiting for account setup. Your current website has not changed.'}, 503);
const html = (body, status = 200, extra = {}) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Library website approval</title><style>body{font:18px/1.55 system-ui,sans-serif;color:#202932;background:#f7f8ff;margin:3rem auto;padding:0 1.25rem;max-width:48rem}h1{line-height:1.2}a{color:#354495}button{font:inherit;background:#4956a7;color:white;border:0;border-radius:.4rem;padding:.65rem 1rem;cursor:pointer}code{overflow-wrap:anywhere;font-size:.82em}dt{font-weight:600}dd{margin:0 0 1rem}small{color:#59616a}</style></head><body>${body}</body></html>`, {
  status, headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
    ...extra,
  },
});

function ledger(env, pathname, body) {
  const durable = env.CMS_LEDGER.get(env.CMS_LEDGER.idFromName('library-cms-v1'));
  return durable.fetch(`https://ledger.internal${pathname}`, body === undefined ? {} : {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body),
  });
}

function reviewPage(operation, session, ready) {
  const pins = ['sourceSha', 'documentRevision', 'contentDigest', 'revisionDigest', 'releaseDigest', 'previewRunId'];
  const metadata = `<dl><dt>Status</dt><dd>${escape(operation.summary)}</dd><dt>Content record</dt><dd>${escape(operation.documentId)}</dd><dt>Checked website version</dt><dd><code>${escape(operation.releaseDigest || 'Not ready yet')}</code></dd></dl>`;
  const preview = operation.previewUrl ? `<p><a href="${escape(operation.previewUrl)}" target="_blank" rel="noopener noreferrer">Open the checked website preview</a></p>` : '';
  const form = ready && operation.status === 'review_required' && session ? `<form method="post" action="/review/${escape(operation.id)}/approve">
    <input type="hidden" name="csrf" value="${escape(session.csrf)}">
    ${pins.map(key => `<input type="hidden" name="${key}" value="${escape(operation[key] || '')}">`).join('')}
    <p>This approves exactly the preview above for the saved CMS trial website. The public library domain will not change.</p>
    <button type="submit">Approve this trial update</button></form>` : '';
  const refresh = ready && session && ['review_required', 'build_failed', 'deploy_failed', 'connection_failed', 'preview_dispatch_uncertain', 'superseded'].includes(operation.status) ?
    `<form method="post" action="/review/${escape(operation.id)}/refresh"><input type="hidden" name="csrf" value="${escape(session.csrf)}"><p>If the preview expired or content changed, check a fresh version before approving.</p><button type="submit">Prepare a fresh preview</button></form>` : '';
  return `<h1>Review your library website update</h1>${metadata}${preview}${form}${refresh}<p><small>Saving content and approving a website update are separate steps. Return to the library assistant if a connection needs attention.</small></p>`;
}

async function callback(request, env) {
  const url = new URL(request.url);
  const result = await ledger(env, '/oauth/finish', {
    state: url.searchParams.get('state'), code: url.searchParams.get('code'),
    cookieState: cookie(request, '__Host-cms_oauth'),
  });
  if (!result.ok) return html('<h1>Sign-in could not finish</h1><p>Return to the library assistant and open the review link again. Use the library GitHub account.</p>', result.status, {
    'Set-Cookie': setCookie('__Host-cms_oauth', '', 0),
  });
  const identity = await result.json();
  const signed = await signSession({
    subject: identity.subject, login: identity.login, expiresAt: Date.now() + 3600000, csrf: crypto.randomUUID(),
  }, env.REVIEW_SESSION_SECRET);
  const headers = new Headers({Location: `${env.PUBLIC_ORIGIN}/review/${identity.operationId}`, 'Cache-Control': 'no-store'});
  headers.append('Set-Cookie', setCookie('__Host-cms_review', signed, 3600));
  headers.append('Set-Cookie', setCookie('__Host-cms_oauth', '', 0));
  return new Response(null, {status: 303, headers});
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const ready = readiness(env);
      if (url.pathname === '/health' && request.method === 'GET') {
        return json({service: 'Cottonwood Library CMS publishing', version: '0.1.0',
          status: ready.webhook && ready.review ? 'configured' : 'setup_pending',
          configurationOnly: true, scope: 'Configuration only; health is not proof of live publishing.'});
      }
      if (!ready.webhook) return setupPending();
      if (url.origin !== env.PUBLIC_ORIGIN) return json({error: 'wrong_origin'}, 400);
      if (url.pathname === '/webhooks/sanity' && request.method === 'POST') {
        const signature = request.headers.get(SIGNATURE_HEADER_NAME);
        const raw = await limitedBody(request);
        if (!signature || !(await isValidSignature(raw, signature, env.SANITY_WEBHOOK_SECRET))) {
          return json({error: 'invalid_signature'}, 401);
        }
        const {timestamp} = decodeSignatureHeader(signature);
        // The toolkit verifies HMAC only. Millisecond timestamp freshness and the durable
        // revision ledger also prevent replay. Missed deliveries require reconciliation.
        if (timestamp < Date.now() - 600000 || timestamp > Date.now() + 60000) return json({error: 'expired_delivery'}, 401);
        let event;
        try { event = parseEvent(JSON.parse(raw), env); } catch { return json({error: 'invalid_event'}, 400); }
        const result = await ledger(env, '/accept', event);
        // Do not expose document identifiers, preview URLs, digests, or operation IDs
        // to a webhook response. Status is available only through authenticated routes.
        const operation = await result.json();
        if (!result.ok) return json({error: 'check_unavailable'}, result.status);
        return json({accepted: true, duplicate: operation.duplicate, status: operation.status}, result.status);
      }
      const operationMatch = url.pathname.match(/^\/operations\/([^/]+)(?:\/(result|authorization|context))?$/);
      if (operationMatch && operationIdPattern.test(operationMatch[1])) {
        const [, id, action] = operationMatch;
        const secret = action ? env.CMS_WORKFLOW_TOKEN : env.CMS_STATUS_TOKEN;
        if (!(await authorized(request, secret))) return json({error: 'authorization_required'}, 401);
        if (action === 'result' && request.method === 'POST') {
          let body;
          try { body = JSON.parse(await limitedBody(request, 8192)); } catch { return json({error: 'invalid_result'}, 400); }
          return await ledger(env, `/operation/${id}/result`, body);
        }
        if ((!action || action === 'authorization' || action === 'context') && request.method === 'GET') return await ledger(env, `/operation/${id}${action ? '/' + action : ''}`);
        return json({error: 'method_not_allowed'}, 405);
      }
      if (url.pathname === '/monitor' && request.method === 'POST') {
        if (!(await authorized(request, env.CMS_STATUS_TOKEN))) return json({error: 'authorization_required'}, 401);
        return await ledger(env, '/monitor');
      }
      if (url.pathname === '/reconcile' && request.method === 'POST') {
        if (!(await authorized(request, env.CMS_STATUS_TOKEN))) return json({error: 'authorization_required'}, 401);
        return await ledger(env, '/reconcile');
      }
      if (url.pathname === '/review/callback' && request.method === 'GET') {
        if (!ready.review) return setupPending();
        return await callback(request, env);
      }
      const review = url.pathname.match(/^\/review\/([^/]+)(?:\/(sign-in|approve|refresh))?$/);
      if (review && operationIdPattern.test(review[1])) {
        const [, id, action] = review;
        if (!ready.review) return setupPending();
        const session = await readSession(request, env.REVIEW_SESSION_SECRET);
        if (action === 'sign-in' && request.method === 'GET') {
          const start = await ledger(env, '/oauth/start', {operationId: id});
          if (!start.ok) return html('<h1>Review unavailable</h1><p>Return to the library assistant for a current review link.</p>', start.status);
          const {state, url: githubUrl} = await start.json();
          return new Response(null, {status: 303, headers: {Location: githubUrl,
            'Set-Cookie': setCookie('__Host-cms_oauth', state, 600), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer'}});
        }
        if (!session) {
          if (request.method !== 'GET') return json({error: 'library_sign_in_required'}, 401);
          return html(`<h1>Review a library website update</h1><p>Sign in with the library GitHub account to see the checked preview and approve it.</p><p><a href="/review/${escape(id)}/sign-in">Sign in to review</a></p>`);
        }
        if (['approve', 'refresh'].includes(action) && request.method === 'POST') {
          if (request.headers.get('Origin') !== env.PUBLIC_ORIGIN || !request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded')) {
            return json({error: 'invalid_review_request'}, 403);
          }
          const form = new URLSearchParams(await limitedBody(request, 4096));
          if (!(await sameSecret(form.get('csrf'), session.csrf))) return json({error: 'invalid_review_request'}, 403);
          const result = await ledger(env, `/operation/${id}/${action}`, {...Object.fromEntries(form), subject: session.subject});
          if (!result.ok) return html('<h1>This preview could not be approved</h1><p>Content, website code, or its checked version may have changed. Return to the library assistant for a fresh preview.</p>', result.status);
          const next = await result.json();
          return new Response(null, {status: 303, headers: {Location: `${env.PUBLIC_ORIGIN}/review/${next.id}`, 'Cache-Control': 'no-store'}});
        }
        if (!action && request.method === 'GET') {
          const response = await ledger(env, `/operation/${id}`);
          if (!response.ok) return html('<h1>Review unavailable</h1><p>Return to the library assistant for a current review link.</p>', response.status);
          return html(reviewPage(await response.json(), session, ready.review));
        }
        return json({error: 'method_not_allowed'}, 405);
      }
      return json({error: 'not_found'}, 404);
    } catch {
      // Provider bodies and exceptions may contain credentials; only safe summaries leave here.
      return json({status: 'check_unavailable', summary: 'The website update could not be checked. Return to the library assistant for its current status.'}, 503);
    }
  },
};
