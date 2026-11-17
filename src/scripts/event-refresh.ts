// Pages are built ahead of time, so the visitor's browser keeps event listings current:
// it hides events (EventCards) and featured event blocks ([data-event-feature-expires]) once they end,
// moves regular-program badges to their next session, and swaps dates for "Today", "Tomorrow" and "This Friday".
// Imported by EventCards and by every page with a featured event, so it runs even when a page has no event cards.
import { nextScheduledDay } from '../content/schedule.mjs';
const zone = 'America/Los_Angeles';
const dayKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const weekday = (key: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(new Date(`${key}T12:00:00Z`));
// Day maths on the date text, so a daylight-saving change can't skip or repeat a day.
const addDays = (key: string, days: number) => new Date(Date.parse(`${key}T12:00:00Z`) + days * 864e5).toISOString().slice(0, 10);
const shortDay = (key: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(new Date(`${key}T12:00:00Z`));
const refreshEvents = () => {
  const now = Date.now();
  const today = dayKey(new Date(now)), tomorrow = addDays(today, 1);
  // Regular programs: move the badge to the next session once the built-in date has passed.
  for (const badge of document.querySelectorAll<HTMLElement>('[data-schedule]')) {
    const next = nextScheduledDay(badge.dataset.schedule, today);
    if (!next || next.day === badge.dataset.eventDay) continue;
    badge.dataset.eventDay = next.day;
    badge.dataset.dateLabel = shortDay(next.day);
    if (badge.firstChild?.nodeType === Node.TEXT_NODE) badge.firstChild.textContent = badge.dataset.dateLabel;
  }
  // "This Tuesday" only up to this Saturday; later dates keep their full label.
  const week = addDays(today, 6 - new Date(`${today}T12:00:00Z`).getUTCDay());
  for (const list of document.querySelectorAll<HTMLElement>('[data-event-list]')) {
    const maximum = Number(list.dataset.eventLimit ?? Infinity);
    let shown = 0;
    // Dated events come first, then regular programs, which never expire.
    for (const card of list.querySelectorAll<HTMLElement>('[data-event-card]')) {
      const expires = card.dataset.eventExpires;
      const active = (!expires || Date.parse(expires) >= now) && shown < maximum;
      card.hidden = !active;
      if (active) shown++;
    }
    for (const badge of list.querySelectorAll<HTMLElement>('[data-event-day]')) {
      const key = badge.dataset.eventDay!;
      const label = key === today ? 'Today' : key === tomorrow ? 'Tomorrow' : key > today && key <= week ? `This ${weekday(key)}` : '';
      const visible = badge.firstChild;
      if (label && visible?.nodeType === Node.TEXT_NODE) { badge.dataset.dateLabel ??= visible.textContent ?? ''; visible.textContent = label; }
      else if (!label && visible?.nodeType === Node.TEXT_NODE && badge.dataset.dateLabel) visible.textContent = badge.dataset.dateLabel;
    }
    const rows = list.querySelector<HTMLElement>('[data-event-rows]');
    const empty = list.querySelector<HTMLElement>('[data-event-empty]');
    list.dataset.eventCount = String(shown);
    if (rows) rows.hidden = shown === 0;
    if (empty) empty.hidden = shown > 0;
  }
  for (const feature of document.querySelectorAll<HTMLElement>('[data-event-feature-expires]')) {
    feature.hidden = Date.parse(feature.dataset.eventFeatureExpires!) < now;
  }
};
refreshEvents();
window.setInterval(refreshEvents, 30000);
document.addEventListener('visibilitychange', refreshEvents);
