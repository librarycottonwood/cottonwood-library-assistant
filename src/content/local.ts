/** Prototype/import provider only. Production Sanity errors never load these records. */
import { homeContent } from './seed';
import { supportContent } from './support';
import { libraryEvents, libraryPosts } from './editorial';
import { libraryNotices } from './notices';
import type { ContentRepository } from './repository';
export const localContentRepository: ContentRepository = {
  async getHome() { return homeContent; },
  async getSupport() { return supportContent; },
  async getEvents() { return libraryEvents; },
  async getPosts() { return libraryPosts; },
  async getNotices() { return libraryNotices; },
  async getNewsletters() { return [{ id: 'summer-2026', ...homeContent.newsletter }]; },
};
