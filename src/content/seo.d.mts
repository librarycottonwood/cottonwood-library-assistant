/** Search-engine and AI-answer data: see seo.mjs. */
import type { HomeContent, LibraryEvent, LibraryPost } from './types';
type Node = Record<string, unknown>;
type Library = HomeContent['library'];
export const SITE_URL: string;
export const LIBRARY_POINT: [number, number];
export function parseDays(text: string): string[] | null;
export function parseHours(text: string): { opens: string; closes: string } | null;
export function openingHours(rows: { days: string; hours: string }[]): Node[] | null;
export function libraryNode(library: Library, options?: { image?: string; description?: string }): Node;
export function websiteNode(library: Library): Node;
export function eventNodes(sessions: LibraryEvent[], options: { url: string; image?: string }): Node[];
export function articleNode(post: LibraryPost, options: { url: string; image?: string }): Node;
export function faqNode(items: { question: string; answer: string }[], url: string): Node;
export function jsonLd(nodes: (Node | null | undefined | false)[]): string;
