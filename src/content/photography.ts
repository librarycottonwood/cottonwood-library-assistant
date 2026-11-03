import type { LibraryImage } from './types';

// Page photography selected for the November refresh. Only these existing images
// are replaced; a later CMS upload keeps its own image, description and crop.
// Sources and the distinction between originals and reconstructions: docs/photography.md.
const photo = (key: string, alt: string, position?: string): LibraryImage => ({
  key, alt, fit: 'cover', ...(position ? { position } : {}),
});
const exterior = photo('exteriorPolished', 'Cottonwood Community Library, with its wooden sign, three narrow windows and covered entrance.');
const computers = photo('computersV2', 'Public computer stations along the wood-framed window in the library’s computer room.');
const shelves = photo('borrowingV2', 'Book-filled library shelves beside a round wooden table and burgundy chairs.');
const storytime = photo('storytimeSession', 'A library volunteer reads a picture book to children in the Story Time corner.', '50% 0%');
const sale = photo('bookSaleV2', 'The wooden book-sale bookshelf in the library’s back hall.');
const children = photo('childrensSaleV2', 'Children’s books on the library’s white book-sale shelves.');
const market = photo('holidayMarketV2', 'Holiday Market’s timber-framed entrance and shopping carts.');
const display = photo('readingTable', 'An open book and two closed books on a round library table beside burgundy chairs.', '50% 60%');
const readers = display;
const club = photo('readingNookV2', 'Wooden chairs and book-filled shelves in the library’s sunlit reading nook.');
const community = photo('storytimeFacebook', 'A library volunteer sharing a picture book with children gathered in the Story Time corner.', '50% 55%');

const byKey: Record<string, LibraryImage> = {
  exterior, libraryBuilding: exterior, computerLab: computers, computerRoom: computers,
  communityExterior: community,
  interior: shelves, borrowingShelves: shelves,
  copyRoom: photo('copyRoomV2', 'The library’s white copier beside the wooden windows and reading table.'),
  entrance: photo('entranceV2', 'The library’s tree emblem and Cottonwood sign beside the entrance to the book stacks.'),
  storytime, storyTimeCorner: photo('storytimeRoomV2', 'The Story Time room with wooden chairs, a teal reading chair, an alphabet rug and hanging clouds.'),
  bookSale: sale, childrensBookSale: children, bookDonation: display, books: display, newReads: display,
  holidayMarket: market,
  readingNook: photo('readingNookV2', 'Wooden chairs and a patterned armchair beside the library’s large shaded window.'),
  bookDrop: photo('bookDropV2', 'The outdoor book return with its hand-painted caterpillar and Bookdrop lettering.'),
  mainStreetReaders: readers, bookClub: club,
  adventureMural: photo('adventureMuralOriginal', 'The full Adventure Awaits mural beside the children’s craft table.'),
};

/** A roof fundraiser should show the real building rather than an arbitrary book display. */
export function eventTopicPhoto(...text: (string | undefined)[]): LibraryImage | undefined {
  if (/roof|building/i.test(text.join(' '))) {
    return photo('roofExterior', 'The library’s existing roof, solar panels and covered entrance.', '50% 30%');
  }
  return undefined;
}

// Exact published assets observed in the current CMS snapshot, not filename or
// topic guesses. Preserve unrelated images and newly uploaded replacements.
const byAsset: Record<string, LibraryImage> = {
  '16f328cbd4d4d83b03bc119f5c7a556e1ac19f58-2048x1152.jpg': exterior,
  '8a742c234199405e4b2bc520d434e3e315181795-2048x1152.jpg': exterior,
  '39745f53c007d3b6dae65cba8658d133892d05a6-1600x1200.png': community,
  '51396244812efc45a073ddfec54db0381a1e98ff-960x720.jpg': computers,
  'a9d0bcfd5105db2ad0c427ea5e1a57485d7e7148-960x720.jpg': storytime,
  'aeaa7bd0aeed3c1a086f90c7cae692b4dd071034-1600x629.jpg': shelves,
  'f3c9ff84d58951fd43cb3737c91530eb29b4e4e7-720x960.jpg': sale,
  'b6c5f4f72162ff7ff2c13e53cb52827b3dc1627c-720x960.jpg': children,
  '66252c5440d8bee56631cb81e5686fdab72cc231-1080x1080.png': display,
  '4eedd966749ff80dce5bb377e26fca77e57fe359-2082x1152.jpg': market,
  '420d14d5696a4f17d16d5c0a5c00c491d9964d40-1800x1200.png': readers,
  '13d1b5cce4c01a439a8a04c368d8def38acbbb1c-1176x1178.png': readers,
  'b534c0581733e7e3cb8829f6890af9bb4ed6c25a-1800x1200.png': club,
  '249a439b39c885ff205e09d6a1fd6e17e1bb0ec6-1080x1080.png': club,
};

export function refreshPhoto(image: LibraryImage): LibraryImage {
  let replacement: LibraryImage | undefined;
  if (image.url) {
    const prefix = 'https://cdn.sanity.io/images/2ou0xy2r/production/';
    if (image.url.startsWith(prefix)) replacement = byAsset[image.url.slice(prefix.length)];
  } else if (image.key) replacement = byKey[image.key];
  if (!replacement) return image;
  // Descriptions refer to the chosen photo; retain any separate editorial caption.
  return { ...replacement, ...(image.caption ? { caption: image.caption } : {}) };
}
