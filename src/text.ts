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

type BedId = "cyl" | "dial";

/** A track name as written: 1, 1', 2'', A, B′ … (apostrophes normalised to '). */
const TRACK_LABEL = /^([A-Za-z]|\d)(['′’]*):?$/;

export function normLabel(label: string): string | undefined {
  const m = label.match(TRACK_LABEL);
  return m ? m[1].toUpperCase() + "'".repeat(m[2].length) : undefined;
}

/** Natural order for track names: 1, 1', 2, 2' / A, B, C. */
function labelKey(label: string): [number, number] {
  const base = label.replace(/'+$/, "");
  const n = /^\d$/.test(base) ? Number(base) : base.charCodeAt(0);
  return [n, label.length - base.length];
}
const byLabel = (a: string, b: string) => {
  const [x1, y1] = labelKey(a);
  const [x2, y2] = labelKey(b);
  return x1 - x2 || y1 - y2;
};

/** Split a set-out into track names and empty slots: "1 1' 2 2'", "11'22'", "AA--", "B'A'". */
export function splitSetout(s: string): string[] | undefined {
  const out: string[] = [];
  const re = /\s*(?:([-._])|([A-Za-z]|\d)(['′’]*))/gy;
  let m: RegExpExecArray | null;
  let pos = 0;
  while ((m = re.exec(s))) {
    pos = re.lastIndex;
    if (m[1]) out.push("-");
    else out.push(m[2].toUpperCase() + "'".repeat(m[3].length));
  }
  return s.slice(pos).trim() === "" && out.length ? out : undefined;
}

/** Split cam cells: "M K M K", "MKMK" or "M,K,M,K". */
function camCells(rest: string[]): string[] {
  if (rest.length === 1 && rest[0].length > 1 && /^[KTMktm.\-]+$/.test(rest[0])) return [...rest[0]];
  return rest.flatMap((c) => c.split(",")).filter(Boolean);
}

const isStitch = (c: string) => /^[KTMktm.\-]$/.test(c);
const isYarnCell = (c: string) => /^(Y\d+(\+Y\d+)?|-)$/i.test(c);
const isNumCell = (c: string) => /^(\d+(?:[.,]\d+)?(mm)?|-)$/i.test(c);

const SECTIONS: Record<string, BedId> = { kapak: "dial", dial: "dial", silindir: "cyl", cylinder: "cyl" };

interface GridRow {
  bed: BedId;
  label: string;
  cells: string[];
  /** Internal track id (a letter) used by the model. */
  track?: string;
}

export function parseKnitText(src: string): TextResult {
  const issues: Issue[] = [];
  const fields: Record<string, string> = {};
  const yarnDefs: Record<string, ReturnType<typeof parseYarnDef>> = {};
  const grid: GridRow[] = [];
  const feedRows: Partial<Record<"yarn" | "loop" | "runin", string[]>> = {};
  let columns: number | undefined;
  let bed: BedId = "cyl";
  let sawSection = false;

  src.split(/\r?\n/).forEach((rawLine, idx) => {
    const line = stripComment(rawLine).trim();
    if (!line) return;
    const lineNo = idx + 1;

    // Section line: "kapak" / "silindir" (rows below belong to that bed).
    const sec = SECTIONS[lower(line.replace(/:$/, ""))];
    if (sec) {
      bed = sec;
      sawSection = true;
      return;
    }

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
    const rest = tokens.slice(1).flatMap((c) => c.split(",")).filter(Boolean);
    const head = lower(tokens[0].replace(/:$/, ""));

    // Feeder header: "F1 F2 F3 F4" (optionally after a label).
    const fCols = tokens.filter((t) => /^F\d+$/i.test(t));
    if (fCols.length && fCols.length >= tokens.length - 1) {
      columns = fCols.length;
      return;
    }

    // Feed rows: "F Y1 Y2 …" (yarn per feeder), "L 2.9" (loop), or the words.
    if (rest.length && (head === "f" || FEED_ROWS[head] === "yarn") && rest.every(isYarnCell)) {
      feedRows.yarn = rest;
      return;
    }
    if (rest.length && (head === "l" || FEED_ROWS[head] === "loop") && rest.every(isNumCell)) {
      feedRows.loop = rest;
      return;
    }
    if (rest.length && FEED_ROWS[head] === "runin" && rest.every(isNumCell)) {
      feedRows.runin = rest;
      return;
    }
    const two = lower(tokens.slice(0, 2).join(" ").replace(/:$/, ""));
    if (FEED_ROWS[two] && tokens.length > 2) {
      feedRows[FEED_ROWS[two]] = tokens.slice(2).flatMap((c) => c.split(",")).filter(Boolean);
      return;
    }

    // Track row: "2'  M K M K", "1  KMKT", "A: K T".
    const label = normLabel(tokens[0]);
    const cells = camCells(tokens.slice(1));
    if (label && cells.length && cells.every(isStitch)) {
      grid.push({ bed, label, cells });
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
      issues.push({ level: "error", code: "gridWidth", params: { track: row.label, bed: row.bed, got: row.cells.length, want: width } });
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
  if (!sawSection && machine.type === "double-jersey") issues.push({ level: "error", code: "noKapakSection" });

  // Internal track ids: letters as written if every name is a letter, else A, B, C … in written order.
  const labels: Record<BedId, Record<string, string>> = { cyl: {}, dial: {} };
  for (const b of ["cyl", "dial"] as const) {
    const rows = grid.filter((r) => r.bed === b);
    const seen = new Set<string>();
    for (const r of rows) {
      if (seen.has(r.label)) issues.push({ level: "warning", code: "trackTwice", params: { bed: b, track: r.label } });
      seen.add(r.label);
    }
    const allLetters = rows.every((r) => /^[A-Z]$/.test(r.label));
    rows.forEach((r, i) => {
      r.track = allLetters ? r.label : String.fromCharCode(65 + i);
      labels[b][r.track] = r.label;
    });
  }
  const idOf = (b: BedId, label: string) => grid.find((r) => r.bed === b && r.label === label)?.track;
  raw.labels = labels;
  raw.grid = grid.map((r) => ({ bed: r.bed, track: r.track, label: r.label, cells: r.cells }));

  // Set-out: given (by track name), or the tracks that knit, in natural order.
  const setoutLabels: Record<BedId, string[] | undefined> = { cyl: undefined, dial: undefined };
  for (const b of ["cyl", "dial"] as const) {
    const given = fields[b === "cyl" ? "cylinder" : "dial"];
    if (given) {
      const parts = splitSetout(given);
      if (!parts) issues.push({ level: "error", code: "setoutUnreadable", params: { bed: b, value: given } });
      setoutLabels[b] = parts;
    } else if (b === "cyl" || hasDial) {
      const used = grid
        .filter((r) => r.bed === b && r.cells.some((c) => /[KT]/i.test(c)))
        .map((r) => r.label)
        .sort(byLabel);
      if (used.length) {
        setoutLabels[b] = used;
        issues.push({ level: "warning", code: "setoutAssumed", params: { bed: b, setout: used.join(" ") } });
      }
    }
  }
  const setout: Obj = {};
  for (const b of ["cyl", "dial"] as const) {
    const parts = setoutLabels[b];
    if (!parts) continue;
    const ids: string[] = [];
    for (const p of parts) {
      if (p === "-") {
        ids.push("-");
        continue;
      }
      const id = idOf(b, p);
      if (!id) {
        issues.push({ level: "error", code: "camRowMissing", params: { bed: b, track: p } });
        continue;
      }
      ids.push(id);
    }
    if (ids.length) setout[b === "cyl" ? "cylinder" : "dial"] = ids.join("");
  }
  raw.setout = setout;

  // Rows that knit but have no needles in the set-out.
  for (const r of grid) {
    const ids = String(setout[r.bed === "cyl" ? "cylinder" : "dial"] ?? "");
    if (r.track && !ids.includes(r.track) && r.cells.some((c) => /[KT]/i.test(c))) {
      issues.push({ level: "warning", code: "trackNotInSetout", params: { bed: r.bed, track: r.label } });
    }
  }

  // Cam strings per feeder, in the model's track order (sorted ids of the set-out).
  const setoutIds = (b: BedId) =>
    [...new Set([...String(setout[b === "cyl" ? "cylinder" : "dial"] ?? "")].filter((c) => c !== "-"))].sort();
  const camString = (b: BedId, f: number) =>
    setoutIds(b)
      .map((id) => {
        const c = grid.find((r) => r.bed === b && r.track === id)?.cells[f];
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
