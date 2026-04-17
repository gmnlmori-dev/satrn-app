import type {
  Request,
  RequestPriority,
  RequestStatus,
} from "@/types/request";

export type ToolbarFilters = {
  search: string;
  status: RequestStatus | "all";
  priority: RequestPriority | "all";
  source: string | "all";
};

export const defaultToolbarFilters = (): ToolbarFilters => ({
  search: "",
  status: "all",
  priority: "all",
  source: "all",
});

export function collectSources(requests: Request[]): string[] {
  return [...new Set(requests.map((r) => r.source))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
}

export function filterByToolbar(
  requests: Request[],
  f: ToolbarFilters
): Request[] {
  const q = f.search.trim().toLowerCase();
  return requests.filter((r) => {
    if (f.status !== "all" && r.status !== f.status) return false;
    if (f.priority !== "all" && r.priority !== f.priority) return false;
    if (f.source !== "all" && r.source !== f.source) return false;
    if (!q) return true;
    const hay = [
      r.title,
      r.companyName,
      r.contactName,
      r.contactEmail,
      r.nextAction,
      r.source,
      r.id,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export type SortOption =
  | "updated_desc"
  | "updated_asc"
  | "priority_desc"
  | "priority_asc"
  | "status_asc"
  | "status_desc";

const statusPipeline: RequestStatus[] = [
  "new",
  "in_review",
  "waiting",
  "follow_up",
  "closed",
];

const priorityRank: Record<RequestPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function sortRequests(
  requests: Request[],
  sort: SortOption
): Request[] {
  const out = [...requests];
  out.sort((a, b) => {
    switch (sort) {
      case "updated_desc":
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case "updated_asc":
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      case "priority_desc":
        return priorityRank[a.priority] - priorityRank[b.priority];
      case "priority_asc":
        return priorityRank[b.priority] - priorityRank[a.priority];
      case "status_asc":
        return (
          statusPipeline.indexOf(a.status) - statusPipeline.indexOf(b.status)
        );
      case "status_desc":
        return (
          statusPipeline.indexOf(b.status) - statusPipeline.indexOf(a.status)
        );
      default:
        return 0;
    }
  });
  return out;
}

export function filtersActive(f: ToolbarFilters): boolean {
  return (
    f.search.trim().length > 0 ||
    f.status !== "all" ||
    f.priority !== "all" ||
    f.source !== "all"
  );
}
