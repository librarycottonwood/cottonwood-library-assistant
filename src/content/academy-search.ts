import { lessons, services, quickReference } from '../pages/academy/_guide.ts';
import type { SearchEntry } from '../scripts/search.ts';

export const academySearchEntries: SearchEntry[] = [
  ...lessons.flatMap(lesson => [
    { title: lesson.title, section: 'Lesson', href: `/academy/${lesson.slug}/`, text: lesson.summary },
    ...lesson.parts.map((part, index) => {
      const id = lesson.slug === 'practice-with-a-buddy' ? part.id ?? `example-${index + 1}` : part.id;
      return { title: part.title, section: lesson.title, href: `/academy/${lesson.slug}/${id ? `#${id}` : ''}`, text: [...part.text, ...(part.steps ?? []), ...(part.items ?? []).flatMap(item => [item.label, item.text]), part.prompt ?? '', ...(part.screenshots ?? []).map(image => image.alt), ...(part.links ?? []).map(link => link.label)].filter(Boolean).join(' ') };
    }),
  ]),
  ...services.map(service => ({ title: service.name, section: service.group === 'daily' ? 'Accounts and websites' : 'Website systems', href: `/academy/${service.group === 'daily' ? 'accounts-and-tools' : 'website-systems'}/#website-${service.id}`, text: service.purpose })),
  ...quickReference.map(([title, text], index) => ({ title, section: 'Quick guide', href: `/academy/quick-reference/#quick-${index + 1}`, text })),
];
