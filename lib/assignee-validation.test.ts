import { describe, expect, it } from "vitest";
import {
  normalizeAssigneeIds,
  sameAssigneeSet,
  validateSharedNoteUsers,
} from "@/lib/assignee-actions";
import { validateAssigneeProfiles } from "@/lib/assignee-validation";

describe("normalizeAssigneeIds", () => {
  it("deduplicates and sorts ids", () => {
    expect(normalizeAssigneeIds([" b ", "a", "b", ""])).toEqual(["a", "b"]);
  });
});

describe("sameAssigneeSet", () => {
  it("compares sorted assignee sets", () => {
    expect(sameAssigneeSet(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameAssigneeSet(["a"], ["a", "b"])).toBe(false);
  });
});

describe("validateAssigneeProfiles", () => {
  const teamId = "team-1";

  it("rejects inactive users", () => {
    const result = validateAssigneeProfiles(
      [
        {
          user_id: "u1",
          full_name: "A",
          email: null,
          is_active: false,
          team_id: teamId,
        },
      ],
      ["u1"],
      teamId,
      "manager",
    );
    expect(result).toEqual({
      ok: false,
      message: "Uno o più utenti selezionati non sono attivi.",
    });
  });

  it("rejects cross-team assignees for non-admin", () => {
    const result = validateAssigneeProfiles(
      [
        {
          user_id: "u1",
          full_name: "A",
          email: null,
          is_active: true,
          team_id: "other-team",
        },
      ],
      ["u1"],
      teamId,
      "manager",
    );
    expect(result.ok).toBe(false);
  });

  it("accepts valid team assignees", () => {
    const result = validateAssigneeProfiles(
      [
        {
          user_id: "u1",
          full_name: "A",
          email: null,
          is_active: true,
          team_id: teamId,
        },
      ],
      ["u1"],
      teamId,
      "manager",
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("validateSharedNoteUsers", () => {
  it("mirrors assignee rules for note sharing", () => {
    const result = validateSharedNoteUsers(
      [{ user_id: "u1", team_id: "team-a", is_active: true }],
      ["u1"],
      "team-a",
      "operator",
    );
    expect(result).toEqual({ ok: true });
  });
});
