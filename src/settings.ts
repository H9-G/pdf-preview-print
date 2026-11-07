import { LangCode, isLangCode } from "./i18n";

export type ColorMode = "color" | "gray";
export type MarginKey = "none" | "narrow" | "normal" | "wide";
export type SaveTo = "dialog" | "folder";

/** Paper sizes in millimetres, portrait. */
export const PAGE_SIZES = {
  A3: [297, 420],
  A4: [210, 297],
  A5: [148, 210],
  B4: [257, 364],
  B5: [182, 257],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
} as const;
export type PageSizeKey = keyof typeof PAGE_SIZES;

export const MARGINS: Record<MarginKey, number> = { none: 0, narrow: 10, normal: 20, wide: 30 };
export const SCALES = [70, 80, 90, 100, 110, 120, 130, 150];

/** What a single export looks like. These can be changed in the export window too. */
export interface ExportOptions {
  keepBlankLines: boolean;
  /** Empty lines between and inside list items (also used in reading view). */
  blankInLists: boolean;
  /** Empty lines inside math blocks: the block is split into separate formulas there. */
  blankInMath: boolean;
  colorMode: ColorMode;
  pageSize: PageSizeKey;
  landscape: boolean;
  margin: MarginKey;
  /** Text size in percent. */
  scale: number;
  showTitle: boolean;
  pageNumbers: boolean;
  /** Number every line of text in the left margin. */
  lineNumbers: boolean;
}

export interface PdfSettings extends ExportOptions {
  /** Empty until first run, when it is taken from Obsidian's language. */
  language: LangCode | "";
  /** Show every empty line in reading view as well. */
  readingBlankLines: boolean;
  saveTo: SaveTo;
  openAfterSave: boolean;
  /** Folder last chosen in the save dialog. */
  lastFolder: string;
}

export const DEFAULT_SETTINGS: PdfSettings = {
  language: "",
  keepBlankLines: true,
  blankInLists: true,
  blankInMath: true,
  readingBlankLines: true,
  colorMode: "color",
  pageSize: "A4",
  landscape: false,
  margin: "normal",
  scale: 100,
  showTitle: true,
  pageNumbers: true,
  lineNumbers: false,
  saveTo: "dialog",
  openAfterSave: false,
  lastFolder: "",
};

const has = (o: object, k: unknown): boolean => typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);

export function sanitizeSettings(raw: unknown): PdfSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  const bool = (k: keyof PdfSettings) => (typeof r[k] === "boolean" ? (r[k]) : (d[k] as boolean));
  const scale = Number(r.scale);
  return {
    language: isLangCode(r.language) ? r.language : "",
    keepBlankLines: bool("keepBlankLines"),
    blankInLists: bool("blankInLists"),
    blankInMath: bool("blankInMath"),
    readingBlankLines: bool("readingBlankLines"),
    colorMode: r.colorMode === "gray" || r.colorMode === "color" ? r.colorMode : d.colorMode,
    pageSize: has(PAGE_SIZES, r.pageSize) ? (r.pageSize as PageSizeKey) : d.pageSize,
    landscape: bool("landscape"),
    margin: has(MARGINS, r.margin) ? (r.margin as MarginKey) : d.margin,
    scale: SCALES.includes(scale) ? scale : d.scale,
    showTitle: bool("showTitle"),
    pageNumbers: bool("pageNumbers"),
    lineNumbers: bool("lineNumbers"),
    saveTo: r.saveTo === "folder" || r.saveTo === "dialog" ? r.saveTo : d.saveTo,
    openAfterSave: bool("openAfterSave"),
    lastFolder: typeof r.lastFolder === "string" ? r.lastFolder : "",
  };
}

export function exportOptionsOf(s: PdfSettings): ExportOptions {
  const { keepBlankLines, blankInLists, blankInMath, colorMode, pageSize, landscape, margin, scale, showTitle, pageNumbers, lineNumbers } = s;
  return { keepBlankLines, blankInLists, blankInMath, colorMode, pageSize, landscape, margin, scale, showTitle, pageNumbers, lineNumbers };
}
