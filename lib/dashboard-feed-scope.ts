import type { AppRole } from "@/types/profile";

export type DashboardFeedScope = "mine" | "team" | "other-team";

export type DashboardFeedScopeTag = {
  scope: DashboardFeedScope;
  label: string;
  tone: "accent" | "neutral" | "warning";
  title: string;
};

export type DashboardViewerContext = {
  userId: string;
  teamId: string;
  role: AppRole;
};

function metaActorUserId(
  meta: Record<string, unknown> | null | undefined,
): string | null {
  const id = meta?.changed_by_user_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/** Classifica un movimento per tag Tu / Team / altro team (admin). */
export function resolveDashboardFeedScope(input: {
  viewer: DashboardViewerContext;
  requestTeamId: string;
  requestTeamName?: string | null;
  assignedUserId?: string | null;
  activityMeta?: Record<string, unknown> | null;
}): DashboardFeedScopeTag {
  const { viewer } = input;
  const actorId = metaActorUserId(input.activityMeta);
  const isMyAction = Boolean(actorId && actorId === viewer.userId);
  const isAssignedToMe =
    Boolean(input.assignedUserId) && input.assignedUserId === viewer.userId;
  const isSameTeam =
    Boolean(viewer.teamId) &&
    Boolean(input.requestTeamId) &&
    input.requestTeamId === viewer.teamId;

  if (isMyAction || isAssignedToMe) {
    return {
      scope: "mine",
      label: "Tu",
      tone: "accent",
      title: isMyAction
        ? "Azione eseguita da te"
        : "Richiesta assegnata a te",
    };
  }

  if (isSameTeam) {
    return {
      scope: "team",
      label: "Team",
      tone: "neutral",
      title: "Movimento nel tuo team",
    };
  }

  const teamName = input.requestTeamName?.trim();
  return {
    scope: "other-team",
    label: teamName || "Altro team",
    tone: "warning",
    title: teamName
      ? `Richiesta del team ${teamName}`
      : "Richiesta di un altro team",
  };
}
