// Support Us "Other ways to help" (Figma 1012:1364), in Figma's wording. Shared by /donate/ and each
// /donate/<slug>/ page. Each card links to the way-to-help page of the same id; a card whose page
// doesn't exist (no matching "Ways to help" record) is left out.
import type { LibraryImage, SupportInitiative } from '../../content/types';

export interface OtherWay { id: string; title: string; summary: string; image: LibraryImage }

const otherWays: OtherWay[] = [
  { id: 'donate-books', title: 'Donate books & DVDs', summary: 'We will gladly accept your slightly new, gently used books and unblemished DVDs.', image: { key: 'newReads', alt: 'Library shelves and a table of new books on display.' } },
  { id: 'book-sale', title: 'Shop the book sale', summary: 'Check the library carts in the lobby & the bookshelf in the back hall to see what’s for sale.', image: { key: 'bookSale', alt: 'The book-sale bookshelf in the library’s back hall, with its price list.' } },
  { id: 'wow-points', title: 'Donate WOW points', summary: 'You can donate your Holiday loyalty points to us when you check out at the register! Ask your cashier.', image: { key: 'holidayMarket', alt: 'The entrance of the Holiday Market grocery store.' } },
];

export function otherWaysToHelp(initiatives: SupportInitiative[], except?: string): OtherWay[] {
  return otherWays.filter(way => way.id !== except && initiatives.some(initiative => initiative.id === way.id));
}
