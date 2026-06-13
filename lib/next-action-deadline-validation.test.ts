import { describe, expect, it } from "vitest";
import {
  isChecklistDueAllowed,
  isNextActionDueAllowed,
  validateNextActionDeadlineAlignment,
} from "@/lib/next-action-deadline-validation";

const checklist = JSON.stringify({
  v: 2,
  text: "",
  tasks: [
    {
      id: "t1",
      text: "Task",
      done: false,
      dueAt: "2026-05-15T09:00:00.000Z",
    },
  ],
});

describe("validateNextActionDeadlineAlignment", () => {
  it("rejects checklist due after next_action_at", () => {
    const result = validateNextActionDeadlineAlignment(
      "2026-05-10T09:00:00.000Z",
      checklist,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects next_action_at before checklist due", () => {
    const result = validateNextActionDeadlineAlignment(
      "2026-05-01T09:00:00.000Z",
      checklist,
    );
    expect(result.ok).toBe(false);
  });

  it("accepts aligned deadlines", () => {
    const result = validateNextActionDeadlineAlignment(
      "2026-05-15T09:00:00.000Z",
      checklist,
    );
    expect(result).toEqual({ ok: true });
  });

  it("allows null next_action_at with checklist only", () => {
    expect(validateNextActionDeadlineAlignment(null, checklist)).toEqual({
      ok: true,
    });
  });
});

describe("helpers", () => {
  it("isChecklistDueAllowed compares against next action", () => {
    expect(
      isChecklistDueAllowed(
        "2026-05-20T09:00:00.000Z",
        "2026-05-15T09:00:00.000Z",
      ),
    ).toBe(false);
  });

  it("isNextActionDueAllowed mirrors server validation", () => {
    expect(
      isNextActionDueAllowed("2026-05-15T09:00:00.000Z", checklist),
    ).toBe(true);
  });
});
