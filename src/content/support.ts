import type { SupportContent } from './types';
import { homeContent } from './seed';
const { library, support } = homeContent;

/** Source: research/site-inventory.md, Get Involved and About Us.
 * These are ongoing ways to help, not invented fundraising campaigns.
 *
 * campaigns: only real, approved fundraisers. The first campaign that has not ended becomes
 * the active one: it shows Givebutter's inline Form widget (goal bar on) and every Donate button
 * gives to it. givebutter ids come from the campaign's Sharing → Widgets → Form code:
 * formWidgetId is the id="…" of the <givebutter-widget> element. campaign (optional) is the
 * campaign's short code; with it, Donate buttons open this fundraiser's checkout popup, without it
 * they link to the on-site form. account (optional) is the acct=… value, only when it differs from
 * library.givebutter.account in seed.ts (see .claude/skills/fundraisers/SKILL.md).
 * endsOn is optional (YYYY-MM-DD, Pacific time, inclusive); after it, or once the entry is removed, Donate buttons revert on their own.
 * The image key must exist in images.ts. Example entry (copy inside campaigns: [ ]):
 *   {
 *     id: 'roof-2026', title: 'New roof fund',
 *     description: 'Help replace the library roof before winter rains.',
 *     url: 'https://givebutter.com/example-campaign',
 *     givebutter: { formWidgetId: 'gb4Xy7Lm', campaign: 'R4T5Y6' },
 *     endsOn: '2026-12-31', // optional
 *     image: { key: 'exterior', alt: 'Cottonwood Community Library on Main Street.' }, // optional
 *   },
 */
export const supportContent: SupportContent = {
  campaigns: [],
  updates: [
    {
      id: 'first-five', title: 'Books for young readers', category: 'Children’s programs', image: { key: 'firstFive', alt: 'First 5 Shasta', fit: 'contain' },
      body: 'The library’s published thank-you recognizes First 5 Shasta for supporting books for new families, craft bags and publicity for Wednesday Story Time.',
      href: '/services/story-time/', linkLabel: 'Explore Story Time',
    },
    {
      id: 'community-foundation', title: 'Support for everyday operations', category: 'Community giving', image: { key: 'communityFoundation', alt: 'Community Foundation of the North State', fit: 'contain' },
      body: 'The library has thanked the Community Foundation of the North State for a grant that helps cover day-to-day operating costs.',
      href: '/fundraising-events/library-fund/', linkLabel: 'Support the library',
    },
  ],
  initiatives: [
    {
      id: 'library-fund', title: 'Keep the library open', category: 'giving', label: 'Financial support',
      summary: 'Support the day-to-day work of your community library.',
      image: homeContent.hero.image,
      paragraphs: [homeContent.story.paragraphs[1], 'Financial donations support day-to-day operations. Contact the library to ask about giving and its current fundraising needs.'],
      steps: ['Contact the library about making a gift.', 'The library can help you choose the right way to give.'],
      action: { label: 'Ask about giving', href: `mailto:${library.email}?subject=Supporting%20the%20library` },
    },
    {
      id: 'volunteer', title: 'Give your time', category: 'volunteering', label: 'Volunteering',
      summary: 'Help with the everyday work that keeps books and people connected.',
      image: { key: 'interior', alt: 'Library shelves where volunteers help shelve and catalog books.' },
      paragraphs: ['Volunteers help with shelving, cataloging, check-ins, check-outs, processing donations and Story Time.', 'Download the application or pick up a printed copy at the library. Return your application to the library for review by the director. Contact the library about screening and available roles; applying does not enroll you as a volunteer.'],
      steps: ['Download the volunteer application or pick up a copy.', 'Fill it out and return it to the library.', 'The director reviews applications and discusses screening and available roles.'],
      action: { label: 'Volunteer application (PDF)', href: support.volunteerFileUrl, download: true },
    },
    {
      id: 'book-sale', title: 'Shop the book sale', category: 'community', label: 'Book-sale fundraising',
      summary: support.bookSale,
      image: { key: 'bookSale', alt: 'The actual ongoing book-sale shelves in the library’s back hall.' },
      gallery: [{ key: 'childrensBookSale', alt: 'Children’s and young-adult books in the library’s ongoing book sale.', caption: 'Children’s and young-adult books in the ongoing sale.' }],
      paragraphs: [support.bookSale, 'The next quarterly sale is October 16–17, 2026, from 10 a.m. to 2 p.m. Enter through the back door; cash sales only. These sales are an important source of library income.'],
      steps: ['Visit during library hours.', 'Browse the lobby carts and back-hall bookshelf.', 'Ask library personnel about purchasing your finds.'],
      action: { label: 'Plan your visit', href: '/#visit' },
    },
    {
      id: 'donate-books', title: 'Give books a new home', category: 'community', label: 'Material donations',
      summary: 'Donate gently used books and unblemished DVDs to the library.',
      image: { key: 'bookDonation', alt: 'Give old books new life. The library’s book-donation graphic asks visitors to bring materials to library personnel for processing.', fit: 'contain' },
      paragraphs: [support.materials],
      steps: ['Check that your books and DVDs are in good condition.', 'Leave out dictionaries, encyclopedias, textbooks and used workbooks.', 'Bring donations to library personnel during opening hours.'],
      action: { label: 'View library hours', href: '/#visit' },
    },
    {
      id: 'wow-points', title: 'Put your WOW points to work', category: 'community', label: 'Holiday Market',
      summary: support.wowPoints,
      image: { key: 'holidayMarket', alt: 'Holiday Market’s grocery storefront, where shoppers can donate WOW loyalty points.' },
      paragraphs: ['Your everyday grocery shopping can help support the library. Holiday Market shoppers can donate their WOW loyalty points to Cottonwood Community Library.'],
      steps: ['Use your Holiday Market rewards card when you shop.', 'Ask your cashier to donate your WOW points to Cottonwood Community Library.'],
      action: { label: 'Ask the library about WOW points', href: `mailto:${library.email}?subject=WOW%20points` },
    },
  ],
};
