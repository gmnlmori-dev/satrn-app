import type { Request, RequestPriority } from "@/types/request";
import { toDateKey, toDateKeyFromIso } from "@/lib/date";

export type CalendarCell = {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
};

const priorityRank: Record<RequestPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function addDays(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return startOfDay(d);
}

/** Lunedì come primo giorno della settimana (IT). */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export function buildMonthGrid(anchor: Date, today: Date = new Date()): CalendarCell[] {
  const monthStart = startOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const todayKey = toDateKey(today);
  const anchorMonth = anchor.getMonth();

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    const dateKey = toDateKey(date);
    cells.push({
      date,
      dateKey,
      isCurrentMonth: date.getMonth() === anchorMonth,
      isToday: dateKey === todayKey,
    });
  }
  return cells;
}

export function buildWeekGrid(anchor: Date, today: Date = new Date()): CalendarCell[] {
  const weekStart = startOfWeek(anchor);
  const todayKey = toDateKey(today);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    cells.push({
      date,
      dateKey: toDateKey(date),
      isCurrentMonth: true,
      isToday: toDateKey(date) === todayKey,
    });
  }
  return cells;
}

export function sortDayEvents(requests: Request[]): Request[] {
  return [...requests].sort((a, b) => {
    const pa = priorityRank[a.priority];
    const pb = priorityRank[b.priority];
    if (pa !== pb) return pa - pb;
    const ta = a.nextActionAt ? new Date(a.nextActionAt).getTime() : 0;
    const tb = b.nextActionAt ? new Date(b.nextActionAt).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return a.title.localeCompare(b.title, "it");
  });
}

export function groupRequestsByDay(requests: Request[]): Map<string, Request[]> {
  const map = new Map<string, Request[]>();
  for (const r of requests) {
    if (!r.nextActionAt) continue;
    const key = toDateKeyFromIso(r.nextActionAt);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(r);
    map.set(key, list);
  }
  for (const [key, list] of map) {
    map.set(key, sortDayEvents(list));
  }
  return map;
}

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
