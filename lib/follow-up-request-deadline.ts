import {
  earliestOpenChecklistDueAt,
} from "@/lib/next-action-tasks";
import type { Request } from "@/types/request";

export function dueAtIsoEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return new Date(a).getTime() === new Date(b).getTime();
}

export type FollowUpDeadlineLine = {
  iso: string;
  label: string;
  kind: "checklist" | "next_action" | "both";
};

type RequestDeadlineSource = Pick<Request, "nextActionAt" | "nextAction">;

/** Righe etichettate per la riga progetto in Da seguire (senza duplicati). */
export function followUpRequestDeadlineLines(
  request: RequestDeadlineSource,
): FollowUpDeadlineLine[] {
  const nextAt = request.nextActionAt;
  const checklistEarliest = earliestOpenChecklistDueAt(request.nextAction);

  if (!nextAt && !checklistEarliest) return [];

  if (nextAt && checklistEarliest && dueAtIsoEqual(nextAt, checklistEarliest)) {
    return [
      {
        iso: nextAt,
        label: "Checklist · Prossima azione",
        kind: "both",
      },
    ];
  }

  const lines: FollowUpDeadlineLine[] = [];
  if (checklistEarliest) {
    lines.push({
      iso: checklistEarliest,
      label: "Checklist",
      kind: "checklist",
    });
  }
  if (nextAt && !dueAtIsoEqual(nextAt, checklistEarliest)) {
    lines.push({
      iso: nextAt,
      label: "Prossima azione",
      kind: "next_action",
    });
  } else if (nextAt && !checklistEarliest) {
    lines.push({
      iso: nextAt,
      label: "Prossima azione",
      kind: "next_action",
    });
  }

  lines.sort(
    (a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime(),
  );
  return lines;
}

/** Date già mostrate in testata riga: non ripeterle nei task checklist. */
export function followUpHiddenChecklistDueAts(
  request: RequestDeadlineSource,
): string[] {
  return followUpRequestDeadlineLines(request).map((line) => line.iso);
}

export function isChecklistDueHiddenInFollowUp(
  dueAt: string | null,
  hiddenDueAts: string[],
): boolean {
  if (!dueAt) return false;
  return hiddenDueAts.some((hidden) => dueAtIsoEqual(hidden, dueAt));
}
