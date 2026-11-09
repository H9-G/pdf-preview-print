import { App, PluginSettingTab, SettingDefinitionItem } from "obsidian";
import type PdfPreviewPrintPlugin from "./main";
import { LANGUAGES, MessageKey } from "./i18n";
import { marginOptions } from "./modal";
import { PAGE_SIZES, SCALES, sanitizeSettings } from "./settings";

const SUPPORT_URL = "https://buymeacoffee.com/imh9";

export class PdfSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: PdfPreviewPrintPlugin,
  ) {
    super(app, plugin);
  }

  getControlValue(key: string): unknown {
    const v = (this.plugin.settings as unknown as Record<string, unknown>)[key];
    if (key === "landscape") return v ? "landscape" : "portrait";
    if (key === "scale") return String(v);
    return v;
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    let v = value;
    if (key === "landscape") v = value === "landscape";
    if (key === "scale") v = Number(value);
    const next = sanitizeSettings({ ...this.plugin.settings, [key]: v });
    if ((next as unknown as Record<string, unknown>)[key] !== v) return; // invalid input: keep the old value
    this.plugin.settings = next;
    await this.plugin.saveSettings();
    if (key === "language") this.update(); // redraw in the new language
    if (key === "readingBlankLines") this.plugin.refreshReading();
    if (key === "readingIndent") this.plugin.rerenderReading();
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const t = (k: MessageKey) => this.plugin.t(k);
    return [
      {
        name: t("supportName"),
        desc: t("supportDesc"),
        render: (setting) => {
          setting.addButton((b) => b.setButtonText("☕ Buy me a coffee").setCta().onClick(() => window.open(SUPPORT_URL)));
        },
      },
      {
        type: "group",
        heading: t("headUsage"),
        items: [
          { name: t("usageCommand"), desc: t("usageCommandDesc") },
          { name: t("usageMenu"), desc: t("usageMenuDesc") },
          { name: t("usageWindow"), desc: t("usageWindowDesc") },
        ],
      },
      { name: t("language"), desc: t("languageDesc"), control: { type: "dropdown", key: "language", options: { ...LANGUAGES } } },
      {
        type: "group",
        heading: t("headPdf"),
        items: [
          {
            name: t("optColor"),
            desc: t("setColorDesc"),
            control: { type: "dropdown", key: "colorMode", options: { color: t("colorColor"), gray: t("colorGray") } },
          },
          {
            name: t("optPageSize"),
            control: { type: "dropdown", key: "pageSize", options: Object.fromEntries(Object.keys(PAGE_SIZES).map((k) => [k, k])) },
          },
          {
            name: t("optOrientation"),
            control: { type: "dropdown", key: "landscape", options: { portrait: t("portrait"), landscape: t("landscape") } },
          },
          { name: t("optMargin"), control: { type: "dropdown", key: "margin", options: marginOptions(t) } },
          {
            name: t("optScale"),
            control: { type: "dropdown", key: "scale", options: Object.fromEntries(SCALES.map((s) => [String(s), `${s}%`])) },
          },
          { name: t("optTitle"), desc: t("setTitleDesc"), control: { type: "toggle", key: "showTitle" } },
          { name: t("optPageNumbers"), desc: t("setPageNumbersDesc"), control: { type: "toggle", key: "pageNumbers" } },
          { name: t("optLineNumbers"), desc: t("setLineNumbersDesc"), control: { type: "toggle", key: "lineNumbers" } },
          { name: t("optIndent"), desc: t("setIndentDesc"), control: { type: "toggle", key: "keepIndent" } },
          { name: t("optBlank"), desc: t("setBlankDesc"), control: { type: "toggle", key: "keepBlankLines" } },
          { name: t("optBlankLists"), desc: t("setBlankListsDesc"), control: { type: "toggle", key: "blankInLists" } },
          { name: t("optBlankMath"), desc: t("setBlankMathDesc"), control: { type: "toggle", key: "blankInMath" } },
        ],
      },
      {
        type: "group",
        heading: t("headReading"),
        items: [
          { name: t("setReadingIndent"), desc: t("setReadingIndentDesc"), control: { type: "toggle", key: "readingIndent" } },
          { name: t("setReadingBlank"), desc: t("setReadingBlankDesc"), control: { type: "toggle", key: "readingBlankLines" } },
        ],
      },
      {
        type: "group",
        heading: t("headSave"),
        items: [
          {
            name: t("setSaveTo"),
            desc: t("setSaveToDesc"),
            control: { type: "dropdown", key: "saveTo", options: { dialog: t("saveDialog"), folder: t("saveFolder") } },
          },
          { name: t("setOpen"), desc: t("setOpenDesc"), control: { type: "toggle", key: "openAfterSave" } },
        ],
      },
    ];
  }
}
