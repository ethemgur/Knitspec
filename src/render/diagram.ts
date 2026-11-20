import { Bed, Fabric, isDouble, Stitch, stitchAt } from "../model";
import { Lang, t } from "../i18n";
import { legend } from "./camChart";
import { round, STITCH_COLOUR, svgRoot, tag, text } from "./svg";

const PITCH = 24; // distance between cylinder needles
const HALF = 6; // half width of a loop
const LEFT = 44;
const RIGHT = 70;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Closed (crossed) loop around a needle: knit. d = +1 loop goes down (cylinder), -1 up (dial). */
export function knitLoop(x: number, y0: number, yn: number, d: number): string {
  const r = (v: number) => round(v);
  return [
    `M ${r(x - HALF)} ${r(y0)}`,
    `C ${r(x + 1)} ${r(y0)} ${r(x + 5)} ${r(yn - d * 4)} ${r(x + 5)} ${r(yn)}`,
    `C ${r(x + 5)} ${r(yn + d * 4)} ${r(x + 3)} ${r(yn + d * 6)} ${r(x)} ${r(yn + d * 6)}`,
    `C ${r(x - 3)} ${r(yn + d * 6)} ${r(x - 5)} ${r(yn + d * 4)} ${r(x - 5)} ${r(yn)}`,
    `C ${r(x - 5)} ${r(yn - d * 4)} ${r(x - 1)} ${r(y0)} ${r(x + HALF)} ${r(y0)}`,
  ].join(" ");
}

/** Open hook around a needle, legs not crossed: tuck. */
export function tuckLoop(x: number, y0: number, yn: number, d: number): string {
  const r = (v: number) => round(v);
  return [
    `M ${r(x - HALF)} ${r(y0)}`,
    `C ${r(x - 6)} ${r(y0 + d * 2)} ${r(x - 5)} ${r(yn - d * 3)} ${r(x - 5)} ${r(yn)}`,
    `C ${r(x - 5)} ${r(yn + d * 4)} ${r(x - 3)} ${r(yn + d * 6)} ${r(x)} ${r(yn + d * 6)}`,
    `C ${r(x + 3)} ${r(yn + d * 6)} ${r(x + 5)} ${r(yn + d * 4)} ${r(x + 5)} ${r(yn)}`,
    `C ${r(x + 5)} ${r(yn - d * 3)} ${r(x + 6)} ${r(y0 + d * 2)} ${r(x + HALF)} ${r(y0)}`,
  ].join(" ");
}

/**
 * Yarn-path diagram: one row per feeder, F1 at the bottom and the last feeder
 * at the top, as in standard knitting notation (courses build upward like the
 * fabric). Needles are dots. Cylinder needles sit below the yarn line and
 * dial needles above it: half a pitch over in rib gating, directly opposite
 * in interlock gating.
 */
export function renderDiagram(fabric: Fabric, lang: Lang): string {
  const double = isDouble(fabric);
  const cylW = fabric.setout.cylinder.length;
  const dialW = double ? fabric.setout.dial?.length ?? cylW : cylW;
  const unit = (cylW * dialW) / gcd(cylW, dialW);
  const reps = Math.max(1, Math.min(Math.ceil(12 / unit), Math.floor(32 / unit) || 1));
  const n = unit * reps;

  // Rib gating: dial needles sit between cylinder needles. Interlock gating: directly opposite.
  const dialShift = fabric.machine.gating === "interlock" ? 0 : PITCH / 2;
  const rowH = double ? 58 : 44;
  const top = 18;
  const width = LEFT + n * PITCH + RIGHT;
  const height = top + fabric.cams.length * rowH + 40;
  const body: string[] = [];

  // Repeat shading behind the first repeat.
  body.push(
    tag("rect", { x: LEFT - 4, y: 4, width: unit * PITCH, height: height - 44, fill: "#d9822b", "fill-opacity": 0.06 }),
  );

  fabric.cams.forEach((row, r) => {
    const level = fabric.cams.length - 1 - r; // F1 drawn lowest
    const y0 = top + level * rowH + (double ? rowH / 2 : 12);
    body.push(text(8, y0 + 4, `F${row.feeder}`, { "font-weight": 600, fill: "currentColor" }));
    if (double) {
      const small = { fill: "currentColor", opacity: 0.55, "font-size": 9, "text-anchor": "end" };
      body.push(
        text(LEFT - 6, y0 - 13, t(lang, "bed.dial").charAt(0), small),
        text(LEFT - 6, y0 + 19, t(lang, "bed.cyl").charAt(0), small),
      );
    }
    const feed = fabric.feeds[row.feeder];
    if (feed) {
      body.push(
        text(LEFT + n * PITCH + 8, y0 + 4, feed.plate ? `${feed.yarn}+${feed.plate}` : feed.yarn, { fill: "currentColor", opacity: 0.8 }),
      );
    }

    // Needles in drawing order.
    const needles: { x: number; y: number; d: number; st: Stitch }[] = [];
    for (let i = 0; i < n; i++) {
      const add = (bed: Bed, x: number) => {
        const st = stitchAt(fabric, row, bed, i);
        if (st === null) return; // empty slot
        const d = bed === "cyl" ? 1 : -1;
        needles.push({ x, y: y0 + d * (double ? 16 : 14), d, st });
      };
      add("cyl", LEFT + i * PITCH + PITCH / 2 - 6);
      if (double) add("dial", LEFT + i * PITCH + PITCH / 2 - 6 + dialShift);
    }

    const laysYarn = needles.some((nd) => nd.st !== "M");
    // Needle dots first, so the yarn draws over them.
    for (const nd of needles) {
      const miss = nd.st === "M";
      body.push(
        tag("circle", {
          cx: nd.x,
          cy: nd.y,
          r: 2.6,
          fill: miss ? "none" : "currentColor",
          stroke: "currentColor",
          "stroke-opacity": miss ? 0.5 : 1,
        }),
      );
    }
    if (!laysYarn) {
      body.push(text(LEFT, y0 + 4, t(lang, "label.empty"), { fill: "currentColor", opacity: 0.5, "font-style": "italic" }));
      return;
    }

    // Yarn: straight connectors plus a loop shape for each knit or tuck.
    let cursor = LEFT - 4;
    const straight: string[] = [];
    for (const nd of needles) {
      if (nd.st === "M") continue;
      straight.push(`M ${round(cursor)} ${round(y0)} H ${round(nd.x - HALF)}`);
      const d = nd.st === "K" ? knitLoop(nd.x, y0, nd.y, nd.d) : tuckLoop(nd.x, y0, nd.y, nd.d);
      body.push(
        tag("path", {
          d,
          fill: "none",
          stroke: nd.st === "K" ? STITCH_COLOUR.K : STITCH_COLOUR.T,
          "stroke-width": 1.6,
          "stroke-linecap": "round",
        }),
      );
      cursor = nd.x + HALF;
    }
    straight.push(`M ${round(cursor)} ${round(y0)} H ${round(LEFT + n * PITCH)}`);
    body.push(tag("path", { d: straight.join(" "), fill: "none", stroke: "currentColor", "stroke-width": 1.4 }));
  });

  const lg = legend(lang, LEFT, height - 14);
  body.push(lg.svg);
  return svgRoot(Math.max(width, LEFT + lg.width), height, "knitspec-diagram", body, t(lang, "tab.diagram"));
}
