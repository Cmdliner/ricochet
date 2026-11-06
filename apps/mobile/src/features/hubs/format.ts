const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** "Today", "Yesterday", a weekday for the last week, then a date. */
export function formatDayLabel(timestamp: number, now = Date.now()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(timestamp)) / DAY);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  const date = new Date(timestamp);
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatListTime(timestamp: number, now = Date.now()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(timestamp)) / DAY);
  if (diffDays <= 0) return formatClock(timestamp);
  if (diffDays === 1) return "Yesterday";
  return formatDayLabel(timestamp, now);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
