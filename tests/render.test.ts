import { DOMParser } from "@xmldom/xmldom";
import { describe, expect, it } from "vitest";
import { toCsv } from "../src/export";
import { issueText } from "../src/i18n";
import { findKnitBlock } from "../src/pipeline";
import { knitLoop, tuckLoop } from "../src/render/diagram";
import { trackLabel } from "../src/render/options";
import { renderCamChart } from "../src/render/camChart";
import { renderDiagram } from "../src/render/diagram";
import { buildSpec } from "../src/render/spec";
import { standalone } from "../src/render/svg";
import { fixture, run } from "./helpers";

const FIXTURES = ["sj-plain", "sp-1024-single-pique", "fl-2210-fleece", "rb-0450-rib", "il-3300-interlock"];

function wellFormed(svg: string): void {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (level, msg) => void (level !== "warning" && errors.push(msg)) }).parseFromString(
    svg,
    "image/svg+xml",
  );
  expect(errors).toEqual([]);
  expect(doc.documentElement!.nodeName).toBe("svg");
}

describe("SVG renderers", () => {
  for (const name of FIXTURES) {
    it(`${name}: all views are well-formed SVG in both languages`, () => {
      const { fabric, figures } = run(fixture(`${name}.yaml`));
      for (const lang of ["en", "tr"] as const) {
        wellFormed(renderCamChart(fabric!, lang));
        wellFormed(renderCamChart(fabric!, lang, figures!.needles?.value));
        wellFormed(renderDiagram(fabric!, lang));
        wellFormed(standalone(renderDiagram(fabric!, lang)));
      }
    });
  }

  it("cam chart shows one row per feeder with its feed", () => {
    const { fabric } = run(fixture("sp-1024-single-pique.yaml"));
    const svg = renderCamChart(fabric!, "en");
    for (const f of ["F1", "F2", "F3", "F4"]) expect(svg).toContain(`>${f}<`);
    expect(svg).toContain(">Y1+Y2<");
    expect(svg).toContain(">2.9<");
    expect(renderCamChart(fabric!, "tr")).toContain("Askı");
  });

  it("cam chart carries the needle set-out and its repeat count", () => {
    const { fabric, figures } = run(fixture("rb-0450-rib.yaml"));
    const svg = renderCamChart(fabric!, "en", figures!.needles!.value);
    expect(svg).toContain("Needle set-out");
    expect(svg).toContain("AA-- × 423 repeats");
    expect(svg).toContain("-A′A′- × 423 repeats");
    expect(renderCamChart(fabric!, "tr", 1692)).toContain("× 423 rapor");
  });

  it("diagram draws one loop per knit or tuck", () => {
    const { fabric } = run(fixture("sp-1024-single-pique.yaml"));
    const svg = renderDiagram(fabric!, "en");
    // 12 needles drawn (6 repeats of AB) × 4 feeders = 48 loops, 6 of them tucks per tuck row.
    const knit = (svg.match(/stroke="#2e8b57" stroke-width="1.6"/g) ?? []).length;
    const tuck = (svg.match(/stroke="#d9822b" stroke-width="1.6"/g) ?? []).length;
    // + one knit and one tuck sample in the legend
    expect(knit + tuck).toBe(48 + 2);
    expect(tuck).toBe(12 + 1);
  });

  it("escapes text", () => {
    const { fabric } = run({ ...(fixture("sj-plain.yaml") as object), yarns: { "<Y&1>": { count: "75 dtex", material: "PES" } }, feeds: { F1: { yarn: "<Y&1>", loop: 2.9 } } });
    wellFormed(renderCamChart(fabric!, "en"));
  });
});

describe("spec card", () => {
  it("shows figures with their inputs", () => {
    const { fabric, figures, issues } = run(fixture("sp-1024-single-pique.yaml"));
    const spec = buildSpec(fabric!, figures!, issues, "en");
    const rows = Object.fromEntries(spec.sections.flatMap((s) => s.rows.map((r) => [r.label, r])));
    expect(rows["Needles per bed"]).toMatchObject({ value: "2,639", note: "π × 30 × 28" });
    expect(rows["Composition"].value).toBe("91% PES / 9% EA");
    expect(rows["Production"].value).toMatch(/kg\/h$/);
    expect(spec.issues[0].text).toContain("nearest 2640");
  });

  it("uses Turkish labels and decimal comma", () => {
    const { fabric, figures, issues } = run(fixture("sj-plain.yaml"));
    const spec = buildSpec(fabric!, figures!, issues, "tr");
    const rows = spec.sections.flatMap((s) => s.rows);
    expect(rows.find((r) => r.label === "Üretim")!.value).toBe("7 kg/h");
    expect(rows.find((r) => r.label === "Yatak başına iğne")!.value).toBe("2.639");
  });

  it("every issue code has text in both languages", () => {
    const codes = [
      "notAMap", "yaml", "machineMissing", "machineType", "machineRefNotFound", "setoutMissing", "dialMissing",
      "dialOnSingle", "camsMissing", "camLetter", "camLength", "camDialMissing", "camDialOnSingle", "feederKey",
      "feederTwice", "feederGap", "badCount", "unknownYarn", "trackOutOfRange", "neverKnits", "tuckBuildup",
      "feederRepeat", "setoutRepeat", "longFloat", "noFeed", "gaugeMismatch", "range", "gsmDeviation", "emptySetout", "needleClash",
    ];
    for (const lang of ["en", "tr"] as const) {
      for (const code of codes) expect(issueText(lang, { level: "error", code }), code).not.toMatch(/^issue\./);
    }
  });
});

describe("export", () => {
  it("CSV with semicolons and decimal comma", () => {
    const { fabric, figures } = run(fixture("sp-1024-single-pique.yaml"));
    const csv = toCsv(fabric!, figures!, "en", ";");
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Feeder;Cylinder A;Cylinder B;yarn;plate;loop_mm");
    expect(lines[2]).toBe("F2;K;T;Y1;Y2;2,9");
    expect(csv).toContain("\nneedles;2639\n");
  });

  it("finds the knit block in a note", () => {
    const md = "# Note\n\n```knit\narticle: A\n```\n\ntext\n";
    expect(findKnitBlock(md)).toBe("article: A");
    expect(findKnitBlock("```yaml\na: 1\n```")).toBeUndefined();
  });
});

describe("cam chart layout", () => {
  it("rows are tracks (dial with apostrophe, above cylinder), columns are feeders", () => {
    const { fabric } = run(fixture("il-3300-interlock.yaml"));
    const svg = renderCamChart(fabric!, "tr");
    const y = (label: string) => Number(svg.match(new RegExp(`y="([\\d.]+)"[^>]*>${label}<`))![1]);
    expect(y("Kapak")).toBeLessThan(y("Silindir"));
    expect(svg).toContain(">A′<");
    expect(svg).toContain(">B′<");
    expect(svg).toContain(">İplik<");
  });
});

describe("diagram orientation", () => {
  it("draws F1 at the bottom and the last feeder at the top", () => {
    const { fabric } = run(fixture("sp-1024-single-pique.yaml"));
    const svg = renderDiagram(fabric!, "en");
    const y = (f: string) => Number(svg.match(new RegExp(`<text x="8" y="([\\d.]+)"[^>]*>${f}<`))![1]);
    expect(y("F1")).toBeGreaterThan(y("F2"));
    expect(y("F2")).toBeGreaterThan(y("F4"));
  });
});

describe("textbook notation options", () => {
  it("knit is an open loop round the needle; tuck only reaches the hook", () => {
    // knit passes beyond the needle (y 20 → 26), tuck peaks at the needle (≈ 21)
    const ys = (d: string) => [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(Number).filter((_, i) => i % 2 === 1);
    expect(Math.max(...ys(knitLoop(50, 0, 20, 1)))).toBe(26);
    expect(Math.max(...ys(tuckLoop(50, 0, 20, 1)))).toBeLessThanOrEqual(28);
    expect(tuckLoop(50, 0, 20, 1).split("C").length - 1).toBe(1); // one simple curve
  });

  it("cam symbols replace letters when chosen", () => {
    const { fabric } = run(fixture("sp-1024-single-pique.yaml"));
    const svg = renderCamChart(fabric!, "en", undefined, { camStyle: "symbols", trackNames: "letters", trackOrder: "first-top" });
    expect(svg).toContain("<polyline");
    expect(svg).not.toMatch(/font-weight="600"[^>]*>K</);
  });

  it("tracks can be numbered and ordered first-at-bottom", () => {
    expect(trackLabel("cyl", "C", { camStyle: "letters", trackNames: "numbers", trackOrder: "first-top" })).toBe("3");
    expect(trackLabel("dial", "B", { camStyle: "letters", trackNames: "numbers", trackOrder: "first-top" })).toBe("2′");
    const { fabric } = run(fixture("fl-2210-fleece.yaml"));
    const svg = renderCamChart(fabric!, "en", undefined, { camStyle: "letters", trackNames: "numbers", trackOrder: "first-bottom" });
    const y = (l: string) => Number(svg.match(new RegExp(`y="([\\d.]+)" text-anchor="end"[^>]*>${l}<`))![1]);
    expect(y("1")).toBeGreaterThan(y("4"));
    expect(svg).toContain("1 2 3 4 ×");
  });
});
