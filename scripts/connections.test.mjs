import test from 'node:test';
import assert from 'node:assert/strict';
import {assess, overall, WARN_DAYS} from './connections.mjs';

const now = Date.parse('2026-11-13T00:00:00Z');
const day = 86400000;

test('connections: expiry turns into ok, warn and fail in time', () => {
  assert.equal(assess({ok: true, expiresOn: null}, now).status, 'ok');
  assert.equal(assess({ok: true, expiresOn: new Date(now + (WARN_DAYS + 5) * day).toISOString()}, now).status, 'ok');
  const soon = assess({ok: true, expiresOn: new Date(now + 10 * day).toISOString()}, now);
  assert.equal(soon.status, 'warn'); assert.equal(soon.daysLeft, 10);
  assert.equal(assess({ok: true, expiresOn: new Date(now - day).toISOString()}, now).status, 'fail');
  assert.equal(assess({ok: false}, now).status, 'fail');
  assert.equal(assess({ok: null}, now).status, 'unknown');
});

test('connections: one broken connection outranks warnings', () => {
  assert.equal(overall([{status: 'ok'}, {status: 'unknown'}]), 'ok');
  assert.equal(overall([{status: 'ok'}, {status: 'warn'}]), 'warn');
  assert.equal(overall([{status: 'warn'}, {status: 'fail'}]), 'fail');
});
