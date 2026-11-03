import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  image: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/images/**' }] },
  redirects: {
    // Old address of the newsletter page, which now always shows the current issue.
    '/librarynews/summer-2026/': '/librarynews/newsletter/',
    // The old separate "Keep the library open" page; the Donate page is now the only donation page.
    '/fundraising-events/library-fund/': '/fundraising-events/',
    // Kids & families became the Story Time page under Explore Services.
    '/kids/': '/services/story-time/',
  },
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
});
