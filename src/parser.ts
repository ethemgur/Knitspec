import {
  CamRow,
  EMPTY,
  Fabric,
  FabricState,
  Feed,
  Gating,
  Issue,
  Machine,
  MachineType,
  Stitch,
  Yarn,
} from "./model";
import { parseCount, parseFraction, parseLengthCm, parseLengthMm, parseNumber } from "./units";

export interface ParseResult {
  fabric?: Fabric;
  issues: Issue[];
}

export interface ParseOptions {
  /**
   * Returns the properties of a linked machine note (e.g. "[[M-12]]"), so a
   * block can write `machine: "[[M-12]]"` and inherit diameter, gauge, etc.
   */
  resolveMachine?: (ref: string) => Record<string, unknown> | undefined;
}

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (Array.isArray(v)) {
    // YAML reads an unquoted [[Link]] as a nested list.
    const flat = v.flat(Infinity as 1).join("");
    return v.length === 1 && Array.isArray(v[0]) ? `[[${flat}]]` : flat;
  }
  return String(v).trim();
}

/** Expand "F1", "F1-F4", "F1,F3,F5", "1-4" or 3 into feeder numbers. */
export function parseFeederKey(key: string | number): number[] | undefined {
  const out: number[] = [];
  for (const part of String(key).split(",")) {
    const m = part.trim().toUpperCase().match(/^F?(\d+)(?:\s*-\s*F?(\d+))?$/);
    if (!m) return undefined;
    const a = parseInt(m[1], 10);
    const b = m[2] ? parseInt(m[2], 10) : a;
    if (a < 1 || b < a) return undefined;
    for (let i = a; i <= b; i++) out.push(i);
  }
  return out;
}

const MACHINE_TYPES: Record<string, { type: MachineType; gating?: Gating }> = {
  "single-jersey": { type: "single-jersey" },
  single: { type: "single-jersey" },
  sj: { type: "single-jersey" },
  "tek-plaka": { type: "single-jersey" },
  "double-jersey": { type: "double-jersey" },
  double: { type: "double-jersey" },
  dj: { type: "double-jersey" },
  "çift-plaka": { type: "double-jersey" },
  rib: { type: "double-jersey", gating: "rib" },
  interlock: { type: "double-jersey", gating: "interlock" },
};

function parseMachine(raw: unknown, opts: ParseOptions, issues: Issue[]): Machine | undefined {
  let m: Obj = {};
  let ref: string | undefined;
  if (typeof raw === "string" || Array.isArray(raw)) {
    ref = str(raw);
  } else if (isObj(raw)) {
    m = raw;
    ref = str(m.ref);
  } else {
    issues.push({ level: "error", code: "machineMissing" });
    return undefined;
  }
  if (ref && opts.resolveMachine) {
    const linked = opts.resolveMachine(ref);
    if (linked) m = { ...linked, ...m };
    else issues.push({ level: "warning", code: "machineRefNotFound", params: { ref } });
  }

  const typeText = (str(m.type) ?? "").toLowerCase().replace(/\s+/g, "-");
  const t = MACHINE_TYPES[typeText];
  if (!t) {
    issues.push({ level: "error", code: "machineType", params: { value: typeText || "—" } });
    return undefined;
  }
  const gatingText = str(m.gating)?.toLowerCase();
  const gating: Gating | undefined =
    gatingText === "interlock" || gatingText === "rib" ? gatingText : t.gating;

  return {
    type: t.type,
    diameter: parseNumber(m.diameter),
    gauge: parseNumber(m.gauge),
    dialGauge: parseNumber(m.dial_gauge ?? m.dialGauge),
    feeders: parseNumber(m.feeders),
    rpm: parseNumber(m.rpm),
    efficiency: parseFraction(m.efficiency),
    needles: parseNumber(m.needles),
    tracks: parseNumber(m.tracks),
    gating: t.type === "double-jersey" ? gating ?? "rib" : undefined,
    ref,
  };
}

/** "AB", "A B", "AA--", "aa.." → ["A","A","-","-"] */
export function parseSetoutLine(v: unknown): string[] | undefined {
  const s = str(v);
  if (!s) return undefined;
  const out: string[] = [];
  for (const ch of s.toUpperCase()) {
    if (/\s/.test(ch) || ch === "'" || ch === "′" || ch === "’") continue; // dial tracks may be written A′
    if (ch === "-" || ch === "." || ch === "_") out.push(EMPTY);
    else if (/[A-Z]/.test(ch)) out.push(ch);
    else if (/[1-9]/.test(ch)) out.push(String.fromCharCode(64 + Number(ch))); // butt number 1 = track A
    else return undefined;
  }
  return out.length ? out : undefined;
}

function tracksOf(setout: string[] | undefined): string[] {
  if (!setout) return [];
  return [...new Set(setout.filter((c) => c !== EMPTY))].sort();
}

const STITCH_ALIASES: Record<string, Stitch> = { K: "K", T: "T", M: "M", X: "K", O: "M" };

function parseStitches(v: unknown, tracks: string[], label: string, issues: Issue[]): Stitch[] | undefined {
  let letters: string[];
  if (isObj(v)) {
    // { A: K, B: T } form
    letters = tracks.map((t) => str(v[t] ?? v[t.charCodeAt(0) - 64] ?? v[`${t}'`] ?? v[`${t}′`]) ?? "M");
  } else {
    const s = str(v);
    if (s === undefined) return undefined;
    letters = [...s.toUpperCase().replace(/[\s,]/g, "")];
  }
  const out: Stitch[] = [];
  for (const l of letters) {
    const st = STITCH_ALIASES[l.toUpperCase()];
    if (!st) {
      issues.push({ level: "error", code: "camLetter", params: { feeder: label, value: l } });
      return undefined;
    }
    out.push(st);
  }
  if (out.length !== tracks.length) {
    issues.push({
      level: "error",
      code: "camLength",
      params: { feeder: label, got: out.length, want: tracks.length, tracks: tracks.join("") },
    });
    while (out.length < tracks.length) out.push("M");
    out.length = tracks.length;
  }
  return out;
}

function parseCams(raw: unknown, fabric: Pick<Fabric, "tracks" | "machine">, issues: Issue[]): CamRow[] {
  if (!isObj(raw)) {
    issues.push({ level: "error", code: "camsMissing" });
    return [];
  }
  const double = fabric.machine.type === "double-jersey";
  const rows = new Map<number, CamRow>();
  for (const [key, value] of Object.entries(raw)) {
    const feeders = parseFeederKey(key);
    if (!feeders) {
      issues.push({ level: "error", code: "feederKey", params: { value: key } });
      continue;
    }
    let cylRaw: unknown = value;
    let dialRaw: unknown = undefined;
    if (isObj(value) && ("cyl" in value || "dial" in value || "cylinder" in value)) {
      cylRaw = value.cyl ?? value.cylinder;
      dialRaw = value.dial;
    }
    const cyl =
      cylRaw === undefined
        ? fabric.tracks.cyl.map((): Stitch => "M")
        : parseStitches(cylRaw, fabric.tracks.cyl, key, issues);
    let dial: Stitch[] | undefined;
    if (double) {
      if (dialRaw === undefined) {
        issues.push({ level: "error", code: "camDialMissing", params: { feeder: key } });
        dial = fabric.tracks.dial.map((): Stitch => "M");
      } else {
        dial = parseStitches(dialRaw, fabric.tracks.dial, key, issues);
      }
    } else if (dialRaw !== undefined) {
      issues.push({ level: "warning", code: "camDialOnSingle", params: { feeder: key } });
    }
    if (!cyl) continue;
    for (const f of feeders) {
      if (rows.has(f)) issues.push({ level: "warning", code: "feederTwice", params: { feeder: `F${f}` } });
      rows.set(f, { feeder: f, cyl, dial: dial ?? undefined });
    }
  }
  const max = Math.max(0, ...rows.keys());
  const out: CamRow[] = [];
  for (let f = 1; f <= max; f++) {
    const row = rows.get(f);
    if (row) out.push(row);
    else {
      issues.push({ level: "error", code: "feederGap", params: { feeder: `F${f}` } });
      out.push({
        feeder: f,
        cyl: fabric.tracks.cyl.map((): Stitch => "M"),
        dial: double ? fabric.tracks.dial.map((): Stitch => "M") : undefined,
      });
    }
  }
  return out;
}

function parseYarns(raw: unknown, issues: Issue[]): Record<string, Yarn> {
  const out: Record<string, Yarn> = {};
  if (!isObj(raw)) return out;
  for (const [id, v] of Object.entries(raw)) {
    const o: Obj = isObj(v) ? v : { count: v };
    const countText = str(o.count) ?? "";
    const tex = parseCount(o.count);
    if (tex === undefined) issues.push({ level: "warning", code: "badCount", params: { yarn: id, value: countText || "—" } });
    out[id] = { id, countText, tex, material: str(o.material) ?? "?" };
  }
  return out;
}

function parseFeeds(raw: unknown, yarns: Record<string, Yarn>, issues: Issue[]): Record<number, Feed> {
  const out: Record<number, Feed> = {};
  if (!isObj(raw)) return out;
  for (const [key, v] of Object.entries(raw)) {
    const feeders = parseFeederKey(key);
    if (!feeders) {
      issues.push({ level: "error", code: "feederKey", params: { value: key } });
      continue;
    }
    const o: Obj = isObj(v) ? v : { yarn: v };
    const yarn = str(o.yarn) ?? "";
    const plate = str(o.plate);
    for (const id of [yarn, plate]) {
      if (id !== undefined && !yarns[id]) issues.push({ level: "error", code: "unknownYarn", params: { feeder: key, yarn: id || "—" } });
    }
    const feed: Feed = {
      yarn,
      loop: parseLengthMm(o.loop),
      plate,
      draft: parseNumber(o.draft),
      tuck: parseLengthMm(o.tuck),
      miss: parseLengthMm(o.miss),
      runin: parseLengthMm(o.runin ?? o["run-in"]),
    };
    for (const f of feeders) out[f] = feed;
  }
  return out;
}

function parseState(raw: unknown): FabricState {
  if (!isObj(raw)) return {};
  return {
    gsm: parseNumber(raw.gsm),
    width: parseLengthCm(raw.width),
    cpc: parseNumber(raw.cpc ?? raw.courses),
    wpc: parseNumber(raw.wpc ?? raw.wales),
  };
}

/** Build a Fabric from the parsed YAML of a `knit` block. */
export function parseFabric(input: unknown, opts: ParseOptions = {}): ParseResult {
  const issues: Issue[] = [];
  if (!isObj(input)) {
    issues.push({ level: "error", code: "notAMap" });
    return { issues };
  }

  const machine = parseMachine(input.machine, opts, issues);
  const setoutRaw = input.setout;
  let cylinder: string[] | undefined;
  let dial: string[] | undefined;
  if (isObj(setoutRaw)) {
    cylinder = parseSetoutLine(setoutRaw.cylinder ?? setoutRaw.cyl);
    dial = parseSetoutLine(setoutRaw.dial);
  } else {
    cylinder = parseSetoutLine(setoutRaw);
  }
  if (!cylinder) issues.push({ level: "error", code: "setoutMissing" });
  if (!machine || !cylinder) return { issues };

  if (machine.type === "double-jersey" && !dial) issues.push({ level: "error", code: "dialMissing" });
  if (machine.type === "single-jersey" && dial) issues.push({ level: "warning", code: "dialOnSingle" });

  const tracks = { cyl: tracksOf(cylinder), dial: machine.type === "double-jersey" ? tracksOf(dial) : [] };
  if (machine.tracks) {
    const allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, machine.tracks);
    for (const t of [...tracks.cyl, ...tracks.dial]) {
      if (!allowed.includes(t)) {
        issues.push({ level: "error", code: "trackOutOfRange", params: { track: t, tracks: machine.tracks } });
      }
    }
  }

  const cams = parseCams(input.cams, { tracks, machine }, issues);
  if (cams.length === 0) {
    if (!issues.some((i) => i.code === "camsMissing")) issues.push({ level: "error", code: "camsMissing" });
    return { issues };
  }
  const yarns = parseYarns(input.yarns, issues);
  const feeds = parseFeeds(input.feeds, yarns, issues);
  const fabricRaw = isObj(input.fabric) ? input.fabric : {};

  const fabric: Fabric = {
    article: str(input.article),
    customer: str(input.customer),
    status: str(input.status),
    structure: str(input.structure),
    notes: str(input.notes),
    machine,
    setout: { cylinder, dial: machine.type === "double-jersey" ? dial : undefined },
    tracks,
    cams,
    yarns,
    feeds,
    grey: parseState(fabricRaw.grey),
    finished: parseState(fabricRaw.finished),
    orderKg: parseNumber(input.order_kg ?? (isObj(input.order) ? input.order.kg : input.order)),
    labels: isObj(input.labels) ? (input.labels as Fabric["labels"]) : undefined,
    grid: Array.isArray(input.grid)
      ? (input.grid as { bed: "cyl" | "dial"; track: string; label: string; cells: string[] }[]).map((r) => ({
          ...r,
          cells: r.cells.map((c): Stitch => STITCH_ALIASES[c.toUpperCase()] ?? "M"),
        }))
      : undefined,
  };
  return { fabric, issues };
}
