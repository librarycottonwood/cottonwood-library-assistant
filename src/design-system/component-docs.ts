/**
 * Reads the usage block at the top of each design-system component, so the component file stays
 * the single source for its notes. Used by the /components catalog and scripts/design-system.mjs.
 *
 * Block format (inside the component's frontmatter):
 *   /**
 *    * @component Name
 *    * @internal            (optional: BaseLayout adds it; pages don't use it)
 *    * One-line purpose.
 *    * @use What to use it for.
 *    * @avoid What not to use it for, and what to use instead.
 *    * @example
 *    * <Name prop="value">…</Name>
 *    *\/
 */
export interface ComponentDoc {
  name: string;
  file: string;
  purpose: string;
  useFor: string;
  avoid: string;
  example: string;
  /** The component's Props interface, as written. */
  props: string;
  internal: boolean;
}

/** Folders whose .astro files make up the design system (paths from the repo root). */
export const componentSources = ['src/layouts/BaseLayout.astro', 'src/components/site/'];

export function parseComponentDoc(source: string, file: string): ComponentDoc | undefined {
  const block = source.match(/\/\*\*([\s\S]*?)\*\//g)?.find(comment => comment.includes('@component'));
  if (!block) return undefined;
  const lines = block.replace(/^\/\*\*|\*\/$/g, '').split('\n').map(line => line.replace(/^\s*\* ?/, '').replace(/\s+$/, ''));
  const fields: Record<string, string[]> = { purpose: [] };
  let current = 'purpose';
  let name = '';
  let internal = false;
  for (const line of lines) {
    const tag = line.match(/^@(\w+)\s*(.*)$/);
    if (tag) {
      const [, key, rest] = tag as unknown as [string, string, string];
      if (key === 'component') { name = rest.trim(); current = 'purpose'; continue; }
      if (key === 'internal') { internal = true; continue; }
      current = key;
      fields[current] = rest ? [rest] : [];
      continue;
    }
    (fields[current] ??= []).push(line);
  }
  const text = (key: string) => (fields[key] ?? []).join(' ').replace(/\s+/g, ' ').trim();
  return {
    name,
    file,
    purpose: text('purpose'),
    useFor: text('use'),
    avoid: text('avoid'),
    example: (fields.example ?? []).join('\n').replace(/^\n+|\n+$/g, ''),
    props: extractProps(source),
    internal,
  };
}

function extractProps(source: string): string {
  const start = source.search(/(interface Props\b|type Props\s*=)/);
  if (start < 0) return '';
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  return '';
}
