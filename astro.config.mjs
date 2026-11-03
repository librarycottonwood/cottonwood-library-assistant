import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  image: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/images/**' }] },
  redirects: {
    // Pages of the old Square website (cottonwood-community-library.square.site/sitemap.xml, Nov 2026). Google,
    // Facebook posts and printed material link to these; they reach this site once the domain moves here.
    '/plan-your-visit': '/visit/',
    '/our-story': '/about/',
    '/librarynews': '/events/',
    '/fundraising-events': '/donate/',
    '/product/donate-to-the-library/1': '/donate/',
    '/s/shop': '/donate/',
    '/s/stories/story-title': '/events/',
    // Still linked from Sanity's "Giving and acknowledgments" thank-you records. Drop once those links are updated.
    '/librarynews/story-time/': '/services/story-time/',
    '/fundraising-events/library-fund/': '/donate/',
  },
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
});
