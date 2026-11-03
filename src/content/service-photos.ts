import type { LibraryImage } from './types';

/** Services have no photos in Sanity yet, so each service icon maps to a library photo. */
export const servicePhotos: Record<string, LibraryImage> = {
  book: { key: 'interior', alt: '' },
  computer: { key: 'computerLab', alt: '' },
  printer: { key: 'copyRoom', alt: '' },
};
