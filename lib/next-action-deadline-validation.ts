import {
  earliestOpenChecklistDueAt,
  parseNextAction,
} from "@/lib/next-action-tasks";

function dueMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export type NextActionDeadlineValidationResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Allinea scadenza richiesta e checklist:
 * - checklist con due non può essere dopo next_action_at
 * - next_action_at non può essere prima della checklist più in ritardo
 */
export function validateNextActionDeadlineAlignment(
  nextActionAt: string | null,
  nextActionRaw: string,
): NextActionDeadlineValidationResult {
  const nextMs = dueMs(nextActionAt);
  if (nextMs === null) return { ok: true };

  const content = parseNextAction(nextActionRaw);

  for (const task of content.tasks) {
    if (task.done || !task.dueAt) continue;
    const taskMs = dueMs(task.dueAt);
    if (taskMs === null) continue;

    if (taskMs > nextMs) {
      return {
        ok: false,
        message:
          "La scadenza di un task checklist non può essere successiva alla scadenza prossima azione.",
      };
    }
  }

  const earliestChecklist = earliestOpenChecklistDueAt(nextActionRaw);
  const earliestMs = dueMs(earliestChecklist);
  if (earliestMs !== null && nextMs < earliestMs) {
    return {
      ok: false,
      message:
        "La scadenza prossima azione non può precedere quella della checklist.",
    };
  }

  return { ok: true };
}

/** Messaggio errore per singolo task checklist (validazione client). */
export function checklistDueAfterNextActionMessage(): string {
  return "La scadenza checklist non può essere successiva alla scadenza prossima azione.";
}

/** Messaggio errore per scadenza richiesta (validazione client). */
export function nextActionBeforeChecklistMessage(): string {
  return "La scadenza prossima azione non può precedere quella della checklist.";
}

export function isChecklistDueAllowed(
  taskDueAt: string | null,
  nextActionAt: string | null,
): boolean {
  const taskMs = dueMs(taskDueAt);
  const nextMs = dueMs(nextActionAt);
  if (taskMs === null || nextMs === null) return true;
  return taskMs <= nextMs;
}

export function isNextActionDueAllowed(
  nextActionAt: string | null,
  nextActionRaw: string,
): boolean {
  return validateNextActionDeadlineAlignment(nextActionAt, nextActionRaw).ok;
}
