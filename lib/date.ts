/** Fuso orario di riferimento per scadenze solo-data parse lato server. */
export const APP_TIMEZONE = "Europe/Rome";

const itDate = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const itDateTime = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return itDate.format(new Date(iso));
}

export function formatCalendarDay(date: Date): string {
  return itDate.format(date);
}

export function formatDateTime(iso: string): string {
  return itDateTime.format(new Date(iso));
}

export function isSameCalendarDay(iso: string, ref: Date = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

/** Valore per input `datetime-local` da ISO UTC. */
export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ISO da valore `datetime-local` (interpretato come orario locale). */
export function fromDatetimeLocalValue(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const t = new Date(v).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

/** Valore per input `type="date"` da ISO. */
export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return toDateKey(d);
}

/** Valore per input `type="time"` da ISO (HH:mm). */
export function toTimeInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function todayDateInputValue(ref: Date = new Date()): string {
  return toDateKey(ref);
}

function zonedDateTimeParts(
  date: Date,
  timeZone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === "24" ? "0" : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Istante UTC per data/ora “a parete” in un fuso IANA (es. solo-data → 23:59). */
export function zonedDateTimeToUtcIso(
  date: string,
  time: string,
  timeZone: string = APP_TIMEZONE,
): string | null {
  const d = date.trim();
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;

  const [y, m, day] = d.split("-").map(Number);
  let hour = 23;
  let minute = 59;
  let second = 0;

  const t = time.trim();
  if (t) {
    if (!/^\d{2}:\d{2}$/.test(t)) return null;
    [hour, minute] = t.split(":").map(Number);
    second = 0;
  }

  let utcMs = Date.UTC(y, m - 1, day, hour, minute, second);
  for (let i = 0; i < 4; i++) {
    const parts = zonedDateTimeParts(new Date(utcMs), timeZone);
    const desiredMs = Date.UTC(y, m - 1, day, hour, minute, second);
    const actualMs = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const diff = desiredMs - actualMs;
    if (diff === 0) break;
    utcMs += diff;
  }

  const result = new Date(utcMs);
  if (Number.isNaN(result.getTime())) return null;
  return result.toISOString();
}

function endOfLocalDayFromDateInputInRuntimeTimezone(date: string): string | null {
  const d = date.trim();
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const [y, m, day] = d.split("-").map(Number);
  const end = new Date(y, m - 1, day, 23, 59, 0, 0);
  if (Number.isNaN(end.getTime())) return null;
  return end.toISOString();
}

/**
 * Combina data e ora opzionale (locale). Solo data → fine giornata (23:59).
 * Lato server usa `APP_TIMEZONE` (Vercel è UTC e altrimenti sposterebbe la scadenza).
 */
export function endOfLocalDayFromDateInput(date: string): string | null {
  if (typeof window === "undefined") {
    return zonedDateTimeToUtcIso(date, "", APP_TIMEZONE);
  }
  return endOfLocalDayFromDateInputInRuntimeTimezone(date);
}

export function fromDateAndTimeInputs(
  date: string,
  time: string,
): string | null {
  const d = date.trim();
  if (!d) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;

  const t = time.trim();
  if (typeof window === "undefined") {
    return zonedDateTimeToUtcIso(d, t, APP_TIMEZONE);
  }

  if (t) {
    if (!/^\d{2}:\d{2}$/.test(t)) return null;
    const local = new Date(`${d}T${t}`);
    if (Number.isNaN(local.getTime())) return null;
    return local.toISOString();
  }

  return endOfLocalDayFromDateInputInRuntimeTimezone(d);
}

/** True se l'ISO cade alle 23:59 locali (scadenza solo-data). */
export function isEndOfLocalDayIso(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  if (typeof window === "undefined") {
    const parts = zonedDateTimeParts(d, APP_TIMEZONE);
    return parts.hour === 23 && parts.minute === 59 && parts.second === 0;
  }
  return d.getHours() === 23 && d.getMinutes() === 59;
}

/** Legge scadenza da FormData (ISO pre-calcolato, date+time o legacy datetime-local). */
export function nextActionAtFromFormData(fd: FormData): string | null {
  const precomputed = String(fd.get("nextActionAtIso") ?? "").trim();
  if (precomputed) {
    const t = new Date(precomputed).getTime();
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }

  const date = String(fd.get("nextActionAtDate") ?? "").trim();
  const time = String(fd.get("nextActionAtTime") ?? "").trim();
  if (date) {
    return fromDateAndTimeInputs(date, time);
  }

  const legacy = String(fd.get("nextActionAt") ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(legacy)) {
    return endOfLocalDayFromDateInput(legacy);
  }
  return fromDatetimeLocalValue(legacy);
}

export function nowIso(): string {
  return new Date().toISOString();
}

const itMonthYear = new Intl.DateTimeFormat("it-IT", {
  month: "long",
  year: "numeric",
});

const itWeekdayShort = new Intl.DateTimeFormat("it-IT", { weekday: "short" });

const itTime = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatMonthYear(date: Date): string {
  const s = itMonthYear.format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Intervallo settimana calendario, es. «5–11 Maggio 2026» o «28 Aprile – 4 Maggio 2026». */
export function formatCalendarWeekRange(start: Date, end: Date): string {
  const sy = start.getFullYear();
  const ey = end.getFullYear();
  const sm = start.getMonth();
  const em = end.getMonth();

  if (sy === ey && sm === em) {
    return `${start.getDate()}–${end.getDate()} ${formatMonthYear(start)}`;
  }

  if (sy === ey) {
    const startMonth = formatMonthYear(start).split(" ")[0] ?? "";
    const endMonth = formatMonthYear(end).split(" ")[0] ?? "";
    return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${sy}`;
  }

  return `${start.getDate()} ${formatMonthYear(start)} – ${end.getDate()} ${formatMonthYear(end)}`;
}

export function formatWeekdayShort(date: Date): string {
  return itWeekdayShort.format(date).replace(/\.$/, "");
}

export function formatTime(iso: string): string {
  return itTime.format(new Date(iso));
}

/** Chiave giorno locale YYYY-MM-DD per raggruppamento calendario. */
export function toDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return toDateKey(d);
}

export function parseMonthParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [y, m] = value.split("-").map(Number);
  if (!y || m < 1 || m > 12) return null;
  return new Date(y, m - 1, 1);
}

export function monthParamFromDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function isToday(date: Date, ref: Date = new Date()): boolean {
  return toDateKey(date) === toDateKey(ref);
}

export function isRequestOverdue(
  nextActionAt: string,
  status: string,
  now: Date = new Date(),
): boolean {
  if (status === "closed") return false;
  return new Date(nextActionAt).getTime() < now.getTime();
}
