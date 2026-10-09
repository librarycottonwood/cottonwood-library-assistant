import type { HomeContent, SupportContent, LibraryEvent, LibraryNotice, LibraryPost } from './types';
import { homeContent } from './seed';
import { supportContent } from './support';
import { libraryEvents, libraryPosts } from './editorial';
import { libraryNotices } from './notices';

export interface ContentRepository {
  getHome(): Promise<HomeContent>;
  getSupport(): Promise<SupportContent>;
  getEvents(): Promise<LibraryEvent[]>;
  getPosts(): Promise<LibraryPost[]>;
  getNotices(): Promise<LibraryNotice[]>;
}

// Deliberately local for the UI prototype. A Sanity implementation can map
// published CMS documents into HomeContent without changing page components.
// Do not add a silent seed fallback to a future production CMS implementation.
const localContentRepository: ContentRepository = {
  async getHome() { return homeContent; },
  async getSupport() { return supportContent; },
  async getEvents() { return libraryEvents; },
  async getPosts() { return libraryPosts; },
  async getNotices() { return libraryNotices; },
};

export const contentRepository = localContentRepository;
