import { Figures } from "./calc";
import { Fabric, isDouble } from "./model";
import { Lang, t } from "./i18n";
import { compositionText } from "./render/spec";
import { DEFAULT_DISPLAY, DisplayOptions, trackLabel } from "./render/options";

export type CsvSeparator = "," | ";";

function cell(v: string | number | undefined, sep: CsvSeparator): string {
  if (v === undefined) return "";
  let s: string;
  if (typeof v === "number") {
    s = String(Math.round(v * 1000) / 1000);
    if (sep === ";") s = s.replace(".", ",");
  } else s = v;
  const special = sep === ";" ? /[";\n]/ : /[",\n]/;
  return special.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Cam chart and figures as CSV for Excel and the production tracker.
 * Use ";" for Excel with a Turkish locale (decimal comma), "," otherwise.
 */
export function toCsv(
  fabric: Fabric,
  figures: Figures,
  lang: Lang,
  sep: CsvSeparator = ";",
  display: DisplayOptions = DEFAULT_DISPLAY,
): string {
  const lines: string[] = [];
  const row = (...cells: (string | number | undefined)[]) => lines.push(cells.map((c) => cell(c, sep)).join(sep));

  const double = isDouble(fabric);
  row(
    t(lang, "label.feeder"),
    ...(double ? fabric.tracks.dial.map((x) => `${t(lang, "bed.dial")} ${trackLabel("dial", x, display)}`) : []),
    ...fabric.tracks.cyl.map((x) => `${t(lang, "bed.cyl")} ${trackLabel("cyl", x, display)}`),
    "yarn",
    "plate",
    "loop_mm",
  );
  for (const r of fabric.cams) {
    const f = fabric.feeds[r.feeder];
    row(`F${r.feeder}`, ...(double ? r.dial ?? [] : []), ...r.cyl, f?.yarn, f?.plate, f?.loop);
  }
  lines.push("");

  row("key", "value", "unit");
  row("article", fabric.article);
  row("customer", fabric.customer);
  row("structure", fabric.structure);
  row("machine_type", fabric.machine.type);
  row("diameter", fabric.machine.diameter, "inch");
  row("gauge", fabric.machine.gauge, "E");
  row("feeders", fabric.machine.feeders);
  row("rpm", fabric.machine.rpm);
  row("needles", figures.needles?.value);
  row("setout_cylinder", fabric.setout.cylinder.join(""));
  if (double) row("setout_dial", fabric.setout.dial?.join(""));
  row("production", figures.production?.kgPerHour, "kg/h");
  row("composition", compositionText(figures, "en"));
  row("gsm_grey_entered", fabric.grey.gsm, "g/m2");
  row("gsm_grey_calc", figures.gsm.grey, "g/m2");
  row("gsm_finished_entered", fabric.finished.gsm, "g/m2");
  row("width_grey_entered", fabric.grey.width, "cm");
  row("width_grey_open_calc", figures.width.grey?.open, "cm");
  row("width_finished_entered", fabric.finished.width, "cm");
  row("order", fabric.orderKg, "kg");
  row("machine_hours", figures.machineHours, "h");
  return lines.join("\n") + "\n";
}
