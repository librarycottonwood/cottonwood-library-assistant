/** Next date of a regular program from its schedule text: see schedule.mjs. */
export function parseSchedule(schedule: unknown): { days: number[]; nth: number | null; time?: string } | null;
export function nextScheduledDay(schedule: unknown, todayKey: string): { day: string; time?: string } | null;
export function sessionPhrase<T extends { day: string }>(sessions: T[]): { text: string; session?: T }[];
