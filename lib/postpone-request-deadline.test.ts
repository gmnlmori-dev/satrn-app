import { describe, expect, it } from "vitest";
import {
  buildPostponeRequestUpdate,
  defaultPostponeRequestScope,
  previewEffectiveAfterPostpone,
  requestPostponeDrivenBy,
  shouldShowRequestPostponeScope,
} from "@/lib/postpone-request-deadline";
import { shiftOpenChecklistDueDatesTo } from "@/lib/next-action-tasks";

const checklistDue = "2026-05-01T09:00:00.000Z";
const requestDue = "2026-06-01T09:00:00.000Z";

const nextAction = JSON.stringify({
  v: 2,
  text: "",
  tasks: [{ id: "t1", text: "Task", done: false, dueAt: checklistDue }],
});

describe("shiftOpenChecklistDueDatesTo", () => {
  it("updates open checklist tasks with due date", () => {
    const next = shiftOpenChecklistDueDatesTo(
      nextAction,
      "2026-05-10T09:00:00.000Z",
    );
    expect(next).toContain("2026-05-10T09:00:00.000Z");
  });
});

describe("requestPostponeDrivenBy", () => {
  it("detects checklist-driven effective date", () => {
    expect(
      requestPostponeDrivenBy({
        nextActionAt: requestDue,
        nextAction,
      }),
    ).toBe("checklist");
  });
});

describe("buildPostponeRequestUpdate", () => {
  it("updates only next_action_at for next_action scope", () => {
    expect(
      buildPostponeRequestUpdate(
        { nextActionAt: requestDue, nextAction },
        "2026-07-01T09:00:00.000Z",
        "next_action",
      ),
    ).toEqual({ next_action_at: "2026-07-01T09:00:00.000Z" });
  });

  it("updates checklist for checklist scope", () => {
    const payload = buildPostponeRequestUpdate(
      { nextActionAt: requestDue, nextAction },
      "2026-07-01T09:00:00.000Z",
      "checklist",
    );
    expect(payload.next_action_at).toBeUndefined();
    expect(payload.next_action).toContain("2026-07-01T09:00:00.000Z");
  });

  it("updates both for all scope", () => {
    const payload = buildPostponeRequestUpdate(
      { nextActionAt: requestDue, nextAction },
      "2026-07-01T09:00:00.000Z",
      "all",
    );
    expect(payload.next_action_at).toBe("2026-07-01T09:00:00.000Z");
    expect(payload.next_action).toContain("2026-07-01T09:00:00.000Z");
  });
});

describe("previewEffectiveAfterPostpone", () => {
  it("changes visible date when postponing checklist", () => {
    expect(
      previewEffectiveAfterPostpone(
        { nextActionAt: requestDue, nextAction },
        "2026-07-01T09:00:00.000Z",
        "checklist",
      ),
    ).toBe("2026-07-01T09:00:00.000Z");
  });

  it("leaves checklist date when only next_action scope", () => {
    expect(
      previewEffectiveAfterPostpone(
        { nextActionAt: requestDue, nextAction },
        "2026-07-01T09:00:00.000Z",
        "next_action",
      ),
    ).toBe(checklistDue);
  });
});

describe("shouldShowRequestPostponeScope", () => {
  it("shows scope when checklist has due dates", () => {
    expect(
      shouldShowRequestPostponeScope({ nextActionAt: requestDue, nextAction }),
    ).toBe(true);
  });

  it("hides scope without checklist due dates", () => {
    expect(
      shouldShowRequestPostponeScope({
        nextActionAt: requestDue,
        nextAction: JSON.stringify({ v: 2, text: "", tasks: [] }),
      }),
    ).toBe(false);
  });
});

describe("defaultPostponeRequestScope", () => {
  it("defaults to all when checklist has due dates", () => {
    expect(
      defaultPostponeRequestScope({ nextActionAt: requestDue, nextAction }),
    ).toBe("all");
  });
});
