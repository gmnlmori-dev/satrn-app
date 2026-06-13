import { describe, expect, it } from "vitest";
import {
  daysFromTodayAtNineDatetimeLocal,
  getFollowUpWindowBounds,
  tomorrowAtNineDatetimeLocal,
} from "@/lib/follow-up-windows";

describe("getFollowUpWindowBounds", () => {
  it("returns ordered window boundaries", () => {
    const now = new Date("2026-05-20T15:30:00.000Z");
    const bounds = getFollowUpWindowBounds(now);
    expect(new Date(bounds.startTodayIso).getTime()).toBeLessThan(
      new Date(bounds.startTomorrowIso).getTime(),
    );
    expect(new Date(bounds.startTomorrowIso).getTime()).toBeLessThan(
      new Date(bounds.endWeekIso).getTime(),
    );
  });
});

describe("datetime-local helpers", () => {
  it("formats tomorrow at 09:00", () => {
    const value = tomorrowAtNineDatetimeLocal();
    expect(value).toMatch(/T09:00$/);
  });

  it("offsets days from today", () => {
    const threeDays = daysFromTodayAtNineDatetimeLocal(3);
    expect(threeDays).toMatch(/T09:00$/);
  });
});
