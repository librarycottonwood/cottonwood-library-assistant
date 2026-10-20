/** Shared with the actual form rules; these guard content, never library facts. */
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validLink(value: unknown): true | string {
  if (typeof value !== 'string' || !value.trim()) return 'Enter a website address or a site page path.';
  if (/^\/(?!\/)[^\s\\]*$/.test(value)) return true;
  if (/^#[A-Za-z][\w-]*$/.test(value)) return true;
  if (/^mailto:[^\s@]+@[^\s@]+(?:\?[^\s]*)?$/.test(value) || /^tel:\+?[\d ()-]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? true : 'Use a secure https:// link or a site page path.';
  } catch {
    return 'Use a complete https:// link or a site page path such as /visit/.';
  }
}

export function validImage(value: unknown): true | string {
  if (!value || typeof value !== 'object') return 'Add a picture.';
  const image = value as {asset?: {_ref?: string}; legacyKey?: string};
  return image.asset?._ref || image.legacyKey?.trim() ? true : 'Upload a picture or keep the imported picture reference.';
}

export function validDateRange(value: unknown): true | string {
  if (!value || typeof value !== 'object') return true;
  const range = value as {startsOn?: string; endsOn?: string};
  return range.startsOn && range.endsOn && range.endsOn < range.startsOn
    ? 'The end date must be the same as or later than the start date.' : true;
}

export function validSession(value: unknown): true | string {
  if (!value || typeof value !== 'object') return true;
  const session = value as {startsAt?: string; endsAt?: string};
  if (session.startsAt && !Number.isFinite(Date.parse(session.startsAt))) return 'Choose a valid start date and time.';
  if (session.endsAt && !Number.isFinite(Date.parse(session.endsAt))) return 'Choose a valid end date and time.';
  return session.startsAt && session.endsAt && Date.parse(session.endsAt) <= Date.parse(session.startsAt)
    ? 'The end time must be later than the start time.' : true;
}

export function uniqueSessions(value: unknown): true | string {
  if (!Array.isArray(value)) return true;
  const starts = value.map((session: {startsAt?: string} | null) => session?.startsAt)
    .filter((start): start is string => Boolean(start))
    .map((start) => Number.isFinite(Date.parse(start)) ? new Date(start).toISOString() : start);
  return new Set(starts).size === starts.length ? true : 'This date and time is already listed. Keep one entry per occurrence.';
}

export function validNewsletter(value: unknown): true | string {
  const newsletter = value as {file?: {asset?: {_ref?: string}}; legacyFileUrl?: string} | undefined;
  return newsletter?.file?.asset?._ref || newsletter?.legacyFileUrl?.trim()
    ? true : 'Upload the newsletter PDF before publishing.';
}
