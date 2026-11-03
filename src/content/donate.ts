import { contentRepository } from './repository';
import { activeCampaign, checkGivebutterId } from './feeds';
import type { FundraisingCampaign, GivebutterLibrary } from './types';

/** Opens Givebutter's checkout popup from our own link (Givebutter's documented
 * data-gb-account + data-gb-campaign "custom element" option). */
export interface GivebutterCheckout { account: string; campaign: string; }

export interface DonateLink {
  /** Always a real destination, used when JavaScript is off, Givebutter's script hasn't loaded yet, or a content
   * blocker stops it. It is the Givebutter page itself, so a click always reaches a working donation form. */
  href: string;
  label: string;
  campaignTitle?: string;
  /** campaign: active fundraiser · library: library.givebutter / library.donationUrl · fallback: the Donate page (call or email until online giving is set up). */
  source: 'campaign' | 'library' | 'fallback';
  /** Present when the button opens Givebutter's checkout popup on this site. */
  checkout?: GivebutterCheckout;
  /** True when the click leaves the site (no popup and an outside href). */
  external: boolean;
  /** For a fundraiser with an end date: the link the site switches to after that day. Pages are built ahead of
   * time, so the visitor's browser makes the switch (see CampaignExpiry.astro) without waiting for a new save. */
  after?: { endsOn: string; link: DonateLink };
}

/** library.givebutter, validated, or undefined while the board hasn't supplied it. */
export async function libraryGivebutter(): Promise<GivebutterLibrary | undefined> {
  const gb = (await contentRepository.getHome()).library.givebutter;
  if (!gb) return undefined;
  checkGivebutterId(gb.account, 'library.givebutter.account');
  checkGivebutterId(gb.campaign, 'library.givebutter.campaign');
  return gb;
}

/** The Givebutter account a fundraiser's widgets belong to: its own override, else the library's. */
export async function campaignAccount(campaign: FundraisingCampaign): Promise<string> {
  const account = campaign.givebutter.account ?? (await libraryGivebutter())?.account;
  if (!account) throw new Error(`Campaign ${campaign.id} needs a Givebutter account: set library.givebutter in site settings or givebutter.account on the campaign (the acct=… value from the widget code)`);
  return account;
}

/** On-site spot where the active fundraiser's donation form is shown. */
export const DONATE_PAGE_HREF = '/donate/';
/** The general giving initiative. The Donate page replaces its old separate page, which redirects there. */
export const DONATE_INITIATIVE_ID = 'library-fund';
export const FUNDRAISER_FORM_HREF = `${DONATE_PAGE_HREF}#give`;

/** The one place every Donate button gets its destination. Ending or removing a
 * campaign in the CMS reverts every button at the next build. With nothing
 * configured in Givebutter, buttons are plain links exactly as before.
 */
export async function getDonateLink(now = Date.now()): Promise<DonateLink> {
  const [{ library: settings }, support, library] = await Promise.all([contentRepository.getHome(), contentRepository.getSupport(), libraryGivebutter()]);
  const campaign = activeCampaign(support.campaigns, now);
  if (campaign) {
    const account = await campaignAccount(campaign);
    const label = `Give to ${campaign.title}`;
    const code = campaign.givebutter.campaign;
    const after = campaign.endsOn ? { endsOn: campaign.endsOn, link: await getDonateLink(dayAfter(campaign.endsOn)) } : undefined;
    // With the fundraiser's campaign code the popup opens its checkout; without the popup the link goes to the campaign's Givebutter page.
    if (code) return { href: campaign.url, label, campaignTitle: campaign.title, source: 'campaign', checkout: { account, campaign: code }, external: false, after };
    return { href: FUNDRAISER_FORM_HREF, label, campaignTitle: campaign.title, source: 'campaign', external: false, after };
  }
  const { donationUrl } = settings;
  // The popup opens Givebutter's checkout. Without it, the link goes to the Givebutter page (as the old site did);
  // our own Donate page would only show another Donate button that needs the same popup.
  if (library) return { href: donationUrl ?? DONATE_PAGE_HREF, label: 'Give to the library', source: 'library', checkout: { account: library.account, campaign: library.campaign }, external: false };
  if (donationUrl) return { href: donationUrl, label: 'Give to the library', source: 'library', external: true };
  return { href: DONATE_PAGE_HREF, label: 'Make a donation', source: 'fallback', external: false };
}

/** Noon (Pacific) on the day after a YYYY-MM-DD end date: the first moment the fundraiser has ended. */
export function dayAfter(endsOn: string): number {
  return Date.parse(`${endsOn}T12:00:00-08:00`) + 864e5;
}

/** Attributes that turn one of our own Donate links into Givebutter's checkout popup. Spread onto the <a>.
 * A fundraiser with an end date also carries the link to switch to afterwards (data-after-*). */
export function checkoutAttributes(link: DonateLink): Record<string, string> {
  const attributes: Record<string, string> = link.checkout ? { 'data-gb-account': link.checkout.account, 'data-gb-campaign': link.checkout.campaign } : {};
  if (link.after) {
    const later = link.after.link;
    attributes['data-campaign-ends'] = link.after.endsOn;
    attributes['data-after-href'] = later.href;
    if (later.checkout) Object.assign(attributes, { 'data-after-gb-account': later.checkout.account, 'data-after-gb-campaign': later.checkout.campaign });
  }
  return attributes;
}

/** Account for Givebutter's widget script when every page needs it (Donate buttons in the header open the popup).
 * undefined → no site-wide script; a page showing a fundraiser form then loads it itself. */
export async function sitewideGivebutterAccount(now = Date.now()): Promise<string | undefined> {
  return (await getDonateLink(now)).checkout?.account;
}

export function givebutterScriptSrc(account: string): string {
  return `https://widgets.givebutter.com/latest.umd.cjs?acct=${encodeURIComponent(account)}`;
}
