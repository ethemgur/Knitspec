import { Fabric, isDouble, Stitch } from "../model";
import { fmt, Lang, t } from "../i18n";
import { esc, STITCH_COLOUR, svgRoot, tag, text } from "./svg";

const CELL_W = 30;
const CELL_H = 24;
const LABEL_W = 44;
const FEED_W = 150;

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

/** Feeder × track grid. Double jersey shows the dial tracks first, then the cylinder. */
export function renderCamChart(fabric: Fabric, lang: Lang): string {
  const double = isDouble(fabric);
  const groups: { bed: "dial" | "cyl"; tracks: string[] }[] = double
    ? [
        { bed: "dial", tracks: fabric.tracks.dial },
        { bed: "cyl", tracks: fabric.tracks.cyl },
      ]
    : [{ bed: "cyl", tracks: fabric.tracks.cyl }];

  const gap = 12;
  const gridW = groups.reduce((a, g) => a + g.tracks.length * CELL_W, 0) + gap * (groups.length - 1);
  const top = 40;
  const rows = fabric.cams.length;
  const width = Math.max(LABEL_W + gridW + FEED_W, 330);
  const height = top + rows * CELL_H + 40;
  const body: string[] = [];

  // Headers.
  let gx = LABEL_W;
  for (const g of groups) {
    const w = g.tracks.length * CELL_W;
    body.push(text(gx + w / 2, 14, t(lang, `bed.${g.bed}`), { "text-anchor": "middle", "font-weight": 600, fill: "currentColor" }));
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
