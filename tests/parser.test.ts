import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { parseFabric, parseFeederKey, parseSetoutLine } from "../src/parser";
import { codes, fixture } from "./helpers";

describe("feeder keys", () => {
  it("expands ranges and lists", () => {
    expect(parseFeederKey("F1")).toEqual([1]);
    expect(parseFeederKey("F1-F4")).toEqual([1, 2, 3, 4]);
    expect(parseFeederKey("F1,F3")).toEqual([1, 3]);
    expect(parseFeederKey("2-3")).toEqual([2, 3]);
    expect(parseFeederKey("X1")).toBeUndefined();
    expect(parseFeederKey("F4-F1")).toBeUndefined();
  });
});

describe("set-out lines", () => {
  it("reads letters, spaces and empty slots", () => {
    expect(parseSetoutLine("AB")).toEqual(["A", "B"]);
    expect(parseSetoutLine("a b")).toEqual(["A", "B"]);
    expect(parseSetoutLine("AA--")).toEqual(["A", "A", "-", "-"]);
    expect(parseSetoutLine("A.B_")).toEqual(["A", "-", "B", "-"]);
    expect(parseSetoutLine("A1")).toBeUndefined();
  });
});

describe("parseFabric", () => {
  it("reads the plan's single piqué example", () => {
    const { fabric, issues } = parseFabric(fixture("sp-1024-single-pique.yaml"));
    expect(issues).toEqual([]);
    expect(fabric!.article).toBe("SP-1024");
    expect(fabric!.tracks.cyl).toEqual(["A", "B"]);
    expect(fabric!.cams.map((r) => r.cyl.join(""))).toEqual(["KK", "KT", "KK", "TK"]);
    expect(Object.keys(fabric!.feeds)).toEqual(["1", "2", "3", "4"]);
    expect(fabric!.feeds[1].loop).toBe(2.9);
    expect(fabric!.yarns.Y2.tex).toBeCloseTo(2.2);
    expect(fabric!.grey).toMatchObject({ gsm: 165, width: 172 });
  });

  it("reads double-jersey cams and gating", () => {
    const { fabric, issues } = parseFabric(fixture("il-3300-interlock.yaml"));
    expect(issues).toEqual([]);
    expect(fabric!.machine).toMatchObject({ type: "double-jersey", gating: "interlock" });
    expect(fabric!.cams[0]).toMatchObject({ cyl: ["K", "M"], dial: ["K", "M"] });
    expect(fabric!.customer).toBe("[[Sporthaus GmbH]]");
  });

  it("accepts the map form of a cam row", () => {
    const { fabric } = parseFabric(parse(`
machine: { type: sj }
setout: { cylinder: AB }
cams: { F1: { A: K, B: T } }
`));
    expect(fabric!.cams[0].cyl).toEqual(["K", "T"]);
  });

  it("flags cam strings that do not match the tracks", () => {
    const { fabric, issues } = parseFabric(parse(`
machine: { type: sj }
setout: { cylinder: ABC }
cams: { F1: KK, F2: KKQ }
`));
    expect(codes(issues)).toEqual(["camLength", "camLetter"]);
    expect(fabric!.cams[0].cyl).toEqual(["K", "K", "M"]);
  });

  it("fills gaps in the feeder list and reports them", () => {
    const { fabric, issues } = parseFabric(parse(`
machine: { type: sj }
setout: { cylinder: A }
cams: { F1: K, F3: K }
`));
    expect(fabric!.cams).toHaveLength(3);
    expect(codes(issues)).toContain("feederGap");
  });

  it("requires a dial on double jersey", () => {
    const { issues } = parseFabric(parse(`
machine: { type: double-jersey }
setout: { cylinder: A }
cams: { F1: K }
`));
    expect(codes(issues)).toEqual(expect.arrayContaining(["dialMissing", "camDialMissing"]));
  });

  it("stops on missing required groups", () => {
    expect(parseFabric(parse("article: X")).fabric).toBeUndefined();
    expect(codes(parseFabric(parse("machine: { type: lathe }")).issues)).toContain("machineType");
    expect(codes(parseFabric("hello").issues)).toEqual(["notAMap"]);
  });

  it("merges a linked machine note, block values win", () => {
    const raw = parse(`
machine: { ref: "[[M-12]]", rpm: 20 }
setout: { cylinder: A }
cams: { F1: K }
`);
    const { fabric } = parseFabric(raw, {
      resolveMachine: (ref) => (ref === "[[M-12]]" ? { type: "single-jersey", diameter: 30, gauge: 28, rpm: 25 } : undefined),
    });
    expect(fabric!.machine).toMatchObject({ diameter: 30, gauge: 28, rpm: 20, ref: "[[M-12]]" });
  });

  it("reads an unquoted [[link]] that YAML turned into a nested list", () => {
    const raw = parse(`
machine: [[M-12]]
setout: { cylinder: A }
cams: { F1: K }
`);
    const { fabric } = parseFabric(raw, { resolveMachine: () => ({ type: "sj" }) });
    expect(fabric!.machine.ref).toBe("[[M-12]]");
  });

  it("checks set-out tracks against the machine's tracks", () => {
    const { issues } = parseFabric(parse(`
machine: { type: sj, tracks: 2 }
setout: { cylinder: ABC }
cams: { F1: KKK }
`));
    expect(codes(issues)).toEqual(["trackOutOfRange"]);
  });
});
