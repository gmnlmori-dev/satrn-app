import type { FollowUpAssigneeScope } from "@/lib/request-assignee";

export function scopeFromSearchParam(
  raw: string | null,
  fallback: FollowUpAssigneeScope,
): FollowUpAssigneeScope {
  if (raw === "mine") return "mine";
  if (raw === "all") return "all";
  return fallback;
}

/** Scrive `?scope=` nell'URL preservando hash e altri query param. */
export function persistAssigneeScopeInUrl(
  scope: FollowUpAssigneeScope,
  pathname: string,
  searchParams: URLSearchParams,
) {
  const next = new URLSearchParams(searchParams.toString());
  if (scope === "all") {
    next.delete("scope");
  } else {
    next.set("scope", scope);
  }
  const query = next.toString();
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const url = `${pathname}${query ? `?${query}` : ""}${hash}`;
  window.history.replaceState(null, "", url);
}
