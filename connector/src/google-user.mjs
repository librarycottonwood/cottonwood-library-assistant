// Canonical Google report credential. Disabled unless the library-owned Google
// OAuth client is explicitly configured for production (Testing expires in 7d).
import { ReportError } from './reports.mjs';
import { recoveryDetail } from './recovery.mjs';
const encoder=new TextEncoder();
const STORE='library-google-reader-v1';
const CACHE=new Map();
const encode=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)));
const decode=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
export function userOAuthReady(env) {
  return !!(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET && env.GOOGLE_OAUTH_TOKEN_KEY && env.GOOGLE_OAUTH_PUBLISHING_STATUS==='production');
}
export function recoveryError(reason,env={}) {
  const detail=recoveryDetail(reason,userOAuthReady(env));const error=new ReportError(reason==='temporary'?'temporarily_unavailable':'account_attention',detail.message);error.recovery=detail;return error;
}
async function encryptionKey(env) {
  const raw=decode(env.GOOGLE_OAUTH_TOKEN_KEY);if(raw.length!==32)throw Error('Invalid token protection configuration.');
  return crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
}
export async function protectGrant(value,env) {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(STORE)},await encryptionKey(env),encoder.encode(JSON.stringify(value)));
  return JSON.stringify({v:1,iv:encode(iv),data:encode(ciphertext)});
}
export async function readGrant(env) {
  if(!env.OAUTH_KV)return null;
  const stored=await env.OAUTH_KV.get(STORE);if(!stored)return null;
  try {const data=JSON.parse(stored);if(data.v!==1)throw Error();
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(data.iv),additionalData:encoder.encode(STORE)},await encryptionKey(env),decode(data.data));
    const grant=JSON.parse(new TextDecoder().decode(plain));if(grant.email!=='librarycottonwood@gmail.com'||!grant.refreshToken)throw Error();return grant;
  }catch {throw recoveryError('google_client_rejected');}
}
export async function saveGrant(grant,env) {
  if(grant.email!=='librarycottonwood@gmail.com'||!grant.refreshToken)throw Error('Library identity required.');
  await env.OAUTH_KV.put(STORE,await protectGrant(grant,env));CACHE.clear();
}
export function clearUserTokenCache(){CACHE.clear();}
export async function userAccessToken(env,fetcher=fetch,force=false) {
  const grant=await readGrant(env);if(!grant)return null;
  if(!userOAuthReady(env))throw recoveryError('google_client_rejected');
  const cached=CACHE.get(grant.refreshToken);
  if(!force && cached?.expires>Date.now()+60000)return cached.value;
  const response=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:grant.refreshToken,client_id:env.GOOGLE_OAUTH_CLIENT_ID,client_secret:env.GOOGLE_OAUTH_CLIENT_SECRET}),signal:AbortSignal.timeout(15000)});
  const body=await response.json();
  if(!response.ok){if(body.error==='invalid_client')throw recoveryError('google_client_rejected');if(body.error==='invalid_grant')throw recoveryError('google_grant_revoked');throw new ReportError('temporarily_unavailable','Google could not reconnect the visitor reports yet. Please try again shortly.');}
  if(!body.access_token)throw recoveryError('google_grant_revoked');
  CACHE.clear();CACHE.set(grant.refreshToken,{value:body.access_token,expires:Date.now()+Math.min(Number(body.expires_in)||3600,3600)*1000});return body.access_token;
}
