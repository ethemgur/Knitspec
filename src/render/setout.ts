import { Figures } from "../calc";
import { EMPTY, Fabric, isDouble } from "../model";
import { fmt, Lang, t } from "../i18n";
import { svgRoot, tag, text } from "./svg";

const PITCH = 22;
const NEEDLE_H = 70;

/** How many repeats to draw so a small repeat still shows a readable strip. */
function repeatsToDraw(width: number): number {
  return Math.max(1, Math.min(Math.ceil(12 / width), Math.floor(48 / width)));
}

function bedStrip(
  setout: string[],
  tracks: string[],
  y: number,
  label: string,
  info: string,
  lang: Lang,
): { svg: string[]; width: number } {
  const reps = repeatsToDraw(setout.length);
  const n = setout.length * reps;
  const x0 = 80;
  const out: string[] = [];
  out.push(text(8, y + NEEDLE_H / 2, label, { "font-weight": 600, fill: "currentColor" }));

  // Track guide lines: A at the top, then B, C, ...
  const span = NEEDLE_H - 30;
  const trackY = (i: number) => (tracks.length === 1 ? y + 10 + span / 2 : y + 10 + (i * span) / (tracks.length - 1));
  tracks.forEach((tr, i) => {
    const ty = trackY(i);
    out.push(
      tag("line", { x1: x0 - 10, x2: x0 + n * PITCH, y1: ty + 3, y2: ty + 3, stroke: "currentColor", "stroke-opacity": 0.12 }),
      text(x0 - 14, ty + 7, tr, { "text-anchor": "end", fill: "currentColor", opacity: 0.6, "font-size": 10 }),
    );
  });

  for (let i = 0; i < n; i++) {
    const x = x0 + i * PITCH + PITCH / 2;
    const letter = setout[i % setout.length];
    if (letter === EMPTY) {
      out.push(
        tag("line", { x1: x, x2: x, y1: y + 4, y2: y + NEEDLE_H - 12, stroke: "currentColor", "stroke-opacity": 0.25, "stroke-dasharray": "3 3" }),
        text(x, y + NEEDLE_H + 4, "–", { "text-anchor": "middle", fill: "currentColor", opacity: 0.5 }),
      );
      continue;
    }
    const ty = trackY(tracks.indexOf(letter));
    out.push(
      tag("line", { x1: x, x2: x, y1: y, y2: y + NEEDLE_H - 12, stroke: "currentColor", "stroke-width": 2 }),
      tag("path", { d: `M ${x - 3} ${y + 5} Q ${x} ${y - 3} ${x + 3} ${y + 5}`, fill: "none", stroke: "currentColor", "stroke-width": 1.5 }),
      tag("rect", { x: x - 6, y: ty, width: 12, height: 7, rx: 1.5, fill: "currentColor" }),
      text(x, y + NEEDLE_H + 4, letter, { "text-anchor": "middle", fill: "currentColor", "font-weight": 600 }),
    );
  }

  // Bracket over the first repeat.
  const bx1 = x0 + 2;
  const bx2 = x0 + setout.length * PITCH - 2;
  out.push(
    tag("path", { d: `M ${bx1} ${y + NEEDLE_H + 12} v 5 H ${bx2} v -5`, fill: "none", stroke: "#d9822b", "stroke-width": 1.5 }),
    text((bx1 + bx2) / 2, y + NEEDLE_H + 30, `${t(lang, "label.repeat")} 1`, { "text-anchor": "middle", fill: "#d9822b", "font-size": 10 }),
    text(x0 + n * PITCH + 14, y + NEEDLE_H / 2, info, { fill: "currentColor" }),
  );
  return { svg: out, width: x0 + n * PITCH + 14 + info.length * 6.2 + 10 };
}

/** One repeat (or a few, for short repeats) of the needle order by butt, per bed. */
export function renderSetout(fabric: Fabric, figures: Figures, lang: Lang): string {
  const n = figures.needles?.value;
  const info = (w: number) =>
    n ? t(lang, "label.setoutRepeats", { width: w, repeats: fmt(lang, n / w, 2) }) : `${w}`;
  const strips: { svg: string[]; width: number }[] = [];
  const blockH = NEEDLE_H + 50;
  let y = 14;
  if (isDouble(fabric) && fabric.setout.dial) {
    strips.push(bedStrip(fabric.setout.dial, fabric.tracks.dial, y, t(lang, "bed.dial"), info(fabric.setout.dial.length), lang));
    y += blockH;
  }
  strips.push(bedStrip(fabric.setout.cylinder, fabric.tracks.cyl, y, t(lang, "bed.cyl"), info(fabric.setout.cylinder.length), lang));
  y += blockH;
  const width = Math.max(...strips.map((s) => s.width));
  return svgRoot(width, y - 10, "knitspec-setout", strips.flatMap((s) => s.svg), t(lang, "tab.setout"));
}
