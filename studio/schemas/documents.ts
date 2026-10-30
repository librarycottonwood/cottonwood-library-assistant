import {defineArrayMember, defineField, defineType, type DocumentDefinition} from 'sanity';
import {image, link, paragraph, slug, strings, text} from './objects.ts';
import {uniqueSessions, validDateRange, validLink, validNewsletter, validPhone} from '../validation.ts';
import {pacificDateLabel} from '../dates.ts';

export const event = defineType({
  name: 'event', title: 'Event', type: 'document',
  description: 'Add an event once. All confirmed dates appear together and feed the website’s upcoming lists.',
  fields: [text('title', 'Event name'), slug, paragraph('summary', 'Short description', 'What visitors should know: cost, what to bring, or how to enter.'),
    image('image', 'Event picture', false),
    defineField({name: 'sessions', title: 'Confirmed dates', type: 'array', of: [defineArrayMember({type: 'eventSession'})],
      validation: (rule) => rule.required().min(1).custom(uniqueSessions)}),
    defineField({name: 'location', title: 'Location', type: 'string', description: 'Only enter a location confirmed by the library.'}),
    link('href', 'Optional destination link', false),
    defineField({name: 'program', title: 'Related regular program', type: 'reference', to: [{type: 'program'}]}),
  ],
  orderings: [{title: 'First date', name: 'firstDate', by: [{field: 'sessions[0].startsAt', direction: 'asc'}]}],
  preview: {select: {title: 'title', first: 'sessions.0.startsAt', media: 'image'}, prepare({title, first, media}) {
    return {title, media, subtitle: first ? pacificDateLabel(first) : 'No confirmed date'};
  }},
});

export const post = defineType({
  name: 'post', title: 'Blog post', type: 'document',
  fields: [text('title', 'Title'), slug,
    defineField({name: 'publishedAt', title: 'Article date (Pacific time)', type: 'datetime', options: {displayTimeZone: 'America/Los_Angeles', allowTimeZoneSwitch: false}, description: 'This is the date displayed with the article. Publishing now does not schedule a future article; leave blank only for imported undated material.'}),
    defineField({name: 'dateLabel', title: 'Alternative date label', type: 'string', description: 'For an undated newsletter such as Summer 2026. Usually leave blank.'}),
    text('category', 'Category'), paragraph('summary', 'Short description'),
    defineField({name: 'body', title: 'Post text', type: 'portableBody', validation: (rule) => rule.required().min(1)}),
    image('image', 'Cover picture', false),
    defineField({name: 'gallery', title: 'More pictures', type: 'array', of: [defineArrayMember({type: 'libraryImage'})]}),
    defineField({name: 'eventRefs', title: 'Related events', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'event'}]})],
      description: 'Link to the original events rather than copying dates into several places.', validation: (rule) => rule.unique()}),
    link('href', 'Imported article destination', false),
    defineField({name: 'externalUrl', title: 'Original article link', type: 'url', validation: (rule) => rule.uri({scheme: ['https']})}),
    defineField({name: 'sourceLabel', title: 'Original publisher', type: 'string'}),
  ],
  orderings: [{title: 'Newest article first', name: 'articleDate', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'category', media: 'image'}},
});

export const program = defineType({
  name: 'program', title: 'Regular program', type: 'document',
  description: 'Describe the recurring program here. Add dated occurrences in Events only when those dates are confirmed.',
  fields: [text('title', 'Program name'), slug,
    defineField({name: 'audience', title: 'Audience', type: 'string', options: {list: [{title: 'Children and families', value: 'children'}, {title: 'Adults', value: 'adults'}]}, validation: (rule) => rule.required()}),
    text('schedule', 'Regular schedule', 'A description such as Wednesdays at 11:30 a.m. This does not invent dated events.'),
    paragraph('description', 'Short description'), paragraph('details', 'More information'), image(),
    defineField({name: 'orderRank', title: 'Display order', type: 'number', initialValue: 0, validation: (rule) => rule.integer().min(0)}),
  ],
  orderings: [{title: 'Website order', name: 'websiteOrder', by: [{field: 'orderRank', direction: 'asc'}, {field: 'title', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'schedule', media: 'image'}},
});

export const newsletter = defineType({
  name: 'newsletter', title: 'Newsletter', type: 'document',
  description: 'Upload an issue here, then choose it as the current issue in Library settings. Older issues remain available.',
  fields: [text('issue', 'Issue', 'For example, the season and year printed on the newsletter.'), text('title', 'Title'), slug, paragraph('summary', 'Short description'),
    defineField({name: 'file', title: 'Newsletter PDF', type: 'file', options: {accept: 'application/pdf'},
      validation: (rule) => rule.custom(async (file, context) => {
        if (!file?.asset?._ref) return true;
        const asset = await context.getClient({apiVersion: '2026-10-01'}).fetch<{mimeType?: string} | null>('*[_id == $id][0]{mimeType}', {id: file.asset._ref});
        return asset?.mimeType === 'application/pdf' ? true : 'Choose a PDF document.';
      })}),
    defineField({name: 'legacyFileUrl', title: 'Imported PDF address', type: 'string', readOnly: true,
      hidden: ({document}) => !document?.legacyFileUrl,
      validation: (rule) => rule.custom((value) => value ? validLink(value) : true)}),
    image('cover', 'Cover picture'),
  ],
  validation: (rule) => rule.custom(validNewsletter),
  preview: {select: {title: 'title', subtitle: 'issue', media: 'cover'}},
});

export const notice = defineType({
  name: 'notice', title: 'Notice or closure', type: 'document',
  description: 'A short banner shown on every page during the dates you choose. Dates include the entire day in Pacific time.',
  fields: [
    defineField({...slug, options: {source: 'message', maxLength: 96}}),
    paragraph('message', 'Banner message'),
    defineField({name: 'startsOn', title: 'First day to show', type: 'date', validation: (rule) => rule.required()}),
    defineField({name: 'endsOn', title: 'Last day to show', type: 'date', validation: (rule) => rule.required()}),
    defineField({name: 'link', title: 'Optional link', type: 'navigationLink'}),
  ],
  validation: (rule) => rule.custom(validDateRange),
  preview: {select: {title: 'message', start: 'startsOn', end: 'endsOn'}, prepare({title, start, end}) {return {title, subtitle: `${start ?? '?'} to ${end ?? '?'} · Pacific`};}},
});

export const siteSettings = defineType({
  name: 'siteSettings', title: 'Library settings', type: 'document',
  groups: [{name: 'contact', title: 'Contact and hours', default: true}, {name: 'home', title: 'Homepage'}, {name: 'services', title: 'Services'}, {name: 'about', title: 'Story and support'}, {name: 'navigation', title: 'Navigation'}],
  fields: [
    defineField({name: 'library', title: 'Library contact and hours', type: 'object', group: 'contact', validation: (rule) => rule.required(), fields: [
      text('name', 'Library name'),
      defineField({name: 'phone', title: 'Phone number', type: 'string', description: 'As visitors should see it, such as (530) 347-4818. An extension such as ext. 2 is dialed too.',
        validation: (rule) => rule.required().custom(validPhone)}),
      defineField({name: 'phoneHref', title: 'Imported phone link', type: 'string', hidden: true, readOnly: true, description: 'The website derives this from the phone number above.'}),
      defineField({name: 'email', title: 'Email', type: 'string', validation: (rule) => rule.required().email()}),
      text('address', 'Street address'), text('locality', 'City, state and ZIP'), text('mailingAddress', 'Mailing address'),
      defineField({name: 'timezone', title: 'Library timezone', type: 'string', initialValue: 'America/Los_Angeles', readOnly: true,
        validation: (rule) => rule.required().custom((value) => value === 'America/Los_Angeles' ? true : 'Library dates use America/Los_Angeles.')}),
      defineField({name: 'hoursSummary', title: 'Imported hours summary', type: 'string', hidden: true, readOnly: true, description: 'The website derives this from the opening hours below.'}),
      defineField({name: 'hours', title: 'Opening hours', type: 'array', of: [defineArrayMember({type: 'hoursRow'})], validation: (rule) => rule.required().min(1)}),
      link('catalogUrl', 'Catalog address'), link('directionsUrl', 'Directions address'), link('instagramUrl', 'Instagram address'), link('facebookUrl', 'Facebook address'),
      defineField({name: 'donationUrl', title: 'Approved donation page', type: 'url', validation: (rule) => rule.uri({scheme: ['https']})}),
      defineField({name: 'givebutter', title: 'General Givebutter donations', type: 'givebutterAccount', description: 'Leave empty until the board supplies the approved campaign. Live totals remain in Givebutter.'}),
    ]}),
    defineField({name: 'hero', title: 'Homepage introduction', type: 'object', group: 'home', validation: (rule) => rule.required(), fields: [
      text('eyebrow', 'Small introductory line'),
      defineField({name: 'heading', title: 'Heading lines', type: 'array', of: [defineArrayMember({type: 'string', validation: (rule) => rule.required()})], validation: (rule) => rule.required().length(2)}),
      paragraph('introduction', 'Introduction'), image(),
    ]}),
    defineField({name: 'currentNewsletter', title: 'Current newsletter', type: 'reference', to: [{type: 'newsletter'}], group: 'home',
      description: 'Choose the issue shown on the homepage. Upload each new issue in Newsletters, then change this selection.'}),
    defineField({name: 'services', title: 'Library services', type: 'array', group: 'services', of: [defineArrayMember({type: 'libraryService'})], validation: (rule) => rule.required().min(1)}),
    defineField({...image('serviceImage', 'Services picture', false), group: 'services', description: 'Optional shared picture used for services and the computer area. Leave blank to keep the existing library picture.'}),
    defineField({name: 'borrowing', title: 'Borrowing and computer information', type: 'array', group: 'services', of: [defineArrayMember({type: 'borrowingAnswer'})], validation: (rule) => rule.required().min(1)}),
    defineField({name: 'story', title: 'Library story', type: 'object', group: 'about', validation: (rule) => rule.required(), fields: [text('heading', 'Heading'), strings('paragraphs', 'Story paragraphs'), image()]}),
    defineField({...image('givingImage', 'Giving picture', false), group: 'about', description: 'Optional shared giving picture. Leave blank to use the supporting-the-library picture.'}),
    defineField({name: 'support', title: 'Supporting the library', type: 'object', group: 'about', validation: (rule) => rule.required(), fields: [
      text('title', 'Heading'), paragraph('introduction', 'Introduction'), image(), link('volunteerFileUrl', 'Volunteer application PDF'),
      paragraph('materials', 'Donating books and DVDs'), paragraph('bookSale', 'Ongoing book sales'), paragraph('wowPoints', 'WOW points'),
    ]}),
    defineField({name: 'navigation', title: 'Main navigation', type: 'array', group: 'navigation', of: [defineArrayMember({type: 'navigationLink'})], validation: (rule) => rule.required().min(1)}),
  ],
  preview: {prepare: () => ({title: 'Library settings', subtitle: 'One shared source for contact details, hours, and page content'})},
});

export const givingSettings = defineType({
  name: 'givingSettings', title: 'Giving and acknowledgments', type: 'document',
  fields: [
    defineField({name: 'updates', title: 'Community acknowledgments', type: 'array', of: [defineArrayMember({type: 'supportUpdate'})], validation: (rule) => rule.required()}),
    defineField({name: 'initiatives', title: 'Ways to help', type: 'array', of: [defineArrayMember({type: 'supportInitiative'})], validation: (rule) => rule.required()}),
    defineField({name: 'campaigns', title: 'Approved fundraising campaigns', type: 'array', of: [defineArrayMember({type: 'fundraisingCampaign'})],
      description: 'The first campaign that has not ended drives Donate buttons. Only enter approved campaigns. Givebutter supplies live totals; never type fundraising totals here.',
      initialValue: [], validation: (rule) => rule.required()}),
  ],
  preview: {prepare: () => ({title: 'Giving and acknowledgments', subtitle: 'Ways to help, thank-yous, and approved Givebutter campaigns'})},
});

const migrationSource = defineField({
  name: 'migrationSource', title: 'Migration provenance', type: 'string', hidden: true, readOnly: true,
  description: 'Records where imported copy came from. It is not a published library fact or an editable field.',
});
const documentDefinitions: DocumentDefinition[] = [event, post, program, newsletter, notice, siteSettings, givingSettings];
export const documentTypes = documentDefinitions
  .map((document) => defineType({...document, fields: [...document.fields, migrationSource]}));
