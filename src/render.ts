import { App, Component, MarkdownRenderer, MarkdownView, TFile } from "obsidian";
import { keepIndent } from "./indent";
import { GAP_BEFORE_CLASS, GAP_CLASS, LINES_VAR, keepBlankLines, stripFrontmatter } from "./blank";
import { PAGE_CLASS, GRAY_CLASS } from "./page";
import { READING_CLASS } from "./reading";

/** The note as HTML, ready to be put into the print page. */
export interface RenderedNote {
  html: string;
  title: string;
}

/** The text of the note, including changes that are not saved yet. */
async function noteText(app: App, file: TFile): Promise<string> {
  for (const leaf of app.workspace.getLeavesOfType("markdown")) {
    const view = leaf.view;
    if (view instanceof MarkdownView && view.file?.path === file.path) return view.editor.getValue();
  }
  return app.vault.read(file);
}

/** Wait until the rendered note stops changing (embeds, diagrams and other plugins render later). */
function settle(el: HTMLElement, quietMs = 300, maxMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    let quiet = window.setTimeout(done, quietMs);
    const max = window.setTimeout(done, maxMs);
    const observer = new MutationObserver(() => {
      window.clearTimeout(quiet);
      quiet = window.setTimeout(done, quietMs);
    });
    observer.observe(el, { childList: true, subtree: true, attributes: true, characterData: true });
    function done() {
      observer.disconnect();
      window.clearTimeout(quiet);
      window.clearTimeout(max);
      resolve();
    }
  });
}

export interface RenderOptions {
  keepBlankLines: boolean;
  keepIndent: boolean;
  blankInLists: boolean;
  blankInMath: boolean;
  showTitle: boolean;
}

export async function renderNote(app: App, file: TFile, opts: RenderOptions): Promise<RenderedNote> {
  let md = stripFrontmatter(await noteText(app, file));
  // Indentation first: the empty-line rules then see indented paragraphs as ordinary ones.
  if (opts.keepIndent) md = keepIndent(md);
  if (opts.keepBlankLines) md = keepBlankLines(md, { lists: opts.blankInLists, math: opts.blankInMath });

  const fm = app.metadataCache.getFileCache(file)?.frontmatter;
  const raw: unknown = fm?.cssclasses ?? fm?.cssclass;
  const cssclasses = (Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/[\s,]+/) : []).filter(
    (c): c is string => typeof c === "string" && /^[\w-]+$/.test(c),
  );

  const host = document.body.createDiv({ cls: "pdf-preview-print-render print" });
  const view = host.createDiv({ cls: ["markdown-preview-view", "markdown-rendered", ...cssclasses] });
  const component = new Component();
  component.load();
  try {
    if (opts.showTitle) view.createEl("h1", { cls: "pdf-preview-print-title", text: file.basename });
    const body = view.createDiv();
    await MarkdownRenderer.render(app, md, body, file.path, component);
    await settle(view);

    // Drawings on a canvas would be lost when the HTML is copied, so turn them into pictures.
    for (const canvas of Array.from(view.querySelectorAll("canvas"))) {
      try {
        const img = createEl("img", { attr: { src: canvas.toDataURL("image/png") } });
        img.setCssProps({ width: `${canvas.clientWidth || canvas.width}px` });
        canvas.replaceWith(img);
      } catch {
        // A canvas with pictures from other sites cannot be read; leave it out.
      }
    }
    // Links to other notes lead nowhere in a PDF.
    for (const a of Array.from(view.querySelectorAll("a.internal-link"))) a.removeAttribute("href");
    for (const img of Array.from(view.querySelectorAll("img"))) img.removeAttribute("loading");
    // The reading-view spacing is done differently in the PDF.
    for (const el of Array.from(view.querySelectorAll<HTMLElement>(`.${READING_CLASS}, .${GAP_BEFORE_CLASS}`))) {
      el.removeClasses([READING_CLASS, GAP_BEFORE_CLASS]);
      el.setCssProps({ [LINES_VAR]: "" });
    }
    // Space between list items: the marker tells how many lines; the space goes on its paragraph or list item.
    for (const m of Array.from(view.querySelectorAll<HTMLElement>(`span.${GAP_CLASS}`))) {
      const n = Number(new RegExp(`${GAP_CLASS}-(\\d+)`).exec(m.className)?.[1] ?? 0);
      // Between list items the space goes on the item; in a paragraph inside an item, on the paragraph.
      const parent = m.parentElement;
      const li = m.closest("li");
      const firstP = li?.querySelector(":scope > p");
      const target = parent?.tagName === "P" && li && parent !== firstP ? parent : (li ?? parent);
      if (target && n > 0) {
        target.addClass(GAP_BEFORE_CLASS);
        target.setCssProps({ [LINES_VAR]: String(n) });
      }
      m.remove();
    }

    return { html: host.innerHTML, title: file.basename };
  } finally {
    component.unload();
    host.remove();
  }
}

/** All styles of the app (theme, snippets, plugins), as text. */
export function collectCss(): string {
  const out: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) out.push(rule.cssText);
    } catch {
      // Style sheets from other sites cannot be read.
    }
  }
  return out.join("\n");
}

/** The classes for the body of the print page: Obsidian's, always with the light theme. */
export function bodyClass(gray: boolean): string {
  const cls = Array.from(document.body.classList).filter((c) => c !== "theme-dark" && c !== "theme-light");
  cls.push("theme-light", PAGE_CLASS);
  if (gray) cls.push(GRAY_CLASS);
  return cls.join(" ");
}

export function bodyStyle(): string {
  return document.body.getAttribute("style") ?? "";
}

export function baseFontPx(): number {
  const v = parseFloat(getComputedStyle(document.body).getPropertyValue("--font-text-size"));
  return Number.isFinite(v) && v > 0 ? v : 16;
}
