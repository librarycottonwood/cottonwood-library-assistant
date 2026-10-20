export function pacificDateLabel(value: unknown, includeTime = false): string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return 'Choose a date';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', dateStyle: 'medium', ...(includeTime ? {timeStyle: 'short' as const} : {}),
  }).format(new Date(value));
}
