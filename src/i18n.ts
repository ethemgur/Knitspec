import { Issue } from "./model";
import { DEFAULT_DISPLAY, DisplayOptions, trackLabel } from "./render/options";

export type Lang = "en" | "tr";

const en = {
  // tabs
  "tab.diagram": "Knitting diagram",
  "tab.cams": "Cam chart",
  "tab.setout": "Needle set-out",
  "tab.spec": "Spec card",
  // stitches
  "stitch.K": "Knit",
  "stitch.T": "Tuck",
  "stitch.M": "Miss",
  // beds
  "bed.cyl": "Cylinder",
  "bed.dial": "Dial",
  // machine
  "machine.single-jersey": "Single jersey",
  "machine.double-jersey": "Double jersey",
  "gating.rib": "rib gating",
  "gating.interlock": "interlock gating",
  // labels
  "label.article": "Article",
  "label.customer": "Customer",
  "label.status": "Status",
  "label.structure": "Structure",
  "label.machine": "Machine",
  "label.needles": "Needles per bed",
  "label.needlesPlate": "from machine plate",
  "label.needlesCalc": "π × {d} × {e}",
  "label.feeder": "Feeder",
  "label.track": "Track",
  "label.repeat": "Repeat",
  "label.repeats": "repeats",
  "label.yarn": "Yarn",
  "label.loopMm": "Loop (mm)",
  "label.setoutRepeats": "{width} needles × {repeats} repeats",
  "label.feederRepeats": "{height} feeders × {repeats} repeats",
  "label.yarns": "Yarns",
  "label.feeds": "Feeds",
  "label.loop": "loop {loop} mm",
  "label.plate": "plated with {yarn}",
  "label.draft": "draft {draft}",
  "label.runin": "run-in {runin} mm/100 needles",
  "label.composition": "Composition",
  "label.production": "Production",
  "label.productionInputs": "{rpm} rpm × {feeders} feeders × {g} g/rev × 60 × η {eff}",
  "label.gsm": "GSM",
  "label.width": "Width",
  "label.open": "open",
  "label.tube": "tube",
  "label.grey": "Grey",
  "label.finished": "Finished",
  "label.entered": "entered",
  "label.calculated": "calculated",
  "label.tightness": "Tightness factor",
  "label.machineHours": "Machine-hours for {kg} kg",
  "label.warnings": "Checks",
  "label.noIssues": "All checks passed.",
  "label.notes": "Notes",
  "label.legend": "Legend",
  "label.emptyNeedle": "no needle",
  "label.empty": "Empty feeder",
  "label.estimate": "Estimates — check against the machine.",
  "label.unknownFigure": "—",
  "button.svg": "Save SVG",
  "button.png": "Save PNG",
  "button.csv": "Save CSV",
  // missing inputs
  "missing.needles": "needle count (diameter and gauge, or needles)",
  "missing.feeders": "machine feeders",
  "missing.feeds": "a feed (yarn) for every knitting feeder",
  "missing.loop": "loop length",
  "missing.count": "yarn counts",
  "missing.rpm": "rpm",
  "missing.cpcwpc": "grey courses and wales per cm (cpc, wpc)",
  "missing.prefix": "Needs: ",
  // issues
  "issue.error": "Error",
  "issue.warning": "Warning",
  "issue.notAMap": "The block is not a YAML map. Start with `article:` or `machine:`.",
  "issue.yaml": "YAML error: {message}",
  "issue.machineMissing": "`machine` is missing.",
  "issue.machineType": "Unknown machine type “{value}”. Use single-jersey or double-jersey.",
  "issue.machineRefNotFound": "Machine note {ref} was not found or has no properties.",
  "issue.setoutMissing": "`setout` is missing or not readable. Example: `setout: { cylinder: AB }`.",
  "issue.dialMissing": "Double jersey needs a dial line in the set-out.",
  "issue.dialOnSingle": "Single jersey has no dial; the dial set-out is ignored.",
  "issue.camsMissing": "`cams` is missing. Example: `F1: KT`.",
  "issue.camLetter": "{feeder}: “{value}” is not a cam letter. Use K, T or M.",
  "issue.camLength": "{feeder}: {got} cam letters for {want} tracks ({tracks}).",
  "issue.camDialMissing": "{feeder}: double jersey needs `cyl` and `dial` cams.",
  "issue.camDialOnSingle": "{feeder}: dial cams on a single-jersey machine are ignored.",
  "issue.feederKey": "“{value}” is not a feeder. Use F1, F1-F4 or F1,F3.",
  "issue.feederTwice": "{feeder} is set twice; the last one wins.",
  "issue.feederGap": "{feeder} has no cams; it is drawn as an empty feeder.",
  "issue.badCount": "Yarn {yarn}: count “{value}” not understood. Use dtex, den, tex, Ne or Nm.",
  "issue.unknownYarn": "{feeder}: yarn {yarn} is not in `yarns`.",
  "issue.trackOutOfRange": "Track {track} is beyond the machine's {tracks} tracks.",
  "issue.neverKnits": "{bed} track {track} never knits: the needle holds its loops and the fabric fails.",
  "issue.tuckBuildup": "{bed} track {track} holds {count} tucks before knitting (limit {max}).",
  "issue.feederRepeat": "The {height}-feeder repeat does not divide {feeders} feeders: the pattern breaks where the round closes.",
  "issue.setoutRepeat":
    "{bed}: {needles} needles is not a multiple of the {width}-needle set-out (nearest {nearest}). Enter the real needle count from the machine plate.",
  "issue.setoutRepeatPlate": "{bed}: {needles} needles leaves a partial repeat of the {width}-needle set-out.",
  "issue.longFloat": "{feeder}: float over {count} needles (limit {max}) can snag.",
  "issue.noFeed": "{feeder} knits but has no feed (yarn and loop length).",
  "issue.gaugeMismatch": "Cylinder gauge E{cyl} and dial gauge E{dial} must match.",
  "issue.range": "{field} {value}{unit} is outside {min}–{max}{unit}. Check the unit.",
  "issue.gsmDeviation": "Entered grey GSM {entered} differs from the calculated {calc} by {pct}%.",
  "issue.emptySetout": "{bed} set-out has no needles.",
  "issue.needleClash":
    "{feeder}: in interlock gating, cylinder and dial needle {needle} face each other and cannot both knit or tuck. Use opposite tracks on the dial (e.g. cylinder AB, dial BA).",
  "field.gauge": "Gauge",
  "field.rpm": "RPM",
  "field.diameter": "Diameter",
  "field.efficiency": "Efficiency",
  "field.loop": "Loop length",
};

type Key = keyof typeof en;

const tr: Record<Key, string> = {
  "tab.diagram": "Örgü diyagramı",
  "tab.cams": "Kam tablosu",
  "tab.setout": "İğne dizilimi",
  "tab.spec": "Teknik föy",
  "stitch.K": "İlmek",
  "stitch.T": "Askı",
  "stitch.M": "Atlama",
  "bed.cyl": "Silindir",
  "bed.dial": "Kapak",
  "machine.single-jersey": "Tek plaka (süprem)",
  "machine.double-jersey": "Çift plaka",
  "gating.rib": "ribana dizilişi",
  "gating.interlock": "interlok dizilişi",
  "label.article": "Artikel",
  "label.customer": "Müşteri",
  "label.status": "Durum",
  "label.structure": "Örgü",
  "label.machine": "Makine",
  "label.needles": "Yatak başına iğne",
  "label.needlesPlate": "makine etiketinden",
  "label.needlesCalc": "π × {d} × {e}",
  "label.feeder": "Besleyici",
  "label.track": "Ray",
  "label.repeat": "Rapor",
  "label.repeats": "rapor",
  "label.yarn": "İplik",
  "label.loopMm": "İlmek (mm)",
  "label.setoutRepeats": "{width} iğne × {repeats} rapor",
  "label.feederRepeats": "{height} besleyici × {repeats} rapor",
  "label.yarns": "İplikler",
  "label.feeds": "Beslemeler",
  "label.loop": "ilmek boyu {loop} mm",
  "label.plate": "{yarn} ile plaitli",
  "label.draft": "çekim {draft}",
  "label.runin": "iplik sarfı {runin} mm/100 iğne",
  "label.composition": "Karışım",
  "label.production": "Üretim",
  "label.productionInputs": "{rpm} devir × {feeders} besleyici × {g} g/devir × 60 × η {eff}",
  "label.gsm": "Gramaj (g/m²)",
  "label.width": "En",
  "label.open": "açık en",
  "label.tube": "tüp",
  "label.grey": "Ham",
  "label.finished": "Mamul",
  "label.entered": "girilen",
  "label.calculated": "hesaplanan",
  "label.tightness": "Sıklık faktörü",
  "label.machineHours": "{kg} kg için makine-saat",
  "label.warnings": "Kontroller",
  "label.noIssues": "Tüm kontroller geçti.",
  "label.notes": "Notlar",
  "label.legend": "Açıklama",
  "label.emptyNeedle": "iğne yok",
  "label.empty": "Boş besleyici",
  "label.estimate": "Tahmini değerler — makinede kontrol edin.",
  "label.unknownFigure": "—",
  "button.svg": "SVG kaydet",
  "button.png": "PNG kaydet",
  "button.csv": "CSV kaydet",
  "missing.needles": "iğne sayısı (çap ve incelik ya da needles)",
  "missing.feeders": "makine besleyici sayısı",
  "missing.feeds": "örgü yapan her besleyici için besleme (iplik)",
  "missing.loop": "ilmek boyu",
  "missing.count": "iplik numaraları",
  "missing.rpm": "devir",
  "missing.cpcwpc": "ham sıra ve çubuk sayısı / cm (cpc, wpc)",
  "missing.prefix": "Gerekli: ",
  "issue.error": "Hata",
  "issue.warning": "Uyarı",
  "issue.notAMap": "Blok bir YAML haritası değil. `article:` ya da `machine:` ile başlayın.",
  "issue.yaml": "YAML hatası: {message}",
  "issue.machineMissing": "`machine` eksik.",
  "issue.machineType": "Bilinmeyen makine tipi “{value}”. single-jersey ya da double-jersey yazın.",
  "issue.machineRefNotFound": "{ref} makine notu bulunamadı ya da özelliği yok.",
  "issue.setoutMissing": "`setout` eksik ya da okunamıyor. Örnek: `setout: { cylinder: AB }`.",
  "issue.dialMissing": "Çift plaka için iğne diziliminde kapak satırı gerekli.",
  "issue.dialOnSingle": "Tek plakada kapak yok; kapak dizilimi yok sayıldı.",
  "issue.camsMissing": "`cams` eksik. Örnek: `F1: KT`.",
  "issue.camLetter": "{feeder}: “{value}” bir kam harfi değil. K, T ya da M kullanın.",
  "issue.camLength": "{feeder}: {want} ray ({tracks}) için {got} kam harfi var.",
  "issue.camDialMissing": "{feeder}: çift plakada `cyl` ve `dial` kamları gerekli.",
  "issue.camDialOnSingle": "{feeder}: tek plakada kapak kamları yok sayıldı.",
  "issue.feederKey": "“{value}” bir besleyici değil. F1, F1-F4 ya da F1,F3 yazın.",
  "issue.feederTwice": "{feeder} iki kez tanımlı; sonuncusu geçerli.",
  "issue.feederGap": "{feeder} için kam yok; boş besleyici olarak çizildi.",
  "issue.badCount": "{yarn} ipliği: “{value}” numarası okunamadı. dtex, den, tex, Ne ya da Nm kullanın.",
  "issue.unknownYarn": "{feeder}: {yarn} ipliği `yarns` içinde yok.",
  "issue.trackOutOfRange": "{track} rayı makinenin {tracks} rayının dışında.",
  "issue.neverKnits": "{bed} {track} rayı hiç ilmek yapmıyor: iğne ilmeklerini tutar ve kumaş bozulur.",
  "issue.tuckBuildup": "{bed} {track} rayı ilmek yapmadan önce {count} askı tutuyor (sınır {max}).",
  "issue.feederRepeat": "{height} besleyicilik rapor {feeders} besleyiciye bölünmüyor: desen tur kapanışında bozulur.",
  "issue.setoutRepeat":
    "{bed}: {needles} iğne, {width} iğnelik dizilimin katı değil (en yakın {nearest}). Makine etiketindeki gerçek iğne sayısını girin.",
  "issue.setoutRepeatPlate": "{bed}: {needles} iğne, {width} iğnelik dizilimde yarım rapor bırakıyor.",
  "issue.longFloat": "{feeder}: {count} iğne üzerinde atlama (sınır {max}) takılabilir.",
  "issue.noFeed": "{feeder} örgü yapıyor ama beslemesi (iplik ve ilmek boyu) yok.",
  "issue.gaugeMismatch": "Silindir inceliği E{cyl} ile kapak inceliği E{dial} aynı olmalı.",
  "issue.range": "{field} {value}{unit}, {min}–{max}{unit} aralığının dışında. Birimi kontrol edin.",
  "issue.gsmDeviation": "Girilen ham gramaj {entered}, hesaplanan {calc} değerinden %{pct} farklı.",
  "issue.emptySetout": "{bed} diziliminde iğne yok.",
  "issue.needleClash":
    "{feeder}: interlok dizilişinde {needle}. silindir ve kapak iğneleri karşı karşıya; ikisi birden ilmek ya da askı yapamaz. Kapakta ters ray kullanın (ör. silindir AB, kapak BA).",
  "field.gauge": "İncelik",
  "field.rpm": "Devir",
  "field.diameter": "Çap",
  "field.efficiency": "Verim",
  "field.loop": "İlmek boyu",
};

const dicts: Record<Lang, Record<Key, string>> = { en, tr };

export type I18nKey = Key;

export function t(lang: Lang, key: Key, params: Record<string, string | number> = {}): string {
  const text = dicts[lang][key] ?? en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, p: string) => (p in params ? String(params[p]) : `{${p}}`));
}

/** Number formatting per language (Turkish uses a decimal comma). */
export function fmt(lang: Lang, n: number, digits = 1): string {
  return n.toLocaleString(lang === "tr" ? "tr-TR" : "en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function issueText(lang: Lang, issue: Issue, display: DisplayOptions = DEFAULT_DISPLAY): string {
  const params: Record<string, string | number> = { ...(issue.params ?? {}) };
  if (typeof params.track === "string") {
    params.track = trackLabel(issue.params?.bed === "dial" ? "dial" : "cyl", params.track, display);
  }
  if (typeof params.bed === "string") params.bed = t(lang, `bed.${params.bed}` as Key);
  if (typeof params.field === "string") params.field = t(lang, `field.${params.field}` as Key);
  for (const k of Object.keys(params)) {
    const v = params[k];
    if (typeof v === "number" && !Number.isInteger(v)) params[k] = fmt(lang, v, 2);
  }
  let code = issue.code;
  if (code === "setoutRepeat" && issue.params?.fromPlate) code = "setoutRepeatPlate";
  return t(lang, `issue.${code}` as Key, params);
}
