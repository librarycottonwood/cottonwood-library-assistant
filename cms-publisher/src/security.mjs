const encoder = new TextEncoder();

export const encode = value => btoa(String.fromCharCode(...new Uint8Array(value)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function decode(value) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

export async function sha256(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function sameSecret(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || !left || !right) return false;
  const [a, b] = await Promise.all([sha256(left), sha256(right)]);
  let different = 0;
  for (let index = 0; index < a.length; index++) different |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return different === 0;
}

export async function authorized(request, secret) {
  return sameSecret(request.headers.get('Authorization'), secret ? `Bearer ${secret}` : '');
}

async function signingKey(secret, usages) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, usages);
}

export async function signSession(payload, secret) {
  const body = encode(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret, ['sign']), encoder.encode(body));
  return `${body}.${encode(signature)}`;
}

export async function readSession(request, secret, now = Date.now()) {
  if (!secret) return null;
  const value = cookie(request, '__Host-cms_review');
  if (!value || value.length > 2048) return null;
  const session = await readSigned(value, secret);
  if (!session || session.subject !== '338888442' || session.login !== 'librarycottonwood' ||
    !Number.isSafeInteger(session.expiresAt) || session.expiresAt <= now || session.expiresAt > now + 3600000 ||
    !/^[a-f0-9-]{36}$/.test(session.csrf)) return null;
  return session;
}

export async function readSigned(value, secret) {
  if (typeof value !== 'string' || value.length > 4096 || !secret) return null;
  const [body, signature, extra] = value.split('.');
  if (!body || !signature || extra) return null;
  try {
    const valid = await crypto.subtle.verify('HMAC', await signingKey(secret, ['verify']), decode(signature), encoder.encode(body));
    if (!valid) return null;
    return JSON.parse(new TextDecoder().decode(decode(body)));
  } catch { return null; }
}

export function cookie(request, name) {
  return request.headers.get('Cookie')?.split(';').map(value => value.trim())
    .find(value => value.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;
}

export function setCookie(name, value, seconds) {
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${seconds}`;
}

export async function limitedBody(request, maximum = 32768) {
  if (Number(request.headers.get('Content-Length')) > maximum) throw new Error('body_too_large');
  if (!request.body) return '';
  const reader = request.body.getReader();
  const parts = [];
  let bytes = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maximum) {
      await reader.cancel();
      throw new Error('body_too_large');
    }
    parts.push(value);
  }
  const combined = new Uint8Array(bytes);
  let offset = 0;
  for (const part of parts) { combined.set(part, offset); offset += part.byteLength; }
  return new TextDecoder('utf-8', {fatal: true}).decode(combined);
}

export const escape = value => String(value).replace(/[&<>"']/g, character => `&#${character.charCodeAt(0)};`);
