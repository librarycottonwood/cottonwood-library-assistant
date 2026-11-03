// Support Us "Other ways to help" (Figma 1012:1364), in Figma's wording. Shared by /donate/ and each
// /donate/<slug>/ page. Each card links to the way-to-help page of the same id; a card whose page
// doesn't exist (no matching "Ways to help" record) is left out.
import type { LibraryImage, SupportInitiative } from '../../content/types';

export interface OtherWay { id: string; title: string; summary: string; image: LibraryImage }

const otherWays: OtherWay[] = [
  { id: 'donate-books', title: 'Donate books & DVDs', summary: 'Bring your gently used books and unblemished DVDs to the library.', image: { key: 'newReads', alt: 'Library shelves and a table of new books on display.' } },
  { id: 'book-sale', title: 'Shop the book sale', summary: 'Find used books for sale in the lobby and the back hall.', image: { key: 'bookSale', alt: 'The book-sale bookshelf in the library’s back hall, with its price list.' } },
  { id: 'wow-points', title: 'Donate WOW points', summary: 'Ask your Holiday Market cashier to donate your WOW points to us.', image: { key: 'holidayMarket', alt: 'The entrance of the Holiday Market grocery store.' } },
];

export function otherWaysToHelp(initiatives: SupportInitiative[], except?: string): OtherWay[] {
  return otherWays.filter(way => way.id !== except && initiatives.some(initiative => initiative.id === way.id));
}
