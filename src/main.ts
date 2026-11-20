import {
  App,
  debounce,
  Editor,
  MarkdownPostProcessorContext,
  MarkdownView,
  Modal,
  normalizePath,
  Notice,
  Plugin,
  Setting,
  SuggestModal,
  TFile,
} from "obsidian";
import { toCsv } from "./export";
import { I18nKey, issueText, Lang, t } from "./i18n";
import { findKnitBlock, PipelineResult, runPipeline } from "./pipeline";
import { renderCamChart } from "./render/camChart";
import { renderDiagram } from "./render/diagram";
import { buildSpec, compositionText } from "./render/spec";
import { standalone } from "./render/svg";
import { DEFAULT_SETTINGS, KnitspecSettings, KnitspecSettingTab, mergeSettings, TabId } from "./settings";
import { BUILTIN_TEMPLATES, Template, templateBlock } from "./templates";

const TABS: TabId[] = ["cams", "diagram", "spec"];

function linkTarget(s: string): string | undefined {
  const m = s.match(/^\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]$/);
  return m ? m[1].trim() : undefined;
}

export default class KnitspecPlugin extends Plugin {
  settings: KnitspecSettings = DEFAULT_SETTINGS;

  private refresh = debounce(() => this.rerenderViews(), 400, true);

  async onload(): Promise<void> {
    this.settings = mergeSettings(await this.loadData());
    this.addSettingTab(new KnitspecSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor("knit", (source, el, ctx) => this.renderBlock(source, el, ctx));

    this.addCommand({
      id: "insert-template",
      name: "New fabric from template",
      editorCallback: (editor) => new TemplateModal(this.app, this.allTemplates(), (tpl) => this.insertTemplate(editor, tpl)).open(),
    });
    this.addCommand({
      id: "sync-properties",
      name: "Copy fabric values to note properties",
      checkCallback: (checking) => this.withActiveFabric(checking, (file, res) => this.syncProperties(file, res)),
    });
    this.addCommand({
      id: "export-csv",
      name: "Export cam chart and figures as CSV",
      checkCallback: (checking) =>
        this.withActiveFabric(checking, async (file, res) => {
          if (!res.fabric || !res.figures) return;
          const csv = toCsv(res.fabric, res.figures, this.settings.language, this.settings.csvSeparator);
          await this.saveFile(file, `${this.baseName(file, res)}.csv`, csv);
        }),
    });
    this.addCommand({
      id: "save-as-template",
      name: "Save this note's fabric as a template",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const body = view ? findKnitBlock(view.editor.getValue()) : undefined;
        if (checking) return body !== undefined;
        if (!body || !view?.file) return false;
        new NameModal(this.app, view.file.basename, async (name) => {
          this.settings.userTemplates = this.settings.userTemplates.filter((x) => x.name !== name);
          this.settings.userTemplates.push({ id: `user-${Date.now()}`, name, body });
          await this.saveData(this.settings);
          new Notice(`Template “${name}” saved.`);
        }).open();
        return true;
      },
    });
    this.addCommand({
      id: "toggle-language",
      name: "Switch labels Turkish / English",
      callback: async () => {
        this.settings.language = this.settings.language === "tr" ? "en" : "tr";
        await this.saveSettings();
      },
    });
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refresh();
  }

  private rerenderViews(): void {
    this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof MarkdownView) view.previewMode.rerender(true);
    });
    this.app.workspace.updateOptions();
  }

  private allTemplates(): Template[] {
    return [...BUILTIN_TEMPLATES, ...this.settings.userTemplates];
  }

  private insertTemplate(editor: Editor, tpl: Template): void {
    const cursor = editor.getCursor();
    const prefix = cursor.ch === 0 ? "" : "\n";
    editor.replaceRange(prefix + templateBlock(tpl.body), cursor);
  }

  /** Parse and compute a block, resolving machine links against the note. */
  run(source: string, sourcePath: string): PipelineResult {
    return runPipeline(source, {
      calc: this.settings.calc,
      validation: this.settings.validation,
      resolveMachine: (ref) => {
        const target = linkTarget(ref);
        if (!target) return undefined;
        const file = this.app.metadataCache.getFirstLinkpathDest(target, sourcePath);
        return file ? this.app.metadataCache.getFileCache(file)?.frontmatter : undefined;
      },
    });
  }

  private withActiveFabric(checking: boolean, action: (file: TFile, res: PipelineResult) => unknown): boolean {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const file = view?.file;
    const body = view ? findKnitBlock(view.editor.getValue()) : undefined;
    if (checking) return !!file && body !== undefined;
    if (!file || body === undefined) return false;
    const res = this.run(body, file.path);
    if (!res.fabric) {
      new Notice("Knitspec: the knit block has errors; open the card to see them.");
      return true;
    }
    void action(file, res);
    return true;
  }

  private async syncProperties(file: TFile, res: PipelineResult): Promise<void> {
    const f = res.fabric!;
    const fig = res.figures!;
    const round = (n: number | undefined, d = 0) => (n === undefined ? undefined : Math.round(n * 10 ** d) / 10 ** d);
    const values: Record<string, unknown> = {
      article: f.article,
      customer: f.customer,
      machine: f.machine.ref,
      machine_type: f.machine.type,
      gauge: f.machine.gauge,
      diameter: f.machine.diameter,
      structure: f.structure,
      gsm_grey: f.grey.gsm ?? round(fig.gsm.grey),
      gsm_finished: f.finished.gsm,
      width_grey: f.grey.width,
      width_finished: f.finished.width,
      composition: fig.composition.length ? compositionText(fig, "en") : undefined,
      kg_per_hour: round(fig.production?.kgPerHour, 1),
      status: f.status,
    };
    await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(values)) if (v !== undefined && v !== "") fm[k] = v;
    });
    new Notice("Knitspec: properties updated.");
  }

  private baseName(file: TFile, res: PipelineResult): string {
    return (res.fabric?.article || file.basename).replace(/[\\/:*?"<>|#^[\]]/g, "-");
  }

  private async saveFile(note: TFile, name: string, data: string | ArrayBuffer): Promise<void> {
    const folder = this.settings.exportFolder || note.parent?.path || "";
    if (folder && !this.app.vault.getAbstractFileByPath(folder)) await this.app.vault.createFolder(folder);
    const path = normalizePath(folder ? `${folder}/${name}` : name);
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      if (typeof data === "string") await this.app.vault.modify(existing, data);
      else await this.app.vault.modifyBinary(existing, data);
    } else if (typeof data === "string") await this.app.vault.create(path, data);
    else await this.app.vault.createBinary(path, data);
    new Notice(`Knitspec: saved ${path}`);
  }

  // ---------- rendering ----------

  private renderBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
    const lang = this.settings.language;
    const res = this.run(source, ctx.sourcePath);
    const card = el.createDiv({ cls: "knitspec-card" });

    if (!res.fabric || !res.figures) {
      card.addClass("knitspec-failed");
      card.createDiv({ cls: "knitspec-title", text: "Knitspec" });
      this.renderIssues(card, res, lang);
      return;
    }
    const fabric = res.fabric;
    const figures = res.figures;
    const spec = buildSpec(fabric, figures, res.issues, lang);

    const header = card.createDiv({ cls: "knitspec-header" });
    header.createSpan({ cls: "knitspec-title", text: spec.title || "Knitspec" });
    if (fabric.status) header.createSpan({ cls: "knitspec-badge", text: fabric.status });
    const errors = res.issues.filter((i) => i.level === "error").length;
    const warnings = res.issues.length - errors;
    if (errors) header.createSpan({ cls: "knitspec-badge knitspec-badge-error", text: `${errors} ${t(lang, "issue.error")}` });
    if (warnings) header.createSpan({ cls: "knitspec-badge knitspec-badge-warning", text: `${warnings} ${t(lang, "issue.warning")}` });

    const tabBar = card.createDiv({ cls: "knitspec-tabs" });
    const panes = card.createDiv({ cls: "knitspec-panes" });
    const svgs: Partial<Record<TabId, string>> = {
      diagram: renderDiagram(fabric, lang),
      cams: renderCamChart(fabric, lang, figures.needles?.value, this.settings.display),
    };

    const paneEls = {} as Record<TabId, HTMLElement>;
    const buttons = {} as Record<TabId, HTMLElement>;
    let active: TabId = this.settings.defaultTab;
    const svgButtons: HTMLElement[] = [];
    const show = (id: TabId) => {
      active = id;
      for (const tab of TABS) {
        paneEls[tab].toggleClass("is-active", tab === id);
        buttons[tab].toggleClass("is-active", tab === id);
      }
      svgButtons.forEach((b) => b.toggleClass("is-hidden", !svgs[id]));
    };

    for (const tab of TABS) {
      buttons[tab] = tabBar.createEl("button", { cls: "knitspec-tab", text: t(lang, `tab.${tab}` as I18nKey) });
      buttons[tab].addEventListener("click", () => show(tab));
      const pane = panes.createDiv({ cls: `knitspec-pane knitspec-pane-${tab}` });
      pane.createDiv({ cls: "knitspec-print-title", text: t(lang, `tab.${tab}` as I18nKey) });
      paneEls[tab] = pane;
      const svg = svgs[tab];
      if (svg) {
        const holder = pane.createDiv({ cls: "knitspec-svg-holder" });
        const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
        holder.appendChild(document.importNode(doc.documentElement, true));
      }
    }
    this.renderSpec(paneEls.spec, spec, ctx.sourcePath);

    // Toolbar.
    const toolbar = tabBar.createDiv({ cls: "knitspec-toolbar" });
    const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
    const note = file instanceof TFile ? file : undefined;
    if (note) {
      const base = this.baseName(note, res);
      const svgBtn = toolbar.createEl("button", { cls: "knitspec-tool", text: t(lang, "button.svg") });
      svgBtn.addEventListener("click", () => {
        const svg = svgs[active];
        if (svg) void this.saveFile(note, `${base} - ${active}.svg`, standalone(svg));
      });
      const pngBtn = toolbar.createEl("button", { cls: "knitspec-tool", text: t(lang, "button.png") });
      pngBtn.addEventListener("click", async () => {
        const svg = svgs[active];
        if (!svg) return;
        try {
          await this.saveFile(note, `${base} - ${active}.png`, await svgToPng(standalone(svg)));
        } catch (e) {
          new Notice(`Knitspec: PNG export failed: ${(e as Error).message}`);
        }
      });
      svgButtons.push(svgBtn, pngBtn);
      const csvBtn = toolbar.createEl("button", { cls: "knitspec-tool", text: t(lang, "button.csv") });
      csvBtn.addEventListener("click", () =>
        void this.saveFile(note, `${base}.csv`, toCsv(fabric, figures, lang, this.settings.csvSeparator)),
      );
    }
    show(active);
  }

  private renderIssues(parent: HTMLElement, res: PipelineResult, lang: Lang): void {
    const spec = res.fabric && res.figures ? buildSpec(res.fabric, res.figures, res.issues, lang) : undefined;
    const list = parent.createEl("ul", { cls: "knitspec-issues" });
    const items = spec ? spec.issues : res.issues.map((i) => ({ level: i.level, text: issueText(lang, i) }));
    for (const it of items) {
      const li = list.createEl("li", { cls: `knitspec-issue knitspec-issue-${it.level}` });
      li.createSpan({ cls: "knitspec-issue-level", text: t(lang, `issue.${it.level}` as I18nKey) });
      li.createSpan({ text: it.text });
    }
  }

  private renderValue(parent: HTMLElement, value: string, sourcePath: string): void {
    const target = linkTarget(value);
    if (!target) {
      parent.setText(value);
      return;
    }
    const a = parent.createEl("a", { cls: "internal-link", text: target, href: target });
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      void this.app.workspace.openLinkText(target, sourcePath, ev.ctrlKey || ev.metaKey);
    });
  }

  private renderSpec(pane: HTMLElement, spec: ReturnType<typeof buildSpec>, sourcePath: string): void {
    const lang = this.settings.language;
    for (const section of spec.sections) {
      pane.createEl("h4", { cls: "knitspec-spec-heading", text: section.title });
      const table = pane.createEl("table", { cls: "knitspec-spec" });
      for (const row of section.rows) {
        const tr = table.createEl("tr");
        tr.createEl("th", { text: row.label });
        const td = tr.createEl("td");
        this.renderValue(td.createSpan(), row.value, sourcePath);
        if (row.note) {
          const note = td.createDiv({ cls: "knitspec-note" });
          this.renderValue(note, row.note, sourcePath);
        }
      }
    }
    pane.createDiv({ cls: "knitspec-note", text: t(lang, "label.estimate") });
    if (spec.missing.length) {
      pane.createDiv({ cls: "knitspec-missing", text: t(lang, "missing.prefix") + spec.missing.join(", ") });
    }
    pane.createEl("h4", { cls: "knitspec-spec-heading", text: t(lang, "label.warnings") });
    if (spec.issues.length === 0) {
      pane.createDiv({ cls: "knitspec-ok", text: t(lang, "label.noIssues") });
    } else {
      const list = pane.createEl("ul", { cls: "knitspec-issues" });
      for (const it of spec.issues) {
        const li = list.createEl("li", { cls: `knitspec-issue knitspec-issue-${it.level}` });
        li.createSpan({ cls: "knitspec-issue-level", text: t(lang, `issue.${it.level}` as I18nKey) });
        li.createSpan({ text: it.text });
      }
    }
  }
}

/** Rasterise an SVG string at 2× for sharp PNGs. */
async function svgToPng(svg: string): Promise<ArrayBuffer> {
  const img = new Image();
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("could not load SVG"));
    img.src = url;
  });
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("no PNG");
  return blob.arrayBuffer();
}

class TemplateModal extends SuggestModal<Template> {
  constructor(app: App, private templates: Template[], private onPick: (t: Template) => void) {
    super(app);
    this.setPlaceholder("Structure…");
  }
  getSuggestions(query: string): Template[] {
    const q = query.toLowerCase();
    return this.templates.filter((t) => t.name.toLowerCase().includes(q) || t.id.includes(q));
  }
  renderSuggestion(tpl: Template, el: HTMLElement): void {
    el.createDiv({ text: tpl.name });
  }
  onChooseSuggestion(tpl: Template): void {
    this.onPick(tpl);
  }
}

class NameModal extends Modal {
  constructor(app: App, private initial: string, private onSubmit: (name: string) => void) {
    super(app);
  }
  onOpen(): void {
    let value = this.initial;
    this.titleEl.setText("Template name");
    new Setting(this.contentEl).setName("Name").addText((t) => {
      t.setValue(value).onChange((v) => (value = v));
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
      });
    });
    const submit = () => {
      if (!value.trim()) return;
      this.close();
      this.onSubmit(value.trim());
    };
    new Setting(this.contentEl).addButton((b) => b.setButtonText("Save").setCta().onClick(submit));
  }
  onClose(): void {
    this.contentEl.empty();
  }
}
