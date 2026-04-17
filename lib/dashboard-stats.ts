import type { Request } from "@/types/request";
import { isSameCalendarDay } from "@/lib/date";

export interface DashboardStats {
  nuove: number;
  inValutazione: number;
  daSeguireOggi: number;
  ferme: number;
}

export function computeDashboardStats(requests: Request[]): DashboardStats {
  const today = new Date();
  let daSeguireOggi = 0;

  for (const r of requests) {
    if (r.status === "closed") continue;
    if (!r.nextActionAt) continue;
    if (isSameCalendarDay(r.nextActionAt, today)) {
      daSeguireOggi += 1;
    }
  }

  return {
    nuove: requests.filter((r) => r.status === "new").length,
    inValutazione: requests.filter((r) => r.status === "in_review").length,
    daSeguireOggi,
    ferme: requests.filter((r) => r.status === "waiting").length,
  };
}

export function getRecentRequests(requests: Request[], limit = 5): Request[] {
  return [...requests]
    .filter((r) => r.status !== "closed")
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, limit);
}

export function getFollowUpToday(requests: Request[]): Request[] {
  const today = new Date();
  return requests
    .filter(
      (r) =>
        r.status !== "closed" &&
        r.nextActionAt &&
        isSameCalendarDay(r.nextActionAt, today)
    )
    .sort(
      (a, b) =>
        new Date(a.nextActionAt!).getTime() - new Date(b.nextActionAt!).getTime()
    );
}
