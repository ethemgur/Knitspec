import { Figures } from "./calc";
import { Bed, EMPTY, Fabric, isDouble, Issue, Stitch, stitchAt } from "./model";

export interface Range {
  min: number;
  max: number;
}

export interface ValidationOptions {
  /** Most tucks a needle may hold before it knits (default 2). */
  maxTucks: number;
  /** Longest float, in consecutive missed needles (default 3). */
  maxFloat: number;
  loopMm: Range;
  gauge: Range;
  rpm: Range;
  diameter: Range;
  /** Warn when entered and calculated grey GSM differ by more than this share. */
  gsmTolerance: number;
}

export const DEFAULT_VALIDATION: ValidationOptions = {
  maxTucks: 2,
  maxFloat: 3,
  loopMm: { min: 1.5, max: 8 },
  gauge: { min: 5, max: 50 },
  rpm: { min: 5, max: 60 },
  diameter: { min: 8, max: 44 },
  gsmTolerance: 0.15,
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

/** Needle positions of one repeat in drawing order: cylinder and dial interleaved. */
export function needlePositions(fabric: Fabric): { bed: Bed; index: number }[] {
  const cylW = fabric.setout.cylinder.length;
  const dialW = isDouble(fabric) ? fabric.setout.dial?.length ?? 0 : 0;
  const width = dialW ? lcm(cylW, dialW) : cylW;
  const out: { bed: Bed; index: number }[] = [];
  for (let i = 0; i < width; i++) {
    out.push({ bed: "cyl", index: i });
    if (dialW) out.push({ bed: "dial", index: i });
  }
  return out;
}

function trackStitches(fabric: Fabric, bed: Bed, track: string): Stitch[] {
  const set = bed === "cyl" ? fabric.setout.cylinder : fabric.setout.dial ?? [];
  const i = set.indexOf(track);
  return fabric.cams.map((row) => stitchAt(fabric, row, bed, i) ?? "M");
}

/** Most tucks held in the hook before the next knit, around the repeat (cyclic). */
export function maxTuckRun(seq: Stitch[]): number {
  if (!seq.includes("K")) return seq.filter((s) => s === "T").length;
  const start = seq.indexOf("K");
  let run = 0;
  let max = 0;
  for (let k = 1; k <= seq.length; k++) {
    const s = seq[(start + k) % seq.length];
    if (s === "K") run = 0;
    else if (s === "T") max = Math.max(max, ++run);
  }
  return max;
}

/** Longest cyclic run of misses; Infinity if every entry misses. */
export function maxMissRun(seq: (Stitch | null)[]): number {
  const s = seq.filter((x): x is Stitch => x !== null);
  if (s.length === 0) return 0;
  if (s.every((x) => x === "M")) return Infinity;
  const start = s.findIndex((x) => x !== "M");
  let run = 0;
  let max = 0;
  for (let k = 1; k <= s.length; k++) {
    if (s[(start + k) % s.length] === "M") max = Math.max(max, ++run);
    else run = 0;
  }
  return max;
}

function rangeCheck(issues: Issue[], field: string, value: number | undefined, r: Range, unit = "") {
  if (value === undefined) return;
  if (value < r.min || value > r.max) {
    issues.push({ level: "warning", code: "range", params: { field, value, min: r.min, max: r.max, unit } });
  }
}

export function validate(fabric: Fabric, figures?: Figures, opts: ValidationOptions = DEFAULT_VALIDATION): Issue[] {
  const issues: Issue[] = [];
  const m = fabric.machine;
  const beds: Bed[] = isDouble(fabric) ? ["cyl", "dial"] : ["cyl"];

  // Every needle knits at least once per repeat; tuck build-up.
  for (const bed of beds) {
    for (const track of fabric.tracks[bed]) {
      const seq = trackStitches(fabric, bed, track);
      if (!seq.includes("K")) {
        issues.push({ level: "error", code: "neverKnits", params: { bed, track } });
        continue;
      }
      const tucks = maxTuckRun(seq);
      if (tucks > opts.maxTucks) {
        issues.push({ level: "warning", code: "tuckBuildup", params: { bed, track, count: tucks, max: opts.maxTucks } });
      }
    }
  }

  // Feeder repeat divides the machine's feeders.
  const height = fabric.cams.length;
  if (m.feeders && m.feeders % height !== 0) {
    issues.push({ level: "error", code: "feederRepeat", params: { feeders: m.feeders, height } });
  }

  // Set-out width divides the needle count.
  const n = figures?.needles?.value;
  if (n) {
    const widths: [Bed, number][] = [["cyl", fabric.setout.cylinder.length]];
    if (isDouble(fabric) && fabric.setout.dial) widths.push(["dial", fabric.setout.dial.length]);
    for (const [bed, w] of widths) {
      if (n % w !== 0) {
        const lower = n - (n % w);
        const nearest = n % w < w / 2 ? lower : lower + w;
        issues.push({
          level: "warning",
          code: "setoutRepeat",
          params: { bed, needles: n, width: w, nearest, fromPlate: figures?.needles?.fromPlate ? 1 : 0 },
        });
      }
    }
  }

  // Floats: consecutive missed needles on a feeder that lays yarn.
  const positions = needlePositions(fabric);
  for (const row of fabric.cams) {
    const seq = positions.map((p) => stitchAt(fabric, row, p.bed, p.index));
    const run = maxMissRun(seq);
    if (run === Infinity) continue; // empty feeder
    if (run > opts.maxFloat) {
      issues.push({ level: "warning", code: "longFloat", params: { feeder: `F${row.feeder}`, count: run, max: opts.maxFloat } });
    }
    const laysYarn = seq.some((s) => s === "K" || s === "T");
    if (laysYarn && !fabric.feeds[row.feeder]) {
      issues.push({ level: "warning", code: "noFeed", params: { feeder: `F${row.feeder}` } });
    }
  }

  // Double jersey: gauges equal.
  if (isDouble(fabric) && m.dialGauge !== undefined && m.gauge !== undefined && m.dialGauge !== m.gauge) {
    issues.push({ level: "error", code: "gaugeMismatch", params: { cyl: m.gauge, dial: m.dialGauge } });
  }

  // Sane ranges, mainly to catch unit mistakes.
  rangeCheck(issues, "gauge", m.gauge, opts.gauge, "E");
  rangeCheck(issues, "rpm", m.rpm, opts.rpm);
  rangeCheck(issues, "diameter", m.diameter, opts.diameter, '"');
  if (m.efficiency !== undefined) rangeCheck(issues, "efficiency", m.efficiency, { min: 0.3, max: 1 });
  const loops = new Set<number>();
  for (const f of Object.values(fabric.feeds)) if (f.loop !== undefined) loops.add(f.loop);
  for (const l of loops) rangeCheck(issues, "loop", l, opts.loopMm, "mm");

  // Entered vs calculated grey GSM.
  const calcGsm = figures?.gsm.grey;
  const enteredGsm = fabric.grey.gsm;
  if (calcGsm && enteredGsm) {
    const dev = (calcGsm - enteredGsm) / enteredGsm;
    if (Math.abs(dev) > opts.gsmTolerance) {
      issues.push({
        level: "warning",
        code: "gsmDeviation",
        params: { entered: enteredGsm, calc: Math.round(calcGsm), pct: Math.round(dev * 100) },
      });
    }
  }

  // Empty-slot-only set-out guard.
  for (const bed of beds) {
    const set = bed === "cyl" ? fabric.setout.cylinder : fabric.setout.dial;
    if (set && set.every((c) => c === EMPTY)) issues.push({ level: "error", code: "emptySetout", params: { bed } });
  }

  return issues;
}
