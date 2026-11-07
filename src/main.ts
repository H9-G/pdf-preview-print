import { MarkdownView, Notice, Plugin, TFile, debounce, getLanguage } from "obsidian";
import { MessageKey, detectLanguage, tr } from "./i18n";
import { ExportModal } from "./modal";
import { ReadingBlankLines } from "./reading";
import { PdfSettings, sanitizeSettings } from "./settings";
import { PdfSettingTab } from "./settingsTab";

export default class PdfPreviewPrintPlugin extends Plugin {
  settings!: PdfSettings;
  private reading!: ReadingBlankLines;

  t(key: MessageKey, vars?: Record<string, string | number>): string {
    return tr(this.settings.language || "en", key, vars);
  }

  async onload(): Promise<void> {
    this.settings = sanitizeSettings(await this.loadData());
    // First run: follow the language Obsidian is using.
    if (this.settings.language === "") {
      this.settings.language = detectLanguage(getLanguage());
      await this.saveSettings();
    }

    this.reading = new ReadingBlankLines(() => this.settings.readingBlankLines);
    this.registerMarkdownPostProcessor((el, ctx) => this.reading.process(el, ctx));
    const refresh = debounce(() => this.reading.refresh(), 300, true);
    this.registerEvent(this.app.workspace.on("editor-change", refresh));
    this.registerEvent(this.app.workspace.on("layout-change", refresh));
    this.registerEvent(this.app.vault.on("modify", refresh));

    this.addCommand({
      id: "export",
      name: this.t("cmdExport"),
      icon: "printer",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveViewOfType(MarkdownView)?.file;
        if (!file) return false;
        if (!checking) this.openExport(file);
        return true;
      },
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFile) || file.extension !== "md") return;
        menu.addItem((item) =>
          item
            .setTitle(this.t("menuExport"))
            .setIcon("printer")
            .onClick(() => this.openExport(file)),
        );
      }),
    );

    this.addSettingTab(new PdfSettingTab(this.app, this));
  }

  onunload(): void {
    this.reading.clear();
  }

  openExport(file: TFile | null): void {
    if (!file) {
      new Notice(this.t("noFile"));
      return;
    }
    new ExportModal(this, file).open();
  }

  refreshReading(): void {
    this.reading.refresh();
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
