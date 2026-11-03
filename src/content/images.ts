import type { ImageMetadata } from 'astro';
import exterior from '../assets/images/library-in-red-white-and-blue.jpeg';
import computerLab from '../assets/images/computer-stations.jpg';
import storytime from '../assets/images/storytime-room.jpg';
import books from '../assets/images/stack-of-books.jpg';
import interior from '../assets/images/plan-your-visit-hero.jpg';
import newsletter from '../assets/newsletter-cover.jpg';
import watercolor from '../assets/images/library-painting.jpeg';
import entrance from '../assets/images/library-entrance.jpg';
import newReads from '../assets/images/junior-readers-display.jpg';
import copyRoom from '../assets/images/copy-room.jpg';
import bookDrop from '../assets/images/caterpillar-book-drop.jpg';
import readingNook from '../assets/images/sunny-reading-nook.jpg';

import mainStreetReaders from '../assets/images/main-street-readers.png';
import bookClub from '../assets/images/book-club.png';
import bookDonation from '../assets/images/book-donor.png';
import bookSale from '../assets/images/back-hall-bookshelf.jpeg';
import childrensBookSale from '../assets/images/book-sale-childrens.jpeg';
import holidayMarket from '../assets/images/holiday-market-storefront.jpg';
import firstFive from '../assets/images/first-5-shasta.jpg';
import communityFoundation from '../assets/images/community-foundation-of-the-north-state.png';
import founders from '../assets/images/founders-plaque.jpeg';
// Page photos from Figma and the old Square site's Our Story page (Nov 2026).
import borrowingShelves from '../assets/images/borrowing-shelves-red-chairs.jpg';
import computerRoom from '../assets/images/computer-room-wifi.jpg';
import cattleDrivePainting from '../assets/images/cottonwood-cattle-drive-painting.jpg';
import foundersPortrait from '../assets/images/founders-portrait-doc-reifert.jpg';
import libraryBuilding from '../assets/images/library-building-exterior.jpg';
import countyCertificate from '../assets/images/county-10th-anniversary-certificate.jpg';
import thankYouNote from '../assets/images/caterpillar-mural-thank-you-note.jpg';
import muralOrchard from '../assets/images/childrens-mural-orchard.jpg';
import storyTimeCorner from '../assets/images/story-time-corner.jpg';
// Cropped from the Figma About Us frame (the Square site had no copy).
import muralPicnicTable from '../assets/images/childrens-mural-picnic-table.jpg';

const images: Record<string, ImageMetadata> = { exterior, computerLab, storytime, books, interior, newsletter, watercolor, entrance, newReads, copyRoom, bookDrop, readingNook, mainStreetReaders, bookClub, bookDonation, bookSale, childrensBookSale, holidayMarket, firstFive, communityFoundation, founders, borrowingShelves, computerRoom, cattleDrivePainting, foundersPortrait, libraryBuilding, countyCertificate, thankYouNote, muralOrchard, storyTimeCorner, muralPicnicTable };

export function resolveImage(key: string): ImageMetadata {
  const image = images[key];
  if (!image) throw new Error(`Unknown library image: ${key}`);
  return image;
}
