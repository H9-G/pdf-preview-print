import { Modal, Notice, Setting, TFile, loadPdfJs, normalizePath } from "obsidian";
import { remote } from "electron";
import { promises as fs } from "fs";
import * as path from "path";
import type PdfPreviewPrintPlugin from "./main";
import { PrintEngine } from "./engine";
import { pageCss, pageNumberContent, pdfOptions, printOptions, safeFileName } from "./page";
import { RenderedNote, baseFontPx, bodyClass, bodyStyle, collectCss, renderNote } from "./render";
import { ColorMode, ExportOptions, MARGINS, MarginKey, PAGE_SIZES, PageSizeKey, SCALES, exportOptionsOf } from "./settings";
import { MessageKey } from "./i18n";

interface PdfJsPage {
  getViewport(o: { scale: number }): { width: number; height: number };
  render(o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }): { promise: Promise<void> };
}
interface PdfJsDoc {
  numPages: number;
  getPage(n: number): Promise<PdfJsPage>;
  destroy(): Promise<void>;
}
interface PdfJs {
  getDocument(o: { data: Uint8Array }): { promise: Promise<PdfJsDoc> };
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export class ExportModal extends Modal {
  private opts: ExportOptions;
  private engine: PrintEngine | null = null;
  private pagesEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private buttons: HTMLButtonElement[] = [];
  /** The rendered note, kept while the options that change it stay the same. */
  private note: { key: string; value: RenderedNote } | null = null;
  private loadedKey = "";
  private css = "";
  private pdf: Uint8Array | null = null;
  private generation = 0;
  private timer = 0;
  private building: Promise<void> = Promise.resolve();

  constructor(
    private plugin: PdfPreviewPrintPlugin,
    private file: TFile,
  ) {
    super(plugin.app);
    this.opts = exportOptionsOf(plugin.settings);
  }

  private t(key: MessageKey, vars?: Record<string, string | number>): string {
    return this.plugin.t(key, vars);
  }

  onOpen(): void {
    this.modalEl.addClass("pdf-preview-print-modal");
    this.setTitle(`${this.t("modalTitle")}: ${this.file.basename}`);
    const layout = this.contentEl.createDiv({ cls: "pdf-preview-print-layout" });
    const left = layout.createDiv({ cls: "pdf-preview-print-left" });
    this.statusEl = left.createDiv({ cls: "pdf-preview-print-status" });
    this.pagesEl = left.createDiv({ cls: "pdf-preview-print-pages" });
    const side = layout.createDiv({ cls: "pdf-preview-print-side" });
    this.buildOptions(side.createDiv({ cls: "pdf-preview-print-options" }));
    this.buildButtons(side.createDiv({ cls: "pdf-preview-print-buttons" }));

    this.css = collectCss();
    this.engine = new PrintEngine(this.modalEl);
    this.schedule(0);
  }

  onClose(): void {
    this.generation++;
    window.clearTimeout(this.timer);
    this.engine?.destroy();
    this.engine = null;
    this.contentEl.empty();
  }

  private buildOptions(el: HTMLElement): void {
    const t = (k: MessageKey) => this.t(k);
    const change = (f: () => void) => {
      f();
      this.schedule();
    };
    new Setting(el).setName(t("optColor")).addDropdown((c) =>
      c
        .addOptions({ color: t("colorColor"), gray: t("colorGray") })
        .setValue(this.opts.colorMode)
        .onChange((v) => change(() => (this.opts.colorMode = v as ColorMode))),
    );
    new Setting(el).setName(t("optPageSize")).addDropdown((c) =>
      c
        .addOptions(Object.fromEntries(Object.keys(PAGE_SIZES).map((k) => [k, k])))
        .setValue(this.opts.pageSize)
        .onChange((v) => change(() => (this.opts.pageSize = v as PageSizeKey))),
    );
    new Setting(el).setName(t("optOrientation")).addDropdown((c) =>
      c
        .addOptions({ portrait: t("portrait"), landscape: t("landscape") })
        .setValue(this.opts.landscape ? "landscape" : "portrait")
        .onChange((v) => change(() => (this.opts.landscape = v === "landscape"))),
    );
    new Setting(el).setName(t("optMargin")).addDropdown((c) =>
      c
        .addOptions(marginOptions(t))
        .setValue(this.opts.margin)
        .onChange((v) => change(() => (this.opts.margin = v as MarginKey))),
    );
    new Setting(el).setName(t("optScale")).addDropdown((c) =>
      c
        .addOptions(Object.fromEntries(SCALES.map((s) => [String(s), `${s}%`])))
        .setValue(String(this.opts.scale))
        .onChange((v) => change(() => (this.opts.scale = Number(v)))),
    );
    new Setting(el)
      .setName(t("optTitle"))
      .addToggle((c) => c.setValue(this.opts.showTitle).onChange((v) => change(() => (this.opts.showTitle = v))));
    new Setting(el)
      .setName(t("optPageNumbers"))
      .addToggle((c) => c.setValue(this.opts.pageNumbers).onChange((v) => change(() => (this.opts.pageNumbers = v))));
    new Setting(el)
      .setName(t("optLineNumbers"))
      .addToggle((c) => c.setValue(this.opts.lineNumbers).onChange((v) => change(() => (this.opts.lineNumbers = v))));
    new Setting(el)
      .setName(t("optBlank"))
      .setDesc(t("optBlankDesc"))
      .addToggle((c) => c.setValue(this.opts.keepBlankLines).onChange((v) => change(() => (this.opts.keepBlankLines = v))));
    new Setting(el)
      .setName(t("optBlankLists"))
      .addToggle((c) => c.setValue(this.opts.blankInLists).onChange((v) => change(() => (this.opts.blankInLists = v))));
    new Setting(el)
      .setName(t("optBlankMath"))
      .addToggle((c) => c.setValue(this.opts.blankInMath).onChange((v) => change(() => (this.opts.blankInMath = v))));
  }

  private buildButtons(el: HTMLElement): void {
    const save = el.createEl("button", { cls: "mod-cta", text: this.t("btnSave") });
    save.addEventListener("click", () => void this.save());
    const print = el.createEl("button", { text: this.t("btnPrint") });
    print.addEventListener("click", () => void this.print());
    this.buttons = [save, print];
    const def = el.createEl("button", { cls: "pdf-preview-print-default", text: this.t("btnDefault") });
    def.addEventListener("click", () => void this.makeDefault());
    this.setBusy(true);
  }

  private setBusy(busy: boolean): void {
    for (const b of this.buttons) b.disabled = busy;
  }

  private schedule(delay = 300): void {
    window.clearTimeout(this.timer);
    this.setBusy(true);
    this.statusEl.setText(this.t("building"));
    this.timer = window.setTimeout(() => {
      this.building = this.build();
    }, delay);
  }

  /** Render the note if needed, lay it out with the current options, make the PDF and show its pages. */
  private async build(): Promise<void> {
    const gen = ++this.generation;
    const engine = this.engine;
    if (!engine) return;
    try {
      const o = { ...this.opts };
      const key = [o.keepBlankLines, o.blankInLists, o.blankInMath, o.showTitle].join("|");
      if (this.note?.key !== key) {
        this.note = { key, value: await renderNote(this.app, this.file, o) };
      }
      if (gen !== this.generation) return;
      if (this.loadedKey !== key) {
        const n = this.note.value;
        await engine.setContent({ title: n.title, css: this.css, html: `<div class="print">${n.html}</div>`, bodyStyle: bodyStyle() });
        this.loadedKey = key;
      }
      const numbers = pageNumberContent(this.t("pageNumberFormat"));
      await engine.setPage(pageCss(o, baseFontPx(), numbers), bodyClass(o.colorMode === "gray"), o.lineNumbers);
      if (gen !== this.generation) return;
      const pdf = await engine.pdf(pdfOptions(o));
      if (gen !== this.generation) return;
      this.pdf = pdf;
      const count = await this.showPages(pdf, gen);
      if (gen !== this.generation) return;
      this.statusEl.setText(this.t("pages", { n: count }));
      this.setBusy(false);
    } catch (e) {
      if (gen !== this.generation) return;
      console.error(e);
      this.statusEl.setText(this.t("failed", { msg: errorText(e) }));
    }
  }

  private async showPages(data: Uint8Array, gen: number): Promise<number> {
    const pdfjs = (await loadPdfJs()) as PdfJs;
    // pdf.js may take over the buffer it is given, so it gets a copy.
    const doc = await pdfjs.getDocument({ data: data.slice() }).promise;
    try {
      const sheets: HTMLElement[] = [];
      const width = Math.max(200, this.pagesEl.clientWidth - 40);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      for (let i = 1; i <= doc.numPages; i++) {
        if (gen !== this.generation) return 0;
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width / base.width) * ratio });
        const sheet = createDiv({ cls: "pdf-preview-print-sheet" });
        const canvas = sheet.createEl("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d");
        if (ctx) await page.render({ canvasContext: ctx, viewport }).promise;
        sheets.push(sheet);
      }
      if (gen !== this.generation) return 0;
      const top = this.pagesEl.scrollTop;
      this.pagesEl.replaceChildren(...sheets);
      this.pagesEl.scrollTop = top;
      return doc.numPages;
    } finally {
      void doc.destroy();
    }
  }

  private async current(): Promise<Uint8Array | null> {
    await this.building;
    return this.pdf;
  }

  private async save(): Promise<void> {
    const pdf = await this.current();
    if (!pdf) return;
    const s = this.plugin.settings;
    const name = `${safeFileName(this.file.basename)}.pdf`;
    try {
      // Without Electron's dialog (very old app versions) the PDF goes next to the note.
      if (s.saveTo === "folder" || !remote?.dialog) {
        const folder = this.file.parent?.path ?? "/";
        const target = normalizePath(folder === "/" ? name : `${folder}/${name}`);
        const bytes = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
        const old = this.app.vault.getAbstractFileByPath(target);
        let saved: TFile;
        if (old instanceof TFile) {
          await this.app.vault.modifyBinary(old, bytes);
          saved = old;
        } else {
          saved = await this.app.vault.createBinary(target, bytes);
        }
        new Notice(this.t("savedTo", { path: saved.path }));
        if (s.openAfterSave) await this.app.workspace.getLeaf(true).openFile(saved);
      } else {
        const result = await remote.dialog.showSaveDialog({
          title: this.t("btnSave"),
          defaultPath: s.lastFolder ? path.join(s.lastFolder, name) : name,
          filters: [{ name: "PDF", extensions: ["pdf"] }],
        });
        if (result.canceled || !result.filePath) return;
        await fs.writeFile(result.filePath, pdf);
        s.lastFolder = path.dirname(result.filePath);
        await this.plugin.saveSettings();
        new Notice(this.t("savedTo", { path: result.filePath }));
        if (s.openAfterSave) await remote.shell?.openPath(result.filePath);
      }
      this.close();
    } catch (e) {
      console.error(e);
      new Notice(this.t("failed", { msg: errorText(e) }));
    }
  }

  private async print(): Promise<void> {
    const pdf = await this.current();
    if (!pdf || !this.engine) return;
    try {
      await this.engine.print(printOptions(this.opts));
    } catch (e) {
      const msg = errorText(e);
      if (!/cancel/i.test(msg)) new Notice(this.t("printFailed", { msg }));
    }
  }

  private async makeDefault(): Promise<void> {
    Object.assign(this.plugin.settings, this.opts);
    await this.plugin.saveSettings();
    new Notice(this.t("defaultSaved"));
  }
}

export function marginOptions(t: (k: MessageKey) => string): Record<MarginKey, string> {
  const label: Record<MarginKey, MessageKey> = { none: "marginNone", narrow: "marginNarrow", normal: "marginNormal", wide: "marginWide" };
  return Object.fromEntries((Object.keys(MARGINS) as MarginKey[]).map((k) => [k, t(label[k])])) as Record<MarginKey, string>;
}
