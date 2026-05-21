import type { AppRole } from "@/types/profile";

export type TeamQueryScope = {
  role: AppRole;
  teamId: string;
};

/** Admin vede tutti i team; manager/operator solo il proprio. */
export function scopesToTeam(scope: TeamQueryScope): boolean {
  return scope.role !== "admin";
}

/** team_id da applicare alle query, o null se admin / senza team. */
export function teamIdForScope(scope: TeamQueryScope): string | null {
  if (scopesToTeam(scope) && scope.teamId) {
    return scope.teamId;
  }
  return null;
}
