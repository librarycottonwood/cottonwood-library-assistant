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
  if (/volunteer|neighbo|communit/i.test(text)) return rotation[1];
  if (/story ?time|kids|children|little readers/i.test(text)) return rotation[2];
  if (/new (books|reads)|computer/i.test(text)) return rotation[0];
  return undefined;
}

/** News posts, newest first, each with a photo: its own, one that fits, or the next in Figma's order (never the same as the post above). */
export function postsWithPhotos(posts: LibraryPost[]): LibraryPost[] {
  let previous: LibraryImage | undefined;
  return newestPosts(posts).map((post, index) => {
    const fitting = byTopic(`${post.title} ${post.summary}`);
    const image = post.image ?? (fitting && fitting !== previous ? fitting : rotation.map((_, step) => rotation[(index + step) % rotation.length]!).find(picture => picture !== previous)!);
    previous = image;
    return { ...post, image };
  });
}

/** An event's photo: its own, its program's, or a sharp, wide library photo that fits (it runs page-wide on the event page). */
export function eventPhoto(event: LibraryEvent, programs: HomeContent['programs']): LibraryImage {
  const own = event.image ?? programs.find(program => program.id === event.programId)?.image;
  if (own) return own;
  const about = `${event.title} ${event.summary}`;
  if (/book sale/i.test(about)) return photo('bookSale', 'Book-sale shelves in the library’s back hall.');
  if (/roof|building/i.test(about)) return photo('exterior', 'The Cottonwood Community Library building.');
  return photo('interior', 'Inside the Cottonwood Community Library.');
}
