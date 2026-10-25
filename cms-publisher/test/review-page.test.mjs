import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewResponse} from '../src/review-page.mjs';

const operation = {id: '11111111-1111-4111-8111-111111111111', status: 'review_required',
  documentId: 'internal-record-number', documentRevision: 'revision-code', sourceSha: 'a'.repeat(40),
  contentDigest: 'b'.repeat(64), revisionDigest: 'c'.repeat(64), releaseDigest: 'd'.repeat(64),
  previewRunId: '123456', previewUrl: 'https://1234abcd.cottonwood-library.pages.dev/'};

test('review links to the exact preview and keeps approval pins out of visible text', async () => {
  const response = reviewResponse(operation, {csrf: 'test-csrf'}, true);
  const body = await response.text();
  const visible = body.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<[^>]*>/g, '');
  for (const internal of [operation.documentId, operation.releaseDigest, operation.sourceSha, operation.documentRevision, operation.previewRunId]) assert.ok(!visible.includes(internal));
  assert.match(body, /Save to the live website/);
  assert.match(body, /action="\/review\/11111111-1111-4111-8111-111111111111\/approve"/);
  for (const pin of ['sourceSha', 'documentRevision', 'contentDigest', 'revisionDigest', 'releaseDigest', 'previewRunId']) {
    assert.ok(body.includes(`type="hidden" name="${pin}" value="${operation[pin]}"`));
  }
  assert.ok(body.includes(`href="${operation.previewUrl}"`));
  assert.ok(!body.includes('<img'));
  assert.ok(!body.includes('<details>'));
  assert.ok(!visible.toLowerCase().includes('picture'));

});

test('untrusted or mutable preview links cannot be offered or approved', async () => {
  for (const previewUrl of ['https://example.com/', 'https://cottonwood-library.pages.dev/', 'https://cms-draft.cottonwood-library.pages.dev/', 'https://1234abcd.cottonwood-library.pages.dev/?other=1', 'https://1234abcd.cottonwood-library-trial-preview.pages.dev/', 'javascript:alert(1)']) {
    const response = reviewResponse({...operation, previewUrl}, {csrf: 'test'}, true);
    const body = await response.text();
    assert.ok(!body.includes('<img'));
    assert.ok(!body.includes('/approve'));
    assert.ok(!body.includes(previewUrl));
  }
});

test('pending, completed, failed and superseded updates never offer saving', async () => {
  for (const status of ['preview_queued', 'publish_queued', 'deployed_verified', 'deploy_failed', 'superseded']) {
    const body = await reviewResponse({...operation, status}, {csrf: 'test'}, true).text();
    assert.ok(!body.includes('/approve'));
    assert.ok(!body.includes('internal-record-number'));
  }
});
