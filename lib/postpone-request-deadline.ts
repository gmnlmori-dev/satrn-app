import { formatDateTime } from "@/lib/date";
import {
  earliestOpenChecklistDueAt,
  effectiveNextActionAt,
  parseNextAction,
  serializeNextAction,
  shiftOpenChecklistDueDatesTo,
} from "@/lib/next-action-tasks";
import type { Request } from "@/types/request";

export type PostponeRequestScope = "next_action" | "checklist" | "all";

export type PostponeScopeOption = {
  id: PostponeRequestScope;
  label: string;
  description: string;
};

type RequestPostponeSource = Pick<Request, "nextAction" | "nextActionAt">;

function openChecklistTasksWithDue(nextActionRaw: string) {
  return parseNextAction(nextActionRaw).tasks.filter(
    (task) => !task.done && task.dueAt,
  );
}

function dueMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function countOpenChecklistDueDates(nextActionRaw: string): number {
  return openChecklistTasksWithDue(nextActionRaw).length;
}

/** Chi determina oggi la scadenza visibile in Da seguire. */
export function requestPostponeDrivenBy(
  request: RequestPostponeSource,
): "next_action" | "checklist" | "none" {
  const effective = effectiveNextActionAt(request);
  if (!effective) return "none";

  const checklistEarliest = earliestOpenChecklistDueAt(request.nextAction);
  const nextMs = dueMs(request.nextActionAt);
  const checklistMs = dueMs(checklistEarliest);
  const effectiveMs = dueMs(effective);

  if (
    checklistMs !== null &&
    effectiveMs !== null &&
    checklistMs === effectiveMs &&
    (nextMs === null || checklistMs <= nextMs)
  ) {
    return "checklist";
  }

  return "next_action";
}

export function shouldShowRequestPostponeScope(
  request: RequestPostponeSource,
): boolean {
  return countOpenChecklistDueDates(request.nextAction) > 0;
}

export function defaultPostponeRequestScope(
  request: RequestPostponeSource,
): PostponeRequestScope {
  if (!shouldShowRequestPostponeScope(request)) return "next_action";
  return "all";
}

export function buildPostponeRequestScopeOptions(
  request: RequestPostponeSource,
): PostponeScopeOption[] {
  const drivenBy = requestPostponeDrivenBy(request);
  const checklistCount = countOpenChecklistDueDates(request.nextAction);
  const checklistNote =
    drivenBy === "checklist" ? " Checklist può restare più urgente." : "";

  const options: PostponeScopeOption[] = [
    {
      id: "next_action",
      label: "Prossima azione",
      description: `Solo scadenza richiesta.${checklistNote}`,
    },
    {
      id: "checklist",
      label: "Checklist",
      description: `${checklistCount === 1 ? "1 task" : `${checklistCount} task`} checklist con data.`,
    },
    {
      id: "all",
      label: "Entrambe",
      description: "Richiesta e checklist alla nuova data.",
    },
  ];

  return options;
}

/** Anteprima della scadenza effettiva dopo il posticipo. */
export function previewEffectiveAfterPostpone(
  request: RequestPostponeSource,
  newDueAt: string,
  scope: PostponeRequestScope,
): string | null {
  let nextActionAt = request.nextActionAt;
  let nextAction = request.nextAction;

  if (scope === "next_action" || scope === "all") {
    nextActionAt = newDueAt;
  }
  if (scope === "checklist" || scope === "all") {
    nextAction = shiftOpenChecklistDueDatesTo(nextAction, newDueAt);
  }

  return effectiveNextActionAt({ nextActionAt, nextAction });
}

export function previewPostponeOutcome(
  request: RequestPostponeSource,
  newDueAt: string,
  scope: PostponeRequestScope,
): string {
  const effective = previewEffectiveAfterPostpone(request, newDueAt, scope);
  if (!effective) return "Nessuna scadenza visibile.";
  return `Visibile: ${formatDateTime(effective)}`;
}

export function buildPostponeRequestUpdate(
  request: RequestPostponeSource,
  newDueAt: string,
  scope: PostponeRequestScope,
): {
  next_action_at?: string;
  next_action?: string;
} {
  const payload: { next_action_at?: string; next_action?: string } = {};

  if (scope === "next_action" || scope === "all") {
    payload.next_action_at = newDueAt;
  }

  if (scope === "checklist" || scope === "all") {
    const next = shiftOpenChecklistDueDatesTo(request.nextAction, newDueAt);
    if (next !== request.nextAction) {
      payload.next_action = next;
    }
  }

  return payload;
}
