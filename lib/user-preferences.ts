import type { FollowUpAssigneeScope } from "@/lib/request-assignee";
import { defaultFollowUpAssigneeScope } from "@/lib/request-assignee";
import type { AssignScopeFilter } from "@/lib/requests-query";
import type { AppRole } from "@/types/profile";

/** Vista predefinita «Le mie» / «Tutte» su Richieste, Inbox e Da seguire. */
export type DefaultAssignScopePreference = FollowUpAssigneeScope;

/** Layout predefinito della pagina Calendario. */
export type DefaultRequestsCalendarLayoutPreference = "month" | "week";

/** Pagina predefinita dopo login / apertura app. */
export type DefaultHomePagePreference =
  | "dashboard"
  | "follow-up"
  | "requests"
  | "calendar";

export const DEFAULT_HOME_PAGE_PATHS: Record<DefaultHomePagePreference, string> =
  {
    dashboard: "/app/dashboard",
    "follow-up": "/app/follow-up",
    requests: "/app/requests",
    calendar: "/app/calendar",
  };

export const DEFAULT_HOME_PAGE_LABELS: Record<DefaultHomePagePreference, string> =
  {
    dashboard: "Dashboard",
    "follow-up": "Da seguire",
    requests: "Richieste",
    calendar: "Calendario",
  };

export type UserPreferences = {
  defaultAssignScope?: DefaultAssignScopePreference;
  defaultRequestsCalendarLayout?: DefaultRequestsCalendarLayoutPreference;
  defaultHomePage?: DefaultHomePagePreference;
};

export function parseUserPreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const prefs: UserPreferences = {};
  if (o.defaultAssignScope === "all" || o.defaultAssignScope === "mine") {
    prefs.defaultAssignScope = o.defaultAssignScope;
  }
  if (
    o.defaultRequestsCalendarLayout === "month" ||
    o.defaultRequestsCalendarLayout === "week"
  ) {
    prefs.defaultRequestsCalendarLayout = o.defaultRequestsCalendarLayout;
  }
  if (
    o.defaultHomePage === "dashboard" ||
    o.defaultHomePage === "follow-up" ||
    o.defaultHomePage === "requests" ||
    o.defaultHomePage === "calendar"
  ) {
    prefs.defaultHomePage = o.defaultHomePage;
  }
  return prefs;
}

export function resolveDefaultAssignScope(
  preferences: UserPreferences,
  role: AppRole,
): FollowUpAssigneeScope {
  if (preferences.defaultAssignScope) {
    return preferences.defaultAssignScope;
  }
  return defaultFollowUpAssigneeScope(role);
}

export function resolveDefaultRequestsCalendarLayout(
  preferences: UserPreferences,
): DefaultRequestsCalendarLayoutPreference {
  return preferences.defaultRequestsCalendarLayout ?? "month";
}

export function resolveDefaultHomePage(
  preferences: UserPreferences,
): DefaultHomePagePreference {
  return preferences.defaultHomePage ?? "dashboard";
}

export function resolveDefaultHomePath(
  preferences: UserPreferences | undefined,
): string {
  const page = resolveDefaultHomePage(preferences ?? {});
  return DEFAULT_HOME_PAGE_PATHS[page];
}

export function defaultAssignScopeToFilter(
  scope: FollowUpAssigneeScope,
): AssignScopeFilter {
  return scope;
}
