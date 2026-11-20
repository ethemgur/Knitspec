import { describe, expect, it } from "vitest";
import { parseFeederKey, parseSetoutLine } from "../src/parser";
import { parseMachineLine, parseStateLine, parseYarnDef } from "../src/text";
import { runPipeline } from "../src/pipeline";
import { codes, fixture, run } from "./helpers";

describe("feeder keys and set-out lines", () => {
  it("expands feeder keys", () => {
    expect(parseFeederKey("F1-F4")).toEqual([1, 2, 3, 4]);
    expect(parseFeederKey("F1,F3")).toEqual([1, 3]);
    expect(parseFeederKey("X1")).toBeUndefined();
  });
  it("reads letters, numbers, apostrophes and empty slots", () => {
    expect(parseSetoutLine("AB")).toEqual(["A", "B"]);
    expect(parseSetoutLine("a b")).toEqual(["A", "B"]);
    expect(parseSetoutLine("AA--")).toEqual(["A", "A", "-", "-"]);
    expect(parseSetoutLine("1234")).toEqual(["A", "B", "C", "D"]);
    expect(parseSetoutLine("B'A'")).toEqual(["B", "A"]);
    expect(parseSetoutLine("-A′A′-")).toEqual(["-", "A", "A", "-"]);
    expect(parseSetoutLine("A#")).toBeUndefined();
  });
});

describe("machine line", () => {
  it("reads the compact form", () => {
    expect(parseMachineLine('SJ 30" E28 96F 25rpm 85%')).toEqual({
      type: "single-jersey", diameter: 30, gauge: 28, feeders: 96, rpm: 25, efficiency: 0.85,
    });
  });
  it("reads words and Turkish units", () => {
    expect(parseMachineLine("interlok 30 pus E24 72 besleyici 24 devir 4 ray")).toEqual({
      type: "double-jersey", gating: "interlock", diameter: 30, gauge: 24, feeders: 72, rpm: 24, tracks: 4,
    });
  });
  it("keeps a machine note link", () => {
    expect(parseMachineLine("[[M-12]] 22rpm")).toEqual({ ref: "[[M-12]]", rpm: 22 });
  });
});

describe("yarn and fabric lines", () => {
  it("reads yarns the way the factory writes them", () => {
    expect(parseYarnDef("40/1 Penye")).toEqual({ count: "40/1 ne", material: "CO", draft: undefined });
    expect(parseYarnDef("70/36 Poly")).toEqual({ count: "70/36 den", material: "PES", draft: undefined });
    expect(parseYarnDef("150/48 Pol")).toMatchObject({ count: "150/48 den", material: "PES" });
    expect(parseYarnDef("22 dtex likra draft 3")).toEqual({ count: "22 dtex", material: "EA", draft: 3 });
    expect(parseYarnDef("Ne 30/1 CO")).toMatchObject({ count: "30/1 ne", material: "CO" });
  });
  it("reads fabric state lines", () => {
    expect(parseStateLine("165 gsm 172 cm 20 cpc 14 wpc")).toEqual({ gsm: 165, width: 172, cpc: 20, wpc: 14 });
    expect(parseStateLine("180gsm, 1.6 m")).toEqual({ gsm: 180, width: 160 });
  });
});

describe("whole blocks", () => {
  it("reads the plan's single piqué", () => {
    const { fabric, issues } = run(fixture("sp-1024-single-pique"));
    expect(codes(issues)).toEqual(["setoutRepeat"]);
    expect(fabric!.article).toBe("SP-1024");
    expect(fabric!.machine).toMatchObject({ type: "single-jersey", diameter: 30, gauge: 28, feeders: 96, rpm: 25, efficiency: 0.85 });
    expect(fabric!.cams.map((r) => r.cyl.join(""))).toEqual(["KK", "KT", "KK", "TK"]);
    expect(fabric!.feeds[2]).toMatchObject({ yarn: "Y1", plate: "Y2", draft: 3, loop: 2.9 });
    expect(fabric!.yarns.Y2.tex).toBeCloseTo(2.2);
    expect(fabric!.grey).toMatchObject({ gsm: 165, width: 172 });
  });

  it("reads kapak rows (A') and the interlock dial set-out", () => {
    const { fabric, issues } = run(fixture("il-3300-interlock"));
    expect(issues).toEqual([]);
    expect(fabric!.machine).toMatchObject({ type: "double-jersey", gating: "interlock" });
    expect(fabric!.setout.dial).toEqual(["B", "A"]);
    expect(fabric!.cams[0]).toMatchObject({ cyl: ["K", "M"], dial: ["K", "M"] });
    expect(fabric!.customer).toBe("[[Sporthaus GmbH]]");
    expect(fabric!.orderKg).toBe(1500);
  });

  it("accepts compact rows, numbered tracks and comments", () => {
    const { fabric, issues } = run(`
machine: SJ 96F   # Mayer
cylinder: 12
     F1 F2
1    KK
2:   K T
yarn Y1
Y1 = 30/1 Penye
`);
    expect(issues).toEqual([]);
    expect(fabric!.cams.map((r) => r.cyl.join(""))).toEqual(["KK", "KT"]);
  });

  it("assumes the set-out from the tracks that knit, and says so", () => {
    const { fabric, issues } = run(`
A  M K
B  M M
C  K T
`);
    expect(fabric!.setout.cylinder).toEqual(["A", "C"]);
    expect(issues).toContainEqual({ level: "warning", code: "setoutAssumed", params: { bed: "cyl", setout: "AC" } });
  });

  it("flags rows of the wrong length, missing rows and stray lines", () => {
    const { issues } = run(`
cylinder: ABC
     F1 F2 F3
A    K  K
B    K  K  K
hello there
`);
    expect(codes(issues)).toEqual(expect.arrayContaining(["gridWidth", "camRowMissing", "unknownLine"]));
  });

  it("says when there is no cam grid at all", () => {
    expect(codes(run("article: X").issues)).toEqual(["noGrid"]);
  });

  it("merges a linked machine note; the block wins", () => {
    const { fabric } = runPipeline(
      `machine: [[M-12]] 20rpm
A  K`,
      { resolveMachine: (ref) => (ref === "[[M-12]]" ? { type: "single-jersey", diameter: 30, gauge: 28, rpm: 25 } : undefined) },
    );
    expect(fabric!.machine).toMatchObject({ diameter: 30, gauge: 28, rpm: 20, ref: "[[M-12]]" });
  });

  it("checks set-out tracks against the machine's tracks", () => {
    const { issues } = run(`
machine: SJ 2T
cylinder: ABC
A K
B K
C K
`);
    expect(codes(issues)).toContain("trackOutOfRange");
  });
});
