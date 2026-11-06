// /llms.txt (https://llmstxt.org): a plain-text summary of the library and its main pages for AI assistants.
// Every fact comes from Sanity at build time (the same content the pages show), so it can't drift from the site.
import type { APIRoute } from 'astro';
import { contentRepository } from '../content/repository';
import { newestPosts } from '../content/feeds';
import { SITE_URL } from '../content/seo.mjs';

const zone = 'America/Los_Angeles';
const day = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: zone });
const page = (path: string) => new URL(path, SITE_URL).href;

export const GET: APIRoute = async () => {
  const [home, events, posts] = await Promise.all([contentRepository.getHome(), contentRepository.getEvents(), contentRepository.getPosts()]);
  const { library, programs } = home;
  const eventPages = [...new Map(events.filter(event => event.slug).map(event => [event.slug, event])).values()];
  const libraryPosts = newestPosts(posts).filter(post => post.href === `/news/${post.id}/`);
  const lines = [
    `# ${library.name}`,
    '',
    `> A community-supported library on Main Street in Cottonwood, California. Run by volunteers and a part-time director, with no government funding.`,
    '',
    `- Address: ${library.address}, ${library.locality}`,
    `- Mailing address: ${library.mailingAddress}`,
    `- Phone: ${library.phone}`,
    `- Email: ${library.email}`,
    `- Opening hours (Pacific time): ${library.hours.map(row => `${row.days}: ${row.hours}`).join('; ')}`,
    `- Library catalog: ${library.catalogUrl}`,
    `- Facebook: ${library.facebookUrl}`,
    `- Instagram: ${library.instagramUrl}`,
    '',
    'Check the website for closures and holiday hours before visiting.',
    '',
    '## Main pages',
    '',
    `- [Visit us](${page('/visit/')}): address, opening hours, directions and visiting questions`,
    `- [Services](${page('/services/')}): borrowing books, computers and Wi-Fi, printing and copying`,
    `- [Events and news](${page('/events/')}): upcoming events and regular programs`,
    `- [About](${page('/about/')}): the library's history and who keeps it open`,
    `- [Donate and help](${page('/donate/')}): donations, volunteering, book donations and the book sale`,
    `- [Newsletter](${page('/newsletter/')}): the current newsletter issue and sign-up`,
    '',
    '## Regular programs',
    '',
    ...programs.map(program => `- [${program.title}](${page(`/events/regular/${program.id}/`)}): ${program.schedule} — ${program.description}`),
    '',
    '## Events',
    '',
    ...eventPages.map(event => `- [${event.title}](${page(`/events/${event.slug}/`)}): ${day.format(new Date(event.startsAt))} — ${event.summary}`),
    '',
    '## News',
    '',
    ...libraryPosts.map(post => `- [${post.title}](${page(post.href)}): ${post.summary}`),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
