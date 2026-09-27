// Timezone-aware local-date helpers. Challenge weeks are counted in the challenge's
// time zone so "this week" means the same thing for both friends.

const MS_PER_DAY = 86_400_000;

/** "YYYY-MM-DD" for an instant, as seen in the given IANA time zone. */
export function localDateString(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function toUtcDay(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `from` to `to` (both "YYYY-MM-DD"). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcDay(to) - toUtcDay(from)) / MS_PER_DAY);
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function addDays(date: string, days: number): string {
  return new Date(toUtcDay(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export type ChallengePhase =
  | { kind: "not_started"; daysUntilStart: number }
  | { kind: "active"; week: number }
  | { kind: "ended" };

/** Where today falls relative to the challenge's calendar. */
export function challengePhase(startDate: string, today: string, durationWeeks: number): ChallengePhase {
  const days = daysBetween(startDate, today);
  if (days < 0) return { kind: "not_started", daysUntilStart: -days };
  const week = Math.floor(days / 7) + 1;
  if (week > durationWeeks) return { kind: "ended" };
  return { kind: "active", week };
}

/**
 * The challenge week a local date counts towards. Workouts done before the start date
 * count towards week 1; late workouts count towards the final week.
 */
export function weekForDate(startDate: string, date: string, durationWeeks: number): number {
  const week = Math.floor(daysBetween(startDate, date) / 7) + 1;
  return Math.min(Math.max(week, 1), durationWeeks);
}

/** "Today", "Yesterday", "Saturday" (within a week) or "12 Mar". */
export function relativeDayLabel(instant: Date, now: Date, timeZone: string): string {
  const days = daysBetween(localDateString(instant, timeZone), localDateString(now, timeZone));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long" }).format(instant);
  return new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short" }).format(instant);
}

/** "Mon 6 Oct" style label for a "YYYY-MM-DD" date. */
export function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(
    new Date(toUtcDay(date)),
  );
}
