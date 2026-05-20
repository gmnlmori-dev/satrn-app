import type { AppRole } from "@/types/profile";

export function canAssignRequests(role: AppRole): boolean {
  return role === "admin" || role === "manager";
}

export function canManageUsers(role: AppRole): boolean {
  return role === "admin";
}
