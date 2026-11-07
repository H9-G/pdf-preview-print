import { BLANK_CLASS } from "./blank";
import { ExportOptions, MARGINS, PAGE_SIZES } from "./settings";

export const GRAY_CLASS = "pdf-preview-print-gray";
export const PAGE_CLASS = "pdf-preview-print-page";
export const LINE_NO_CLASS = "pdf-preview-print-line-no";

const MM_PER_INCH = 25.4;

/** Paper size and margins in millimetres, with the orientation applied. */
export function geometry(o: ExportOptions) {
  const [w, h] = PAGE_SIZES[o.pageSize];
  const m = MARGINS[o.margin];
  return {
    width: o.landscape ? h : w,
    height: o.landscape ? w : h,
    // Page numbers are printed in the bottom margin, so it needs some room.
    margin: { top: m, right: m, bottom: o.pageNumbers ? Math.max(m, 12) : m, left: m },
  };
}

/** Options for Electron's printToPDF. Sizes are in inches. */
export function pdfOptions(o: ExportOptions) {
  const g = geometry(o);
  const inch = (mm: number) => mm / MM_PER_INCH;
  return {
    pageSize: { width: inch(g.width), height: inch(g.height) },
    landscape: false, // the size above already has the orientation
    margins: { top: inch(g.margin.top), bottom: inch(g.margin.bottom), left: inch(g.margin.left), right: inch(g.margin.right) },
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  };
}

/** Options for Electron's print. Sizes are in microns; the margins come from the page's CSS. */
export function printOptions(o: ExportOptions) {
  const g = geometry(o);
  return {
    silent: false,
    printBackground: true,
    color: o.colorMode === "color",
    landscape: false,
    pageSize: { width: Math.round(g.width * 1000), height: Math.round(g.height * 1000) },
    margins: { marginType: "default" as const },
  };
}

/** Light-theme colours of Obsidian, as greys of the same brightness. */
const GRAYS: Record<string, number> = {
  red: 106,
  orange: 139,
  yellow: 168,
  green: 120,
  cyan: 133,
  blue: 92,
  purple: 111,
  pink: 112,
};

function grayCss(): string {
  const vars = Object.entries(GRAYS)
    .map(([c, v]) => `--color-${c}-rgb: ${v}, ${v}, ${v}; --color-${c}: rgb(${v}, ${v}, ${v});`)
    .join(" ");
  return `
body.${GRAY_CLASS}.${GRAY_CLASS} {
  ${vars}
  --accent-s: 0%;
  --text-highlight-bg: rgba(0, 0, 0, 0.14);
  --text-highlight-bg-rgb: 0, 0, 0;
  --text-selection: rgba(0, 0, 0, 0.14);
}
body.${GRAY_CLASS} :is(img, video, canvas, svg:not(.svg-icon)) { filter: grayscale(1); }`;
}

/**
 * Line numbers: each marker is taken out of the text flow but keeps the height of its line,
 * and is moved to the left edge of the text, into room made for the numbers.
 */
function lineNumberCss(): string {
  return `
body.${PAGE_CLASS} .print .markdown-preview-view { position: relative; padding-left: 10mm !important; }
body.${PAGE_CLASS} .${LINE_NO_CLASS} {
  position: absolute;
  left: var(--x, 0px);
  width: 7mm;
  text-align: right;
  font: normal normal 400 7.5pt/1.6 sans-serif;
  color: #888;
  white-space: nowrap;
  text-indent: 0;
  text-decoration: none;
  user-select: none;
}
body.${PAGE_CLASS} .${LINE_NO_CLASS}::before { content: attr(data-n); }
body.${PAGE_CLASS} :is(pre, code, .callout, .callout-content, blockquote, table, .table-wrapper, .markdown-embed, .markdown-embed-content) { overflow: visible !important; }`;
}

const fmt = (n: number) => String(Math.round(n * 100) / 100);

/** CSS for the printed page: paper, margins, page numbers, text size, empty lines and colours. */
export function pageCss(o: ExportOptions, baseFontPx: number, pageNumberText: string): string {
  const g = geometry(o);
  const m = g.margin;
  const numbers = o.pageNumbers
    ? `@bottom-center { content: ${pageNumberText}; font-size: 9pt; color: #777; font-family: sans-serif; }`
    : "";
  return `
@page {
  size: ${fmt(g.width)}mm ${fmt(g.height)}mm;
  margin: ${fmt(m.top)}mm ${fmt(m.right)}mm ${fmt(m.bottom)}mm ${fmt(m.left)}mm;
  ${numbers}
}
html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
body.${PAGE_CLASS} {
  --font-text-size: ${fmt((baseFontPx * o.scale) / 100)}px !important;
  background: #fff !important;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
/* On screen the text gets the width it has on paper, so the lines can be numbered where they break. */
@media screen { body.${PAGE_CLASS} .print { width: ${fmt(g.width - m.left - m.right)}mm; } }
body.${PAGE_CLASS} .print .markdown-preview-view {
  padding: 0 !important;
  height: auto !important;
  overflow: visible !important;
  max-width: none !important;
  font-size: var(--font-text-size);
}
body.${PAGE_CLASS} .${BLANK_CLASS} {
  margin: calc(-1 * var(--p-spacing, 1rem)) 0 0;
  line-height: var(--line-height-normal, 1.5);
}
body.${PAGE_CLASS} pre, body.${PAGE_CLASS} blockquote, body.${PAGE_CLASS} .callout, body.${PAGE_CLASS} img { break-inside: avoid; }
body.${PAGE_CLASS} :is(h1, h2, h3, h4, h5, h6) { break-after: avoid; }
body.${PAGE_CLASS} tr { break-inside: avoid; }
${o.lineNumbers ? lineNumberCss() : ""}
${o.colorMode === "gray" ? grayCss() : ""}`;
}

/** The CSS `content` value for "page / pages", from a template such as "{page} / {pages}". */
export function pageNumberContent(template: string): string {
  const parts: string[] = [];
  const re = /\{(page|pages)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template))) {
    if (m.index > last) parts.push(JSON.stringify(template.slice(last, m.index)));
    parts.push(`counter(${m[1]})`);
    last = m.index + m[0].length;
  }
  if (last < template.length) parts.push(JSON.stringify(template.slice(last)));
  return parts.length ? parts.join(" ") : "counter(page)";
}

/** A file name that works on Windows, macOS and Linux. */
export function safeFileName(name: string): string {
  const s = name
    .replace(/[\\/:*?"<>|]/g, "_")
    .split("")
    .filter((c) => c.charCodeAt(0) >= 32)
    .join("")
    .trim()
    .replace(/[. ]+$/, "");
  return s === "" ? "note" : s;
}
