import type { LibraryEvent, LibraryPost } from './types';
import { homeContent } from './seed';

// Published old-site announcement checked October 5: Friday/Saturday October
// 16–17, 10 a.m.–2 p.m. The weekday/publication date establish the 2026 year.
export const bookSaleDateLabel = 'October 16–17 · 10 a.m.–2 p.m.';
export const libraryEvents: LibraryEvent[] = ['16', '17'].map(day => ({
  id: `book-sale-october-${day}`, title: 'Quarterly book sale',
  startsAt: `2026-10-${day}T10:00:00-07:00`, endsAt: `2026-10-${day}T14:00:00-07:00`,
  summary: 'Back-door entry · Cash only', href: '/fundraising-events/book-sale/',
}));

// September 29 copy is a proposed library update based on Jaden's meeting notes.
// The newsletter has no verified publication day, so it remains undated.
// External articles can supply externalUrl and sourceLabel without copying them.
export const libraryPosts: LibraryPost[] = [
  {
    id: 'october-book-sale', title: 'Our next book sale: October 16–17',
    publishedAt: '2026-10-01', category: 'Library news',
    summary: 'Friday and Saturday, 10 a.m.–2 p.m. Back-door entry; cash sales only.',
    href: '/librarynews/october-book-sale/',
    paragraphs: ['Our next quarterly book sale is Friday and Saturday, October 16–17, from 10 a.m. to 2 p.m. at Cottonwood Community Library.', 'Please enter through the back door. Sales are cash only. Your purchases support our independent community library.'],
  },
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
