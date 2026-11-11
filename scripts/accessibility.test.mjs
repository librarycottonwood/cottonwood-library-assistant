import test from 'node:test';
import assert from 'node:assert/strict';
import { accessibilityProblems, pageAccessibilityProblems } from './accessibility-pages.mjs';

const page = body => `<!doctype html><html lang="en"><head><title>T</title></head><body>${body}</body></html>`;

test('a page with one h1, headings in order, alt text and frame titles passes', () => {
  assert.deepEqual(pageAccessibilityProblems('/', page('<h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2><img src="a.jpg" alt=""><iframe src="x" title="Map"></iframe>')), []);
});

test('headings that skip a level fail (the news and newsletter lists once went h1 to h3)', () => {
  assert.deepEqual(pageAccessibilityProblems('/news/', page('<h1>News</h1><h3>Post</h3>')), ['/news/ jumps from h1 to h3; headings never skip a level (give the Card or PostList a lower heading level).']);
  assert.match(pageAccessibilityProblems('/x/', page('<h2>No title</h2>')).join(' '), /has 0 h1 headings/);
  assert.match(pageAccessibilityProblems('/x/', page('<h1>A</h1><h1>B</h1>')).join(' '), /has 2 h1 headings/);
});

test('missing language, alt text and frame titles fail', () => {
  const html = '<html><body><h1>A</h1><img src="a.jpg"><iframe src="https://example.org/"></iframe></body></html>';
  assert.deepEqual(pageAccessibilityProblems('/x/', html), [
    '/x/ has no lang on <html>.',
    '/x/ has 1 picture(s) without alt text (a.jpg).',
    '/x/ has a frame without a title (https://example.org/).',
  ]);
});

test('redirect pages and design-system pages are skipped', () => {
  assert.deepEqual(accessibilityProblems([
    { path: '/our-story/', html: '<meta http-equiv="refresh" content="0;url=/about/">' },
    { path: '/components/', html: '<html><body><h3>x</h3></body></html>' },
  ]), []);
});
