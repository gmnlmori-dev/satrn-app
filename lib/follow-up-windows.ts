/** Finestre temporali in orario locale server (coerente con `isSameCalendarDay` in UI). */

export function getFollowUpWindowBounds(now = new Date()) {
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const startTomorrow = new Date(startToday);
  startTomorrow.setDate(startTomorrow.getDate() + 1);

  const endWeek = new Date(startToday);
  endWeek.setDate(endWeek.getDate() + 7);
  endWeek.setHours(23, 59, 59, 999);

  return {
    startTodayIso: startToday.toISOString(),
    startTomorrowIso: startTomorrow.toISOString(),
    endWeekIso: endWeek.toISOString(),
  };
}

export function tomorrowAtNineLocalIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}
