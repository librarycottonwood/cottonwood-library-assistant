import type { LibraryEvent, LibraryPost } from './types';
import { homeContent } from './seed';

// No confirmed event dates were supplied. Add approved ISO timestamps with an
// explicit Pacific offset here; never turn regular schedules into occurrences.
export const libraryEvents: LibraryEvent[] = [];

// September 29 copy is a proposed library update based on Jaden's meeting notes.
// The newsletter has no verified publication day, so it remains undated.
// External articles can supply externalUrl and sourceLabel without copying them.
export const libraryPosts: LibraryPost[] = [
  {
    id: 'community-library', title: 'A library powered by neighbors',
    publishedAt: '2026-09-29', category: 'Your support matters',
    summary: 'No county or taxpayer funding. Your gifts keep this independent library open.',
    href: '/librarynews/community-library/',
    paragraphs: [
      'Cottonwood Community Library receives no county or taxpayer funding. Community donations keep its books, computers and programs available to our neighbors.',
      'Our larger book sales happen roughly quarterly, when storage fills up. Shop the sales or make a financial gift to help keep the doors open.',
    ],
  },
  {
    id: 'summer-2026', title: 'Summer at the library', publishedAt: null,
    dateLabel: 'Summer 2026', category: 'Newsletter',
    summary: homeContent.newsletter.summary,
    href: '/librarynews/summer-2026/', paragraphs: [],
  },
];
