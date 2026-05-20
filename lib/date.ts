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
