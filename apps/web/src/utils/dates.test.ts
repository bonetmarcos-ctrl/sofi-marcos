import { describe, expect, it } from "vitest";
import { addMeses, daysBetween, rangoFechas, toISO } from "./dates.ts";

describe("date helpers", () => {
  it("formats and ranges dates", () => {
    expect(toISO(new Date(2026, 5, 8))).toBe("2026-06-08");
    expect(daysBetween("2026-06-01", "2026-06-04")).toBe(3);
    expect(rangoFechas("2026-06-01", "2026-06-03")).toEqual(["2026-06-01", "2026-06-02", "2026-06-03"]);
  });

  it("adds months across years", () => {
    expect(addMeses("2026-11", 3)).toBe("2027-02");
  });
});
