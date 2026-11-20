import { describe, expect, it } from "vitest";
import { BUILTIN_TEMPLATES } from "../src/templates";
import { maxMissRun, maxTuckRun } from "../src/validate";
import { runPipeline } from "../src/pipeline";
import { codes, fixture, run } from "./helpers";

/** Single-jersey block on tracks A B; `rows` are the cam rows ("A  K K", "B  K T"). */
const base = (rows: string, extra = "") => `
machine: SJ 96F
needles: 2640
cylinder: AB
${rows}
yarn  Y1
loop  2.9
Y1 = 75 dtex PES
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
    const { issues } = run(fixture("sp-1024-single-pique"));
    expect(codes(issues)).toEqual(["setoutRepeat"]);
    expect(issues[0].params).toMatchObject({ needles: 2639, width: 2, nearest: 2640 });
  });

  it("all five fixtures pass without errors", () => {
    for (const f of ["sj-plain", "sp-1024-single-pique", "fl-2210-fleece", "rb-0450-rib", "il-3300-interlock"]) {
      const { issues } = run(fixture(f));
      expect(issues.filter((i) => i.level === "error"), f).toEqual([]);
    }
  });

  it("error: a needle that never knits", () => {
    const { issues } = run(base("A  K K\nB  T M"));
    expect(issues).toContainEqual({ level: "error", code: "neverKnits", params: { bed: "cyl", track: "B" } });
  });

  it("error: repeat height does not divide the feeders", () => {
    const { issues } = run(base("A  K K K K K\nB  K K K K K"));
    expect(codes(issues)).toContain("feederRepeat");
  });

  it("warning: tucks build up above the limit", () => {
    const { issues } = run(base("A  K K K K\nB  T T T K"));
    expect(issues).toContainEqual(expect.objectContaining({ code: "tuckBuildup", params: expect.objectContaining({ track: "B", count: 3 }) }));
  });

  it("warning: long floats", () => {
    const { issues } = run(`
machine: SJ 96F
needles: 2640
cylinder: ABCDE
A  K K
B  M K
C  M K
D  M K
E  M K
yarn Y1
loop 2.9
Y1 = 75 dtex PES
`);
    expect(issues).toContainEqual(expect.objectContaining({ code: "longFloat", params: expect.objectContaining({ feeder: "F1", count: 4 }) }));
  });

  it("warning: values outside sane ranges (cm typed for mm)", () => {
    const { issues } = run(base("A  K\nB  K").replace("loop  2.9", "loop  29"));
    expect(issues).toContainEqual(expect.objectContaining({ code: "range", params: expect.objectContaining({ field: "loop" }) }));
  });

  it("error: dial and cylinder gauges differ", () => {
    // The block has one gauge; a linked machine note can still carry a different dial gauge.
    const { issues } = runPipeline(
      `
machine: [[M-DJ]]
cylinder: A
dial: A'
A'  K
A   K
`,
      { resolveMachine: () => ({ type: "double-jersey", gauge: 18, dial_gauge: 20 }) },
    );
    expect(codes(issues)).toContain("gaugeMismatch");
  });

  it("warning: entered GSM far from calculated", () => {
    const { issues } = run(fixture("sj-plain")); // entered 120, calculated ≈ 61
    expect(codes(issues)).toContain("gsmDeviation");
  });

  it("warning: knitting feeder without a feed", () => {
    const { issues } = run(base("A  K K\nB  K K").replace("yarn  Y1", "yarn  Y1 -"));
    expect(issues).toContainEqual(expect.objectContaining({ code: "noFeed", params: { feeder: "F2" } }));
  });
});

describe("built-in templates", () => {
  for (const tpl of BUILTIN_TEMPLATES) {
    it(`${tpl.name} parses and has no errors`, () => {
      const { fabric, issues } = run(tpl.body);
      expect(fabric).toBeDefined();
      expect(issues.filter((i) => i.level === "error")).toEqual([]);
      expect(fabric!.status).toBe("template-unverified");
    });
  }
});

describe("interlock gating", () => {
  it("accepts long/short needles opposite each other", () => {
    expect(codes(run(fixture("il-3300-interlock")).issues)).not.toContain("needleClash");
  });
  it("error: opposite needles both knit on one feeder", () => {
    const { issues } = run(`
machine: interlock 72F
needles: 2256
cylinder: AB
dial: A'B'
A'  K M
B'  M K
A   K M
B   M K
`);
    expect(issues).toContainEqual({ level: "error", code: "needleClash", params: { feeder: "F1", needle: 1 } });
  });
  it("rib gating has no clash rule (dial sits between cylinder needles)", () => {
    expect(codes(run(fixture("rb-0450-rib")).issues)).not.toContain("needleClash");
  });
});
