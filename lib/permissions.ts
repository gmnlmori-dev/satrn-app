import type { AppRole } from "@/types/profile";

export function canAssignRequests(role: AppRole): boolean {
  return role === "admin" || role === "manager";
}

/** Solo admin/manager gestiscono le definizioni dei tag di team. */
export function canManageTeamTags(role: AppRole): boolean {
  return role === "admin" || role === "manager";
}

/** Admin e manager vedono metadati cross-team nel popup task calendario. */
export function canViewAllTeamsRequestMeta(role: AppRole): boolean {
  return canAssignRequests(role);
}

export function canManageTeams(role: AppRole): boolean {
  return role === "admin";
}

export function canManageUsers(role: AppRole): boolean {
  return role === "admin";
}
