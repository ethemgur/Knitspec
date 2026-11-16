import { describe, expect, it } from "vitest";
import { fixture, run, runYaml } from "./helpers";

describe("needles", () => {
  it("π × D × E: 30\" E28 ≈ 2,639", () => {
    const { figures } = run(fixture("sp-1024-single-pique.yaml"));
    expect(figures!.needles).toMatchObject({ value: 2639, computed: 2639, fromPlate: false });
  });

  it("uses the machine plate figure when given", () => {
    const { figures } = run(fixture("fl-2210-fleece.yaml"));
    expect(figures!.needles).toMatchObject({ value: 1884, fromPlate: true });
  });
});

describe("production", () => {
  it("plan check: plain single jersey makes about 7.0 kg/h", () => {
    const { figures } = run(fixture("sj-plain.yaml"));
    // 25 × 96 × 2639 × 2.9 × 7.5 × 60 × 0.85 / 1e9
    expect(figures!.production!.kgPerHour).toBeCloseTo(7.0255, 3);
  });

  it("tuck uses the tuck ratio of the loop length", () => {
    const { figures } = run(fixture("sp-1024-single-pique.yaml"));
    // Per two needles: F1 5.8, F2 4.35, F3 5.8, F4 4.35 mm of Y1
    const y1 = figures!.feederUse.map((f) => f.uses[0].lengthMm / (2639 / 2));
    expect(y1.map((v) => +v.toFixed(3))).toEqual([5.8, 4.35, 5.8, 4.35]);
  });

  it("machine-hours for an order", () => {
    const { figures } = run(fixture("il-3300-interlock.yaml"));
    expect(figures!.machineHours).toBeCloseTo(1500 / figures!.production!.kgPerHour, 6);
  });

  it("run-in overrides the stitch sum", () => {
    const { figures } = runYaml(`
machine: { type: sj, needles: 2640, feeders: 96, rpm: 25, efficiency: 0.85 }
setout: { cylinder: A }
cams: { F1: K }
yarns: { Y1: { count: 75 dtex, material: PES } }
feeds: { F1: { yarn: Y1, loop: 2.9 mm, runin: 300 mm } }
`);
    expect(figures!.feederUse[0].fromRunin).toBe(true);
    expect(figures!.feederUse[0].uses[0].lengthMm).toBeCloseTo(3 * 2640);
  });

  it("says what is missing instead of guessing", () => {
    const { figures } = runYaml(`
machine: { type: sj, diameter: 30, gauge: 28 }
setout: { cylinder: A }
cams: { F1: K }
`);
    expect(figures!.production).toBeUndefined();
    expect(figures!.missing).toEqual(expect.arrayContaining(["feeders", "feeds", "rpm"]));
  });
});

describe("composition, GSM and width", () => {
  it("plated elastane with draft 3 gives about 91% PES / 9% EA", () => {
    const { figures } = run(fixture("sp-1024-single-pique.yaml"));
    const [pes, ea] = figures!.composition;
    expect(pes.material).toBe("PES");
    expect(pes.share).toBeCloseTo(7.5 / (7.5 + 2.2 / 3), 6);
    expect(ea.material).toBe("EA");
  });

  it("GSM = CPC × WPC × L × T / 100 for plain jersey", () => {
    const { figures } = run(fixture("sj-plain.yaml"));
    expect(figures!.gsm.grey).toBeCloseTo((20 * 14 * 2.9 * 7.5) / 100, 6);
  });

  it("open width = needles ÷ WPC, tube is half", () => {
    const { figures } = run(fixture("sj-plain.yaml"));
    expect(figures!.width.grey!.open).toBeCloseTo(2639 / 14);
    expect(figures!.width.grey!.tube).toBeCloseTo(2639 / 28);
  });

  it("2×2 rib counts only needles in action, both beds", () => {
    const { figures } = run(fixture("rb-0450-rib.yaml"));
    expect(figures!.needles).toMatchObject({ value: 1692, activeCyl: 846, activeDial: 846 });
    const tex = 590.5 / 30;
    // Two loops (one per bed) per face wale and course.
    expect(figures!.gsm.grey).toBeCloseTo((14 * 9 * 2 * 3.0 * tex) / 100, 4);
    expect(figures!.width.grey!.open).toBeCloseTo(846 / 9);
  });

  it("tightness factor √tex ÷ L", () => {
    const { figures } = run(fixture("sj-plain.yaml"));
    expect(figures!.tightness[0].tf).toBeCloseTo(Math.sqrt(7.5) / 2.9);
  });
});
