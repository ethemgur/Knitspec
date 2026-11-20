import { Figures } from "../calc";
import { Fabric, Feed, isDouble, Issue } from "../model";
import { fmt, I18nKey, issueText, Lang, t } from "../i18n";
import { DEFAULT_DISPLAY, DisplayOptions, trackLabel } from "./options";
import { EMPTY } from "../model";

export interface SpecRow {
  label: string;
  value: string;
  /** Inputs or formula behind the figure, shown small. */
  note?: string;
}

export interface SpecSection {
  title: string;
  rows: SpecRow[];
}

export interface SpecCard {
  title: string;
  sections: SpecSection[];
  missing: string[];
  issues: { level: Issue["level"]; text: string }[];
}

/** Group consecutive feeders that share one feed entry: "F1–F4". */
export function feedGroups(fabric: Fabric): { label: string; feed: Feed }[] {
  const out: { label: string; feed: Feed; first: number; last: number }[] = [];
  const keys = Object.keys(fabric.feeds)
    .map(Number)
    .sort((a, b) => a - b);
  for (const k of keys) {
    const feed = fabric.feeds[k];
    const prev = out[out.length - 1];
    if (prev && prev.feed === feed && prev.last === k - 1) prev.last = k;
    else out.push({ label: "", feed, first: k, last: k });
  }
  return out.map((g) => ({ label: g.first === g.last ? `F${g.first}` : `F${g.first}–F${g.last}`, feed: g.feed }));
}

export function feedText(feed: Feed, lang: Lang): string {
  const parts = [feed.yarn];
  if (feed.loop !== undefined) parts.push(t(lang, "label.loop", { loop: fmt(lang, feed.loop, 2) }));
  if (feed.plate) parts.push(t(lang, "label.plate", { yarn: feed.plate }));
  if (feed.draft) parts.push(t(lang, "label.draft", { draft: fmt(lang, feed.draft, 2) }));
  if (feed.runin !== undefined) parts.push(t(lang, "label.runin", { runin: fmt(lang, feed.runin, 0) }));
  return parts.join(", ");
}

export function machineText(fabric: Fabric, lang: Lang): string {
  const m = fabric.machine;
  const parts = [t(lang, `machine.${m.type}` as I18nKey)];
  if (m.gating) parts[0] += ` (${t(lang, `gating.${m.gating}` as I18nKey)})`;
  if (m.diameter) parts.push(`${fmt(lang, m.diameter)}"`);
  if (m.gauge) parts.push(`E${m.gauge}`);
  if (m.feeders) parts.push(`${m.feeders} ${t(lang, "label.feeder").toLowerCase()}`);
  if (m.rpm) parts.push(`${fmt(lang, m.rpm)} rpm`);
  return parts.join(" · ");
}

export function compositionText(figures: Figures, lang: Lang): string {
  return figures.composition.map((c) => `${fmt(lang, c.share * 100, 0)}% ${c.material}`).join(" / ");
}

export function buildSpec(
  fabric: Fabric,
  figures: Figures,
  issues: Issue[],
  lang: Lang,
  display: DisplayOptions = DEFAULT_DISPLAY,
): SpecCard {
  const shown = (bed: "cyl" | "dial", set: string[]) => set.map((l) => (l === EMPTY ? l : trackLabel(bed, l, display))).join(display.trackNames === "numbers" ? " " : "");
  const dash = t(lang, "label.unknownFigure");
  const sections: SpecSection[] = [];

  const head: SpecRow[] = [];
  if (fabric.article) head.push({ label: t(lang, "label.article"), value: fabric.article });
  if (fabric.customer) head.push({ label: t(lang, "label.customer"), value: fabric.customer });
  if (fabric.structure) head.push({ label: t(lang, "label.structure"), value: fabric.structure });
  if (fabric.status) head.push({ label: t(lang, "label.status"), value: fabric.status });
  if (head.length) sections.push({ title: t(lang, "label.article"), rows: head });

  // Machine.
  const mrows: SpecRow[] = [{ label: t(lang, "label.machine"), value: machineText(fabric, lang), note: fabric.machine.ref }];
  const nd = figures.needles;
  if (nd) {
    mrows.push({
      label: t(lang, "label.needles"),
      value: fmt(lang, nd.value, 0),
      note: nd.fromPlate
        ? t(lang, "label.needlesPlate")
        : t(lang, "label.needlesCalc", { d: fabric.machine.diameter ?? "", e: fabric.machine.gauge ?? "" }),
    });
  }
  const sw = fabric.setout.cylinder.length;
  mrows.push({
    label: t(lang, "tab.setout"),
    value:
      `${t(lang, "bed.cyl")} ${shown("cyl", fabric.setout.cylinder)}` +
      (isDouble(fabric) && fabric.setout.dial ? ` · ${t(lang, "bed.dial")} ${shown("dial", fabric.setout.dial)}` : ""),
    note: figures.setoutRepeats ? t(lang, "label.setoutRepeats", { width: sw, repeats: fmt(lang, figures.setoutRepeats, 2) }) : undefined,
  });
  mrows.push({
    label: t(lang, "tab.cams"),
    value: `${fabric.cams.length} ${t(lang, "label.feeder").toLowerCase()}`,
    note: figures.feederRepeats
      ? t(lang, "label.feederRepeats", { height: fabric.cams.length, repeats: fmt(lang, figures.feederRepeats, 2) })
      : undefined,
  });
  sections.push({ title: t(lang, "label.machine"), rows: mrows });

  // Yarns and feeds.
  const yrows: SpecRow[] = Object.values(fabric.yarns).map((y) => ({
    label: y.id,
    value: `${y.countText} ${y.material}`.trim(),
    note: y.tex !== undefined ? `${fmt(lang, y.tex, 2)} tex` : undefined,
  }));
  for (const g of feedGroups(fabric)) yrows.push({ label: g.label, value: feedText(g.feed, lang) });
  if (yrows.length) sections.push({ title: t(lang, "label.yarns"), rows: yrows });

  // Figures.
  const frows: SpecRow[] = [];
  const p = figures.production;
  frows.push({
    label: t(lang, "label.production"),
    value: p ? `${fmt(lang, p.kgPerHour, 1)} kg/h` : dash,
    note: p
      ? t(lang, "label.productionInputs", {
          rpm: fmt(lang, p.rpm),
          feeders: p.feeders,
          g: fmt(lang, p.gramsPerRev / p.feeders, 3),
          eff: fmt(lang, p.efficiency, 2),
        })
      : undefined,
  });
  frows.push({ label: t(lang, "label.composition"), value: figures.composition.length ? compositionText(figures, lang) : dash });
  for (const state of ["grey", "finished"] as const) {
    const entered = fabric[state].gsm;
    const calc = figures.gsm[state];
    if (entered === undefined && calc === undefined && state === "finished") continue;
    const values: string[] = [];
    if (entered !== undefined) values.push(`${fmt(lang, entered, 0)} (${t(lang, "label.entered")})`);
    if (calc !== undefined) values.push(`${fmt(lang, calc, 0)} (${t(lang, "label.calculated")})`);
    frows.push({ label: `${t(lang, "label.gsm")} — ${t(lang, `label.${state}`)}`, value: values.join(" · ") || dash });
  }
  for (const state of ["grey", "finished"] as const) {
    const entered = fabric[state].width;
    const calc = figures.width[state];
    if (entered === undefined && calc === undefined) continue;
    const values: string[] = [];
    if (entered !== undefined) values.push(`${fmt(lang, entered, 0)} cm (${t(lang, "label.entered")})`);
    if (calc)
      values.push(
        `${t(lang, "label.open")} ${fmt(lang, calc.open, 0)} cm · ${t(lang, "label.tube")} ${fmt(lang, calc.tube, 0)} cm (${t(lang, "label.calculated")})`,
      );
    frows.push({ label: `${t(lang, "label.width")} — ${t(lang, `label.${state}`)}`, value: values.join(" · ") });
  }
  if (figures.tightness.length) {
    frows.push({
      label: t(lang, "label.tightness"),
      value: figures.tightness.map((x) => `${x.yarn} @ ${fmt(lang, x.loop, 2)} mm: ${fmt(lang, x.tf, 2)}`).join(" · "),
      note: "√tex ÷ L(mm)",
    });
  }
  if (figures.machineHours !== undefined && fabric.orderKg) {
    frows.push({ label: t(lang, "label.machineHours", { kg: fmt(lang, fabric.orderKg, 0) }), value: `${fmt(lang, figures.machineHours, 1)} h` });
  }
  sections.push({ title: t(lang, "label.production"), rows: frows });

  if (fabric.notes) sections.push({ title: t(lang, "label.notes"), rows: [{ label: "", value: fabric.notes }] });

  return {
    title: [fabric.article, fabric.structure].filter(Boolean).join(" — "),
    sections,
    missing: figures.missing.map((k) => t(lang, `missing.${k}` as I18nKey)),
    issues: [...issues]
      .sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1))
      .map((i) => ({ level: i.level, text: issueText(lang, i, display) })),
  };
}
