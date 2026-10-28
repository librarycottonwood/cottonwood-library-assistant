// Newsletter sign-up endpoint (functions/api/newsletter.ts). Givebutter is never called: every
// test passes a fake fetch that records requests and answers like the documented API.
import test, {beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {handleNewsletter, passesTurnstile, buildContact, parseSubmission, isValidEmail, isValidName, isSameOrigin, redirectTarget, resetRateLimit, NEWSLETTER_TAG, STATUSES} from '../functions/api/newsletter.ts';
import {newsletterStatuses} from '../src/content/newsletter.ts';

const SITE = 'https://cottonwood-library.pages.dev';
const env = {GIVEBUTTER_API_KEY: 'test-key'};
const quiet = () => {};

function post(body, {type = 'application/json', headers = {}} = {}) {
  return new Request(`${SITE}/api/newsletter`, {
    method: 'POST',
    headers: {'Content-Type': type, Origin: SITE, 'CF-Connecting-IP': '203.0.113.7', ...headers},
    body: typeof body === 'string' ? body : type === 'application/json' ? JSON.stringify(body) : new URLSearchParams(body).toString(),
  });
}
const reply = (status, body) => new Response(body === undefined ? null : JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});
/** Fake Givebutter: answers in order and records every call. */
function givebutter(...answers) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({url: String(url), method: init.method, auth: init.headers.Authorization, body: init.body ? JSON.parse(init.body) : undefined});
    const next = answers.shift();
    if (!next) throw Error(`Unexpected Givebutter call ${init.method} ${url}`);
    if (next instanceof Error) throw next;
    return next;
  };
  return {fetcher, calls};
}

beforeEach(() => resetRateLimit());
const silence = t => {t.mock.method(console, 'error', quiet);};

test('the newsletter tag is the Givebutter audience in newsletter-signup.json', async () => {
  const config = JSON.parse(await readFile(new URL('../src/content/newsletter-signup.json', import.meta.url), 'utf8'));
  assert.equal(NEWSLETTER_TAG, 'Library Newsletter');
  assert.equal(NEWSLETTER_TAG, config.audienceName);
  assert.ok(NEWSLETTER_TAG.length <= 64);
  assert.deepEqual([...STATUSES], newsletterStatuses, 'the server and the form agree on result names');
});

test('builds a subscribed, tagged contact and leaves out an empty first name', () => {
  assert.deepEqual(buildContact({email: 'reader@example.org', firstName: 'Ada'}),
    {first_name: 'Ada', primary_email: 'reader@example.org', email_subscription: true, tags: ['Library Newsletter']});
  const contact = buildContact({email: 'reader@example.org', firstName: ''});
  assert.equal('first_name' in contact, false);
  // Deduplication must stay on, so an existing contact is matched (and keeps its tags) instead of duplicated.
  assert.equal('force_create' in contact, false);
});

test('validates email and first name', () => {
  for (const email of ['reader@example.org', 'a.b+news@mail.example.co.uk']) assert.ok(isValidEmail(email), email);
  for (const email of ['', 'reader', 'reader@', '@example.org', 'reader@example', 'two words@example.org', 'a<b>@example.org', `${'a'.repeat(250)}@example.org`]) assert.equal(isValidEmail(email), false, email);
  for (const name of ['', 'Ada', 'Mary-Jo', "O'Brien", 'José Luis']) assert.ok(isValidName(name), name);
  for (const name of ['<b>Ada</b>', 'Visit https://spam.example', 'www.spam.example', 'me@example.org', 'a'.repeat(101)]) assert.equal(isValidName(name), false, name);
});

test('parses JSON and form posts, trimming whitespace', () => {
  const fields = {email: '  reader@example.org ', first_name: ' Ada   Lovelace ', website: '', return: '/visit/'};
  const expected = {email: 'reader@example.org', firstName: 'Ada Lovelace', honeypot: '', returnPath: '/visit/', turnstileToken: ''};
  assert.deepEqual(parseSubmission(JSON.stringify(fields), 'json'), expected);
  assert.deepEqual(parseSubmission(new URLSearchParams(fields).toString(), 'form'), expected);
  assert.equal(parseSubmission('not json', 'json'), undefined);
  assert.equal(parseSubmission('[1]', 'json'), undefined);
  assert.deepEqual(parseSubmission(JSON.stringify({email: 42}), 'json').email, '');
});

test('accepts only same-origin POSTs as JSON or a normal form post', async () => {
  const {fetcher, calls} = givebutter();
  const get = await handleNewsletter(new Request(`${SITE}/api/newsletter`), env, {fetcher});
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('Allow'), 'POST');
  assert.equal((await handleNewsletter(post({email: 'reader@example.org'}, {headers: {Origin: 'https://evil.example'}}), env, {fetcher})).status, 403);
  assert.equal((await handleNewsletter(post('email=reader@example.org', {type: 'text/plain'}), env, {fetcher})).status, 415);
  assert.equal((await handleNewsletter(post('x', {type: 'multipart/form-data; boundary=x'}), env, {fetcher})).status, 415);
  assert.equal((await handleNewsletter(post({email: 'reader@example.org', first_name: 'x'.repeat(5000)}), env, {fetcher})).status, 413);
  assert.equal(calls.length, 0);

  const noOrigin = headers => isSameOrigin(new Request(`${SITE}/api/newsletter`, {method: 'POST', headers}));
  assert.equal(noOrigin({}), true);
  assert.equal(noOrigin({'Sec-Fetch-Site': 'same-origin'}), true);
  assert.equal(noOrigin({'Sec-Fetch-Site': 'cross-site'}), false);
  assert.equal(noOrigin({Origin: 'null'}), false);
});

test('a filled honeypot looks like success but never reaches Givebutter', async () => {
  const {fetcher, calls} = givebutter();
  const response = await handleNewsletter(post({email: 'bot@example.org', website: 'http://spam.example'}), env, {fetcher});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {ok: true, status: 'subscribed', reason: 'ok'});
  assert.equal(calls.length, 0);
});

test('invalid input is refused before Givebutter is called', async () => {
  const {fetcher, calls} = givebutter();
  const bad = await handleNewsletter(post({email: 'not-an-email'}), env, {fetcher});
  assert.equal(bad.status, 400);
  assert.deepEqual(await bad.json(), {ok: false, status: 'invalid', reason: 'invalid_email'});
  const name = await handleNewsletter(post({email: 'reader@example.org', first_name: 'see https://spam.example'}), env, {fetcher});
  assert.equal((await name.json()).reason, 'invalid_name');
  assert.equal(calls.length, 0);
});

test('a missing API key is a clear error the form turns into the email link', async t => {
  silence(t);
  const {fetcher, calls} = givebutter();
  const response = await handleNewsletter(post({email: 'reader@example.org'}), {}, {fetcher});
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {ok: false, status: 'error', reason: 'not_configured'});
  assert.equal(calls.length, 0);
  assert.match(console.error.mock.calls[0].arguments[0], /GIVEBUTTER_API_KEY/);
});

test('creates the contact with the secret key, subscribed and tagged', async () => {
  const {fetcher, calls} = givebutter(reply(200, {id: 101, is_email_subscribed: true}));
  const response = await handleNewsletter(post({email: 'reader@example.org', first_name: 'Ada', website: '', return: '/'}), env, {fetcher});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {ok: true, status: 'subscribed', reason: 'ok'});
  assert.deepEqual(calls, [{url: 'https://api.givebutter.com/v1/contacts', method: 'POST', auth: 'Bearer test-key',
    body: {first_name: 'Ada', primary_email: 'reader@example.org', email_subscription: true, tags: ['Library Newsletter']}}]);
});

test('a matched contact who had unsubscribed is never opted back in by the public form', async () => {
  const {fetcher, calls} = givebutter(reply(200, {data: {id: 7, is_email_subscribed: false}}), reply(200, {id: 7}));
  const response = await handleNewsletter(post({email: 'reader@example.org'}), env, {fetcher});
  assert.equal((await response.json()).status, 'subscribed');
  assert.equal(calls.length, 1, 'only the create call; no PUT turning email back on');
});

test('an email Givebutter already has: tag added (not replaced), email setting untouched, same answer as a new sign-up', async () => {
  const {fetcher, calls} = givebutter(
    reply(422, {message: 'The given data was invalid.', errors: {primary_email: ['The primary email has already been taken.']}}),
    reply(200, {data: [{id: 55, primary_email: 'Reader@Example.org', is_email_subscribed: false}]}),
    reply(200, {}),
  );
  const response = await handleNewsletter(post({email: 'reader@example.org'}), env, {fetcher});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {ok: true, status: 'subscribed', reason: 'existing_contact'});
  assert.deepEqual(calls.slice(1).map(({url, method, body}) => ({url, method, body})), [
    {url: 'https://api.givebutter.com/v1/contacts?email=reader%40example.org', method: 'GET', body: undefined},
    {url: 'https://api.givebutter.com/v1/contacts/55/tags/add', method: 'POST', body: {tags: ['Library Newsletter']}},
  ]);
  // tags/sync and a PUT with tags would replace the contact's other tags.
  assert.ok(!calls.some(call => call.url.endsWith('/tags/sync') || (call.method === 'PUT' && 'tags' in call.body)));
});

test('an existing contact still gets the normal answer when it cannot be tagged', async t => {
  silence(t);
  const conflict = givebutter(reply(409, {message: 'Conflict'}), reply(200, {data: [{id: 9, primary_email: 'someone-else@example.org'}]}));
  assert.equal((await (await handleNewsletter(post({email: 'reader@example.org'}), env, conflict)).json()).status, 'subscribed');
  assert.equal(conflict.calls.length, 2, 'never edits a contact whose email does not match');
  resetRateLimit();
  const lookupFails = givebutter(reply(409, {}), reply(500, {}));
  assert.equal((await (await handleNewsletter(post({email: 'reader@example.org'}), env, lookupFails)).json()).status, 'subscribed');
});

test('Givebutter problems become the error message; a rejected email becomes "check your email"', async t => {
  silence(t);
  const cases = [
    [reply(422, {message: 'invalid', errors: {primary_email: ['The primary email must be a valid email address.']}}), 400, 'invalid', 'invalid_email'],
    [reply(422, {message: 'invalid', errors: {tags: ['Too long.']}}), 502, 'error', 'upstream'],
    [reply(401, {message: 'Unauthenticated.'}), 502, 'error', 'upstream'],
    [reply(429), 502, 'error', 'busy'],
    [reply(500), 502, 'error', 'upstream'],
    [new TypeError('fetch failed'), 502, 'error', 'unreachable'],
  ];
  for (const [answer, code, status, reason] of cases) {
    resetRateLimit();
    const response = await handleNewsletter(post({email: 'reader@example.org'}), env, givebutter(answer));
    assert.equal(response.status, code, reason);
    assert.deepEqual(await response.json(), {ok: false, status, reason});
  }
  assert.ok(console.error.mock.calls.some(call => /GIVEBUTTER_API_KEY/.test(call.arguments[0])), '401 points at the key setting');
  assert.ok(!console.error.mock.calls.some(call => call.arguments.join(' ').includes('reader@example.org')), 'never logs the email');
});

test('without JavaScript the browser is sent back to its page at the matching message', async t => {
  silence(t);
  const form = {type: 'application/x-www-form-urlencoded'};
  const ok = await handleNewsletter(post({email: 'reader@example.org', return: '/visit/'}, form), env, givebutter(reply(200, {id: 1, is_email_subscribed: true})));
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get('Location'), `${SITE}/visit/#newsletter-subscribed`);
  const invalid = await handleNewsletter(post({email: 'nope', return: '/librarynews/newsletter/'}, form), env);
  assert.equal(invalid.headers.get('Location'), `${SITE}/librarynews/newsletter/#newsletter-invalid`);
  const missingKey = await handleNewsletter(post({email: 'reader@example.org', return: '/'}, form), {});
  assert.equal(missingKey.status, 303);
  assert.equal(missingKey.headers.get('Location'), `${SITE}/#newsletter-error`);
});

test('the redirect never leaves the site', () => {
  const request = (referer) => new Request(`${SITE}/api/newsletter`, {method: 'POST', headers: referer ? {Referer: referer} : {}});
  assert.equal(redirectTarget(request(), '/kids/?x=1#top', 'already'), `${SITE}/kids/#newsletter-already`);
  for (const evil of ['https://evil.example/', '//evil.example/', '/\\evil.example', 'javascript:alert(1)']) {
    assert.equal(redirectTarget(request(), evil, 'subscribed'), `${SITE}/#newsletter-subscribed`, evil);
  }
  assert.equal(redirectTarget(request(`${SITE}/visit/`), '', 'error'), `${SITE}/visit/#newsletter-error`);
  assert.equal(redirectTarget(request('https://evil.example/page/'), '', 'error'), `${SITE}/#newsletter-error`);
});

test('one visitor posting over and over is slowed down', async () => {
  let calls = 0;
  const fetcher = async () => {calls++; return reply(200, {id: 1, is_email_subscribed: true});};
  const statuses = [];
  for (let i = 0; i < 7; i++) statuses.push((await handleNewsletter(post({email: `reader${i}@example.org`}), env, {fetcher, now: 1000 + i})).status);
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429, 429]);
  assert.equal(calls, 5);
  // Ten minutes later they can sign up again.
  assert.equal((await handleNewsletter(post({email: 'later@example.org'}), env, {fetcher, now: 1000 + 10 * 60 * 1000 + 10})).status, 200);
});

test('with a Turnstile secret, a sign-up needs a token Cloudflare accepts', async () => {
  const secretEnv = {...env, TURNSTILE_SECRET_KEY: 'turnstile-secret'};
  // No token: rejected before Givebutter is called.
  const none = givebutter();
  let response = await handleNewsletter(post({email: 'reader@example.com'}), secretEnv, {fetcher: none.fetcher});
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {ok: false, status: 'error', reason: 'bot_check_failed'});
  assert.equal(none.calls.length, 0);
  // Cloudflare says no.
  const rejected = givebutter(reply(200, {success: false}));
  response = await handleNewsletter(post({email: 'reader@example.com', 'cf-turnstile-response': 'bad'}), secretEnv, {fetcher: rejected.fetcher});
  assert.equal(response.status, 403);
  assert.equal(rejected.calls[0].url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.deepEqual(rejected.calls[0].body, {secret: 'turnstile-secret', response: 'bad', remoteip: '203.0.113.7'});
  // Cloudflare says yes: the sign-up goes on to Givebutter.
  const accepted = givebutter(reply(200, {success: true}), reply(201, {id: 1}));
  response = await handleNewsletter(post({email: 'reader@example.com', 'cf-turnstile-response': 'good'}), secretEnv, {fetcher: accepted.fetcher});
  assert.equal(response.status, 200);
  assert.equal(accepted.calls[1].url, 'https://api.givebutter.com/v1/contacts');
});

test('without a Turnstile secret the check is skipped, and a Cloudflare outage fails closed', async () => {
  const {fetcher, calls} = givebutter(reply(201, {id: 1}));
  const response = await handleNewsletter(post({email: 'reader@example.com'}), env, {fetcher});
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(await passesTurnstile('token', 'secret', null, async () => { throw Error('down'); }), false);
});
