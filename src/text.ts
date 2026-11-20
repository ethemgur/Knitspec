/**
 * The human syntax of a `knit` block. It reads like a çelik dizilimi sheet:
 *
 *   article: K1825
 *   machine: SJ 30" E28 96F 25rpm
 *   cylinder: ABCD
 *
 *         F1  F2  F3  F4
 *   A     M   K   M   K
 *   B     M   K   M   K
 *   C     K   T   K   M
 *   D     K   M   K   T
 *   yarn  Y1  Y2  Y1  Y2
 *   loop  2.9
 *
 *   Y1 = 40/1 Penye
 *   Y2 = 70/36 Poly
 *
 * Rows are tracks (kapak tracks carry an apostrophe: A'), columns are
 * feeders. This module turns the text into the plain object `parseFabric`
 * reads, so the model, checks and figures stay in one place.
 */
import { Issue } from "./model";

type Obj = Record<string, unknown>;

export interface TextResult {
  raw: Obj;
  issues: Issue[];
}

const KEYS: Record<string, string> = {
  article: "article",
  artikel: "article",
  structure: "structure",
  "örgü": "structure",
  customer: "customer",
  "müşteri": "customer",
  status: "status",
  durum: "status",
  notes: "notes",
  note: "notes",
  not: "notes",
  order: "order",
  "sipariş": "order",
  machine: "machine",
  makine: "machine",
  needles: "needles",
  "iğne": "needles",
  cylinder: "cylinder",
  silindir: "cylinder",
  setout: "cylinder",
  dizilim: "cylinder",
  dial: "dial",
  kapak: "dial",
  grey: "grey",
  ham: "grey",
  finished: "finished",
  mamul: "finished",
};

const FEED_ROWS: Record<string, "yarn" | "loop" | "runin"> = {
  yarn: "yarn",
  yarns: "yarn",
  "iplik": "yarn",
  loop: "loop",
  ilmek: "loop",
  "ilmek boyu": "loop",
  runin: "runin",
  "run-in": "runin",
  sarfiyat: "runin",
};

const MATERIALS: Record<string, string> = {
  penye: "CO",
  karde: "CO",
  pamuk: "CO",
  cotton: "CO",
  co: "CO",
  poly: "PES",
  pol: "PES",
  polyester: "PES",
  pes: "PES",
  likra: "EA",
  lycra: "EA",
  elastan: "EA",
  elastane: "EA",
  spandex: "EA",
  ea: "EA",
  viskon: "CV",
  viscose: "CV",
  cv: "CV",
  naylon: "PA",
  nylon: "PA",
  pa: "PA",
  modal: "CMD",
};

/** Staple-fibre materials whose bare counts are Ne; others (filament) are denier. */
const STAPLE = new Set(["CO", "CV", "CMD"]);

const COUNT_UNITS = new Set(["dtex", "den", "denier", "denye", "d", "tex", "ne", "nm"]);

const lower = (s: string) => s.replace(/İ/g, "i").toLowerCase();

function stripComment(line: string): string {
  return line.replace(/(^|\s)#.*$/, "").trimEnd();
}

function num(s: string): number | undefined {
  const m = s.match(/^(\d+(?:[.,]\d+)?)$/);
  return m ? parseFloat(m[1].replace(",", ".")) : undefined;
}

/** "SJ 30" E28 96F 25rpm 85% 4 tracks interlock 2640 needles [[M-12]]" */
export function parseMachineLine(value: string): Obj {
  const out: Obj = {};
  const link = value.match(/\[\[[^\]]+\]\]/);
  if (link) {
    out.ref = link[0];
    value = value.replace(link[0], " ");
  }
  const tokens = value
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[”″]/g, '"'));
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const lo = lower(tok);
    const next = lower(tokens[i + 1] ?? "");
    const n = num(tok);
    if (n !== undefined && next) {
      const unit: Record<string, string> = {
        '"': "diameter", in: "diameter", inch: "diameter", pus: "diameter",
        f: "feeders", feeders: "feeders", feeder: "feeders", besleyici: "feeders", sistem: "feeders",
        rpm: "rpm", devir: "rpm",
        tracks: "tracks", track: "tracks", ray: "tracks",
        needles: "needles", "iğne": "needles",
      };
      if (unit[next]) {
        out[unit[next]] = n;
        i++;
        continue;
      }
    }
    let m: RegExpMatchArray | null;
    if (["sj", "single", "single-jersey", "tek", "tek-plaka"].includes(lo)) out.type = "single-jersey";
    else if (["dj", "double", "double-jersey", "çift", "çift-plaka"].includes(lo)) out.type = "double-jersey";
    else if (lo === "rib" || lo === "ribana") {
      out.type = "double-jersey";
      out.gating = "rib";
    } else if (lo === "interlock" || lo === "interlok") {
      out.type = "double-jersey";
      out.gating = "interlock";
    } else if ((m = tok.match(/^(\d+(?:[.,]\d+)?)("|in|inch|pus)$/i))) out.diameter = num(m[1]);
    else if ((m = tok.match(/^E(\d+(?:[.,]\d+)?)$/i))) out.gauge = num(m[1]);
    else if ((m = tok.match(/^(\d+)F$/i))) out.feeders = num(m[1]);
    else if ((m = tok.match(/^(\d+(?:[.,]\d+)?)rpm$/i))) out.rpm = num(m[1]);
    else if ((m = tok.match(/^(\d+(?:[.,]\d+)?)%$/))) out.efficiency = (num(m[1]) ?? 0) / 100;
    else if ((m = tok.match(/^(\d+)T$/i))) out.tracks = num(m[1]);
    else if ((m = tok.match(/^(\d+)N$/i))) out.needles = num(m[1]);
    else out.unknown = [...((out.unknown as string[]) ?? []), tok];
  }
  return out;
}

/** "165 gsm 172 cm 20 cpc 14 wpc" (also "165gsm", "172cm"). */
export function parseStateLine(value: string): Obj {
  const out: Obj = {};
  const tokens = value.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    let m = tokens[i].match(/^(\d+(?:[.,]\d+)?)([a-zA-Z/²]*)$/);
    if (!m) continue;
    let unit = lower(m[2]);
    if (!unit && tokens[i + 1]) {
      unit = lower(tokens[i + 1]);
      i++;
    }
    const n = num(m[1]);
    if (unit === "gsm" || unit === "g/m2" || unit === "g/m²" || unit === "g") out.gsm = n;
    else if (unit === "cm") out.width = n;
    else if (unit === "m") out.width = n === undefined ? undefined : n * 100;
    else if (unit === "cpc" || unit === "sıra") out.cpc = n;
    else if (unit === "wpc" || unit === "çubuk") out.wpc = n;
  }
  return out;
}

/** "40/1 Penye", "70/36 Poly", "22 dtex EA draft 3", "Ne 30/1 CO". */
export function parseYarnDef(value: string): { count: string; material: string; draft?: number } {
  const tokens = value.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  let draft: number | undefined;
  const di = tokens.findIndex((t) => ["draft", "çekim"].includes(lower(t)));
  if (di >= 0) {
    draft = num(tokens[di + 1] ?? "");
    tokens.splice(di, 2);
  }
  let count = "";
  let unit = "";
  const words: string[] = [];
  for (const tok of tokens) {
    const lo = lower(tok);
    if (!count && /^\d+(?:[.,]\d+)?(?:\/\d+)?$/.test(tok)) count = tok;
    else if (COUNT_UNITS.has(lo) && !unit) unit = lo === "denye" || lo === "denier" || lo === "d" ? "den" : lo;
    else words.push(tok);
  }
  const matWord = words.join(" ");
  const material = MATERIALS[lower(matWord)] ?? (matWord || "?");
  if (!unit) unit = STAPLE.has(material) ? "ne" : "den";
  return { count: count ? `${count} ${unit}` : "", material, draft };
}

const TRACK_LABEL = /^([A-Za-z]|[1-9])(['′’]?):?$/;

function trackOf(label: string): { bed: "cyl" | "dial"; track: string } | undefined {
  const m = label.match(TRACK_LABEL);
  if (!m) return undefined;
  const ch = m[1].toUpperCase();
  const track = /[1-9]/.test(ch) ? String.fromCharCode(64 + Number(ch)) : ch;
  return { bed: m[2] ? "dial" : "cyl", track };
}

/** Split cam cells: "M K M K", "MKMK" or "M,K,M,K". */
function camCells(rest: string[]): string[] {
  if (rest.length === 1 && rest[0].length > 1 && /^[KTMktm.\-]+$/.test(rest[0])) return [...rest[0]];
  return rest.flatMap((c) => c.split(",")).filter(Boolean);
}

export function parseKnitText(src: string): TextResult {
  const issues: Issue[] = [];
  const fields: Record<string, string> = {};
  const yarnDefs: Record<string, ReturnType<typeof parseYarnDef>> = {};
  const grid: { bed: "cyl" | "dial"; track: string; cells: string[]; line: number }[] = [];
  const feedRows: Partial<Record<"yarn" | "loop" | "runin", string[]>> = {};
  let columns: number | undefined;

  src.split(/\r?\n/).forEach((rawLine, idx) => {
    const line = stripComment(rawLine).trim();
    if (!line) return;
    const lineNo = idx + 1;

    // Yarn definition: "Y1 = 40/1 Penye" or "Y1: 40/1 Penye".
    let m = line.match(/^(Y\d+)\s*[=:]\s*(.+)$/i);
    if (m) {
      yarnDefs[m[1].toUpperCase()] = parseYarnDef(m[2]);
      return;
    }

    // key: value
    m = line.match(/^([^\s:]+(?:\s[^\s:]+)?)\s*:\s*(.*)$/);
    if (m && KEYS[lower(m[1])]) {
      fields[KEYS[lower(m[1])]] = m[2].trim();
      return;
    }

    const tokens = line.split(/\s+/);

    // Feeder header: "F1 F2 F3 F4" (optionally after a label).
    const fCols = tokens.filter((t) => /^F\d+$/i.test(t));
    if (fCols.length && fCols.length >= tokens.length - 1) {
      columns = fCols.length;
      return;
    }

    // Feed rows: yarn / loop / runin.
    for (const len of [2, 1]) {
      const key = lower(tokens.slice(0, len).join(" ").replace(/:$/, ""));
      if (FEED_ROWS[key] && tokens.length > len) {
        feedRows[FEED_ROWS[key]] = tokens.slice(len).flatMap((c) => c.split(",")).filter(Boolean);
        return;
      }
    }

    // Track row: "A  M K M K", "B'  KTKT", "1: M K".
    const tr = trackOf(tokens[0]);
    if (tr && tokens.length > 1) {
      grid.push({ ...tr, cells: camCells(tokens.slice(1)), line: lineNo });
      return;
    }

    issues.push({ level: "warning", code: "unknownLine", params: { line: lineNo, text: line.slice(0, 40) } });
  });

  // ---- Assemble the plain object for parseFabric ----
  const raw: Obj = {};
  for (const k of ["article", "structure", "customer", "status", "notes"]) if (fields[k]) raw[k] = fields[k];
  if (fields.order) raw.order_kg = num(fields.order.replace(/\s*kg$/i, "").trim());

  if (grid.length === 0) {
    issues.push({ level: "error", code: "noGrid" });
    return { raw, issues };
  }
  const width = columns ?? grid[0].cells.length;
  for (const row of grid) {
    if (row.cells.length !== width) {
      issues.push({
        level: "error",
        code: "gridWidth",
        params: { track: row.track, bed: row.bed, got: row.cells.length, want: width },
      });
    }
  }

  // Machine.
  const machine: Obj = fields.machine ? parseMachineLine(fields.machine) : {};
  if (machine.unknown) {
    issues.push({ level: "warning", code: "machineToken", params: { value: (machine.unknown as string[]).join(" ") } });
    delete machine.unknown;
  }
  if (fields.needles) machine.needles = num(fields.needles.split(/\s+/)[0]);
  const hasDial = grid.some((r) => r.bed === "dial") || !!fields.dial;
  if (!machine.type && !machine.ref) machine.type = hasDial ? "double-jersey" : "single-jersey";
  raw.machine = machine;

  // Set-out: given, or the tracks that take yarn, in row order.
  const usedTracks = (bed: "cyl" | "dial") =>
    grid.filter((r) => r.bed === bed && r.cells.some((c) => /[KT]/i.test(c))).map((r) => r.track);
  const setout: Obj = {};
  for (const bed of ["cyl", "dial"] as const) {
    const given = fields[bed === "cyl" ? "cylinder" : "dial"];
    if (given) setout[bed === "cyl" ? "cylinder" : "dial"] = given;
    else if (bed === "cyl" || hasDial) {
      const used = usedTracks(bed);
      if (used.length) {
        setout[bed === "cyl" ? "cylinder" : "dial"] = used.join("");
        issues.push({ level: "warning", code: "setoutAssumed", params: { bed, setout: used.join("") } });
      }
    }
  }
  raw.setout = setout;

  // Tracks named in the set-out, so cam strings can follow them.
  const setoutTracks = (bed: "cyl" | "dial"): string[] => {
    const s = String(setout[bed === "cyl" ? "cylinder" : "dial"] ?? "").toUpperCase();
    const letters = [...s]
      .filter((c) => /[A-Z1-9]/.test(c))
      .map((c) => (/[1-9]/.test(c) ? String.fromCharCode(64 + Number(c)) : c));
    return [...new Set(letters)].sort();
  };
  const rowFor = (bed: "cyl" | "dial", track: string) => grid.find((r) => r.bed === bed && r.track === track);

  for (const bed of ["cyl", "dial"] as const) {
    const inSetout = setoutTracks(bed);
    for (const r of grid.filter((g) => g.bed === bed)) {
      if (!inSetout.includes(r.track) && r.cells.some((c) => /[KT]/i.test(c))) {
        issues.push({ level: "warning", code: "trackNotInSetout", params: { bed, track: r.track } });
      }
    }
    for (const tr of inSetout) {
      if (!rowFor(bed, tr)) issues.push({ level: "error", code: "camRowMissing", params: { bed, track: tr } });
    }
  }

  const camString = (bed: "cyl" | "dial", f: number) =>
    setoutTracks(bed)
      .map((tr) => {
        const c = rowFor(bed, tr)?.cells[f];
        return c === undefined || c === "-" || c === "." ? "M" : c.toUpperCase();
      })
      .join("");
  const cams: Obj = {};
  const double = machine.type === "double-jersey" || hasDial;
  for (let f = 0; f < width; f++) {
    cams[`F${f + 1}`] = double ? { cyl: camString("cyl", f), dial: camString("dial", f) } : camString("cyl", f);
  }
  raw.cams = cams;

  // Yarns.
  const yarns: Obj = {};
  for (const [id, y] of Object.entries(yarnDefs)) yarns[id] = { count: y.count, material: y.material };
  raw.yarns = yarns;

  // Feeds: one column per feeder; a single value applies to every feeder.
  const cellAt = (row: string[] | undefined, f: number) => (row ? (row.length === 1 ? row[0] : row[f]) : undefined);
  const feeds: Obj = {};
  for (let f = 0; f < width; f++) {
    const y = cellAt(feedRows.yarn, f);
    if (!y || y === "-") continue;
    const [main, plate] = y.toUpperCase().split("+");
    const loop = cellAt(feedRows.loop, f);
    const runin = cellAt(feedRows.runin, f);
    const feed: Obj = { yarn: main };
    if (plate) {
      feed.plate = plate;
      if (yarnDefs[plate]?.draft) feed.draft = yarnDefs[plate].draft;
    }
    if (loop && loop !== "-") feed.loop = num(loop.replace(/mm$/i, ""));
    if (runin && runin !== "-") feed.runin = num(runin.replace(/mm$/i, ""));
    feeds[`F${f + 1}`] = feed;
  }
  for (const [row, vals] of Object.entries(feedRows)) {
    if (vals && vals.length !== 1 && vals.length !== width) {
      issues.push({ level: "error", code: "feedRowWidth", params: { row, got: vals.length, want: width } });
    }
  }
  raw.feeds = feeds;

  const fabric: Obj = {};
  if (fields.grey) fabric.grey = parseStateLine(fields.grey);
  if (fields.finished) fabric.finished = parseStateLine(fields.finished);
  raw.fabric = fabric;

  return { raw, issues };
}
