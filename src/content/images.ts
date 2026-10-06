import type { ImageMetadata } from 'astro';
import exterior from '../../library-files/images/library-in-red-white-and-blue.jpeg';
import computerLab from '../../library-files/images/computer-lab.jpeg';
import storytime from '../../library-files/images/storytime-corner.jpeg';
import stacks from '../../library-files/images/stacks.jpeg';
import books from '../../library-files/images/stack-of-books.jpg';
import interior from '../../library-files/images/plan-your-visit-hero.jpg';
import newsletter from '../assets/newsletter-cover.jpg';
import watercolor from '../../library-files/images/library-painting.jpeg';

import mainStreetReaders from '../../library-files/images/main-street-readers.png';
import bookClub from '../../library-files/images/book-club.png';
import bookDonation from '../../library-files/images/book-donor.png';
import bookSale from '../../library-files/images/back-hall-bookshelf.jpeg';
import childrensBookSale from '../../library-files/images/book-sale-childrens.jpeg';
import holidayMarket from '../../library-files/images/holiday-market-storefront.png';
import firstFive from '../../library-files/images/first-5-shasta.jpg';
import communityFoundation from '../../library-files/images/community-foundation-of-the-north-state.png';
import founders from '../../library-files/images/founders-plaque.jpeg';

const images: Record<string, ImageMetadata> = { exterior, computerLab, storytime, stacks, books, interior, newsletter, watercolor, mainStreetReaders, bookClub, bookDonation, bookSale, childrensBookSale, holidayMarket, firstFive, communityFoundation, founders };

export function resolveImage(key: string): ImageMetadata {
  const image = images[key];
  if (!image) throw new Error(`Unknown library image: ${key}`);
  return image;
}
