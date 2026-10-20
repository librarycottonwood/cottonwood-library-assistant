import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { fetchSanitySnapshot, sanityConfig, validateSanitySnapshot, type SanityContent } from './sanity.mjs';
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
    return validateSanitySnapshot(snapshot, config);
  })();
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
