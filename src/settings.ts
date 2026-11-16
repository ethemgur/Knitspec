import { App, PluginSettingTab, Setting } from "obsidian";
import { CalcOptions, DEFAULT_CALC } from "./calc";
import { CsvSeparator } from "./export";
import { Lang } from "./i18n";
import { Template } from "./templates";
import { DEFAULT_VALIDATION, ValidationOptions } from "./validate";
import type KnitspecPlugin from "./main";

export type TabId = "cams" | "diagram" | "spec";

export interface KnitspecSettings {
  language: Lang;
  defaultTab: TabId;
  calc: CalcOptions;
  validation: ValidationOptions;
  csvSeparator: CsvSeparator;
  /** Folder for exported SVG/PNG/CSV; empty = next to the note. */
  exportFolder: string;
  userTemplates: Template[];
}

export const DEFAULT_SETTINGS: KnitspecSettings = {
  language: "tr",
  defaultTab: "cams",
  calc: { ...DEFAULT_CALC },
  validation: structuredClone(DEFAULT_VALIDATION),
  csvSeparator: ";",
  exportFolder: "",
  userTemplates: [],
};

export function mergeSettings(saved: Partial<KnitspecSettings> | null): KnitspecSettings {
  const s = saved ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    calc: { ...DEFAULT_SETTINGS.calc, ...(s.calc ?? {}) },
    validation: {
      ...DEFAULT_SETTINGS.validation,
      ...(s.validation ?? {}),
      loopMm: { ...DEFAULT_VALIDATION.loopMm, ...(s.validation?.loopMm ?? {}) },
      gauge: { ...DEFAULT_VALIDATION.gauge, ...(s.validation?.gauge ?? {}) },
      rpm: { ...DEFAULT_VALIDATION.rpm, ...(s.validation?.rpm ?? {}) },
      diameter: { ...DEFAULT_VALIDATION.diameter, ...(s.validation?.diameter ?? {}) },
    },
    userTemplates: s.userTemplates ?? [],
    // The separate set-out tab was merged into the cam chart in 0.2.0.
    defaultTab: (["cams", "diagram", "spec"] as string[]).includes(s.defaultTab ?? "") ? s.defaultTab! : "cams",
  };
}

export class KnitspecSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: KnitspecPlugin) {
    super(app, plugin);
  }

  private num(
    container: HTMLElement,
    name: string,
    desc: string,
    get: () => number,
    set: (v: number) => void,
  ): void {
    new Setting(container)
      .setName(name)
      .setDesc(desc)
      .addText((text) =>
        text.setValue(String(get())).onChange(async (v) => {
          const n = parseFloat(v.replace(",", "."));
          if (!Number.isFinite(n)) return;
          set(n);
          await this.plugin.saveSettings();
        }),
      );
  }

  display(): void {
    const { containerEl } = this;
    const s = this.plugin.settings;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Language / Dil")
      .setDesc("Labels on the card, PDF sheet and exports.")
      .addDropdown((d) =>
        d
          .addOption("tr", "Türkçe")
          .addOption("en", "English")
          .setValue(s.language)
          .onChange(async (v) => {
            s.language = v as Lang;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl).setName("Default tab").addDropdown((d) =>
      d
        .addOption("cams", "Cam chart and set-out")
        .addOption("diagram", "Knitting diagram")
        .addOption("spec", "Spec card")
        .setValue(s.defaultTab)
        .onChange(async (v) => {
          s.defaultTab = v as TabId;
          await this.plugin.saveSettings();
        }),
    );

    new Setting(containerEl).setName("Calculations").setHeading();
    this.num(containerEl, "Tuck length ratio", "Yarn taken by a tuck as a share of the loop length, when the feed gives no `tuck`.", () => s.calc.tuckRatio, (v) => (s.calc.tuckRatio = v));
    this.num(containerEl, "Miss (float) length ratio", "Yarn per missed needle as a share of the loop length, when the feed gives no `miss`.", () => s.calc.missRatio, (v) => (s.calc.missRatio = v));
    this.num(containerEl, "Default efficiency", "Used when the machine block has no `efficiency` (0–1).", () => s.calc.defaultEfficiency, (v) => (s.calc.defaultEfficiency = v));

    new Setting(containerEl).setName("Validation limits").setHeading();
    this.num(containerEl, "Max tucks before knitting", "Warn when a needle holds more tucks than this.", () => s.validation.maxTucks, (v) => (s.validation.maxTucks = v));
    this.num(containerEl, "Max float (needles)", "Warn when a feeder misses more consecutive needles than this.", () => s.validation.maxFloat, (v) => (s.validation.maxFloat = v));
    this.num(containerEl, "Loop length min (mm)", "", () => s.validation.loopMm.min, (v) => (s.validation.loopMm.min = v));
    this.num(containerEl, "Loop length max (mm)", "", () => s.validation.loopMm.max, (v) => (s.validation.loopMm.max = v));
    this.num(containerEl, "Gauge min (E)", "", () => s.validation.gauge.min, (v) => (s.validation.gauge.min = v));
    this.num(containerEl, "Gauge max (E)", "", () => s.validation.gauge.max, (v) => (s.validation.gauge.max = v));
    this.num(containerEl, "RPM min", "", () => s.validation.rpm.min, (v) => (s.validation.rpm.min = v));
    this.num(containerEl, "RPM max", "", () => s.validation.rpm.max, (v) => (s.validation.rpm.max = v));
    this.num(containerEl, "GSM tolerance", "Warn when entered and calculated grey GSM differ by more than this share (0.15 = 15%).", () => s.validation.gsmTolerance, (v) => (s.validation.gsmTolerance = v));

    new Setting(containerEl).setName("Export").setHeading();
    new Setting(containerEl)
      .setName("CSV separator")
      .setDesc("Semicolon with decimal comma suits Excel set to Turkish.")
      .addDropdown((d) =>
        d
          .addOption(";", "; (decimal comma)")
          .addOption(",", ", (decimal point)")
          .setValue(s.csvSeparator)
          .onChange(async (v) => {
            s.csvSeparator = v as CsvSeparator;
            await this.plugin.saveSettings();
          }),
      );
    new Setting(containerEl)
      .setName("Export folder")
      .setDesc("Where SVG, PNG and CSV files go. Empty = next to the note.")
      .addText((t) =>
        t.setValue(s.exportFolder).onChange(async (v) => {
          s.exportFolder = v.trim().replace(/\/+$/, "");
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl).setName("Your templates").setHeading();
    if (s.userTemplates.length === 0) {
      containerEl.createEl("p", { text: "None yet. Use the command “Save this note's fabric as a template”.", cls: "setting-item-description" });
    }
    for (const tpl of s.userTemplates) {
      new Setting(containerEl).setName(tpl.name).addExtraButton((b) =>
        b
          .setIcon("trash")
          .setTooltip("Delete")
          .onClick(async () => {
            s.userTemplates = s.userTemplates.filter((x) => x !== tpl);
            await this.plugin.saveSettings();
            this.display();
          }),
      );
    }
  }
}
