import { homeContent } from './seed';
import { supportContent } from './support';
import { activeCampaign } from './feeds';

export interface DonateLink {
  href: string;
  label: string;
  campaignTitle?: string;
  /** campaign: active fundraiser · library: library.donationUrl · fallback: the library-fund page. */
  source: 'campaign' | 'library' | 'fallback';
}

/** The one place every Donate button gets its destination. Ending or removing a
 * campaign in support.ts reverts every button at the next build.
 */
export function getDonateLink(now = Date.now()): DonateLink {
  const campaign = activeCampaign(supportContent.campaigns, now);
  if (campaign) return { href: campaign.url, label: `Give to ${campaign.title}`, campaignTitle: campaign.title, source: 'campaign' };
  const { donationUrl } = homeContent.library;
  if (donationUrl) return { href: donationUrl, label: 'Give to the library', source: 'library' };
  return { href: '/fundraising-events/library-fund/', label: 'Make a donation', source: 'fallback' };
}
