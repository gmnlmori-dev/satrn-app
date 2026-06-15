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
  const hasNextActionAt = Boolean(request.nextActionAt);

  const checklistNote =
    drivenBy === "checklist"
      ? " In lista potresti ancora vedere la data della checklist se resta più urgente."
      : "";

  const options: PostponeScopeOption[] = [
    {
      id: "next_action",
      label: "Solo prossima azione",
      description: hasNextActionAt
        ? `Aggiorna la scadenza «Prossima azione» della richiesta.${checklistNote}`
        : `Imposta la scadenza «Prossima azione» della richiesta.${checklistNote}`,
    },
    {
      id: "checklist",
      label: "Solo checklist",
      description: `Sposta la scadenza di ${checklistCount === 1 ? "1 task" : `${checklistCount} task`} checklist apert${checklistCount === 1 ? "o" : "i"} con data. La scadenza della richiesta non cambia.`,
    },
    {
      id: "all",
      label: "Prossima azione e checklist",
      description:
        "Allinea prossima azione e tutte le scadenze checklist aperte alla nuova data. Consigliato se vuoi cambiare la data che vedi in Da seguire.",
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
  if (!effective) {
    return "Dopo il salvataggio la richiesta non avrà una scadenza operativa.";
  }
  return `Dopo il salvataggio la scadenza visibile sarà ${formatDateTime(effective)}.`;
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
