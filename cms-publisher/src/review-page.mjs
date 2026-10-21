import {escape} from './security.mjs';
import {previewUrlValid} from './contract.mjs';

const styles = `
:root{color-scheme:light;font-family:'DM Sans',system-ui,sans-serif;color:#283c32;background:#f8f6ef}
*{box-sizing:border-box}body{margin:0;font-size:18px;line-height:1.65;overflow-wrap:anywhere}
header{border-bottom:1px solid #d9ddd1;padding:1.4rem max(1.25rem,calc((100vw - 1120px)/2))}
.brand{font:600 1.25rem/1.3 system-ui,sans-serif}.brand small{display:block;font: .7rem/1.6 system-ui,sans-serif;letter-spacing:.15em;text-transform:uppercase;margin-top:.25rem}
main{max-width:800px;margin:auto;padding:2.5rem 1.25rem 3rem}h1,h2,h3{font-family:'Lora',Georgia,serif;font-weight:400;line-height:1.2;margin:0 0 1rem}
h1{font-size:clamp(2.25rem,5vw,3.6rem);letter-spacing:-.04em;max-width:850px}h2{font-size:1.85rem}h3{font-size:1.4rem;margin:0}
p{margin:0 0 1rem}.intro{max-width:45rem}.eyebrow{font-size:.75rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;margin-bottom:.65rem}
a{color:#253e32;text-underline-offset:.25em}a:hover{text-decoration-thickness:2px}button,.button{font:600 1rem/1.5 system-ui,sans-serif;display:inline-flex;align-items:center;justify-content:center;min-height:48px;border:1px solid #253e32;border-radius:3px;padding:.75rem 1.25rem;cursor:pointer;text-decoration:none;background:#253e32;color:#fff}
button:hover,.button:hover{background:#192d24}.secondary{background:transparent;color:#253e32}.secondary:hover{background:#e9edde}
:where(a,button,summary):focus-visible{outline:3px solid #253e32;outline-offset:4px}
.status{padding:1rem 1.25rem;background:#e9edde;border-left:4px solid #253e32;margin:1.5rem 0}.status p{margin:0}.status strong{display:block}
.hint,footer{color:#596259;font-size:.95rem}.hint{margin:0 0 1rem}.decision{padding:1.75rem;background:#e9edde;border-radius:4px 48px 4px 4px}.decision p{max-width:42rem}
details{border-top:1px solid #d9ddd1;margin-top:1.5rem;padding-top:1rem}summary{cursor:pointer;font-size:1rem;font-weight:600}details form{margin-top:1rem}form p{max-width:42rem}footer{margin-top:2rem}
@media(max-width:640px){header{padding:1.1rem 1.25rem}main{padding-top:1.75rem}.brand{font-size:1.25rem}.decision{padding:1.25rem}button,.button{width:100%}}
`;

export const html = (body, status = 200, extra = {}) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Library website approval</title><style>${styles}</style></head><body><header><div class="brand">Cottonwood<small>Community Library</small></div></header><main>${body}</main></body></html>`, {
  status, headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    // Native form posts need their real Origin; no-referrer turns it into null.
    'Referrer-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff', ...extra,
  },
});

const statusCopy = {
  review_required: ['Ready for your review', 'Look over the preview before saving your update.'],
  deployed_verified: ['Your update is saved', 'The trial website has been updated and checked.'],
  publish_dispatching: ['Saving your update', 'Please check back shortly while the website is updated and checked.'],
  publish_queued: ['Saving your update', 'Please check back shortly while the website is updated and checked.'],
  publish_dispatch_uncertain: ['Checking your update', 'Return to the library assistant to check whether your update has saved.'],
  superseded: ['A newer preview is needed', 'This preview is out of date. Prepare a fresh preview before saving.'],
  build_failed: ['The preview needs attention', 'Return to the library assistant for help, or try a fresh preview.'],
  deploy_failed: ['Your update needs attention', 'Return to the library assistant to check the website before trying again.'],
  connection_failed: ['The connection needs attention', 'Return to the library assistant for help reconnecting.'],
  preview_dispatch_uncertain: ['Checking your preview', 'Return to the library assistant to check its progress.'],
};

export function reviewPage(operation, session, ready, env = {}) {
  const pins = ['sourceSha', 'documentRevision', 'contentDigest', 'revisionDigest', 'releaseDigest', 'previewRunId'];
  const previewUrl = previewUrlValid(operation.previewUrl, env) ? operation.previewUrl : null;
  const [heading, explanation] = statusCopy[operation.status] || ['Preparing your preview', 'Please check back shortly for the website preview.'];
  const preview = previewUrl ? `<p><a class="button secondary" href="${escape(previewUrl)}" target="_blank" rel="noopener noreferrer">Open website preview</a></p>` : '';
  const form = ready && operation.status === 'review_required' && session && previewUrl ? `<form method="post" action="/review/${escape(operation.id)}/approve">
    <input type="hidden" name="csrf" value="${escape(session.csrf)}">
    ${pins.map(key => `<input type="hidden" name="${key}" value="${escape(operation[key] || '')}">`).join('')}
    <button type="submit">Save to the trial website</button></form>` : '';
  const refresh = ready && session && ['build_failed', 'deploy_failed', 'connection_failed', 'preview_dispatch_uncertain', 'superseded'].includes(operation.status) ?
    `<details><summary>Need a new preview?</summary><form method="post" action="/review/${escape(operation.id)}/refresh"><input type="hidden" name="csrf" value="${escape(session.csrf)}"><p>If you made another change or this preview expired, prepare a fresh one to review.</p><button class="secondary" type="submit">Prepare a fresh preview</button></form></details>` : '';
  return `<p class="eyebrow">Website preview</p><h1>Review your website update</h1><div class="status" role="status"><strong>${heading}</strong><p>${explanation}</p></div>${preview}${form}${refresh}`;
}

export function reviewResponse(operation, session, ready, env = {}) {
  return html(reviewPage(operation, session, ready, env));
}
