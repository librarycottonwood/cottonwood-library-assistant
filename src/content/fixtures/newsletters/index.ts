/** Accessible Word versions of the two 2026 issues, made with the newsletter skill's Word steps
 * (plugins/cottonwood-library/skills/newsletter/accessible-word.md). Used only by the local fixture
 * site and by NEWSLETTER_WORD_PREVIEW local previews; CI and live builds read Word files from Sanity. */
import type { AccessibleNewsletterFile } from '../../types';

const fixture = (slug: string): AccessibleNewsletterFile => {
  const fileName = `cottonwood-library-newsletter-${slug}.docx`;
  return { url: `/newsletters/${slug}/${fileName}`, source: `src/content/fixtures/newsletters/${fileName}`, fileName };
};
export const wordFixtures: Record<string, AccessibleNewsletterFile> = {
  'summer-2026': fixture('summer-2026'),
  'fall-2026': fixture('fall-2026'),
};
