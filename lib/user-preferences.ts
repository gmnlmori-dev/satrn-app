import type { FollowUpAssigneeScope } from "@/lib/request-assignee";
import { defaultFollowUpAssigneeScope } from "@/lib/request-assignee";
import type { AssignScopeFilter } from "@/lib/requests-query";
import type { AppRole } from "@/types/profile";

/** Vista predefinita «Le mie» / «Tutte» su Richieste e Da seguire. */
export type DefaultAssignScopePreference = FollowUpAssigneeScope;

/** Vista predefinita su Richieste: elenco tabellare o calendario scadenze. */
export type DefaultRequestsViewPreference = "list" | "calendar";

/** Layout predefinito del calendario richieste. */
export type DefaultRequestsCalendarLayoutPreference = "month" | "week";

export type UserPreferences = {
  defaultAssignScope?: DefaultAssignScopePreference;
  defaultRequestsView?: DefaultRequestsViewPreference;
  defaultRequestsCalendarLayout?: DefaultRequestsCalendarLayoutPreference;
};

export function parseUserPreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const prefs: UserPreferences = {};
  if (o.defaultAssignScope === "all" || o.defaultAssignScope === "mine") {
    prefs.defaultAssignScope = o.defaultAssignScope;
  }
  if (o.defaultRequestsView === "list" || o.defaultRequestsView === "calendar") {
    prefs.defaultRequestsView = o.defaultRequestsView;
  }
  if (
    o.defaultRequestsCalendarLayout === "month" ||
    o.defaultRequestsCalendarLayout === "week"
  ) {
    prefs.defaultRequestsCalendarLayout = o.defaultRequestsCalendarLayout;
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

export function resolveDefaultRequestsView(
  preferences: UserPreferences,
): DefaultRequestsViewPreference {
  return preferences.defaultRequestsView ?? "list";
}

export function resolveDefaultRequestsCalendarLayout(
  preferences: UserPreferences,
): DefaultRequestsCalendarLayoutPreference {
  return preferences.defaultRequestsCalendarLayout ?? "month";
}

export function defaultAssignScopeToFilter(
  scope: FollowUpAssigneeScope,
): AssignScopeFilter {
  return scope;
}
