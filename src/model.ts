/**
 * The fabric model: the single source of truth that the validator,
 * calculator and every renderer read. It is built from the `knit` block
 * by `parseFabric` and never depends on Obsidian.
 */

/** K = knit (ilmek), T = tuck (askı), M = miss (atlama). */
export type Stitch = "K" | "T" | "M";

export type MachineType = "single-jersey" | "double-jersey";
export type Gating = "rib" | "interlock";
export type Bed = "cyl" | "dial";

/** Empty needle slot in a set-out (needle taken out). */
export const EMPTY = "-";

export interface Machine {
  type: MachineType;
  /** Cylinder diameter in inches. */
  diameter?: number;
  /** Gauge E, needles per inch. */
  gauge?: number;
  /** Dial gauge if given separately (double jersey); must equal `gauge`. */
  dialGauge?: number;
  feeders?: number;
  rpm?: number;
  /** 0..1 */
  efficiency?: number;
  /** Real needle count per bed from the machine plate; overrides π·D·E. */
  needles?: number;
  /** Number of needle tracks (butt positions) the machine has. */
  tracks?: number;
  gating?: Gating;
  /** Wiki link to a machine note, e.g. "[[M-12]]". */
  ref?: string;
}

export interface Setout {
  /** One entry per needle in the repeat: a track letter or EMPTY. */
  cylinder: string[];
  dial?: string[];
}

export interface CamRow {
  /** 1-based feeder number inside the repeat. */
  feeder: number;
  /** Stitch per track, indexed in the order of `Fabric.tracks.cyl`. */
  cyl: Stitch[];
  dial?: Stitch[];
}

export interface Yarn {
  id: string;
  /** Original text, e.g. "75 dtex" or "Ne 30/1". */
  countText: string;
  /** Linear density in tex (g per 1000 m), if the count could be read. */
  tex?: number;
  material: string;
}

export interface Feed {
  /** Main yarn id. */
  yarn: string;
  /** Knit loop length in mm. */
  loop?: number;
  /** Plating yarn id, fed with the main yarn. */
  plate?: string;
  /** Draft (stretch ratio) of the plating yarn, e.g. 3 for elastane. Default 1. */
  draft?: number;
  /** Yarn length taken by a tuck, in mm. Default: settings ratio × loop. */
  tuck?: number;
  /** Yarn length taken by a missed needle (float), in mm. Default: settings ratio × loop. */
  miss?: number;
  /** Measured run-in: yarn length (mm) per 100 needles. Overrides the stitch sum. */
  runin?: number;
}

export interface FabricState {
  gsm?: number;
  /** Open width in cm. */
  width?: number;
  /** Courses per cm (one course = one feeder row of the cam chart). */
  cpc?: number;
  /** Wales per cm. */
  wpc?: number;
}

export interface Fabric {
  article?: string;
  customer?: string;
  status?: string;
  structure?: string;
  notes?: string;
  machine: Machine;
  setout: Setout;
  /** Distinct track letters per bed, sorted: the column order of cam strings. */
  tracks: { cyl: string[]; dial: string[] };
  cams: CamRow[];
  yarns: Record<string, Yarn>;
  /** Feed per feeder number (1-based, inside the repeat). */
  feeds: Record<number, Feed>;
  grey: FabricState;
  finished: FabricState;
  /** Order quantity in kg, for machine-hours. */
  orderKg?: number;
}

export type IssueLevel = "error" | "warning";

/** A validation or input message. Text comes from i18n by `code`. */
export interface Issue {
  level: IssueLevel;
  code: string;
  params?: Record<string, string | number>;
}

/** Stitch for one needle in the repeat at one feeder, or null for an empty slot. */
export function stitchAt(fabric: Fabric, row: CamRow, bed: Bed, needleIndex: number): Stitch | null {
  const setout = bed === "cyl" ? fabric.setout.cylinder : fabric.setout.dial;
  if (!setout || setout.length === 0) return null;
  const letter = setout[needleIndex % setout.length];
  if (letter === EMPTY) return null;
  const cams = bed === "cyl" ? row.cyl : row.dial;
  if (!cams) return "M";
  const col = fabric.tracks[bed].indexOf(letter);
  return cams[col] ?? "M";
}

export function isDouble(fabric: Fabric): boolean {
  return fabric.machine.type === "double-jersey";
}
