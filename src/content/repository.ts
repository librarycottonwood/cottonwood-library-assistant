import type { HomeContent, SupportContent, LibraryEvent, LibraryPost } from './types';
import { homeContent } from './seed';
import { supportContent } from './support';
import { libraryEvents, libraryPosts } from './editorial';

export interface ContentRepository {
  getHome(): Promise<HomeContent>;
  getSupport(): Promise<SupportContent>;
  getEvents(): Promise<LibraryEvent[]>;
  getPosts(): Promise<LibraryPost[]>;
}

// Deliberately local for the UI prototype. A Sanity implementation can map
// published CMS documents into HomeContent without changing page components.
// Do not add a silent seed fallback to a future production CMS implementation.
const localContentRepository: ContentRepository = {
  async getHome() { return homeContent; },
  async getSupport() { return supportContent; },
  async getEvents() { return libraryEvents; },
  async getPosts() { return libraryPosts; },
};

export const contentRepository = localContentRepository;
