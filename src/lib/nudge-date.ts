const NUDGE_RESET_HOUR = 5;

export function formatDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getHourInTimeZone(date: Date, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(date),
  );
}

export function addDaysToDateString(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

/** Day bucket for completions; resets at 5:00 in the given IANA timezone. */
export function getNudgeDate(
  date: Date = new Date(),
  timeZone: string = "UTC",
): string {
  const calendarDate = formatDateInTimeZone(date, timeZone);
  const hour = getHourInTimeZone(date, timeZone);

  if (hour >= NUDGE_RESET_HOUR) {
    return calendarDate;
  }

  return addDaysToDateString(calendarDate, -1);
}
