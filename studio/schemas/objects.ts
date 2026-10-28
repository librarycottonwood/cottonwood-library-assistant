import {defineArrayMember, defineField, defineType} from 'sanity';
import {emptyEntryNotice, identifierNotice, nestedListNotice, sessionTimeNotice, slugPattern, validIdentifier, validImage, validLink, validSession} from '../validation.ts';
import {pacificDateLabel} from '../dates.ts';

export const text = (name: string, title: string, description?: string) => defineField({
  name, title, type: 'string', description, validation: (rule) => rule.required(),
});
export const paragraph = (name: string, title: string, description?: string) => defineField({
  name, title, type: 'text', rows: 3, description, validation: (rule) => rule.required(),
});
export const link = (name: string, title: string, required = true) => defineField({
  name, title, type: 'string',
  description: 'A site page such as /visit/, a secure https:// address, email, or phone link.',
  validation: (rule) => required ? rule.required().custom(validLink) : rule.custom((value) => value ? validLink(value) : true),
});
/** A free-text identifier that ends up in web addresses and page anchors. The website tidies it the
 * same way (Printing & Copies -> printing-copies); the warning shows the address it will use. */
export const identifier = (name: string, title: string) => defineField({
  name, title, type: 'string',
  description: 'Used in web addresses. Lowercase words joined by hyphens, such as book-sale. Changing it changes the address.',
  validation: (rule) => [rule.required().custom(validIdentifier), rule.custom(identifierNotice).warning()],
});
export const slug = defineField({
  name: 'slug', title: 'Page address', type: 'slug',
  description: 'Use Generate for a new item. Keep this address when correcting an existing item so shared links continue working.',
  options: {source: 'title', maxLength: 96},
  validation: (rule) => rule.required().custom((value) => !value?.current || slugPattern.test(value.current)
    ? true : 'Use lowercase letters and numbers separated by single hyphens.'),
});
export const image = (name = 'image', title = 'Picture', required = true) => defineField({
  name, title, type: 'libraryImage', validation: (rule) => required ? rule.required() : rule,
});
export const strings = (name: string, title: string) => defineField({
  name, title, type: 'array', of: [defineArrayMember({type: 'text', rows: 3, validation: (rule) => rule.custom(emptyEntryNotice).warning()})],
  validation: (rule) => rule.required().min(1).custom((value) => Array.isArray(value) && !value.some((entry) => typeof entry === 'string' && entry.trim())
    ? 'Add at least one entry with text.' : true),
});

export const libraryImage = defineType({
  name: 'libraryImage', title: 'Library picture', type: 'image',
  description: 'Upload the original picture. Describe what people should know if they cannot see it. Only share pictures approved for public use.',
  options: {hotspot: true, accept: 'image/jpeg,image/png,image/webp'},
  fields: [
    text('alt', 'Picture description', 'A short description for visitors using a screen reader.'),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
    // Hidden: the website picks fill or whole from the picture's shape. Kept so older records stay valid.
    defineField({name: 'fit', title: 'Picture display', type: 'string', hidden: true, options: {
      list: [{title: 'Fill the photo area', value: 'cover'}, {title: 'Show the whole poster or logo', value: 'contain'}], layout: 'radio',
    }}),
    defineField({name: 'legacyKey', title: 'Imported picture reference', type: 'string',
      description: 'Kept during migration so existing pictures continue working. Uploading a replacement takes priority.',
      hidden: ({parent}) => !parent?.legacyKey,
      readOnly: true}),
  ],
  validation: (rule) => rule.custom((value) => value ? validImage(value) : true),
});

export const eventSession = defineType({
  name: 'eventSession', title: 'Event date', type: 'object',
  description: 'Enter each confirmed occurrence. All dates and times here are Pacific time.',
  fields: [
    defineField({name: 'startsAt', title: 'Starts (Pacific time)', type: 'datetime', options: {displayTimeZone: 'America/Los_Angeles', allowTimeZoneSwitch: false}, validation: (rule) => rule.required()}),
    defineField({name: 'endsAt', title: 'Ends (Pacific time)', type: 'datetime', description: 'Required so the event stays listed until it finishes.', options: {displayTimeZone: 'America/Los_Angeles', allowTimeZoneSwitch: false}, validation: (rule) => rule.required().error('Choose an end date and time.')}),
  ],
  validation: (rule) => [rule.custom(validSession), rule.custom(sessionTimeNotice).warning()],
  preview: {select: {start: 'startsAt', end: 'endsAt'}, prepare({start, end}) {
    return {title: pacificDateLabel(start, true), subtitle: end ? `Until ${pacificDateLabel(end, true)} · Pacific` : 'Pacific time'};
  }},
});

export const portableBody = defineType({
  name: 'portableBody', title: 'Post text', type: 'array',
  of: [defineArrayMember({
    type: 'block',
    styles: [{title: 'Paragraph', value: 'normal'}, {title: 'Heading', value: 'h2'}, {title: 'Small heading', value: 'h3'}, {title: 'Quote', value: 'blockquote'}],
    lists: [{title: 'Bullets', value: 'bullet'}, {title: 'Numbered list', value: 'number'}],
    marks: {
      decorators: [{title: 'Bold', value: 'strong'}, {title: 'Italic', value: 'em'}],
      annotations: [{name: 'link', title: 'Link', type: 'object', fields: [link('href', 'Link address')]}],
    },
  })],
  validation: (rule) => rule.custom(nestedListNotice).warning(),
});

export const navigationLink = defineType({name: 'navigationLink', title: 'Navigation link', type: 'object', fields: [text('label', 'Label'), link('href', 'Destination')]});
export const hoursRow = defineType({name: 'hoursRow', title: 'Opening hours', type: 'object', fields: [text('days', 'Day or days'), text('hours', 'Hours', 'Enter the approved opening times, or Closed.')]});
export const libraryService = defineType({name: 'libraryService', title: 'Library service', type: 'object', fields: [
  identifier('id', 'Service identifier'), text('title', 'Title'), paragraph('description', 'Short description'),
  defineField({name: 'icon', title: 'Service symbol', type: 'string', options: {list: [
    {title: 'Books', value: 'book'}, {title: 'Computer', value: 'computer'}, {title: 'Printer', value: 'printer'},
  ]}, validation: (rule) => rule.required()}),
]});
export const borrowingAnswer = defineType({name: 'borrowingAnswer', title: 'Helpful answer', type: 'object', fields: [text('question', 'Question'), paragraph('answer', 'Answer')]});
export const givebutterAccount = defineType({name: 'givebutterAccount', title: 'General donations', type: 'object', fields: [
  text('account', 'Givebutter account ID', 'Only the public acct= value from approved widget code. Never paste a secret API key.'),
  text('campaign', 'General donation campaign code', 'The approved general donation campaign’s short code from Givebutter.'),
]});
export const donationWidget = defineType({name: 'donationWidget', title: 'Givebutter form', type: 'object', fields: [
  text('formWidgetId', 'Form widget ID', 'Use the Form widget with its goal bar enabled. Paste only its public ID, not HTML.'),
  defineField({name: 'campaign', title: 'Campaign code', type: 'string'}),
  defineField({name: 'account', title: 'Account ID override', type: 'string', description: 'Leave blank unless different from the library’s general account.'}),
]});
export const initiativeAction = defineType({name: 'initiativeAction', title: 'Action link', type: 'object', fields: [
  text('label', 'Link label'), link('href', 'Destination'), defineField({name: 'download', title: 'Download a file', type: 'boolean', initialValue: false}),
]});
export const supportUpdate = defineType({name: 'supportUpdate', title: 'Community acknowledgment', type: 'object', fields: [
  identifier('id', 'Identifier'), text('title', 'Title'), paragraph('body', 'Thank-you text'), text('category', 'Category'), image(), link('href', 'Destination'), text('linkLabel', 'Link label'),
], preview: {select: {title: 'title', media: 'image'}}});
export const supportInitiative = defineType({name: 'supportInitiative', title: 'Way to help', type: 'object', fields: [
  identifier('id', 'Identifier'), text('title', 'Title'),
  defineField({name: 'category', title: 'Kind', type: 'string', options: {list: [
    {title: 'Giving', value: 'giving'}, {title: 'Volunteering', value: 'volunteering'}, {title: 'Community', value: 'community'},
  ]}, validation: (rule) => rule.required()}),
  text('label', 'Short label'), paragraph('summary', 'Short description'), image(),
  defineField({name: 'gallery', title: 'More pictures', type: 'array', of: [defineArrayMember({type: 'libraryImage'})]}),
  strings('paragraphs', 'Details'), strings('steps', 'How to help'),
  defineField({name: 'action', title: 'Action link', type: 'initiativeAction', validation: (rule) => rule.required()}),
], preview: {select: {title: 'title', media: 'image'}}});
export const fundraisingCampaign = defineType({name: 'fundraisingCampaign', title: 'Approved fundraiser', type: 'object', fields: [
  identifier('id', 'Identifier'), text('title', 'Title'), paragraph('description', 'Short description'),
  defineField({name: 'url', title: 'Approved donation page', type: 'url', validation: (rule) => rule.required().uri({scheme: ['https']})}),
  defineField({name: 'givebutter', title: 'Givebutter form', type: 'donationWidget', validation: (rule) => rule.required()}),
  defineField({name: 'endsOn', title: 'Last day to show', type: 'date', description: 'Optional. Includes this entire day in Pacific time.'}),
  image('image', 'Campaign picture', false),
], preview: {select: {title: 'title', media: 'image'}}});

export const objectTypes = [libraryImage, eventSession, portableBody, navigationLink, hoursRow, libraryService, borrowingAnswer, givebutterAccount, donationWidget, initiativeAction, supportUpdate, supportInitiative, fundraisingCampaign];
