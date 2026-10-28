// Component usage notes for the /components catalog, read from the same blocks as docs/design-system.md.
import { parseComponentDoc, type ComponentDoc } from './component-docs';

const sources = import.meta.glob(['/src/layouts/BaseLayout.astro', '/src/components/site/*.astro'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const order = (file: string) => (file.includes('/layouts/') ? '0' : '1') + file;
export const componentDocs: ComponentDoc[] = Object.entries(sources)
  .sort(([a], [b]) => order(a).localeCompare(order(b)))
  .flatMap(([file, source]) => parseComponentDoc(source, file.replace(/^\//, '')) ?? []);

export const componentAnchor = (name: string) => name.toLowerCase();
