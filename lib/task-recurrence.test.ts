import { describe, expect, it } from "vitest";
import {
  buildRecurrenceForSave,
  computeNextDueAt,
  defaultRecurrenceDraft,
  formatTaskRecurrenceSummary,
  isRecurrenceSeriesEnded,
  parseTaskRecurrence,
  recurrenceSeriesEndedAfterComplete,
  validateTaskRecurrence,
} from "@/lib/task-recurrence";

describe("parseTaskRecurrence", () => {
  it("parses weekly rule from JSON string", () => {
    const rule = parseTaskRecurrence(
      JSON.stringify({
        interval: 1,
        frequency: "weekly",
        weekdays: [1, 3],
        startAt: "2026-05-20T09:00:00.000Z",
        end: { type: "never" },
        completedCount: 0,
      }),
    );
    expect(rule?.frequency).toBe("weekly");
    expect(rule?.weekdays).toEqual([1, 3]);
  });
});

describe("computeNextDueAt", () => {
  it("advances daily every 2 days", () => {
    const rule = buildRecurrenceForSave(
      { interval: 2, frequency: "daily", end: { type: "never" } },
      "2026-05-20T09:00:00.000Z",
    );
    const next = computeNextDueAt(rule, "2026-05-20T09:00:00.000Z");
    expect(next).toBe("2026-05-22T09:00:00.000Z");
  });

  it("advances weekly on selected weekdays", () => {
    const rule = buildRecurrenceForSave(
      {
        interval: 1,
        frequency: "weekly",
        weekdays: [1, 3],
        end: { type: "never" },
      },
      "2026-05-19T09:00:00.000Z",
    );
    const next = computeNextDueAt(rule, "2026-05-19T09:00:00.000Z");
    expect(next).toBe("2026-05-21T09:00:00.000Z");
  });

  it("advances monthly on day of month", () => {
    const rule = buildRecurrenceForSave(
      {
        interval: 1,
        frequency: "monthly",
        monthlyBy: { mode: "dayOfMonth", day: 13 },
        end: { type: "never" },
      },
      "2026-05-13T23:59:00.000Z",
    );
    const next = computeNextDueAt(rule, "2026-05-13T23:59:00.000Z");
    expect(next).toBe("2026-06-13T23:59:00.000Z");
  });

  it("uses rule schedule after late completion", () => {
    const rule = buildRecurrenceForSave(
      { interval: 1, frequency: "daily", end: { type: "never" } },
      "2026-05-20T09:00:00.000Z",
    );
    const next = computeNextDueAt(rule, "2026-05-20T09:00:00.000Z");
    expect(next).toBe("2026-05-21T09:00:00.000Z");
  });
});

describe("recurrence end conditions", () => {
  it("ends after N occurrences", () => {
    const rule = buildRecurrenceForSave(
      { interval: 1, frequency: "daily", end: { type: "count", count: 2 } },
      "2026-05-20T09:00:00.000Z",
    );
    const next = computeNextDueAt(rule, "2026-05-20T09:00:00.000Z");
    expect(recurrenceSeriesEndedAfterComplete({ ...rule, completedCount: 1 }, next)).toBe(
      true,
    );
  });

  it("ends when next due is after until date", () => {
    const rule = buildRecurrenceForSave(
      {
        interval: 1,
        frequency: "daily",
        end: { type: "until", until: "2026-05-21T23:59:59.999Z" },
      },
      "2026-05-20T09:00:00.000Z",
    );
    const next = computeNextDueAt(rule, "2026-05-20T09:00:00.000Z");
    expect(isRecurrenceSeriesEnded({ ...rule, completedCount: 1 }, next)).toBe(true);
  });
});

describe("validateTaskRecurrence", () => {
  it("requires due date", () => {
    const draft = defaultRecurrenceDraft("2026-05-20T09:00:00.000Z");
    const rule = buildRecurrenceForSave(draft, "2026-05-20T09:00:00.000Z");
    expect(validateTaskRecurrence(rule, null)).toMatch(/scadenza/i);
  });
});

describe("formatTaskRecurrenceSummary", () => {
  it("formats weekly summary in Italian", () => {
    const rule = buildRecurrenceForSave(
      {
        interval: 1,
        frequency: "weekly",
        weekdays: [1, 3],
        end: { type: "never" },
      },
      "2026-05-20T09:00:00.000Z",
    );
    expect(formatTaskRecurrenceSummary(rule)).toContain("settimana");
    expect(formatTaskRecurrenceSummary(rule)).toContain("mar");
  });
});
