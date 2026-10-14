import { homeContent } from './seed';
import { supportContent } from './support';
import { activeCampaign, checkGivebutterId } from './feeds';
import type { FundraisingCampaign, GivebutterLibrary } from './types';

/** Opens Givebutter's checkout popup from our own link (Givebutter's documented
 * data-gb-account + data-gb-campaign "custom element" option). */
export interface GivebutterCheckout { account: string; campaign: string; }

export interface DonateLink {
  /** Always a real destination, used when JavaScript is off or Givebutter's script is blocked. */
  href: string;
  label: string;
  campaignTitle?: string;
  /** campaign: active fundraiser · library: library.givebutter / library.donationUrl · fallback: the library-fund page. */
  source: 'campaign' | 'library' | 'fallback';
  /** Present when the button opens Givebutter's checkout popup on this site. */
  checkout?: GivebutterCheckout;
  /** True when the click leaves the site (no popup and an outside href). */
  external: boolean;
}

/** library.givebutter, validated, or undefined while the board hasn't supplied it. */
export function libraryGivebutter(): GivebutterLibrary | undefined {
  const gb = homeContent.library.givebutter;
  if (!gb) return undefined;
  checkGivebutterId(gb.account, 'library.givebutter.account');
  checkGivebutterId(gb.campaign, 'library.givebutter.campaign');
  return gb;
}

/** The Givebutter account a fundraiser's widgets belong to: its own override, else the library's. */
export function campaignAccount(campaign: FundraisingCampaign): string {
  const account = campaign.givebutter.account ?? libraryGivebutter()?.account;
  if (!account) throw new Error(`Campaign ${campaign.id} needs a Givebutter account: set library.givebutter in seed.ts or givebutter.account on the campaign (the acct=… value from the widget code)`);
  return account;
}

/** On-site spot where the active fundraiser's donation form is shown. */
export const FUNDRAISER_FORM_HREF = '/fundraising-events/library-fund/#give';

/** The one place every Donate button gets its destination. Ending or removing a
 * campaign in support.ts reverts every button at the next build. With nothing
 * configured in Givebutter, buttons are plain links exactly as before.
 */
export function getDonateLink(now = Date.now()): DonateLink {
  const library = libraryGivebutter();
  const campaign = activeCampaign(supportContent.campaigns, now);
  if (campaign) {
    const account = campaignAccount(campaign);
    const label = `Give to ${campaign.title}`;
    const code = campaign.givebutter.campaign;
    // With the fundraiser's campaign code the popup opens its checkout; without it, send people to the on-site form.
    if (code) return { href: campaign.url, label, campaignTitle: campaign.title, source: 'campaign', checkout: { account, campaign: code }, external: false };
    return { href: FUNDRAISER_FORM_HREF, label, campaignTitle: campaign.title, source: 'campaign', external: false };
  }
  const { donationUrl } = homeContent.library;
  if (library) return { href: donationUrl ?? `https://givebutter.com/${library.campaign}`, label: 'Give to the library', source: 'library', checkout: { account: library.account, campaign: library.campaign }, external: false };
  if (donationUrl) return { href: donationUrl, label: 'Give to the library', source: 'library', external: true };
  return { href: '/fundraising-events/library-fund/', label: 'Make a donation', source: 'fallback', external: false };
}

/** Attributes that turn one of our own Donate links into Givebutter's checkout popup. Spread onto the <a>. */
export function checkoutAttributes(link: DonateLink): Record<string, string> {
  return link.checkout ? { 'data-gb-account': link.checkout.account, 'data-gb-campaign': link.checkout.campaign } : {};
}

/** Account for Givebutter's widget script when every page needs it (Donate buttons in the header open the popup).
 * undefined → no site-wide script; a page showing a fundraiser form then loads it itself. */
export function sitewideGivebutterAccount(now = Date.now()): string | undefined {
  return getDonateLink(now).checkout?.account;
}

export function givebutterScriptSrc(account: string): string {
  return `https://widgets.givebutter.com/latest.umd.cjs?acct=${encodeURIComponent(account)}`;
}
