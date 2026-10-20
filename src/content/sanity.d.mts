import type { HomeContent, SupportContent, LibraryEvent, LibraryPost, LibraryNotice, LibraryNewsletter } from './types';
export interface SanityConfig { projectId: string; dataset: string; apiVersion: string; }
export interface SanitySnapshot { schemaVersion: 1; projectId: string; dataset: string; documents: Record<string, unknown>[]; }
export interface SanityContent { home: HomeContent; support: SupportContent; events: LibraryEvent[]; posts: LibraryPost[]; notices: LibraryNotice[]; newsletters: LibraryNewsletter[]; }
export const SANITY_API_VERSION: string;
export const SANITY_QUERY: string;
export const SANITY_DOCUMENT_TYPES: string[];
export function sanityConfig(env?: Record<string, string | undefined>): SanityConfig;
export function safeHref(value: unknown, at?: string): string;
export function fetchSanitySnapshot(config: SanityConfig, options?: {fetch?: typeof fetch; token?: string}): Promise<SanitySnapshot>;
export function validateSanitySnapshot(snapshot: unknown, expected?: SanityConfig): SanityContent;
