import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { BUILTIN_TEMPLATES } from "../src/templates";
import { maxMissRun, maxTuckRun } from "../src/validate";
import { codes, fixture, run, runYaml } from "./helpers";

const base = (cams: string, extra = "") => `
machine: { type: sj, needles: 2640, feeders: 96 }
setout: { cylinder: AB }
cams: ${cams}
yarns: { Y1: { count: 75 dtex, material: PES } }
feeds: { F1-F8: { yarn: Y1, loop: 2.9 } }
${extra}`;

describe("run helpers", () => {
  it("counts tucks held before a knit, around the repeat", () => {
    expect(maxTuckRun(["K", "T", "T", "K"])).toBe(2);
    expect(maxTuckRun(["T", "K", "T", "T"])).toBe(3); // wraps
    expect(maxTuckRun(["K", "T", "M", "T"])).toBe(2 + 0); // misses do not clear the hook
  });
  it("counts the longest float, around the repeat", () => {
    expect(maxMissRun(["K", "M", "M", "K"])).toBe(2);
    expect(maxMissRun(["M", "K", "M", "M"])).toBe(3);
    expect(maxMissRun(["M", null, "M", "K"])).toBe(2);
    expect(maxMissRun(["M", "M"])).toBe(Infinity);
  });
});

describe("validation rules", () => {
  it("plan example: only the partial-repeat warning (2,639 is odd)", () => {
    const { issues } = run(fixture("sp-1024-single-pique.yaml"));
    expect(codes(issues)).toEqual(["setoutRepeat"]);
    expect(issues[0].params).toMatchObject({ needles: 2639, width: 2, nearest: 2640 });
  });

  it("all five fixtures pass without errors", () => {
    for (const f of ["sj-plain", "sp-1024-single-pique", "fl-2210-fleece", "rb-0450-rib", "il-3300-interlock"]) {
      const { issues } = run(fixture(`${f}.yaml`));
      expect(issues.filter((i) => i.level === "error"), f).toEqual([]);
    }
  });

  it("error: a needle that never knits", () => {
    const { issues } = runYaml(base("{ F1: KT, F2: KM }"));
    expect(issues).toContainEqual({ level: "error", code: "neverKnits", params: { bed: "cyl", track: "B" } });
  });

  it("error: repeat height does not divide the feeders", () => {
    const { issues } = runYaml(base("{ F1: KK, F2: KK, F3: KK, F4: KK, F5: KK }"));
    expect(codes(issues)).toContain("feederRepeat");
  });

  it("warning: tucks build up above the limit", () => {
    const { issues } = runYaml(base("{ F1: KT, F2: KT, F3: KT, F4: KK }"));
    expect(issues).toContainEqual(expect.objectContaining({ code: "tuckBuildup", params: expect.objectContaining({ track: "B", count: 3 }) }));
  });

  it("warning: long floats", () => {
    const { issues } = runYaml(`
machine: { type: sj, needles: 2640, feeders: 96 }
setout: { cylinder: ABCDE }
cams: { F1: KMMMM, F2: KKKKK }
yarns: { Y1: { count: 75 dtex, material: PES } }
feeds: { F1-F2: { yarn: Y1, loop: 2.9 } }
`);
    expect(issues).toContainEqual(expect.objectContaining({ code: "longFloat", params: expect.objectContaining({ feeder: "F1", count: 4 }) }));
  });

  it("warning: values outside sane ranges (cm typed for mm)", () => {
    const { issues } = runYaml(base("{ F1: KK }").replace("loop: 2.9", "loop: 29"));
    expect(issues).toContainEqual(expect.objectContaining({ code: "range", params: expect.objectContaining({ field: "loop" }) }));
  });

  it("error: dial and cylinder gauges differ", () => {
    const { issues } = runYaml(`
machine: { type: dj, gauge: 18, dial_gauge: 20 }
setout: { cylinder: A, dial: A }
cams: { F1: { cyl: K, dial: K } }
`);
    expect(codes(issues)).toContain("gaugeMismatch");
  });

  it("warning: entered GSM far from calculated", () => {
    const { issues } = run(fixture("sj-plain.yaml")); // entered 120, calculated ≈ 61
    expect(codes(issues)).toContain("gsmDeviation");
  });

  it("warning: knitting feeder without a feed", () => {
    const { issues } = runYaml(base("{ F1: KK, F2: KK }").replace("F1-F8", "F1"));
    expect(issues).toContainEqual(expect.objectContaining({ code: "noFeed", params: { feeder: "F2" } }));
  });
});

describe("built-in templates", () => {
  for (const tpl of BUILTIN_TEMPLATES) {
    it(`${tpl.name} parses and has no errors`, () => {
      const { fabric, issues } = run(parse(tpl.body));
      expect(fabric).toBeDefined();
      expect(issues.filter((i) => i.level === "error")).toEqual([]);
      expect(fabric!.status).toBe("template-unverified");
    });
  }
});
