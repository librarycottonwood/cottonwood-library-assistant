/** Build-time check of each newsletter's Word version (accessible): the build stops, naming the issue and the problem,
 * when the file would not work with a screen reader. Each file is read once per build. */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { checkAccessibleNewsletter } from './accessible-newsletter.mjs';
import type { LibraryNewsletter } from './types';

const checked = new Map<string, Promise<void>>();

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

async function check(newsletter: LibraryNewsletter): Promise<void> {
  const { problems } = await checkAccessibleNewsletter(await bytesOf(newsletter.accessibleFile!.source));
  if (problems.length) throw new Error(`Sanity content: In newsletter "${newsletter.issue}": Word version (accessible) (accessibleFile): ${problems.join(' ')}`);
}

/** Checks every issue's Word version; issues without one are skipped. */
export async function checkWordVersions(newsletters: LibraryNewsletter[]): Promise<void> {
  await Promise.all(newsletters.filter(issue => issue.accessibleFile).map(issue => {
    const key = issue.accessibleFile!.source;
    if (!checked.has(key)) checked.set(key, check(issue));
    return checked.get(key);
  }));
}
