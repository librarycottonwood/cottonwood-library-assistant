// Newsletter sign-up: POST /api/newsletter (a Cloudflare Pages Function).
//
// The site's own form posts here; this adds the person to the library's Givebutter
// contacts with email subscription on and the newsletter tag. The Givebutter API key
// is the GIVEBUTTER_API_KEY secret in the Cloudflare Pages project settings, never in
// this repository (see docs/setup-checklist.md).
//
// `wrangler pages deploy` compiles this folder from the trusted main checkout when the
// GitHub workflows publish the site. PR artifacts stay static-only, so a PR preview
// keeps running main's version of this file.
//
// Two callers:
// - The form's script sends JSON and gets JSON back ({ ok, status }).
// - Without JavaScript the browser posts the form; we answer with a redirect to the
//   page it came from plus #newsletter-<status>, which shows the matching message.
import signup from '../../src/content/newsletter-signup.json' with { type: 'json' };

export const NEWSLETTER_TAG: string = signup.audienceName;
export const STATUSES = ['subscribed', 'already', 'invalid', 'error'] as const;
export type Status = (typeof STATUSES)[number];

const API = 'https://api.givebutter.com/v1';
const MAX_BODY_BYTES = 4096;
const MAX_EMAIL = 254;
const MAX_NAME = 100;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export interface Env { GIVEBUTTER_API_KEY?: string }
interface Options { fetcher?: typeof fetch; now?: number }
export interface Submission { email: string; firstName: string; honeypot: string; returnPath: string }
type Fetcher = typeof fetch;

/** Pages Function entry point. Every method reaches this; only POST is accepted. */
export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  return handleNewsletter(context.request, context.env);
}

const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
const text = (status: number, body: string, extra: Record<string, string> = {}) =>
  new Response(body, { status, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8', ...extra } });

export async function handleNewsletter(request: Request, env: Env, { fetcher = fetch, now = Date.now() }: Options = {}): Promise<Response> {
  if (request.method !== 'POST') return text(405, 'Use the sign-up form.', { Allow: 'POST' });
  if (!isSameOrigin(request)) return text(403, 'Sign-ups are accepted only from this website.');
  const kind = bodyKind(request.headers.get('Content-Type'));
  if (!kind) return text(415, 'Send the form as JSON or a normal form post.');

  const reply = (status: Status, reason: string, code: number, submission?: Submission) => kind === 'json'
    ? json(code, { ok: status === 'subscribed' || status === 'already', status, reason })
    : new Response(null, { status: 303, headers: { ...headers, Location: redirectTarget(request, submission?.returnPath, status) } });

  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY_BYTES) return reply('invalid', 'too_large', 413);
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return reply('invalid', 'too_large', 413);
  const submission = parseSubmission(raw, kind);
  if (!submission) return reply('invalid', 'malformed', 400);
  // Bots fill every field. Pretend it worked so they don't retry.
  if (submission.honeypot) return reply('subscribed', 'ok', 200, submission);
  if (!isValidEmail(submission.email)) return reply('invalid', 'invalid_email', 400, submission);
  if (!isValidName(submission.firstName)) return reply('invalid', 'invalid_name', 400, submission);
  if (isRateLimited(request.headers.get('CF-Connecting-IP') ?? '', now)) return reply('error', 'rate_limited', 429, submission);
  if (!env.GIVEBUTTER_API_KEY) {
    console.error('Newsletter sign-up is not configured: add the GIVEBUTTER_API_KEY secret to the Cloudflare Pages project.');
    return reply('error', 'not_configured', 503, submission);
  }
  const result = await subscribe(submission, env.GIVEBUTTER_API_KEY, fetcher);
  const code = result.status === 'invalid' ? 400 : result.status === 'error' ? 502 : 200;
  return reply(result.status, result.reason, code, submission);
}

/** Browsers send Origin on every POST; when it is missing (very old browsers, scripts), fall back to Sec-Fetch-Site. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (origin) return origin === new URL(request.url).origin;
  const site = request.headers.get('Sec-Fetch-Site');
  return !site || site === 'same-origin' || site === 'none';
}

function bodyKind(contentType: string | null): 'json' | 'form' | undefined {
  const type = (contentType ?? '').split(';')[0].trim().toLowerCase();
  return type === 'application/json' ? 'json' : type === 'application/x-www-form-urlencoded' ? 'form' : undefined;
}

const field = (value: unknown) => (typeof value === 'string' ? value : '').replace(/\s+/g, ' ').trim();

export function parseSubmission(raw: string, kind: 'json' | 'form'): Submission | undefined {
  let values: Record<string, unknown>;
  if (kind === 'json') {
    try { values = JSON.parse(raw); } catch { return undefined; }
    if (!values || typeof values !== 'object' || Array.isArray(values)) return undefined;
  } else values = Object.fromEntries(new URLSearchParams(raw));
  return { email: field(values.email), firstName: field(values.first_name), honeypot: field(values.website), returnPath: field(values.return) };
}

export function isValidEmail(email: string): boolean {
  return email.length <= MAX_EMAIL && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]{2,}$/.test(email);
}

/** Optional. Rejects links and markup, which only spam puts in a first name. */
export function isValidName(name: string): boolean {
  return name.length <= MAX_NAME && !/[<>@{}\\/]|https?:|www\.|[\u0000-\u001f\u007f]/i.test(name);
}

/** The Givebutter contact for a sign-up. Creating a contact adds tags and never removes existing ones. */
export function buildContact({ email, firstName }: Pick<Submission, 'email' | 'firstName'>) {
  return { ...(firstName ? { first_name: firstName } : {}), primary_email: email, email_subscription: true, tags: [NEWSLETTER_TAG] };
}

// Best effort only: each Pages isolate keeps its own count, so this slows down a
// single noisy visitor; it is not a hard limit.
const recent = new Map<string, number[]>();
export function isRateLimited(ip: string, now: number): boolean {
  if (!ip) return false;
  if (recent.size > 1000) for (const [key, times] of recent) if (times.every(time => now - time > RATE_WINDOW_MS)) recent.delete(key);
  const times = (recent.get(ip) ?? []).filter(time => now - time < RATE_WINDOW_MS);
  times.push(now);
  recent.set(ip, times);
  return times.length > RATE_LIMIT;
}
export const resetRateLimit = () => recent.clear();

/** Back to the page the form was on (path only, never another site), at the message for this result. */
export function redirectTarget(request: Request, returnPath: string | undefined, status: Status): string {
  const own = new URL(request.url).origin;
  const candidates = [returnPath, request.headers.get('Referer')];
  for (const candidate of candidates) {
    if (!candidate || candidate.length > 300 || /[\\\u0000-\u001f]/.test(candidate)) continue;
    if (candidate.startsWith('//')) continue;
    try {
      const url = new URL(candidate, own);
      if (url.origin === own) return `${own}${url.pathname}#newsletter-${status}`;
    } catch { /* try the next candidate */ }
  }
  return `${own}/#newsletter-${status}`;
}

type Result = { status: Status; reason: string };

async function call(fetcher: Fetcher, key: string, path: string, method: string, body?: unknown) {
  return fetcher(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
}
const readJson = async (response: Response): Promise<any> => { try { return await response.json(); } catch { return undefined; } };

/** Create (or, through Givebutter's deduplication, match) the contact. Never logs the email address or the key. */
export async function subscribe(submission: Pick<Submission, 'email' | 'firstName'>, key: string, fetcher: Fetcher = fetch): Promise<Result> {
  let response: Response;
  try { response = await call(fetcher, key, '/contacts', 'POST', buildContact(submission)); }
  catch (error) { console.error('Givebutter could not be reached:', (error as Error).name); return { status: 'error', reason: 'unreachable' }; }

  // A matched contact who once unsubscribed keeps that setting: anyone can type any email here, so this form
  // never turns email back on for an existing contact. They can rejoin through Givebutter or by emailing the library.
  if (response.ok) return { status: 'subscribed', reason: 'ok' };
  const body = await readJson(response);
  if (response.status === 409 || (response.status === 422 && emailAlreadyUsed(body))) {
    await tagExisting(submission.email, key, fetcher);
    // Same answer as a new sign-up, so the form can't be used to find out who is already a library contact.
    return { status: 'subscribed', reason: 'existing_contact' };
  }
  if (response.status === 422 && Object.keys(body?.errors ?? {}).some(name => /email/i.test(name))) return { status: 'invalid', reason: 'invalid_email' };
  if (response.status === 401 || response.status === 403) console.error(`Givebutter refused the API key (${response.status}). Check GIVEBUTTER_API_KEY in the Cloudflare Pages settings.`);
  else console.error(`Givebutter contact request failed (${response.status}).`, response.status === 422 ? Object.keys(body?.errors ?? {}).join(', ') : '');
  return { status: 'error', reason: response.status === 429 ? 'busy' : 'upstream' };
}

function emailAlreadyUsed(body: any): boolean {
  return Object.entries(body?.errors ?? {}).some(([name, messages]) =>
    /email/i.test(name) && (Array.isArray(messages) ? messages : [messages]).some(message => /taken|exist|already|duplicate/i.test(String(message))));
}

/** Existing contact: add the tag (keeps their other tags). Their email setting is left alone. Failures are logged, not shown. */
async function tagExisting(email: string, key: string, fetcher: Fetcher) {
  try {
    const found = await call(fetcher, key, `/contacts?email=${encodeURIComponent(email)}`, 'GET');
    if (!found.ok) return console.error(`Givebutter contact lookup failed (${found.status}).`);
    const list = (await readJson(found))?.data;
    const target = email.toLowerCase();
    const contact = Array.isArray(list) ? list.find((item: any) =>
      [item?.primary_email, ...(Array.isArray(item?.emails) ? item.emails.map((entry: any) => entry?.value ?? entry) : [])]
        .some(value => typeof value === 'string' && value.toLowerCase() === target)) : undefined;
    if (!contact?.id) return console.error('Givebutter returned no contact with that email.');
    const tagged = await call(fetcher, key, `/contacts/${encodeURIComponent(contact.id)}/tags/add`, 'POST', { tags: [NEWSLETTER_TAG] });
    if (!tagged.ok) console.error(`Givebutter tag request failed (${tagged.status}).`);
  } catch (error) { console.error('Tagging the existing Givebutter contact failed:', (error as Error).name); }
}
