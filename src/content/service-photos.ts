import type { LibraryImage } from './types';

/** Services have no photos in Sanity yet, so each service icon maps to a library photo. */
export const servicePhotos: Record<string, LibraryImage> = {
  book: { key: 'borrowingShelves', alt: '' },
  computer: { key: 'computerRoom', alt: '' },
  printer: { key: 'copyRoom', alt: '' },
};
