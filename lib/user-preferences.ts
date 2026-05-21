import type { FollowUpAssigneeScope } from "@/lib/request-assignee";
import { defaultFollowUpAssigneeScope } from "@/lib/request-assignee";
import type { AssignScopeFilter } from "@/lib/requests-query";
import type { AppRole } from "@/types/profile";

/** Vista predefinita «Le mie» / «Tutte» su Richieste e Da seguire. */
export type DefaultAssignScopePreference = FollowUpAssigneeScope;

export type UserPreferences = {
  defaultAssignScope?: DefaultAssignScopePreference;
};

export function parseUserPreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const prefs: UserPreferences = {};
  if (o.defaultAssignScope === "all" || o.defaultAssignScope === "mine") {
    prefs.defaultAssignScope = o.defaultAssignScope;
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

export function defaultAssignScopeToFilter(
  scope: FollowUpAssigneeScope,
): AssignScopeFilter {
  return scope;
}
