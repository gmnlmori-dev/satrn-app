import { describe, expect, it } from "vitest";
import {
  followUpHiddenChecklistDueAts,
  followUpRequestDeadlineLines,
  isChecklistDueHiddenInFollowUp,
} from "@/lib/follow-up-request-deadline";

const checklistDue = "2026-06-13T21:59:00.000Z";
const requestDue = "2026-06-20T21:59:00.000Z";
const sameDue = "2026-06-13T21:59:00.000Z";

const nextActionWithDue = JSON.stringify({
  v: 2,
  text: "",
  tasks: [{ id: "t1", text: "Task", done: false, dueAt: checklistDue }],
});

describe("followUpRequestDeadlineLines", () => {
  it("merges identical next action and checklist dates", () => {
    expect(
      followUpRequestDeadlineLines({
        nextActionAt: sameDue,
        nextAction: nextActionWithDue,
      }),
    ).toEqual([
      {
        iso: sameDue,
        label: "Checklist · Prossima azione",
        kind: "both",
      },
    ]);
  });

  it("shows separate labeled lines when dates differ", () => {
    expect(
      followUpRequestDeadlineLines({
        nextActionAt: requestDue,
        nextAction: nextActionWithDue,
      }),
    ).toEqual([
      { iso: checklistDue, label: "Checklist", kind: "checklist" },
      { iso: requestDue, label: "Prossima azione", kind: "next_action" },
    ]);
  });

  it("shows only checklist when request has no next_action_at", () => {
    expect(
      followUpRequestDeadlineLines({
        nextActionAt: null,
        nextAction: nextActionWithDue,
      }),
    ).toEqual([{ iso: checklistDue, label: "Checklist", kind: "checklist" }]);
  });
});

describe("followUpHiddenChecklistDueAts", () => {
  it("hides checklist due already shown in row header", () => {
    const hidden = followUpHiddenChecklistDueAts({
      nextActionAt: sameDue,
      nextAction: nextActionWithDue,
    });
    expect(isChecklistDueHiddenInFollowUp(checklistDue, hidden)).toBe(true);
  });
});
