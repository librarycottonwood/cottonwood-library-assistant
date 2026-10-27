import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkRepository, lintSource, scopedFiles, tokenProblems, renderReference, componentDocProblems } from './design-system.mjs';
import { tokenGroups } from '../src/design-system/tokens.ts';
import { parseComponentDoc } from '../src/design-system/component-docs.ts';

const component = css => `---\nconst a = 1;\n---\n<div class="box"><slot /></div>\n<style>\n${css}\n</style>\n`;
const messages = (source, file = 'src/components/site/Box.astro') => lintSource(source, file).map(p => p.message);

test('the repository passes the design-system check', async () => {
  const { problems, files } = await checkRepository();
  assert.deepEqual(problems, []);
  assert.ok(files.includes('src/pages/index.astro'), 'the homepage is checked');
  assert.ok(files.includes('src/components/site/Button.astro'), 'site components are checked');
});

test('clean component spacing passes', () => {
  assert.deepEqual(messages(component(`
    .box { display: flex; gap: var(--space-xs) var(--space-sm); padding: 0 var(--page-inset); margin: 0 auto; }
    .box > * { top: var(--space-sm); inset: 0; bottom: calc(-1 * var(--space-xl)); }
    @media (min-width: 48rem) { .box { padding-block: var(--section-space); gap: var(--section-gap); } }
    .box img { width: 1.5rem; height: clamp(13rem, 19vw, 22rem); border-radius: 0.25rem; }`)), []);
});

test('raw px, rem and em spacing fail', () => {
  const found = messages(component(`
    .a { padding: 16px; }
    .b { gap: 1.5rem; }
    .c { margin-left: 0.3em; }
    .d { top: 2vw; }`));
  assert.equal(found.length, 4);
  assert.match(found[0], /padding: 16px .*raw length "16px"/);
  assert.match(found[1], /gap: 1\.5rem/);
  assert.match(found[2], /margin-left: 0\.3em/);
  assert.match(found[3], /top: 2vw/);
});

test('fluid and calculated spacing that makes new sizes fails', () => {
  const found = messages(component(`
    .a { padding: clamp(var(--space-sm), 3vw, var(--space-xl)); }
    .b { padding-bottom: calc(var(--space-xl) * 2); }`));
  assert.equal(found.length, 2);
  assert.match(found[0], /fluid value/);
  assert.match(found[1], /calc\(\) makes new sizes/);
});

test('spacing tokens outside the 5 steps fail', () => {
  const found = messages(component('.a { gap: var(--space-xxl); }\n.b { padding: var(--space-15); }'));
  assert.ok(found.some(m => /--space-xxl is outside the 5 spacing steps/.test(m)));
  assert.ok(found.some(m => /--space-15 is outside the 5 spacing steps/.test(m)));
});

test('deleted tokens fail with a replacement hint', () => {
  const found = messages(component(`
    .a { padding: var(--padding-card-inline); }
    .b { gap: var(--gap-content); }
    .c { margin: var(--space-16); }
    .d { padding-inline: var(--page-inline); }
    .e { gap: var(--fluid-gap); }`));
  assert.ok(found.some(m => /--padding-card-inline was deleted/.test(m)));
  assert.ok(found.some(m => /--gap-content was deleted/.test(m)));
  assert.ok(found.some(m => /--space-16 was deleted; use --space-sm/.test(m)));
  assert.ok(found.some(m => /--page-inline was deleted; use --page-inset/.test(m)));
  assert.ok(found.some(m => /--fluid-gap was deleted; use --section-gap/.test(m)));
});

test('non-spacing tokens in spacing properties fail, local spacing aliases pass', () => {
  assert.match(messages(component('.a { gap: var(--text-body); }'))[0], /--text-body is not a spacing token/);
  assert.deepEqual(messages(component('.a { --inner: var(--space-md); padding: var(--inner); }')), []);
  assert.match(messages(component('.a { --inner: 18px; padding: var(--inner); }'))[0], /--inner is not a spacing token/);
});

test('inline styles and Tailwind spacing classes are checked', () => {
  const inline = messages('---\n---\n<div style="padding: 12px">x</div>\n<p style={`margin-top: var(--space-24)`}>y</p>');
  assert.ok(inline.some(m => /padding: 12px/.test(m)));
  assert.ok(inline.some(m => /--space-24 was deleted/.test(m)));
  assert.match(messages('---\n---\n<div class="flex gap-4 px-[18px]">x</div>')[0], /Tailwind spacing classes \(gap-4 px-\[18px\]\)/);
  assert.deepEqual(messages('---\n---\n<div class="stack-row media-start grid-3 text-label">x</div>'), []);
});

test('pages may not declare spacing at all, even with tokens', () => {
  const page = `---\nimport BaseLayout from '../layouts/BaseLayout.astro';\n---\n<BaseLayout><div class="x">hi</div></BaseLayout>\n<style>.x { padding: var(--space-md); color: var(--color-text); }</style>`;
  const found = messages(page, 'src/pages/visit.astro');
  assert.equal(found.length, 1);
  assert.match(found[0], /pages don't set spacing/);
});

test('problems report the line they are on', () => {
  const [problem] = lintSource(component('.a { color: red; }\n.b { padding: 4px; }'), 'src/components/site/Box.astro');
  assert.equal(problem.line, 7);
});

test('only new-system files are in scope', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ds-scope-'));
  try {
    await mkdir(path.join(root, 'src/pages/news'), { recursive: true });
    await mkdir(path.join(root, 'src/components/site'), { recursive: true });
    await writeFile(path.join(root, 'src/components/site/Box.astro'), component('.box { padding: 4px; }'));
    await writeFile(path.join(root, 'src/pages/new.astro'), `---\nimport BaseLayout from '../layouts/BaseLayout.astro';\n---\n<BaseLayout />`);
    await writeFile(path.join(root, 'src/pages/news/item.astro'), `---\nimport Stack from '../../components/site/Stack.astro';\n---\n<Stack />`);
    await writeFile(path.join(root, 'src/pages/old.astro'), `---\nimport SiteLayout from '../layouts/SiteLayout.astro';\n---\n<SiteLayout><div style="padding: 13px">old</div></SiteLayout>`);
    const files = await scopedFiles(root);
    assert.ok(files.includes('src/components/site/Box.astro'));
    assert.ok(files.includes('src/pages/new.astro'));
    assert.ok(files.includes('src/pages/news/item.astro'));
    assert.ok(!files.includes('src/pages/old.astro'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('tokens stay on the 5-step scale and carry usage notes', () => {
  assert.deepEqual(tokenProblems(), []);
  const broken = structuredClone(tokenGroups);
  broken.find(g => g.slug === 'spacing').tokens.push({ name: '--space-16', label: '16', value: '1rem', useFor: 'x', avoid: 'y', example: 'z' });
  broken.find(g => g.slug === 'layout').tokens.find(t => t.steps).steps.push({ minWidth: '120rem', value: '7rem' });
  broken.find(g => g.slug === 'colors').tokens[0].avoid = '';
  broken.push({ slug: 'padding', title: 'Padding', property: 'padding', note: '', tokens: [{ name: '--padding-card', label: 'Card', value: 'var(--space-md)', useFor: 'x', avoid: 'y', example: 'z' }] });
  const problems = tokenProblems(broken).join('\n');
  assert.match(problems, /Spacing tokens must be exactly/);
  assert.match(problems, /responsive value "7rem"/);
  assert.match(problems, /--color-primary: missing avoid/);
  assert.match(problems, /--padding-card: padding and gap tokens were removed/);
});

test('component usage blocks are parsed and required', () => {
  const doc = parseComponentDoc(`---\n/**\n * @component Thing\n * Does a thing.\n * @use Here.\n * @avoid There.\n * @example\n * <Thing gap="sm" />\n */\ninterface Props { gap?: Space; }\n---\n<div />`, 'src/components/site/Thing.astro');
  assert.equal(doc.name, 'Thing');
  assert.equal(doc.purpose, 'Does a thing.');
  assert.equal(doc.useFor, 'Here.');
  assert.equal(doc.avoid, 'There.');
  assert.equal(doc.example, '<Thing gap="sm" />');
  assert.equal(doc.props, 'interface Props { gap?: Space; }');
  assert.match(componentDocProblems([{ name: 'X', file: 'src/components/site/X.astro', missing: true }])[0], /add a usage block/);
  assert.match(componentDocProblems([{ ...doc, avoid: '' }])[0], /missing @avoid/);
  assert.match(renderReference([doc]), /### Thing[\s\S]*\*\*Don't use for:\*\* There\./);
});
