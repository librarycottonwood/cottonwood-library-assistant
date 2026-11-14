#!/usr/bin/env node
// Design-system reference and spacing check for pages built on BaseLayout.
//
//   node scripts/design-system.mjs docs    rewrite docs/design-system.md from tokens.ts and component usage blocks
//   node scripts/design-system.mjs check   fail if that file is stale, or if new-system files break the spacing rules
//
// `pnpm check` runs `check`.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { breakpoints, spaceSteps, spacingTokenNames, tokenGroups } from '../src/design-system/tokens.ts';
import { componentSources, parseComponentDoc } from '../src/design-system/component-docs.ts';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REFERENCE = 'docs/design-system.md';

// ---------- scope ----------

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(entries.map(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }));
  return files.flat();
}

/** True for a page built on BaseLayout or the site components (every page today); only those are checked. */
export const usesNewSystem = source => /from\s+['"][^'"]*(layouts\/BaseLayout\.astro|components\/site\/)/.test(source);

/** Files the spacing rules apply to, relative to the repo root. */
export async function scopedFiles(root = ROOT) {
  const rel = file => path.relative(root, file).split(path.sep).join('/');
  const components = [...await walk(path.join(root, 'src/components/site')), ...await walk(path.join(root, 'src/components/academy'))].filter(file => file.endsWith('.astro'));
  const pages = [];
  for (const file of await walk(path.join(root, 'src/pages'))) {
    if (file.endsWith('.astro') && usesNewSystem(await readFile(file, 'utf8'))) pages.push(file);
  }
  return ['src/styles/base.css', 'src/layouts/BaseLayout.astro', ...components.map(rel).sort(), ...pages.map(rel).sort()];
}

export const isPage = file => file.startsWith('src/pages/');
/** Site pages (not the /components reference pages), which may only compose components. */
export const isSitePage = file => isPage(file) && !file.startsWith('src/pages/components/');

// ---------- CSS extraction ----------

/** CSS chunks in a file, each with its offset, so problems can report line numbers. */
export function cssChunks(source, file) {
  if (file.endsWith('.css')) return [{ css: source, offset: 0, inline: false }];
  const chunks = [];
  for (const match of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
    chunks.push({ css: match[1], offset: match.index + match[0].indexOf('>') + 1, inline: false });
  }
  for (const match of source.matchAll(/\sstyle=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{'([^']*)'\}|\{"([^"]*)"\})/g)) {
    const css = match.slice(1).find(value => value !== undefined) ?? '';
    chunks.push({ css, offset: match.index + match[0].indexOf(css), inline: true });
  }
  return chunks;
}

const blankComments = css => css.replace(/\/\*[\s\S]*?\*\//g, comment => comment.replace(/[^\n]/g, ' '));

/** Declarations as { property, value, index } (index relative to the chunk). */
export function declarations(css, inline = false) {
  const text = (inline ? ';' : '') + blankComments(css);
  const shift = inline ? -1 : 0;
  const found = [];
  for (const match of text.matchAll(/(^|[{;])(\s*)(-{0,2}[a-zA-Z][\w-]*)\s*:\s*([^;{}]+)/g)) {
    found.push({ property: match[3].toLowerCase(), value: match[4].trim(), index: match.index + match[1].length + match[2].length + shift });
  }
  return found;
}

// ---------- rules ----------

const SPACING_PROPERTY = /^(?:(?:scroll-)?(?:margin|padding)(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?|(?:grid-)?(?:row-|column-)?gap|inset(?:-(?:block|inline)(?:-(?:start|end))?)?|top|right|bottom|left)$/;
export const isSpacingProperty = property => SPACING_PROPERTY.test(property);
const RAW_LENGTH = /(?<![\w.-])-?(?:\d+\.?\d*|\.\d+)(px|r?em|vw|vh|vmin|vmax|[sld]vh|vi|vb|ch|ex|cm|mm|in|pt|pc|lh|%)(?![\w-])/;
const FLUID = /\b(clamp|min|max)\(/;
const VAR = /var\(\s*(--[\w-]*)/g;

const DELETED = new Map([
  ...['0', '10', '16', '20', '24', '30', '50', '60', '100', '200'].map(step => [`--space-${step}`, step === '0' ? '0' : `--space-${({ 10: 'xs', 16: 'sm', 20: 'sm', 24: 'sm', 30: 'md', 50: 'lg', 60: 'lg', 100: 'xl', 200: 'xl' })[step]}`]),
  ['--page-inline', '--page-inset'],
  ['--content-inline', '--width-content (as a max-width)'],
  ['--section-block', '--section-space'],
  ['--fluid-gap', '--section-gap'],
]);
const isDeleted = name => DELETED.has(name) || /^--(padding|gap)-/.test(name);
const replacementFor = name => DELETED.get(name) ?? 'a component, or one of --space-xs … --space-xl';

/** Custom properties declared in CSS: name → values. Used to resolve local aliases like --x: var(--space-md). */
export function customProperties(chunks) {
  const map = new Map();
  for (const { css, inline } of chunks) {
    for (const { property, value } of declarations(css, inline)) {
      if (property.startsWith('--')) map.set(property, [...(map.get(property) ?? []), value]);
    }
  }
  return map;
}

function spacingSafeVar(name, locals, seen = new Set()) {
  if (spacingTokenNames.includes(name)) return true;
  if (seen.has(name) || !locals.has(name)) return false;
  seen.add(name);
  return locals.get(name).every(value => !valueProblem(value, locals, seen));
}

/** Why a value can't be used for spacing, or undefined when it's fine. */
function valueProblem(value, locals, seen = new Set()) {
  if (FLUID.test(value)) return 'fluid value (clamp/min/max) makes in-between sizes; use a responsive token such as --page-inset';
  const raw = value.match(RAW_LENGTH);
  if (raw) return `raw length "${raw[0]}"; use a spacing token`;
  for (const call of value.matchAll(/calc\(/g)) {
    if (!/^calc\(\s*-1\s*\*\s*var\(--[\w-]+\)\s*\)/.test(value.slice(call.index))) return 'calc() makes new sizes; only calc(-1 * var(--space-…)) is allowed';
  }
  for (const [, name] of value.matchAll(VAR)) {
    if (!spacingSafeVar(name, locals, new Set(seen))) return `${name} is not a spacing token; use --space-${spaceSteps.join('/')} or a component gap prop`;
  }
  return undefined;
}

const TAILWIND_SPACING = /^(?:[\w-]+:)*!?-?(?:(?:m|p)[xytrblse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|start|end)-(?:\d|px\b|\[|auto\b|full\b)/;

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

/**
 * Problems in one file: [{ file, line, message }].
 * `locals` are custom properties declared across all checked files (defaults to this file's own).
 */
export function lintSource(source, file, locals) {
  const chunks = cssChunks(source, file);
  locals ??= customProperties(chunks);
  const problems = [];
  const report = (index, message) => problems.push({ file, line: lineOf(source, index), message });

  for (const { css, offset, inline } of chunks) {
    for (const { property, value, index } of declarations(css, inline)) {
      if (!isSpacingProperty(property)) continue;
      if (isPage(file)) { report(offset + index, `${property}: pages don't set spacing; use components and their gap prop`); continue; }
      const problem = valueProblem(value, locals);
      if (problem) report(offset + index, `${property}: ${value} — ${problem}`);
    }
  }
  // Token names are checked anywhere they appear, including scripts and inline styles.
  for (const match of source.matchAll(VAR)) {
    const name = match[1];
    if (isDeleted(name)) report(match.index, `${name} was deleted; use ${replacementFor(name)}`);
    else if (name.startsWith('--space-') && !spacingTokenNames.includes(name)) report(match.index, `${name} is outside the 5 spacing steps (${spaceSteps.join(', ')})`);
  }
  if (!file.endsWith('.css')) {
    for (const match of source.matchAll(/\sclass=(?:"([^"]*)"|'([^']*)')/g)) {
      const classes = (match[1] ?? match[2]).split(/\s+/).filter(name => TAILWIND_SPACING.test(name));
      if (classes.length) report(match.index, `Tailwind spacing classes (${classes.join(' ')}) aren't allowed; use components`);
    }
  }
  // Pages only compose components: no styles, inline styles or class names of their own (rule 7).
  if (isSitePage(file) && file.endsWith('.astro')) {
    const template = source.replace(/^---[\s\S]*?\n---/, match => ' '.repeat(match.length));
    for (const match of template.matchAll(/<style\b|\sstyle=|\sclass(?::list)?=/g)) {
      report(match.index, `${match[0].trim()}: pages only compose components from src/components/site; add a prop or variant to a component instead`);
    }
  }
  return problems;
}

/** Tokens must stick to the 5 steps: the spacing group is exactly xs–xl, and responsive aliases only step between them. */
export function tokenProblems(groups = tokenGroups) {
  const problems = [];
  const spacing = groups.find(group => group.slug === 'spacing');
  const expected = spaceSteps.map(step => `--space-${step}`);
  if (!spacing || spacing.tokens.map(t => t.name).join() !== expected.join()) problems.push(`Spacing tokens must be exactly ${expected.join(', ')}.`);
  for (const t of groups.flatMap(group => group.tokens)) {
    if (/^--(padding|gap)-/.test(t.name)) problems.push(`${t.name}: padding and gap tokens were removed; components own their spacing.`);
    for (const key of ['useFor', 'avoid', 'example']) if (!t[key]?.trim()) problems.push(`${t.name}: missing ${key}.`);
    if (t.steps) {
      for (const value of [t.value, ...t.steps.map(step => step.value)]) {
        if (!expected.some(name => value === `var(${name})`)) problems.push(`${t.name}: responsive value "${value}" must be one of the 5 spacing steps.`);
      }
    }
  }
  return problems;
}

// ---------- reference ----------

export async function loadComponentDocs(root = ROOT) {
  const files = [];
  for (const source of componentSources) {
    const full = path.join(root, source);
    if (source.endsWith('/')) files.push(...(await walk(full)).filter(file => file.endsWith('.astro')).sort());
    else files.push(full);
  }
  const docs = [];
  for (const file of files) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const doc = parseComponentDoc(await readFile(file, 'utf8'), rel);
    docs.push(doc ?? { name: path.basename(file, '.astro'), file: rel, missing: true });
  }
  return docs;
}

export function componentDocProblems(docs) {
  return docs.flatMap(doc => doc.missing
    ? [`${doc.file}: add a usage block (/** @component Name … @use … @avoid … @example … */).`]
    : ['purpose', 'useFor', 'avoid', 'example'].filter(key => !doc[key]).map(key => `${doc.file}: usage block is missing ${key === 'purpose' ? 'a one-line purpose' : '@' + ({ useFor: 'use', avoid: 'avoid', example: 'example' })[key]}.`));
}

const cell = text => String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function renderReference(docs) {
  const out = [];
  const push = (...lines) => out.push(...lines);
  push(
    '# Design system reference',
    '',
    '<!-- Generated by `pnpm design:docs` from src/design-system/tokens.ts and the usage blocks in src/components/site/*.astro and src/layouts/BaseLayout.astro. Do not edit by hand; `pnpm check` fails when this file is out of date. -->',
    '',
    'Read this before building or changing a page. `docs/design-rules.md` holds the rules above the components (where content lives, motion).',
    '',
    '## Rules',
    '',
    '1. Wrap the page in `BaseLayout`. Build it only from the components below. Put `Split` and `Section` directly inside `BaseLayout`; use `Stack` and `Grid` inside them.',
    '2. Pages never set margin, padding, gap or inset. Components own their spacing. To change space between things, pass a `gap` prop: `xs`, `sm`, `md`, `lg` or `xl`.',
    `3. Spacing has five steps: ${spaceSteps.map(step => `\`--space-${step}\``).join(', ')}. No raw px/rem/em, no clamp()/calc() sizes, no other spacing tokens.`,
    '4. Use color, type, corner and border tokens by their role (see "Use for"). Don\'t invent new values; if something is missing, add it as a new token in the same change.',
    '5. If no component fits, add a small one in `src/components/site/` with a usage block (copy an existing one), then run `pnpm design:docs`. Keep it to what the page needs.',
    '6. Sanity (through `contentRepository`) holds only content that changes often: events, news, newsletters, notices, hours, fundraisers, site settings. Everything else (service details, prices, fees, About Us, ways to help, page photos) is written in the page file in Figma\'s wording; never add Sanity fields for it. See docs/design-rules.md.',
    '7. Pages have no `<style>`, `style=` or `class=` of their own, and no raw colors, sizes or spacing. If Figma needs something new, extend a component with a prop or variant (never copy one) or add a reusable one. A Figma value that isn\'t a token is snapped to the nearest token and listed in the PR.',
    '8. Every page passes BaseLayout its own `title` ("<Page> | Cottonwood Community Library") and `description` (1–2 sentences from facts on the page), and an `image` when it has its own photo. The canonical address, share card, schema.org data and sitemap entry are automatic. See "Search and sharing" in docs/design-rules.md.',
    '',
    `Breakpoints used inside components (min-width): ${Object.entries(breakpoints).map(([name, value]) => `${name} \`${value}\` (${parseFloat(value) * 16}px)`).join(', ')}.`,
    '',
    '`pnpm check` enforces rules 2, 3 and 7 on `src/styles/base.css`, `BaseLayout.astro`, `src/components/site/*` and every page that imports them, and checks that this file is up to date.',
    '',
    '## Tokens',
    '',
  );
  for (const group of tokenGroups) {
    push(`### ${group.title}`, '', group.note, '', '| Token | Value | Use for | Don\'t use for | Example |', '| --- | --- | --- | --- | --- |');
    for (const t of group.tokens) {
      const steps = t.steps ? ` → ${t.steps.map(step => `\`${step.value}\` from ${step.minWidth}`).join(', ')}` : '';
      push(`| \`${t.name}\` | \`${cell(t.value)}\`${t.detail ? ` (${cell(t.detail)})` : ''}${steps} | ${cell(t.useFor)} | ${cell(t.avoid)} | \`${cell(t.example)}\` |`);
    }
    push('');
  }
  const pageComponents = docs.filter(doc => !doc.internal);
  const internal = docs.filter(doc => doc.internal);
  push('## Components', '', `Import from \`src/components/site/\` (BaseLayout from \`src/layouts/\`). Each component's usage block in its file is the source for this section.`, '');
  push('| Component | Purpose |', '| --- | --- |', ...pageComponents.map(doc => `| [${doc.name}](#${doc.name.toLowerCase()}) | ${cell(doc.purpose)} |`), '');
  for (const doc of pageComponents) {
    push(`### ${doc.name}`, '', `\`${doc.file}\` — ${doc.purpose}`, '', `- **Use for:** ${doc.useFor}`, `- **Don't use for:** ${doc.avoid}`, '');
    if (doc.props) push('```ts', doc.props, '```', '');
    push('```astro', doc.example, '```', '');
  }
  push('### Added by BaseLayout', '', 'Pages never place these; they are listed so you know they exist.', '');
  for (const doc of internal) push(`- **${doc.name}** (\`${doc.file}\`): ${doc.purpose} ${doc.avoid ? `Don't: ${doc.avoid}` : ''}`.trimEnd());
  push('');
  return out.join('\n');
}

// ---------- commands ----------

export async function checkRepository(root = ROOT) {
  const problems = tokenProblems().map(message => ({ file: 'src/design-system/tokens.ts', line: 0, message }));
  const docs = await loadComponentDocs(root);
  problems.push(...componentDocProblems(docs).map(message => ({ file: message.split(':')[0], line: 0, message: message.slice(message.indexOf(':') + 2) })));
  const files = await scopedFiles(root);
  const sources = new Map(await Promise.all(files.map(async file => [file, await readFile(path.join(root, file), 'utf8')])));
  const locals = customProperties([...sources].flatMap(([file, source]) => cssChunks(source, file)));
  for (const [file, source] of sources) problems.push(...lintSource(source, file, locals));
  if (!docs.some(doc => doc.missing)) {
    const current = await readFile(path.join(root, REFERENCE), 'utf8').catch(() => '');
    if (current !== renderReference(docs)) problems.push({ file: REFERENCE, line: 0, message: 'out of date; run `pnpm design:docs` and commit the result.' });
  }
  return { problems, files };
}

async function main(command) {
  if (command === 'docs') {
    const docs = await loadComponentDocs();
    const missing = componentDocProblems(docs);
    if (missing.length) { console.error(missing.join('\n')); process.exit(1); }
    await writeFile(path.join(ROOT, REFERENCE), renderReference(docs));
    console.log(`Wrote ${REFERENCE}.`);
    return;
  }
  if (command === 'check') {
    const { problems, files } = await checkRepository();
    if (problems.length) {
      console.error(`Design-system check failed (${problems.length}):`);
      for (const { file, line, message } of problems) console.error(`- ${file}${line ? `:${line}` : ''}: ${message}`);
      console.error('See docs/design-system.md.');
      process.exit(1);
    }
    console.log(`Design-system check passed (${files.length} files).`);
    return;
  }
  console.error('Usage: node scripts/design-system.mjs docs|check');
  process.exit(2);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main(process.argv[2]);
