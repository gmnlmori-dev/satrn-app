import { describe, expect, it } from "vitest";
import {
  endOfLocalDayFromDateInput,
  isEndOfLocalDayIso,
  zonedDateTimeToUtcIso,
} from "@/lib/date";

describe("zonedDateTimeToUtcIso", () => {
  it("maps date-only to 23:59 in Europe/Rome (CEST)", () => {
    expect(zonedDateTimeToUtcIso("2026-05-20", "", "Europe/Rome")).toBe(
      "2026-05-20T21:59:00.000Z",
    );
  });

  it("maps date-only to 23:59 in Europe/Rome (CET)", () => {
    expect(zonedDateTimeToUtcIso("2026-01-15", "", "Europe/Rome")).toBe(
      "2026-01-15T22:59:00.000Z",
    );
  });

  it("maps explicit time in Europe/Rome", () => {
    expect(zonedDateTimeToUtcIso("2026-05-20", "09:00", "Europe/Rome")).toBe(
      "2026-05-20T07:00:00.000Z",
    );
  });
});

describe("endOfLocalDayFromDateInput on server", () => {
  it("uses Europe/Rome instead of UTC midnight edge cases", () => {
    expect(endOfLocalDayFromDateInput("2026-05-20")).toBe(
      "2026-05-20T21:59:00.000Z",
    );
  });
});

describe("isEndOfLocalDayIso on server", () => {
  it("detects end-of-day stored in Europe/Rome", () => {
    expect(isEndOfLocalDayIso("2026-05-20T21:59:00.000Z")).toBe(true);
  });

  it("rejects UTC 23:59 mistaken for local end-of-day", () => {
    expect(isEndOfLocalDayIso("2026-05-20T23:59:00.000Z")).toBe(false);
  });
});
