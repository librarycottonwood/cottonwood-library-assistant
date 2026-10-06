import type { LibraryEvent, LibraryPost } from './types';

export function upcomingEvents(events: LibraryEvent[], now = Date.now()): LibraryEvent[] {
  return events.filter(event => {
    const zoned = (value: string) => /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value);
    const start = Date.parse(event.startsAt);
    const end = event.endsAt ? Date.parse(event.endsAt) : start;
    if (!zoned(event.startsAt) || (event.endsAt && !zoned(event.endsAt)) || !Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      throw new Error(`Invalid event dates: ${event.id}`);
    }
    return end >= now;
  }).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export function newestPosts(posts: LibraryPost[]): LibraryPost[] {
  return [...posts].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

export function postDate(post: LibraryPost): string {
  return post.publishedAt
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${post.publishedAt}T12:00:00Z`))
    : post.dateLabel ?? 'From the library';
}
