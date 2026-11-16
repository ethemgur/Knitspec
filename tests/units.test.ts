import { describe, expect, it } from "vitest";
import { parseCount, parseFraction, parseLengthCm, parseLengthMm } from "../src/units";

describe("parseCount → tex", () => {
  it.each([
    ["75 dtex", 7.5],
    ["75/72 dtex", 7.5],
    [75, 7.5],
    ["40 den", 40 / 9],
    ["20 tex", 20],
    ["Ne 30", 590.5 / 30],
    ["30/1 Ne", 590.5 / 30],
    ["30/2 Ne", (590.5 / 30) * 2],
    ["Nm 50", 20],
    ["22,5 dtex", 2.25],
  ])("%s", (input, tex) => {
    expect(parseCount(input)).toBeCloseTo(tex, 6);
  });

  it("rejects nonsense", () => {
    expect(parseCount("thick")).toBeUndefined();
    expect(parseCount("0 dtex")).toBeUndefined();
  });
});

describe("lengths", () => {
  it("reads mm", () => {
    expect(parseLengthMm("2.9 mm")).toBe(2.9);
    expect(parseLengthMm("0.29 cm")).toBeCloseTo(2.9);
    expect(parseLengthMm(2.9)).toBe(2.9);
  });
  it("reads cm", () => {
    expect(parseLengthCm("172 cm")).toBe(172);
    expect(parseLengthCm("1.72 m")).toBeCloseTo(172);
    expect(parseLengthCm(172)).toBe(172);
  });
  it("reads fractions", () => {
    expect(parseFraction(0.85)).toBe(0.85);
    expect(parseFraction("85%")).toBe(0.85);
    expect(parseFraction(85)).toBe(0.85);
  });
});
