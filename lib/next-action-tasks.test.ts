import { describe, expect, it } from "vitest";
import {
  compareChecklistSortItems,
  effectiveNextActionAt,
  filterRequestsByFollowUpWindow,
  parseNextAction,
  serializeNextAction,
  sortChecklistTasksForFollowUp,
} from "@/lib/next-action-tasks";

describe("parseNextAction", () => {
  it("parses v2 JSON with tasks", () => {
    const raw = JSON.stringify({
      v: 2,
      text: "Nota",
      tasks: [{ id: "a", text: "Task A", done: false, dueAt: null }],
    });
    const parsed = parseNextAction(raw);
    expect(parsed.text).toBe("Nota");
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.tasks[0]?.text).toBe("Task A");
  });

  it("returns empty for blank input", () => {
    expect(parseNextAction("")).toEqual({ text: "", tasks: [] });
  });
});

describe("serializeNextAction", () => {
  it("round-trips v2 payload", () => {
    const content = {
      text: "x",
      tasks: [{ id: "t1", text: "Do thing", done: false, dueAt: null }],
    };
    const raw = serializeNextAction(content);
    expect(parseNextAction(raw)).toEqual(content);
  });
});

describe("compareChecklistSortItems", () => {
  const startTodayMs = new Date("2026-05-20T00:00:00.000Z").getTime();

  it("prioritizes overdue items in followUp mode", () => {
    const overdue = compareChecklistSortItems(
      { dueAt: "2026-05-19T12:00:00.000Z", taskIndex: 1 },
      { dueAt: "2026-05-21T12:00:00.000Z", taskIndex: 0 },
      "followUp",
      { startTodayMs },
    );
    expect(overdue).toBeLessThan(0);
  });

  it("falls back to taskIndex when due dates equal", () => {
    const cmp = compareChecklistSortItems(
      { dueAt: null, taskIndex: 2 },
      { dueAt: null, taskIndex: 5 },
      "requestGroup",
      { startTodayMs },
    );
    expect(cmp).toBeLessThan(0);
  });
});

describe("effectiveNextActionAt", () => {
  it("uses the most overdue date between request and checklist", () => {
    const requestDue = "2026-06-01T09:00:00.000Z";
    const checklistDue = "2026-05-01T09:00:00.000Z";
    expect(
      effectiveNextActionAt({
        nextActionAt: requestDue,
        nextAction: JSON.stringify({
          v: 2,
          text: "",
          tasks: [
            {
              id: "t1",
              text: "Task",
              done: false,
              dueAt: checklistDue,
            },
          ],
        }),
      }),
    ).toBe(checklistDue);
  });

  it("uses request date when it is earlier than checklist", () => {
    const requestDue = "2026-05-01T09:00:00.000Z";
    expect(
      effectiveNextActionAt({
        nextActionAt: requestDue,
        nextAction: JSON.stringify({
          v: 2,
          text: "",
          tasks: [
            {
              id: "t1",
              text: "Task",
              done: false,
              dueAt: "2026-06-10T09:00:00.000Z",
            },
          ],
        }),
      }),
    ).toBe(requestDue);
  });

  it("falls back to earliest open checklist due date", () => {
    const nextAction = JSON.stringify({
      v: 2,
      text: "",
      tasks: [
        {
          id: "t1",
          text: "Later",
          done: false,
          dueAt: "2026-06-10T09:00:00.000Z",
        },
        {
          id: "t2",
          text: "Most overdue",
          done: false,
          dueAt: "2026-05-01T09:00:00.000Z",
        },
        { id: "t3", text: "Done", done: true, dueAt: "2026-04-01T09:00:00.000Z" },
      ],
    });
    expect(
      effectiveNextActionAt({ nextActionAt: null, nextAction }),
    ).toBe("2026-05-01T09:00:00.000Z");
  });
});

describe("filterRequestsByFollowUpWindow", () => {
  const bounds = {
    startTodayIso: "2026-05-20T00:00:00.000Z",
    startTomorrowIso: "2026-05-21T00:00:00.000Z",
    endWeekIso: "2026-05-27T23:59:59.999Z",
  };

  it("includes requests without next_action_at but checklist due in window", () => {
    const request = {
      id: "r1",
      title: "Test",
      nextActionAt: null,
      nextAction: JSON.stringify({
        v: 2,
        text: "",
        tasks: [
          {
            id: "t1",
            text: "Call",
            done: false,
            dueAt: "2026-05-19T15:00:00.000Z",
          },
        ],
      }),
      status: "follow_up",
    } as import("@/types/request").Request;

    const overdue = filterRequestsByFollowUpWindow([request], "overdue", bounds);
    expect(overdue.map((r) => r.id)).toEqual(["r1"]);
  });

  it("includes requests when checklist due is more overdue than next_action_at", () => {
    const request = {
      id: "r2",
      title: "Checklist wins",
      nextActionAt: "2026-05-22T09:00:00.000Z",
      nextAction: JSON.stringify({
        v: 2,
        text: "",
        tasks: [
          {
            id: "t1",
            text: "Call",
            done: false,
            dueAt: "2026-05-19T15:00:00.000Z",
          },
        ],
      }),
      status: "follow_up",
    } as import("@/types/request").Request;

    const overdue = filterRequestsByFollowUpWindow([request], "overdue", bounds);
    expect(overdue.map((r) => r.id)).toEqual(["r2"]);
  });
});

describe("sortChecklistTasksForFollowUp", () => {
  it("orders by source order when no due dates", () => {
    const source = [
      { id: "1", text: "First", done: false, dueAt: null },
      { id: "2", text: "Second", done: false, dueAt: null },
    ];
    const shuffled = [source[1]!, source[0]!];
    const sorted = sortChecklistTasksForFollowUp(shuffled, source, {
      startTodayIso: "2026-05-20T00:00:00.000Z",
      startTomorrowIso: "2026-05-21T00:00:00.000Z",
      endWeekIso: "2026-05-27T23:59:59.999Z",
    });
    expect(sorted.map((t) => t.id)).toEqual(["1", "2"]);
  });
});
