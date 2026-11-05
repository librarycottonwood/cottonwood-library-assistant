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
// Library photos from the board's "Unused Library Pics" Drive folder (Todd Haines, Oct 2026).
import storyTimeSession from '../assets/images/story-time-session.jpg';
import storyTimeBeeColoring from '../assets/images/story-time-bee-coloring.jpg';
import storyTimeSnailCraft from '../assets/images/story-time-snail-craft.jpg';
import storyTimeButterflyCraft from '../assets/images/story-time-butterfly-craft.jpg';
import bookClubMeeting from '../assets/images/book-club-meeting.jpg';
// Cropped from the Figma About Us frame (the Square site had no copy).
import muralPicnicTable from '../assets/images/childrens-mural-picnic-table.jpg';
// Cropped from the Figma Events & News frame (the Square site had no copy).
import adventureMural from '../assets/images/adventure-awaits-mural.jpg';
// November photography refresh. Originals remain available for recovery and artwork.
import borrowingV2 from '../assets/images/borrowing-shelves-v2.jpg';
import computersV2 from '../assets/images/computers-wifi-v2.jpg';
import copyRoomV2 from '../assets/images/copy-room-v2.jpg';
import entranceV2 from '../assets/images/library-entrance-v2.jpg';
import storytimeRoomV2 from '../assets/images/storytime-room-v2.jpg';
import exteriorOriginal from '../assets/images/library-exterior-original.jpg';
import exteriorPolished from '../assets/images/library-exterior-polished.jpg';
import roofExterior from '../assets/images/library-roof-original.jpg';
import readingTable from '../assets/images/reading-table-v3.jpg';
import bookSaleV2 from '../assets/images/book-sale-shelves-v2.jpg';
import childrensSaleV2 from '../assets/images/childrens-book-sale-v2.jpg';
import readingNookV2 from '../assets/images/reading-nook-v2.jpg';
import bookDropV2 from '../assets/images/book-drop-v2.jpg';
import holidayMarketV2 from '../assets/images/holiday-market-v2.jpg';
import storytimeSession from '../assets/images/storytime-session.jpg';
import storytimeFacebook from '../assets/images/storytime-facebook.jpg';
import adventureMuralOriginal from '../assets/images/adventure-mural-original.jpg';

// Service logos from their official websites; see docs/academy-images.md.
import academyChatgpt from '../assets/images/academy-chatgpt.png';
import academyGivebutter from '../assets/images/academy-givebutter.png';
import academyBuffer from '../assets/images/academy-buffer.png';
import academyDrive from '../assets/images/academy-drive.png';

import academyGithub from '../assets/images/academy-github.png';
import academyCloudflare from '../assets/images/academy-cloudflare.png';
import academySanity from '../assets/images/academy-sanity.png';
import academySquarespace from '../assets/images/academy-squarespace.png';
import academyGmail from '../assets/images/academy-gmail.png';
import academySquare from '../assets/images/academy-square.png';

const images: Record<string, ImageMetadata> = { academyGithub, academyCloudflare, academySanity, academySquarespace, academyGmail, academySquare, academyChatgpt, academyGivebutter, academyBuffer, academyDrive, exterior, computerLab, storytime, books, interior, newsletter, watercolor, entrance, newReads, copyRoom, bookDrop, readingNook, mainStreetReaders, bookClub, bookDonation, bookSale, childrensBookSale, holidayMarket, firstFive, communityFoundation, founders, borrowingShelves, computerRoom, cattleDrivePainting, foundersPortrait, libraryBuilding, countyCertificate, thankYouNote, muralOrchard, storyTimeCorner, muralPicnicTable, adventureMural, borrowingV2, computersV2, copyRoomV2, entranceV2, storytimeRoomV2, exteriorOriginal, exteriorPolished, roofExterior, readingTable, bookSaleV2, childrensSaleV2, readingNookV2, bookDropV2, holidayMarketV2, storytimeSession, storytimeFacebook, adventureMuralOriginal, storyTimeSession, storyTimeBeeColoring, storyTimeSnailCraft, storyTimeButterflyCraft, bookClubMeeting };

export function resolveImage(key: string): ImageMetadata {
  const image = images[key];
  if (!image) throw new Error(`Unknown library image: ${key}`);
  return image;
}
