import { describe, expect, it } from "vitest";
import { addMonths, dateRange, daysBetween, toISODate } from "./dates.js";

describe("date domain helpers", () => {
  it("formats dates as ISO calendar dates", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("calculates inclusive day ranges", () => {
    expect(daysBetween("2026-06-01", "2026-06-01")).toBe(1);
    expect(daysBetween("2026-06-01", "2026-06-04")).toBe(3);
    expect(dateRange("2026-06-01", "2026-06-03")).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
    ]);
  });

  it("adds months across year boundaries", () => {
    expect(addMonths("2026-11", 3)).toBe("2027-02");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});
