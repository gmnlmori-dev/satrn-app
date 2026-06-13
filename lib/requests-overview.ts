import type { Request, RequestStatus } from "@/types/request";
import { isSameCalendarDay } from "@/lib/date";
import { effectiveNextActionAt } from "@/lib/next-action-tasks";

export function countOpenRequests(requests: Request[]): number {
  return requests.filter((r) => r.status !== "closed").length;
}

export function countByStatus(
  requests: Request[],
  status: RequestStatus
): number {
  return requests.filter((r) => r.status === status).length;
}

export function countDueToday(requests: Request[], ref: Date = new Date()): number {
  return requests.filter(
    (r) =>
      r.status !== "closed" &&
      effectiveNextActionAt(r) &&
      isSameCalendarDay(effectiveNextActionAt(r)!, ref),
  ).length;
}
