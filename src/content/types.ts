/** Provider-neutral content: a future CMS adapter returns this same shape. */
export interface LibraryImage {
  key: string;
  alt: string;
  caption?: string;
  /** Preserve the full artwork/logo instead of cropping it like a photograph. */
  fit?: 'cover' | 'contain';
}

export interface Program {
  audience: 'children' | 'adults';
  id: string;
  title: string;
  schedule: string;
  description: string;
  details: string;
  image: LibraryImage;
}

export interface HomeContent {
  library: {
    name: string;
    phone: string;
    phoneHref: string;
    email: string;
    address: string;
    locality: string;
    mailingAddress: string;
    timezone: 'America/Los_Angeles';
    hoursSummary: string;
    hours: { days: string; hours: string }[];
    catalogUrl: string;
    directionsUrl: string;
    instagramUrl: string;
    /** Null until the library supplies an approved campaign. Never a placeholder URL. */
    donationUrl: string | null;
  };
  navigation: { label: string; href: string }[];
  hero: {
    eyebrow: string;
    heading: [string, string];
    introduction: string;
    image: LibraryImage;
  };
  programs: Program[];
  services: { id: string; title: string; description: string; icon: 'book' | 'computer' | 'printer' }[];
  borrowing: { question: string; answer: string }[];
  newsletter: {
    issue: string;
    title: string;
    summary: string;
    fileUrl: string;
    cover: LibraryImage;
  };
  story: { heading: string; paragraphs: string[]; image: LibraryImage };
  support: { title: string; introduction: string; image: LibraryImage; volunteerFileUrl: string; materials: string; bookSale: string; wowPoints: string };
}

export interface SupportInitiative {
  gallery?: LibraryImage[];
  id: string;
  title: string;
  category: 'giving' | 'volunteering' | 'community';
  label: string;
  summary: string;
  image: LibraryImage;
  paragraphs: string[];
  steps: string[];
  action: { label: string; href: string; download?: boolean };
}

export interface SupportContent {
  updates: SupportUpdate[];
  initiatives: SupportInitiative[];
  /** Only published, approved campaigns belong here. No synthetic totals. */
  campaigns: FundraisingCampaign[];
}

/** The first campaign that has not ended is the active one; it drives every Donate button. */
export interface FundraisingCampaign {
  id: string;
  title: string;
  description: string;
  /** Approved donation page, such as the library's Givebutter campaign. */
  url: string;
  /** Whole dollars, copied from the donation page. */
  raised: number;
  goal: number;
  currency: 'USD';
  /** YYYY-MM-DD the raised amount was last copied. */
  updatedAt: string;
  /** YYYY-MM-DD, inclusive (Pacific time). After this day the campaign disappears and Donate buttons revert. */
  endsOn?: string;
  image?: LibraryImage;
}

/** Site-wide banner, such as a holiday closure. Dates are YYYY-MM-DD in Pacific time, both inclusive. */
export interface LibraryNotice {
  id: string;
  message: string;
  startsOn: string;
  endsOn: string;
  link?: { label: string; href: string };
}

export interface SupportUpdate {
  id: string;
  title: string;
  body: string;
  category: string;
  image: LibraryImage;
  href: string;
  linkLabel: string;
}

/** Confirmed occurrences only. Recurrence descriptions do not create dates. */
export interface LibraryEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  summary: string;
  href: string;
}

/** Library-written updates or attributed links to articles. Undated items stay last. */
export interface LibraryPost {
  id: string;
  title: string;
  publishedAt: string | null;
  dateLabel?: string;
  category: string;
  summary: string;
  href: string;
  paragraphs: string[];
  externalUrl?: string;
  sourceLabel?: string;
  /** Cover photo for the post page and news feeds. */
  image?: LibraryImage;
  /** Extra photos shown below the post. */
  gallery?: LibraryImage[];
}
