export interface SearchEntry { title: string; section: string; href: string; text: string; }
const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function searchEntries(entries: SearchEntry[], query: string) {
  const terms = normalize(query).match(/[\p{L}\p{N}]+/gu) ?? [];
  if (!terms.length) return [];
  return entries.map(entry => {
    const title = normalize(entry.title);
    const section = normalize(entry.section);
    const body = normalize(entry.text);
    const all = `${title} ${section} ${body}`;
    if (!terms.every(term => all.includes(term))) return { entry, score: 0 };
    const score = terms.reduce((total, term) => total + (title.includes(term) ? 10 : section.includes(term) ? 3 : 1), 0)
      + (title.includes(normalize(query.trim())) ? 15 : 0);
    return { entry, score };
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score).map(({ entry }) => entry);
}

export function searchExcerpt(text: string, query: string) {
  const terms = normalize(query).match(/[\p{L}\p{N}]+/gu) ?? [];
  const matches = terms.map(term => normalize(text).indexOf(term)).filter(index => index >= 0);
  const match = matches.length ? Math.min(...matches) : 0;
  const start = Math.max(0, text.lastIndexOf(' ', Math.max(0, match - 45)));
  const excerpt = text.slice(start, start + 180).trim();
  return `${start > 0 ? '…' : ''}${excerpt}${start + 180 < text.length ? '…' : ''}`;
}
