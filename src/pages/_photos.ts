// Page helper (the leading _ keeps Astro from making it a route): a fitting library photo for an event or
// news post that has none in Sanity, so the Events & News, event and news pages never show an empty photo box.
import type { LibraryImage } from '../content/types';

/** Picks by what the event or post is about; the library's reading room otherwise. */
export function fallbackPhoto(...text: (string | undefined)[]): LibraryImage {
  const about = text.join(' ');
  if (/book sale/i.test(about)) return { key: 'bookSale', alt: 'Book-sale shelves in the library’s back hall.' };
  if (/roof|building|neighbo/i.test(about)) return { key: 'exterior', alt: 'The Cottonwood Community Library building.' };
  if (/new (books|reads)|display/i.test(about)) return { key: 'newReads', alt: 'New books on display at the library.' };
  return { key: 'interior', alt: 'Inside the Cottonwood Community Library.' };
}
