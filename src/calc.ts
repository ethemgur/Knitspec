import { Bed, EMPTY, Fabric, Feed, isDouble, Stitch, stitchAt } from "./model";

export interface CalcOptions {
  /** Tuck yarn length as a share of the knit loop length, when the feed gives none. */
  tuckRatio: number;
  /** Float yarn length per missed needle as a share of the loop length. */
  missRatio: number;
  /** Efficiency used when the machine gives none. */
  defaultEfficiency: number;
}

export const DEFAULT_CALC: CalcOptions = { tuckRatio: 0.5, missRatio: 0.3, defaultEfficiency: 0.85 };

export interface YarnUse {
  yarn: string;
  /** Yarn length per revolution at this feeder, in mm. */
  lengthMm: number;
  /** Mass per revolution at this feeder, in g (undefined if the count is unknown). */
  massG?: number;
}

export interface FeederUse {
  feeder: number;
  uses: YarnUse[];
  /** True if the feeder lays yarn but has no feed (yarn) defined. */
  missingFeed: boolean;
  /** True if the stitch sum used the measured run-in. */
  fromRunin: boolean;
}

export interface Figures {
  needles?: {
    value: number;
    computed?: number;
    fromPlate: boolean;
    /** Needles in action per bed (empty slots taken out). */
    activeCyl: number;
    activeDial: number;
  };
  /** Repeats of the set-out around the cylinder (N ÷ width). */
  setoutRepeats?: number;
  /** Repeats of the cam chart around the machine (feeders ÷ height). */
  feederRepeats?: number;
  feederUse: FeederUse[];
  /** Production in kg/h. */
  production?: { kgPerHour: number; rpm: number; feeders: number; efficiency: number; gramsPerRev: number };
  composition: { material: string; share: number }[];
  gsm: { grey?: number; finished?: number };
  width: { grey?: { open: number; tube: number }; finished?: { open: number; tube: number } };
  tightness: { yarn: string; loop: number; tf: number }[];
  machineHours?: number;
  /** Codes of inputs that are missing, so the card can say why a figure is blank. */
  missing: string[];
}

function bedNeedles(fabric: Fabric, bed: Bed): string[] {
  return (bed === "cyl" ? fabric.setout.cylinder : fabric.setout.dial) ?? [];
}

function stitchLength(st: Stitch | null, feed: Feed, opts: CalcOptions): number {
  const L = feed.loop ?? 0;
  switch (st) {
    case "K":
      return L;
    case "T":
      return feed.tuck ?? L * opts.tuckRatio;
    case "M":
      return feed.miss ?? L * opts.missRatio;
    default:
      return 0;
  }
}

/** Whether a feeder lays any yarn on a bed (some needle knits or tucks). */
function bedActive(fabric: Fabric, feederIdx: number, bed: Bed): boolean {
  const row = fabric.cams[feederIdx];
  const set = bedNeedles(fabric, bed);
  return set.some((_, i) => {
    const s = stitchAt(fabric, row, bed, i);
    return s === "K" || s === "T";
  });
}

export function needleCount(fabric: Fabric): Figures["needles"] {
  const { diameter, gauge, needles } = fabric.machine;
  const computed = diameter && gauge ? Math.round(Math.PI * diameter * gauge) : undefined;
  const value = needles ?? computed;
  if (!value) return undefined;
  const share = (s: string[] | undefined) => (s && s.length ? s.filter((c) => c !== EMPTY).length / s.length : 0);
  return {
    value,
    computed,
    fromPlate: needles !== undefined,
    activeCyl: value * share(fabric.setout.cylinder),
    activeDial: isDouble(fabric) ? value * share(fabric.setout.dial) : 0,
  };
}

export function calculate(fabric: Fabric, opts: CalcOptions = DEFAULT_CALC): Figures {
  const missing = new Set<string>();
  const m = fabric.machine;
  const needles = needleCount(fabric);
  if (!needles) missing.add("needles");

  const height = fabric.cams.length;
  const feederRepeats = m.feeders ? m.feeders / height : undefined;
  if (!m.feeders) missing.add("feeders");
  const setoutRepeats = needles ? needles.value / fabric.setout.cylinder.length : undefined;

  const beds: Bed[] = isDouble(fabric) ? ["cyl", "dial"] : ["cyl"];

  // Yarn per feeder and revolution.
  const feederUse: FeederUse[] = fabric.cams.map((row, idx) => {
    const feed = fabric.feeds[row.feeder];
    const activeBeds = beds.filter((b) => bedActive(fabric, idx, b));
    const result: FeederUse = { feeder: row.feeder, uses: [], missingFeed: false, fromRunin: false };
    if (activeBeds.length === 0) return result; // empty feeder
    if (!feed || !feed.yarn) {
      result.missingFeed = true;
      missing.add("feeds");
      return result;
    }
    if (!needles) return result;

    let lengthMm = 0;
    if (feed.runin !== undefined) {
      const n = activeBeds.reduce((a, b) => a + (b === "cyl" ? needles.activeCyl : needles.activeDial), 0);
      lengthMm = (feed.runin / 100) * n;
      result.fromRunin = true;
    } else {
      if (feed.loop === undefined) missing.add("loop");
      for (const bed of activeBeds) {
        const set = bedNeedles(fabric, bed);
        let perRepeat = 0;
        set.forEach((_, i) => (perRepeat += stitchLength(stitchAt(fabric, row, bed, i), feed, opts)));
        lengthMm += perRepeat * (needles.value / set.length);
      }
    }
    const main = fabric.yarns[feed.yarn];
    result.uses.push({ yarn: feed.yarn, lengthMm, massG: main?.tex !== undefined ? (lengthMm * main.tex) / 1e6 : undefined });
    if (feed.plate) {
      const plate = fabric.yarns[feed.plate];
      const len = lengthMm / (feed.draft && feed.draft > 0 ? feed.draft : 1);
      result.uses.push({ yarn: feed.plate, lengthMm: len, massG: plate?.tex !== undefined ? (len * plate.tex) / 1e6 : undefined });
    }
    if (result.uses.some((u) => u.massG === undefined)) missing.add("count");
    return result;
  });

  // Mass per revolution of one cam-chart repeat, by yarn.
  const massByYarn = new Map<string, number>();
  let repeatMass = 0;
  for (const fu of feederUse) {
    for (const u of fu.uses) {
      if (u.massG === undefined) continue;
      massByYarn.set(u.yarn, (massByYarn.get(u.yarn) ?? 0) + u.massG);
      repeatMass += u.massG;
    }
  }
  const complete = repeatMass > 0 && !missing.has("feeds") && !missing.has("count") && !missing.has("loop");

  // Production.
  let production: Figures["production"];
  const efficiency = m.efficiency ?? opts.defaultEfficiency;
  if (!m.rpm) missing.add("rpm");
  if (complete && m.rpm && m.feeders && feederRepeats) {
    const gramsPerRev = repeatMass * feederRepeats;
    production = {
      kgPerHour: (m.rpm * 60 * efficiency * gramsPerRev) / 1000,
      rpm: m.rpm,
      feeders: m.feeders,
      efficiency,
      gramsPerRev,
    };
  }

  // Composition by material.
  const byMaterial = new Map<string, number>();
  for (const [id, g] of massByYarn) {
    const mat = fabric.yarns[id]?.material ?? id;
    byMaterial.set(mat, (byMaterial.get(mat) ?? 0) + g);
  }
  const composition = complete
    ? [...byMaterial.entries()]
        .map(([material, g]) => ({ material, share: g / repeatMass }))
        .sort((a, b) => b.share - a.share)
    : [];

  // GSM and width: mass per face wale (active cylinder needle) per course (feeder row).
  const gsm: Figures["gsm"] = {};
  const width: Figures["width"] = {};
  if (needles) {
    const perWaleCourse = complete ? repeatMass / height / needles.activeCyl : undefined;
    for (const state of ["grey", "finished"] as const) {
      const s = fabric[state];
      if (s.wpc) {
        const open = needles.activeCyl / s.wpc;
        width[state] = { open, tube: open / 2 };
      }
      if (s.cpc && s.wpc && perWaleCourse !== undefined) gsm[state] = s.cpc * s.wpc * 1e4 * perWaleCourse;
    }
  }
  if (!fabric.grey.cpc || !fabric.grey.wpc) missing.add("cpcwpc");

  // Tightness factor per (yarn, loop).
  const seen = new Set<string>();
  const tightness: Figures["tightness"] = [];
  for (const row of fabric.cams) {
    const feed = fabric.feeds[row.feeder];
    const tex = feed ? fabric.yarns[feed.yarn]?.tex : undefined;
    if (!feed || !feed.loop || tex === undefined) continue;
    const key = `${feed.yarn}@${feed.loop}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tightness.push({ yarn: feed.yarn, loop: feed.loop, tf: Math.sqrt(tex) / feed.loop });
  }

  const machineHours = production && fabric.orderKg ? fabric.orderKg / production.kgPerHour : undefined;

  return {
    needles,
    setoutRepeats,
    feederRepeats,
    feederUse,
    production,
    composition,
    gsm,
    width,
    tightness,
    machineHours,
    missing: [...missing],
  };
}
