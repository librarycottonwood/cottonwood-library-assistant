/** Shared content rules: see rules.mjs. Used by the website build and Sanity Studio. */
export type Normalized = { ok: true; value: string; note?: string } | { ok: false; reason: string };
export const SLUG_PATTERN: RegExp;
export const LIBRARY_TIMEZONE: 'America/Los_Angeles';
export function slugify(value: unknown): string;
export function normalizeIdentifier(value: unknown): Normalized;
export function normalizePhone(value: unknown, options?: { requireUS?: boolean }): Normalized;
export function normalizeLink(value: unknown): Normalized;
export function normalizeDay(value: unknown): Normalized;
export function normalizeInstant(value: unknown): Normalized;
export function pacificWallClock(milliseconds: number): string;
export function pacificOffsets(wallClock: string): number[];
