import { MarkdownView, Notice, Plugin, TFile, getLanguage } from "obsidian";
import { MessageKey, detectLanguage, tr } from "./i18n";
import { ExportModal } from "./modal";
import { PdfSettings, sanitizeSettings } from "./settings";
import { PdfSettingTab } from "./settingsTab";

export default class PdfPreviewPrintPlugin extends Plugin {
  settings!: PdfSettings;

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

  openExport(file: TFile | null): void {
    if (!file) {
      new Notice(this.t("noFile"));
      return;
    }
    new ExportModal(this, file).open();
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
