// Page helper (the leading _ keeps Astro from making it a route): a fitting library photo for an event or
// news post that has none in Sanity, so Events & News, event pages and news posts never show an empty box.
// The list and the item's own page use the same helper, so a post or event keeps one photo everywhere.
import { newestPosts } from '../content/feeds';
import type { HomeContent, LibraryEvent, LibraryImage, LibraryPost } from '../content/types';

const photo = (key: string, alt: string): LibraryImage => ({ key, alt });
// The photos Figma's Latest News uses, in its order. The mural is a crop from the Figma frame (small), so it
// only comes up as the fourth photo in a run of posts, never by topic.
const rotation = [
  photo('computerRoom', 'The library’s computer room.'),
  photo('watercolor', 'A watercolor painting of the Cottonwood Community Library.'),
  photo('storytime', 'The Story Time corner.'),
  photo('adventureMural', 'The “Adventure Awaits” mural in the children’s area.'),
];

/** A photo that fits what the item is about, or undefined when nothing fits. */
function byTopic(text: string): LibraryImage | undefined {
  if (/book sale/i.test(text)) return photo('bookSale', 'Book-sale shelves in the library’s back hall.');
  if (/roof|building/i.test(text)) return photo('exterior', 'The Cottonwood Community Library building.');
  if (/volunteer|neighbo/i.test(text)) return rotation[1];
  if (/story ?time|kids|children|little readers/i.test(text)) return rotation[2];
  if (/new (books|reads)|computer|website|online/i.test(text)) return rotation[0];
  return undefined;
}

/** News posts, newest first, each with a photo: its own, one that fits, or the next in Figma's order. A library
 * photo isn't repeated in the list while another is still free (photos are told apart by key). */
export function postsWithPhotos(posts: LibraryPost[]): LibraryPost[] {
  const used = new Set<string>();
  return newestPosts(posts).map((post, index) => {
    const fitting = byTopic(`${post.title} ${post.summary}`);
    const next = rotation.map((_, step) => rotation[(index + step) % rotation.length]!);
    const image = post.image ?? (fitting && !used.has(fitting.key!) ? fitting : next.find(picture => !used.has(picture.key!)) ?? next[0]!);
    if (image.key) used.add(image.key);
    return { ...post, image };
  });
}

/** An event's photo: its own, its program's, or a sharp, wide library photo that fits (it runs page-wide on the event page). */
export function eventPhoto(event: LibraryEvent, programs: HomeContent['programs']): LibraryImage {
  return event.image ?? programs.find(program => program.id === event.programId)?.image ?? fallbackPhoto(event.title, event.summary);
}

/** The library photo for an event with no photo of its own or of its program (the homepage uses it too). */
export function fallbackPhoto(...text: (string | undefined)[]): LibraryImage {
  const about = text.join(' ');
  if (/book sale/i.test(about)) return photo('bookSale', 'Book-sale shelves in the library’s back hall.');
  if (/roof|building/i.test(about)) return photo('exterior', 'The Cottonwood Community Library building.');
  return photo('interior', 'Inside the Cottonwood Community Library.');
}
