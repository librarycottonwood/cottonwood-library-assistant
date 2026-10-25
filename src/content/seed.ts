import type { HomeContent } from './types';

/** Source: research/site-inventory.md and the library's Summer 2026 newsletter.
 * Editorial headlines are prototype copy. Public facts need library review before launch.
 * Keep program recurrences separate from project meetings; do not invent dated occurrences.
 */
export const homeContent = {
  library: {
    name: 'Cottonwood Community Library',
    phone: '(530) 347-4818',
    phoneHref: 'tel:+15303474818',
    email: 'cottonlib@shasta.com',
    address: '3427 Main Street',
    locality: 'Cottonwood, CA 96022',
    mailingAddress: 'PO Box 1807, Cottonwood, CA 96022',
    timezone: 'America/Los_Angeles',
    hoursSummary: 'Mon–Wed 11–5 · Sat 11–2',
    hours: [
      { days: 'Monday–Wednesday', hours: '11 a.m.–5 p.m.' },
      { days: 'Thursday–Friday', hours: 'Closed' },
      { days: 'Saturday', hours: '11 a.m.–2 p.m.' },
      { days: 'Sunday', hours: 'Closed' },
    ],
    catalogUrl: 'https://cottonlib.follettdestiny.com/',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=3427+Main+Street+Cottonwood+CA+96022',
    instagramUrl: 'https://www.instagram.com/cottonwoodcommunitylibrary/',
    donationUrl: null,
    // The general donation campaign in Givebutter, e.g. { account: 'AbC123xYz', campaign: 'Q1W2E3' }.
    // null until the board supplies it; then every Donate button opens Givebutter's checkout popup
    // (see .claude/skills/fundraisers/SKILL.md, "Donate buttons").
    givebutter: null as HomeContent['library']['givebutter'],
  },
  navigation: [
    { label: 'Visit & services', href: '/visit/' },
    { label: 'Events & news', href: '/librarynews/' },
    { label: 'Kids & families', href: '/kids/' },
    { label: 'Our story', href: '/our-story/' },
    { label: 'Support us', href: '/fundraising-events/' },
  ],
  hero: {
    eyebrow: 'Rooted in Cottonwood · Open to you',
    heading: ['Your community.', 'Your library.'],
    introduction: 'Come read, play and connect.',
    image: { key: 'exterior', alt: 'Cottonwood Community Library on Main Street, decorated with flags and red, white, and blue bunting.', caption: 'A little library with a big heart, right here on Main Street.' },
  },
  serviceImage: { key: 'computerLab', alt: 'Public computer workstations inside Cottonwood Community Library.' },
  givingImage: { key: 'interior', alt: 'Bookshelves and reading spaces inside Cottonwood Community Library.' },
  programs: [
    {
      audience: 'children', id: 'story-time', title: 'Story Time',
      schedule: 'Wednesdays · 11:30 a.m.',
      description: 'Stories, songs, a simple craft, and a healthy snack. A little midweek magic for your little ones.',
      details: 'Stories, songs, crafts and a snack for preschoolers during the school year; older children are welcome in summer. First 5 Shasta helps provide take-home books.',
      image: { key: 'storytime', alt: 'The Story Time corner set up with rows of small wooden chairs on an alphabet rug, under a sky-blue draped ceiling with puffy clouds.' },
    },
    {
      audience: 'adults', id: 'main-street-readers', title: 'Main Street Readers',
      schedule: 'Third Tuesday · 2:30 p.m.',
      description: 'Come talk about what you’ve been reading. No assigned book, no homework—just a shared love of stories.',
      details: 'This informal group meets at the library to share recent reads and recommendations. Bring your thoughts about a book you loved—or one you wish you hadn’t picked up.',
      image: { key: 'mainStreetReaders', alt: 'Main Street Readers artwork with a streetlamp and an open book. Books, friends, community; every page connects us.', fit: 'contain' },
    },
    {
      audience: 'adults', id: 'book-club', title: 'Book Club',
      schedule: 'Third Thursday · 1 p.m.',
      description: 'Find your next great read and a lively conversation with fellow book lovers at our monthly book club.',
      details: 'Book Club titles are held at the front desk for members a month ahead. The library is otherwise closed on Thursdays; please enter through the back door by the book drop.',
      image: { key: 'bookClub', alt: 'Book Club poster showing a woman reading. Every third Thursday at 1 p.m., with lively discussions and fellow bookworms.', fit: 'contain' },
    },
  ],
  services: [
    { id: 'borrowing', title: 'Library catalog', description: 'Browse our collection.', icon: 'book' },
    { id: 'computers', title: 'Computers & Wi-Fi', description: 'Public computers and Wi-Fi.', icon: 'computer' },
    { id: 'printing', title: 'Printing & copying', description: 'Black-and-white: 20¢ per page. Color copies: $1.', icon: 'printer' },
  ],
  borrowing: [
    { question: 'How do I borrow books?', answer: 'If you’re 18 or older, bring photo ID and proof of residence to the front desk. Family accounts let other household members, including minors, borrow under the primary account holder’s name. We don’t issue physical library cards—just tell a volunteer your account name. New patrons may borrow 3 items, increasing to 10 after the first successful return.' },
    { question: 'Can I renew my items?', answer: 'Items can be renewed twice, in person or by phone. Late fees are 10¢ per day, capped at the item’s replacement cost. Fees are payable in cash before the next checkout. Use the outdoor book drop to return items when we’re closed.' },
    { question: 'How do I use the computers and printer?', answer: 'Sign in at the front desk before using a computer. First-time users need to read and agree to the computer-use policy. Black-and-white printing is 20¢ per page or 40¢ for a double-sided page; black-and-white copies are 20¢ per page and color copies are $1. The Wi-Fi password is on the placard at the front desk.' },
  ],
  newsletter: {
    issue: 'Summer 2026', title: 'A little news from your library',
    summary: 'Meet the Main Street Readers, catch up on our Book Fairies at the Cottonwood Rodeo Parade, and see what’s been happening at Story Time.',
    fileUrl: '/documents/cottonwood-library-newsletter-summer-2026.pdf',
    cover: { key: 'newsletter', alt: 'Cover of the Cottonwood Community Library Summer 2026 newsletter.', fit: 'contain' },
  },
  story: {
    heading: 'Built by neighbors. Here for you.',
    paragraphs: [
      'When Cottonwood lost its county library branch, this community came together to bring it back. In 1996, a library opened in a rented downtown space. In 2007, thanks to land donated by Dr. James and Mary Reifert and the generosity of our neighbors, we opened the doors on Main Street.',
      'Today, a part-time director and dedicated volunteers keep our library going. With no government funding, every book, program, and open door is made possible by community support.',
    ],
    image: { key: 'founders', alt: 'The library’s founders plaque honoring Dr. James and Mary Reifert.', caption: 'Dr. James and Mary Reifert donated the land for the library.' },
  },
  support: {
    title: 'Keep your library open.',
    introduction: 'No county or taxpayer funding. Donations help cover day-to-day operations.',
    image: { key: 'watercolor', alt: 'Watercolor of Cottonwood Community Library, with its red roof, American flag and garden.' },
    volunteerFileUrl: '/documents/cottonwood-library-volunteer-application.pdf',
    materials: 'We welcome gently used books and unblemished DVDs. Please bring materials to library personnel. We can’t accept damaged books, dictionaries, encyclopedias, textbooks, or used workbooks.',
    bookSale: 'Larger book sales are held roughly quarterly, when storage fills up. Browse the ongoing lobby and back-hall sales during library hours. Every purchase helps fund the library.',
    wowPoints: 'Shopping at Holiday Market? Ask your cashier to donate your WOW loyalty points to Cottonwood Community Library.',
  },
} satisfies HomeContent;
