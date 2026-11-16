import { Bed, EMPTY, Fabric, isDouble, Stitch } from "../model";
import { fmt, Lang, t } from "../i18n";
import { esc, STITCH_COLOUR, svgRoot, tag, text } from "./svg";

const CELL_W = 30;
const CELL_H = 24;
const LABEL_W = 44;
const FEED_W = 150;

// Set-out strip
const SO_LABEL_W = 72;
const SO_CELL = 18;
const SO_ROW_H = 24;
const REPEAT_COLOUR = "#d9822b";

function cell(x: number, y: number, s: Stitch): string {
  const c = STITCH_COLOUR[s];
  return [
    tag("rect", { x: x + 1, y: y + 1, width: CELL_W - 2, height: CELL_H - 2, rx: 3, fill: c, "fill-opacity": s === "M" ? 0.12 : 0.28, stroke: c }),
    text(x + CELL_W / 2, y + CELL_H / 2 + 4, s, { "text-anchor": "middle", "font-weight": 600, fill: "currentColor" }),
  ].join("");
}

export function legend(lang: Lang, x: number, y: number): { svg: string; width: number } {
  let cx = x;
  const parts: string[] = [];
  for (const s of ["K", "T", "M"] as Stitch[]) {
    parts.push(
      tag("rect", { x: cx, y: y - 10, width: 14, height: 14, rx: 2, fill: STITCH_COLOUR[s], "fill-opacity": s === "M" ? 0.12 : 0.28, stroke: STITCH_COLOUR[s] }),
      text(cx + 19, y + 1, `${s} = ${t(lang, `stitch.${s}`)}`, { fill: "currentColor" }),
    );
    cx += 100;
  }
  return { svg: parts.join(""), width: cx - x };
}

function feedLabel(fabric: Fabric, feeder: number, lang: Lang): string {
  const f = fabric.feeds[feeder];
  if (!f) return "";
  const yarns = f.plate ? `${f.yarn}+${f.plate}` : f.yarn;
  return f.loop !== undefined ? `${yarns} · ${fmt(lang, f.loop, 2)} mm` : yarns;
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
function setoutStrip(fabric: Fabric, lang: Lang, needles: number | undefined, top: number): { svg: string[]; width: number; height: number } {
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
        text(x + SO_CELL / 2, y + SO_ROW_H / 2 + 4, empty ? "–" : letter, {
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
    const info = needles
      ? `${set.join("")} × ${fmt(lang, needles / set.length, 2)} ${t(lang, "label.repeats")}`
      : set.join("");
    const ix = x0 + n * SO_CELL + 10;
    out.push(text(ix, y + SO_ROW_H / 2 + 4, info, { fill: "currentColor" }));
    width = Math.max(width, ix + info.length * 6.4 + 10);
    y += SO_ROW_H + 4;
  }
  return { svg: out, width, height: y - top };
}

/**
 * Cam chart with the needle set-out on top: everything a master needs to set
 * the machine in one picture. The feeder × track grid shows the dial tracks
 * first on double jersey, then the cylinder.
 */
export function renderCamChart(fabric: Fabric, lang: Lang, needles?: number): string {
  const double = isDouble(fabric);
  const groups: { bed: Bed; tracks: string[] }[] = double
    ? [
        { bed: "dial", tracks: fabric.tracks.dial },
        { bed: "cyl", tracks: fabric.tracks.cyl },
      ]
    : [{ bed: "cyl", tracks: fabric.tracks.cyl }];

  const strip = setoutStrip(fabric, lang, needles, 4);
  const body: string[] = [...strip.svg];

  const gap = 12;
  const gridW = groups.reduce((a, g) => a + g.tracks.length * CELL_W, 0) + gap * (groups.length - 1);
  const gridTop = strip.height + 18;
  const top = gridTop + 40;
  const rows = fabric.cams.length;
  const width = Math.max(LABEL_W + gridW + FEED_W, 330, strip.width);
  const height = top + rows * CELL_H + 40;

  body.push(tag("line", { x1: 8, x2: width - 8, y1: gridTop - 6, y2: gridTop - 6, stroke: "currentColor", "stroke-opacity": 0.12 }));

  // Headers.
  let gx = LABEL_W;
  for (const g of groups) {
    const w = g.tracks.length * CELL_W;
    body.push(text(gx + w / 2, gridTop + 14, t(lang, `bed.${g.bed}`), { "text-anchor": "middle", "font-weight": 600, fill: "currentColor" }));
    g.tracks.forEach((tr, i) =>
      body.push(text(gx + i * CELL_W + CELL_W / 2, top - 8, tr, { "text-anchor": "middle", fill: "currentColor", opacity: 0.8 })),
    );
    gx += w + gap;
  }
  body.push(text(LABEL_W + gridW + 10, top - 8, t(lang, "label.feeds"), { fill: "currentColor", opacity: 0.8 }));

  // Rows.
  fabric.cams.forEach((row, r) => {
    const y = top + r * CELL_H;
    body.push(text(LABEL_W - 8, y + CELL_H / 2 + 4, `F${row.feeder}`, { "text-anchor": "end", fill: "currentColor", "font-weight": 600 }));
    let x = LABEL_W;
    for (const g of groups) {
      const cams = g.bed === "cyl" ? row.cyl : row.dial ?? [];
      g.tracks.forEach((_, i) => body.push(cell(x + i * CELL_W, y, cams[i] ?? "M")));
      x += g.tracks.length * CELL_W + gap;
    }
    body.push(text(LABEL_W + gridW + 10, y + CELL_H / 2 + 4, feedLabel(fabric, row.feeder, lang), { fill: "currentColor" }));
  });

  body.push(legend(lang, LABEL_W, top + rows * CELL_H + 26).svg);
  return svgRoot(width, height, "knitspec-cams", body, esc(t(lang, "tab.cams")));
}
