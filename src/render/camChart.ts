import { Bed, EMPTY, Fabric, isDouble, Stitch } from "../model";
import { fmt, Lang, t } from "../i18n";
import { DEFAULT_DISPLAY, DisplayOptions, trackLabel } from "./options";
import { esc, STITCH_COLOUR, svgRoot, tag, text } from "./svg";

const CELL_W = 36;
const CELL_H = 24;

// Set-out strip
const SO_LABEL_W = 72;
const SO_CELL = 18;
const SO_ROW_H = 24;
const REPEAT_COLOUR = "#d9822b";

/** Textbook cam symbol inside a box: knit ∧ (full raise), tuck ⏜ (half raise), miss — (no raise). */
function camSymbol(x: number, y: number, w: number, h: number, s: Stitch): string {
  const c = STITCH_COLOUR[s];
  const l = x + w * 0.22;
  const r = x + w * 0.78;
  const base = y + h * 0.75;
  const stroke = { fill: "none", stroke: c, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" };
  switch (s) {
    case "K":
      return tag("polyline", { points: `${l},${base} ${(l + r) / 2},${y + h * 0.22} ${r},${base}`, ...stroke });
    case "T":
      return tag("polyline", { points: `${l},${base} ${l + (r - l) * 0.25},${y + h * 0.48} ${l + (r - l) * 0.75},${y + h * 0.48} ${r},${base}`, ...stroke });
    default:
      return tag("line", { x1: l, x2: r, y1: base, y2: base, ...stroke });
  }
}

function cell(x: number, y: number, s: Stitch, o: DisplayOptions): string {
  const c = STITCH_COLOUR[s];
  const box = tag("rect", { x: x + 1, y: y + 1, width: CELL_W - 2, height: CELL_H - 2, rx: 3, fill: c, "fill-opacity": s === "M" ? 0.12 : 0.28, stroke: c });
  if (o.camStyle === "symbols") return box + camSymbol(x + 1, y + 1, CELL_W - 2, CELL_H - 2, s);
  return box + text(x + CELL_W / 2, y + CELL_H / 2 + 4, s, { "text-anchor": "middle", "font-weight": 600, fill: "currentColor" });
}

export function legend(lang: Lang, x: number, y: number, o: DisplayOptions = DEFAULT_DISPLAY): { svg: string; width: number } {
  let cx = x;
  const parts: string[] = [];
  for (const s of ["K", "T", "M"] as Stitch[]) {
    parts.push(
      tag("rect", { x: cx, y: y - 11, width: 20, height: 16, rx: 2, fill: STITCH_COLOUR[s], "fill-opacity": s === "M" ? 0.12 : 0.28, stroke: STITCH_COLOUR[s] }),
    );
    if (o.camStyle === "symbols") parts.push(camSymbol(cx, y - 11, 20, 16, s));
    const label = o.camStyle === "symbols" ? t(lang, `stitch.${s}`) : `${s} = ${t(lang, `stitch.${s}`)}`;
    parts.push(text(cx + 25, y + 1, label, { fill: "currentColor" }));
    cx += 100;
  }
  return { svg: parts.join(""), width: cx - x };
}

/** How many repeats of a set-out to draw so short repeats still read as a pattern. */
function repeatsToDraw(width: number): number {
  return Math.max(1, Math.min(Math.ceil(8 / width), Math.floor(24 / width) || 1));
}

/**
 * Needle set-out strip: one row per bed, one box per needle with its track
 * letter, the first repeat bracketed, and the repeat count around the bed.
 * Dial needles sit half a box over in rib gating, directly above in interlock.
 */
function setoutStrip(fabric: Fabric, lang: Lang, needles: number | undefined, top: number, o: DisplayOptions): { svg: string[]; width: number; height: number } {
  const beds: Bed[] = isDouble(fabric) && fabric.setout.dial ? ["dial", "cyl"] : ["cyl"];
  const out: string[] = [text(8, top + 10, t(lang, "tab.setout"), { "font-weight": 600, fill: "currentColor" })];
  let width = 0;
  let y = top + 20;
  for (const bed of beds) {
    const set = (bed === "cyl" ? fabric.setout.cylinder : fabric.setout.dial)!;
    const shift = bed === "dial" && fabric.machine.gating !== "interlock" ? SO_CELL / 2 : 0;
    const x0 = SO_LABEL_W + shift;
    const n = set.length * repeatsToDraw(set.length);
    out.push(text(8, y + SO_ROW_H / 2 + 4, t(lang, `bed.${bed}`), { fill: "currentColor", opacity: 0.8 }));
    for (let i = 0; i < n; i++) {
      const x = x0 + i * SO_CELL;
      const letter = set[i % set.length];
      const empty = letter === EMPTY;
      out.push(
        tag("rect", {
          x: x + 1,
          y: y + 2,
          width: SO_CELL - 2,
          height: SO_ROW_H - 4,
          rx: 2,
          fill: empty ? "none" : "currentColor",
          "fill-opacity": empty ? undefined : 0.08,
          stroke: "currentColor",
          "stroke-opacity": empty ? 0.3 : 0.45,
          "stroke-dasharray": empty ? "2 2" : undefined,
        }),
        text(x + SO_CELL / 2, y + SO_ROW_H / 2 + 4, empty ? "–" : trackLabel(bed, letter, o), {
          "text-anchor": "middle",
          fill: "currentColor",
          "font-weight": empty ? undefined : 600,
          opacity: empty ? 0.5 : 1,
        }),
      );
    }
    // Bracket the first repeat.
    out.push(
      tag("rect", { x: x0, y: y + 1, width: set.length * SO_CELL, height: SO_ROW_H - 2, rx: 3, fill: "none", stroke: REPEAT_COLOUR, "stroke-width": 1.5 }),
    );
    const shown = set.map((l) => (l === EMPTY ? l : trackLabel(bed, l, o))).join(o.trackNames === "numbers" ? " " : "");
    const info = needles
      ? `${shown} × ${fmt(lang, needles / set.length, 2)} ${t(lang, "label.repeats")}`
      : shown;
    const ix = x0 + n * SO_CELL + 10;
    out.push(text(ix, y + SO_ROW_H / 2 + 4, info, { fill: "currentColor" }));
    width = Math.max(width, ix + info.length * 6.4 + 10);
    y += SO_ROW_H + 4;
  }
  return { svg: out, width, height: y - top };
}

/**
 * Cam chart with the needle set-out on top: everything a master needs to set
 * the machine in one picture. Laid out like a set-up sheet (çelik dizilimi):
 * one row per track — dial (kapak, A′ B′) rows above cylinder (silindir) rows —
 * (track names, row order and cam style follow the display options)
 * and one column per feeder, with the yarn and loop length under each feeder.
 */
export function renderCamChart(fabric: Fabric, lang: Lang, needles?: number, o: DisplayOptions = DEFAULT_DISPLAY): string {
  const beds: Bed[] = isDouble(fabric) ? ["dial", "cyl"] : ["cyl"];
  const strip = setoutStrip(fabric, lang, needles, 4, o);
  const body: string[] = [...strip.svg];

  const cols = fabric.cams.length;
  const LEFT = 92; // bed name + track label
  const GROUP_GAP = 8;
  const gridTop = strip.height + 18;
  const top = gridTop + 22; // below the feeder header
  const trackRows = beds.reduce((a, b) => a + fabric.tracks[b].length, 0);
  const gridH = trackRows * CELL_H + GROUP_GAP * (beds.length - 1);
  const feedTop = top + gridH + 6;
  const hasLoop = fabric.cams.some((r) => fabric.feeds[r.feeder]?.loop !== undefined);
  const feedRows = hasLoop ? 2 : 1;
  const width = Math.max(LEFT + cols * CELL_W + 16, LEFT + 310, strip.width);
  const height = feedTop + feedRows * 16 + 34;

  body.push(tag("line", { x1: 8, x2: width - 8, y1: gridTop - 6, y2: gridTop - 6, stroke: "currentColor", "stroke-opacity": 0.12 }));

  // Feeder header.
  fabric.cams.forEach((row, c) =>
    body.push(text(LEFT + c * CELL_W + CELL_W / 2, top - 8, `F${row.feeder}`, { "text-anchor": "middle", "font-weight": 600, fill: "currentColor" })),
  );

  // Track rows, grouped by bed.
  let y = top;
  for (const bed of beds) {
    // Cam columns follow fabric.tracks order; rows may be shown first-track-at-bottom.
    const order = fabric.tracks[bed].map((tr, i) => ({ tr, i }));
    if (o.trackOrder === "first-bottom") order.reverse();
    const tracks = fabric.tracks[bed];
    body.push(text(8, y + CELL_H / 2 + 4, t(lang, `bed.${bed}`), { "font-weight": 600, fill: "currentColor" }));
    order.forEach(({ tr, i }, rowIdx) => {
      const ry = y + rowIdx * CELL_H;
      body.push(text(LEFT - 8, ry + CELL_H / 2 + 4, trackLabel(bed, tr, o), { "text-anchor": "end", fill: "currentColor", opacity: 0.8 }));
      fabric.cams.forEach((row, c) => {
        const cams = bed === "cyl" ? row.cyl : row.dial ?? [];
        body.push(cell(LEFT + c * CELL_W, ry, cams[i] ?? "M", o));
      });
    });
    y += tracks.length * CELL_H + GROUP_GAP;
  }

  // Yarn and loop length under each feeder.
  const small = { "text-anchor": "middle", fill: "currentColor", "font-size": 10 };
  body.push(
    text(LEFT - 8, feedTop + 11, t(lang, "label.yarn"), { "text-anchor": "end", fill: "currentColor", opacity: 0.7, "font-size": 10 }),
  );
  if (hasLoop) {
    body.push(text(LEFT - 8, feedTop + 27, t(lang, "label.loopMm"), { "text-anchor": "end", fill: "currentColor", opacity: 0.7, "font-size": 10 }));
  }
  fabric.cams.forEach((row, c) => {
    const f = fabric.feeds[row.feeder];
    if (!f) return;
    const cx = LEFT + c * CELL_W + CELL_W / 2;
    body.push(text(cx, feedTop + 11, f.plate ? `${f.yarn}+${f.plate}` : f.yarn, small));
    if (f.loop !== undefined) body.push(text(cx, feedTop + 27, fmt(lang, f.loop, 2), small));
  });

  body.push(legend(lang, LEFT, height - 10, o).svg);
  return svgRoot(width, height, "knitspec-cams", body, esc(t(lang, "tab.cams")));
}
