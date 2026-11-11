import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { fetchSanitySnapshot, sanityConfig, validateSanitySnapshot, type SanityContent } from './sanity.mjs';
import { wordFixtures } from './fixtures/newsletters';
import type { HomeContent, SupportContent, LibraryEvent, LibraryNotice, LibraryPost, LibraryNewsletter } from './types';

export interface ContentRepository {
  getHome(): Promise<HomeContent>;
  getSupport(): Promise<SupportContent>;
  getEvents(): Promise<LibraryEvent[]>;
  getPosts(): Promise<LibraryPost[]>;
  getNotices(): Promise<LibraryNotice[]>;
  getNewsletters(): Promise<LibraryNewsletter[]>;
}

const env = { ...import.meta.env, ...process.env };

// One validated snapshot feeds every route during the build. Reject promises stay
// rejected: a CMS outage cannot quietly mix old seed records into the website.
let content: Promise<SanityContent> | undefined;
async function sanityContent(): Promise<SanityContent> {
  return content ??= (async () => {
    const config = sanityConfig(env);
    const snapshotPath = env.SANITY_SNAPSHOT_PATH;
    const snapshot = snapshotPath ? JSON.parse(await readFile(snapshotPath, 'utf8')) : await fetchSanitySnapshot(config, { token: env.SANITY_READ_TOKEN });
    return withWordPreview(validateSanitySnapshot(snapshot, config));
  })();
}
/** Local design preview only: NEWSLETTER_WORD_PREVIEW=1 shows the test Word versions (src/content/fixtures/newsletters)
 * on the real published issues that do not have one yet. Refused in CI, which builds every preview and the live website. */
function withWordPreview(content: SanityContent): SanityContent {
  if (env.NEWSLETTER_WORD_PREVIEW !== '1') return content;
  if (env.CI) throw new Error('NEWSLETTER_WORD_PREVIEW is for local previews only. Remove it from this build.');
  const add = (issue: LibraryNewsletter) => issue.accessibleFile || !issue.id || !wordFixtures[issue.id] ? issue : { ...issue, accessibleFile: wordFixtures[issue.id] };
  const newsletters = content.newsletters.map(add);
  const current = content.home.newsletter && newsletters.find(issue => issue.id === content.home.newsletter!.id);
  return { ...content, newsletters, home: { ...content.home, newsletter: current ?? content.home.newsletter } };
}
const sanityRepository: ContentRepository = {
  async getHome() { return (await sanityContent()).home; },
  async getSupport() { return (await sanityContent()).support; },
  async getEvents() { return (await sanityContent()).events; },
  async getPosts() { return (await sanityContent()).posts; },
  async getNotices() { return (await sanityContent()).notices; },
  async getNewsletters() { return (await sanityContent()).newsletters; },
};
const source = env.LIBRARY_CONTENT_SOURCE ?? 'local';
if (source !== 'local' && source !== 'sanity') throw new Error('LIBRARY_CONTENT_SOURCE must be local or sanity');
export const contentSource = source;
export const contentRepository: ContentRepository = source === 'sanity' ? sanityRepository : (await import('./local')).localContentRepository;
