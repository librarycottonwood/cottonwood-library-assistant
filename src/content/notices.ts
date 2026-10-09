import type { LibraryNotice } from './types';

/** Site-wide banner shown above the header on every page, such as a holiday closure.
 * Dates are YYYY-MM-DD in Pacific time and both days are included. The banner appears
 * on startsOn and disappears after endsOn on its own. An empty list shows no banner.
 *
 * Example entry (copy inside the brackets below):
 *   {
 *     id: 'thanksgiving-closure-2026',
 *     message: 'The library is closed Thursday–Saturday, November 26–28, for Thanksgiving.',
 *     startsOn: '2026-11-16',
 *     endsOn: '2026-11-28',
 *     link: { label: 'See regular hours', href: '/#visit' }, // optional
 *   },
 */
export const libraryNotices: LibraryNotice[] = [];
