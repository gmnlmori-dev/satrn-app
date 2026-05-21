import type { AppRole } from "@/types/profile";

export type TeamQueryScope = {
  role: AppRole;
  teamId: string;
};

/** Admin vede tutti i team; manager/operator solo il proprio. */
export function scopesToTeam(scope: TeamQueryScope): boolean {
  return scope.role !== "admin";
}

export function applyTeamIdFilter<
  T extends { eq: (column: string, value: string) => T },
>(query: T, scope: TeamQueryScope, column = "team_id"): T {
  if (scopesToTeam(scope) && scope.teamId) {
    return query.eq(column, scope.teamId);
  }
  return query;
}
