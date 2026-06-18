import { describe, expect, it } from "vitest";
import { fmt, fmtd, labelMes } from "./format.ts";

describe("format helpers", () => {
  it("formats euro values", () => {
    expect(fmt(1200)).toContain("1");
    expect(fmt(1200)).toContain("€");
    expect(fmtd(12.5)).toContain("12,50");
  });

  it("formats month labels safely", () => {
    expect(labelMes("2026-06")).toBe("June 2026");
    expect(labelMes("")).toBe("");
  });
});
