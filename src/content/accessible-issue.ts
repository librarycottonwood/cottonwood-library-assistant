/** Build-time loader for a newsletter's Word version: reads the file once, checks it, and prepares the web page and its pictures. */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { readAccessibleNewsletter } from './accessible-newsletter.mjs';
import type { LibraryNewsletter } from './types';

export interface IssuePicture { index: number; width: number; height: number; bytes: Buffer; }
export interface AccessibleIssue { html: string; pictures: IssuePicture[]; }

/** Web address of one picture from the Word version. */
export const issuePicturePath = (slug: string, index: number) => `/newsletters/${slug}/pictures/${index}.webp`;

/** Website body text is about 1.5 times the size of 12-point Word text. */
const WEB_SCALE = 1.5;

const loaded = new Map<string, Promise<AccessibleIssue>>();

async function bytesOf(source: string): Promise<Uint8Array> {
  if (source.startsWith('https://')) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Could not download the Word version (${response.status}).`);
    return new Uint8Array(await response.arrayBuffer());
  }
  // Local fixtures only: a path inside this repository.
  const file = path.resolve(source);
  if (!file.startsWith(path.resolve('src/content/fixtures') + path.sep)) throw new Error('A local Word version must be in src/content/fixtures/.');
  return readFile(file);
}

async function load(newsletter: LibraryNewsletter & { id: string }): Promise<AccessibleIssue> {
  const at = `Sanity content: In newsletter "${newsletter.issue}": Word version (accessible) (accessibleFile)`;
  const result = await readAccessibleNewsletter(await bytesOf(newsletter.accessibleFile!.source));
  if (result.problems.length) throw new Error(`${at}: ${result.problems.join(' ')}`);
  const pictures = await Promise.all(result.images.map(async (image, index) => {
    try {
      // Shown at its size on the Word page, scaled up like the website's larger text, and saved at twice that for sharp screens.
      const shown = image.size ? Math.round(image.size.width * WEB_SCALE) : undefined;
      const { data, info } = await sharp(image.bytes, { failOn: 'error' }).rotate().resize({ width: Math.min(1200, shown ? shown * 2 : 1200), withoutEnlargement: true })
        .webp({ quality: 72 }).toBuffer({ resolveWithObject: true });
      const width = Math.min(shown ?? info.width, info.width);
      return { index, width, height: Math.round(width * info.height / info.width), bytes: data };
    } catch {
      throw new Error(`${at}: Picture "${image.alt.slice(0, 60)}" is in a format the website can't show (${image.contentType}). Use a JPG or PNG picture.`);
    }
  }));
  const html = result.html.replace(/src="newsletter-picture:(\d+)"/g, (_, index) => {
    const picture = pictures[Number(index)];
    return `src="${issuePicturePath(newsletter.id, picture.index)}" width="${picture.width}" height="${picture.height}" loading="lazy" decoding="async"`;
  });
  return { html, pictures };
}

/** The checked web version of an issue, or undefined when it has no Word version. Fails the build with a plain message when the file has a problem. */
export function accessibleIssue(newsletter: LibraryNewsletter & { id: string }): Promise<AccessibleIssue> | undefined {
  if (!newsletter.accessibleFile) return undefined;
  const key = newsletter.accessibleFile.source;
  if (!loaded.has(key)) loaded.set(key, load(newsletter));
  return loaded.get(key);
}
