import type { FundraisingCampaign, LibraryEvent, LibraryNotice, LibraryPost } from './types';

export function upcomingEvents(events: LibraryEvent[], now = Date.now()): LibraryEvent[] {
  return events.filter(event => {
    const zoned = (value: string) => /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value);
    const start = Date.parse(event.startsAt);
    const end = event.endsAt ? Date.parse(event.endsAt) : start;
    if (!zoned(event.startsAt) || (event.endsAt && !zoned(event.endsAt)) || !Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      throw new Error(`Invalid event dates: ${event.id}`);
    }
    return end >= now;
  }).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export function newestPosts(posts: LibraryPost[]): LibraryPost[] {
  return [...posts].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

export function formatDay(day: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
}

export function postDate(post: LibraryPost): string {
  return post.publishedAt ? formatDay(post.publishedAt) : post.dateLabel ?? 'From the library';
}

/** Today's YYYY-MM-DD at the library, so day-based content changes at Pacific midnight. */
export function libraryToday(now = Date.now()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

// Fail the build with a plain message rather than silently hiding a mistyped date.
function checkDay(value: string | undefined, label: string): void {
  if (value === undefined) return;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().startsWith(value);
  if (!valid) throw new Error(`${label} must be a real date written YYYY-MM-DD, not "${value}"`);
}

/** Givebutter ids go into a script URL and an element id, so only plain letters, digits, _ and - are allowed (never pasted HTML). */
function checkWidgetId(value: unknown, label: string) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(value)) throw new Error(`${label} must be just the id copied from the Givebutter widget code (letters, numbers, _ or -), not "${String(value)}"`);
}

/** Campaigns still running today, in listed order. The first one is the active campaign. */
export function currentCampaigns(campaigns: FundraisingCampaign[], now = Date.now()): FundraisingCampaign[] {
  const today = libraryToday(now);
  return campaigns.filter(campaign => {
    checkDay(campaign.endsOn, `Campaign ${campaign.id} endsOn`);
    checkWidgetId(campaign.givebutter?.account, `Campaign ${campaign.id} givebutter.account`);
    checkWidgetId(campaign.givebutter?.goalBarWidgetId, `Campaign ${campaign.id} givebutter.goalBarWidgetId`);
    return !campaign.endsOn || campaign.endsOn >= today;
  });
}

export function activeCampaign(campaigns: FundraisingCampaign[], now = Date.now()): FundraisingCampaign | undefined {
  return currentCampaigns(campaigns, now)[0];
}

/** Notices that have not ended. Ones starting later stay hidden until the visitor's browser reaches startsOn. */
export function unexpiredNotices(notices: LibraryNotice[], now = Date.now()): (LibraryNotice & { started: boolean })[] {
  const today = libraryToday(now);
  return notices.flatMap(notice => {
    checkDay(notice.startsOn, `Notice ${notice.id} startsOn`);
    checkDay(notice.endsOn, `Notice ${notice.id} endsOn`);
    if (notice.endsOn < notice.startsOn) throw new Error(`Notice ${notice.id} ends before it starts`);
    return notice.endsOn >= today ? [{ ...notice, started: notice.startsOn <= today }] : [];
  });
}
