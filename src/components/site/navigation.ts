// Site navigation for the new design (SiteHeader and SiteFooter), as in Figma.
// It is site structure, not library facts, so it lives here rather than in Sanity: a page's address
// only exists once its code does. Old SiteLayout pages keep the Sanity "Main navigation" until they move.
//
// While a page still uses the old design, its link goes to the old page's address. When the new page
// ships (docs/redesign-plan.md), change `href` to the new address and redirect the old one in astro.config.

export interface NavLink {
  label: string;
  href: string;
  /** Other address prefixes that belong to this tab (news posts and newsletters belong to Events & News). */
  also?: string[];
}

/** Header links, left to right. Support Us is the Donate button, so it isn't repeated here. */
export const mainNavigation: NavLink[] = [
  { label: 'Explore Services', href: '/services/' },
  { label: 'Events & News', href: '/events/', also: ['/news/', '/newsletter/', '/newsletters/'] },
  { label: 'Visit Us', href: '/visit/' },
  { label: 'About Us', href: '/about/' },
];

/** The Support Us page. The header Donate button links here; its own button opens Givebutter's popup. */
export const supportLink: NavLink = { label: 'Support Us', href: '/donate/' };

/** Footer "Explore" links: Home, the header links, then Support Us (the catalog link is added after). */
export const footerNavigation: NavLink[] = [{ label: 'Home', href: '/' }, ...mainNavigation, supportLink];

/** A regular program's page (Story Time, reading groups). They are listed on Events & News, so they live under it. */
export const programHref = (id: string) => `/events/regular/${id}/`;

/** True when `href` is the page being shown or a page under it. Links with a #fragment never count. */
export function isCurrentPage(href: string, pathname: string): boolean {
  if (href.includes('#') || href === '/') return false;
  return pathname === href || pathname.startsWith(href.endsWith('/') ? href : `${href}/`);
}

/** True when the page being shown is this tab's page, under it, or under one of its `also` sections. */
export function isCurrentSection(link: NavLink, pathname: string): boolean {
  return [link.href, ...(link.also ?? [])].some(href => isCurrentPage(href, pathname));
}
