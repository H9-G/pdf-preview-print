import { BLANK_CLASS, GAP_CLASS, extraBlankLinesBefore, listItemGaps, spaceBefore, keepBlankLines, stripFrontmatter } from "../src/blank";
import { allDicts, detectLanguage, tr } from "../src/i18n";
import { geometry, pageCss, pageNumberContent, pdfOptions, printOptions, safeFileName, GRAY_CLASS } from "../src/page";
import { DEFAULT_SETTINGS, exportOptionsOf, sanitizeSettings } from "../src/settings";

let failed = 0;
let passed = 0;
function test(name: string, f: () => void) {
  try {
    f();
    passed++;
  } catch (e) {
    failed++;
    console.error(`✗ ${name}\n  ${(e as Error).message}`);
  }
}
function eq(a: unknown, b: unknown) {
  const x = JSON.stringify(a);
  const y = JSON.stringify(b);
  if (x !== y) throw new Error(`expected ${y}\n  got      ${x}`);
}
const spacer = (n: number) => `<div class="${BLANK_CLASS}">${"<br>".repeat(n)}</div>`;

test("one empty line stays as it is", () => {
  eq(keepBlankLines("a\n\nb"), "a\n\nb");
});

test("three empty lines add two lines of space", () => {
  eq(keepBlankLines("a\n\n\n\nb"), `a\n\n\n\n${spacer(2)}\n\nb`);
});

test("extra lines counted exactly", () => {
  eq(keepBlankLines("a\n\n\nb"), `a\n\n\n${spacer(1)}\n\nb`);
  eq(keepBlankLines("a\n\n\n\n\nb"), `a\n\n\n\n\n${spacer(3)}\n\nb`);
});

test("empty lines at the start are left alone", () => {
  eq(keepBlankLines("\n\n\na"), "\n\n\na");
});

test("lines with only spaces count as empty", () => {
  eq(keepBlankLines("a\n  \n\t\nb"), `a\n  \n\t\n${spacer(1)}\n\nb`);
});

test("code blocks are not changed", () => {
  const md = "```js\nx\n\n\n\ny\n```";
  eq(keepBlankLines(md), md);
  const tilde = "~~~~\nx\n\n\n```\n\n\ny\n~~~~\nz";
  eq(keepBlankLines(tilde), tilde);
});

test("comments are not changed", () => {
  const c = "%%\nnote\n\n\nmore\n%%";
  eq(keepBlankLines(c), c);
});

test("after a code block, empty lines count again", () => {
  eq(keepBlankLines("```\nx\n```\n\n\nb"), "```\nx\n```\n\n\n" + spacer(1) + "\n\nb");
});

const gap = (n: number) => `<span class="${GAP_CLASS} ${GAP_CLASS}-${n}"></span>`;
const off = { lists: false, math: false };

test("lists: every empty line between items is space, and the list stays tight", () => {
  eq(keepBlankLines("- a\n\n- b"), `- a\n- ${gap(1)}b`);
  eq(keepBlankLines("- a\n\n\n- b"), `- a\n- ${gap(2)}b`);
  eq(keepBlankLines("- [ ] a\n\n- [x] b"), `- [ ] a\n- [x] ${gap(1)}b`);
  eq(keepBlankLines("1. a\n\n\n\n2. b"), `1. a\n2. ${gap(3)}b`);
  eq(keepBlankLines("- a\n\n  - nested"), `- a\n  - ${gap(1)}nested`);
  eq(keepBlankLines("- a\n- b"), "- a\n- b");
  eq(keepBlankLines("- a\n\n- b", off), "- a\n\n- b");
});

test("lists: paragraphs inside items work like other paragraphs", () => {
  eq(keepBlankLines("- a\n\n    more"), "- a\n\n    more");
  eq(keepBlankLines("- a\n\n\n    more"), `- a\n\n\n    ${gap(1)}more`);
});

test("lists: after the list, a paragraph works as usual", () => {
  eq(keepBlankLines("- a\n\n\ntext"), `- a\n\n\n${spacer(1)}\n\ntext`);
});

test("reading view: list items", () => {
  const text = "x\n\n- a\n- b\n\n- [ ] c\n\n\n  - d\n```\n- no\n```";
  eq(listItemGaps(text, 2, 11), [0, 0, 1, 2]);
  eq(listItemGaps("> - a\n>\n> - b", 0, 2), [0, 1]);
  eq(spaceBefore("- a\n\n- b", 2), { lines: 1, list: true });
  eq(spaceBefore("a\n\n\nb", 3), { lines: 1, list: false });
  eq(spaceBefore("a\n\nb", 2), { lines: 0, list: false });
});

test("lists: lines that must stay at the start are left alone", () => {
  for (const md of ["- a\n\n\n    ```\n    x\n    ```", "- a\n\n\n- # h", "- a\n\n\n    > q", "- a\n\n\n- "]) eq(keepBlankLines(md), md);
});

test("lists: code blocks inside list items are not changed", () => {
  const md = "- a\n    ```\n    x\n\n\n    y\n    ```";
  eq(keepBlankLines(md), md);
});

test("indented code after a paragraph is not changed", () => {
  const md = "text\n\n\n    code";
  eq(keepBlankLines(md), md);
});

test("math: split at empty lines", () => {
  eq(keepBlankLines("$$\na=b\n\nc=d\n$$"), "$$\na=b\n$$\n\n$$\nc=d\n$$");
  eq(keepBlankLines("$$\na=b\n\n\n\nc=d\n$$"), `$$\na=b\n$$\n\n${spacer(2)}\n\n$$\nc=d\n$$`);
  const env = "$$\n\\begin{aligned}\na\n\nb\n\\end{aligned}\n$$";
  eq(keepBlankLines(env), env);
  eq(keepBlankLines("$$\na=b\n\nc=d\n$$", off), "$$\na=b\n\nc=d\n$$");
  eq(keepBlankLines("$$\na=b\n$$"), "$$\na=b\n$$");
});

test("math: space before and after the block", () => {
  eq(keepBlankLines("t\n\n\n$$\nx\n$$\n\n\nu"), `t\n\n\n${spacer(1)}\n\n$$\nx\n$$\n\n\n${spacer(1)}\n\nu`);
});

test("front matter is removed", () => {
  eq(stripFrontmatter("---\ntitle: x\n---\nbody"), "body");
  eq(stripFrontmatter("---\r\na: 1\r\n---\r\nbody"), "body");
  eq(stripFrontmatter("text\n---\nx\n---\n"), "text\n---\nx\n---\n");
});

test("reading view: extra empty lines above a block", () => {
  const text = "a\n\n\n\nb\n\nc";
  eq(extraBlankLinesBefore(text, 4), 2);
  eq(extraBlankLinesBefore(text, 6), 0);
  eq(extraBlankLinesBefore(text, 0), 0);
  eq(extraBlankLinesBefore("\n\n\nb", 3), 0);
  // A block whose range starts on an empty line
  eq(extraBlankLinesBefore(text, 3, 4), 2);
});

test("settings: defaults and invalid values", () => {
  eq(sanitizeSettings(undefined), DEFAULT_SETTINGS);
  const s = sanitizeSettings({ pageSize: "B5", margin: "wide", scale: 120, colorMode: "gray", keepBlankLines: false, language: "ja" });
  eq([s.pageSize, s.margin, s.scale, s.colorMode, s.keepBlankLines, s.language], ["B5", "wide", 120, "gray", false, "ja"]);
  const bad = sanitizeSettings({ pageSize: "Z9", margin: 5, scale: 33, colorMode: "red", saveTo: "x", language: "xx", toString: 1 });
  eq([bad.pageSize, bad.margin, bad.scale, bad.colorMode, bad.saveTo, bad.language], ["A4", "normal", 100, "color", "dialog", ""]);
  eq(sanitizeSettings({ pageSize: "toString" }).pageSize, "A4");
});

test("page geometry and print options", () => {
  const o = exportOptionsOf(DEFAULT_SETTINGS);
  eq(geometry(o), { width: 210, height: 297, margin: { top: 20, right: 20, bottom: 20, left: 20 } });
  const land = { ...o, landscape: true, margin: "none" as const };
  eq(geometry(land), { width: 297, height: 210, margin: { top: 0, right: 0, bottom: 12, left: 0 } });
  eq(geometry({ ...land, pageNumbers: false }).margin.bottom, 0);
  eq(geometry({ ...land, lineNumbers: true }).margin.left, 0);
  const p = pdfOptions(o);
  eq(Math.round(p.pageSize.width * 1000) / 1000, 8.268);
  eq(p.preferCSSPageSize, true);
  const pr = printOptions({ ...o, colorMode: "gray" });
  eq([pr.color, pr.pageSize], [false, { width: 210000, height: 297000 }]);
  eq(printOptions(o).color, true);
});

test("page CSS", () => {
  const o = exportOptionsOf(DEFAULT_SETTINGS);
  const css = pageCss(o, 16, pageNumberContent("{page} / {pages}"));
  if (!css.includes("size: 210mm 297mm")) throw new Error("no page size");
  if (!css.includes("--font-text-size: 16px")) throw new Error("no font size");
  if (!css.includes('counter(page) " / " counter(pages)')) throw new Error("no page numbers");
  if (css.includes(GRAY_CLASS)) throw new Error("grey in colour mode");
  const gray = pageCss({ ...o, colorMode: "gray", scale: 150, pageNumbers: false }, 16, "counter(page)");
  if (css.includes("pdf-preview-print-line-no")) throw new Error("line numbers when off");
  if (!pageCss({ ...o, lineNumbers: true }, 16, "x").includes("pdf-preview-print-line-no")) throw new Error("no line numbers");
  if (!css.includes("width: 170mm")) throw new Error("no screen width");
  if (!gray.includes(GRAY_CLASS) || !gray.includes("--font-text-size: 24px") || gray.includes("@bottom-center")) throw new Error(gray);
});

test("page number content", () => {
  eq(pageNumberContent("{page} / {pages}"), 'counter(page) " / " counter(pages)');
  eq(pageNumberContent("Seite {page}"), '"Seite " counter(page)');
  eq(pageNumberContent(""), "counter(page)");
});

test("file names", () => {
  eq(safeFileName('a/b:c*?"<>|'), "a_b_c______");
  eq(safeFileName("note. "), "note");
  eq(safeFileName("   "), "note");
  eq(safeFileName("会議メモ"), "会議メモ");
});

test("all languages have the same keys and placeholders", () => {
  const dicts = allDicts();
  const keys = Object.keys(dicts.en).sort();
  const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
  for (const [lang, d] of Object.entries(dicts)) {
    eq([lang, Object.keys(d).sort()], [lang, keys]);
    for (const k of keys) {
      const v = (d as Record<string, string>)[k];
      if (!v) throw new Error(`${lang}.${k} is empty`);
      if (ph(v) !== ph((dicts.en as Record<string, string>)[k])) throw new Error(`${lang}.${k} placeholders differ`);
    }
  }
});

test("language detection and translation", () => {
  eq(["ja", "zh-TW", "zh-hk", "zh", "en-US", "pt", "", "de-AT"].map(detectLanguage), ["ja", "zh-TW", "zh-TW", "zh-CN", "en", "en", "en", "de"]);
  eq(tr("ja", "pages", { n: 3 }), "3ページ");
  eq(tr("en", "pages", { n: 3 }), "3 pages");
});

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
