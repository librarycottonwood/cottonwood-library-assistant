import type {StructureResolver} from 'sanity/structure';

export const singletonIds = {siteSettings: 'library-settings', givingSettings: 'library-giving'} as const;
export const singletonTypes = new Set<string>(Object.keys(singletonIds));

export const structure: StructureResolver = (S) => S.list()
  .title('Cottonwood Library')
  .items([
    S.documentTypeListItem('event').title('Events'),
    S.documentTypeListItem('post').title('Blog posts'),
    S.documentTypeListItem('program').title('Regular programs'),
    S.documentTypeListItem('newsletter').title('Newsletters'),
    S.documentTypeListItem('notice').title('Notices and closures'),
    S.divider(),
    S.listItem().title('Library settings and hours').id('library-settings')
      .child(S.document().schemaType('siteSettings').documentId(singletonIds.siteSettings)),
    S.listItem().title('Giving and acknowledgments').id('library-giving')
      .child(S.document().schemaType('givingSettings').documentId(singletonIds.givingSettings)),
  ]);
