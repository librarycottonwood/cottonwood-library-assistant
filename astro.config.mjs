import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  image: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/images/**' }] },
  redirects: {
    // Old addresses of the newsletter page, which always shows the current issue.
    '/librarynews/summer-2026/': '/newsletter/',
    '/librarynews/newsletter/': '/newsletter/',
    // The old separate "Keep the library open" page; Support Us is now the only donation page.
    '/fundraising-events/library-fund/': '/donate/',
    '/donate/library-fund/': '/donate/',
    // Support Us moved from /fundraising-events/ to /donate/, with each way to help under it.
    '/fundraising-events/': '/donate/',
    '/fundraising-events/[slug]': '/donate/[slug]',
    // Kids & families became the Story Time page under Explore Services.
    '/kids/': '/services/story-time/',
    // Events & News moved from /librarynews/: posts to /news/<post>/, regular programs to /services/<program>/.
    '/librarynews/': '/events/',
    '/librarynews/[slug]': '/news/[slug]',
    '/librarynews/story-time/': '/services/story-time/',
    '/librarynews/main-street-readers/': '/services/main-street-readers/',
    '/librarynews/book-club/': '/services/book-club/',
    '/our-story/': '/about/',
  },
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
});
