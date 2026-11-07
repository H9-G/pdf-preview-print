/**
 * A hidden web view that holds the print page. Electron makes the PDF from it and prints it.
 * It loads one of Obsidian's own pages first, so pictures and fonts of the vault can be shown.
 */

import { LINE_NO_CLASS } from "./page";

interface WebviewTag extends HTMLElement {
  executeJavaScript(code: string): Promise<unknown>;
  printToPDF(options: object): Promise<Uint8Array>;
  print(options?: object): Promise<void>;
}

const START_PAGE = "app://obsidian.md/help.html";

export interface PageContent {
  title: string;
  css: string;
  html: string;
  bodyStyle: string;
}

const SET_CONTENT = `
(async (d) => {
  document.head.innerHTML = '<meta charset="utf-8">';
  document.title = d.title;
  const app = document.createElement("style");
  app.textContent = d.css;
  document.head.appendChild(app);
  const page = document.createElement("style");
  page.id = "pdf-preview-print-page";
  document.head.appendChild(page);
  document.documentElement.className = "";
  if (d.bodyStyle) document.body.setAttribute("style", d.bodyStyle);
  else document.body.removeAttribute("style");
  document.body.innerHTML = d.html;
  const wait = Array.from(document.images).map((img) =>
    img.complete ? null : new Promise((r) => { img.addEventListener("load", r); img.addEventListener("error", r); }));
  await Promise.race([Promise.all(wait), new Promise((r) => setTimeout(r, 10000))]);
  if (document.fonts) await document.fonts.ready;
  return true;
})`;

/**
 * Lay out the page with new options. With line numbers, a marker is put at the start of every line of text;
 * the number is drawn at the left edge of the text (see lineNumberCss) and moves with its line when pages break.
 */
const SET_PAGE = `
(async (d) => {
  for (const m of Array.from(document.querySelectorAll("." + d.lineClass))) {
    const parent = m.parentNode;
    m.remove();
    if (parent) parent.normalize();
  }
  document.getElementById("pdf-preview-print-page").textContent = d.css;
  document.body.className = d.bodyClass;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  if (document.fonts) await document.fonts.ready;
  if (!d.lineNumbers) return 0;

  const root = document.querySelector(".print .markdown-preview-view");
  if (!root) return 0;
  const skip = ".pdf-preview-print-title, mjx-container, .math, svg, style, script, ." + d.lineClass;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.nodeValue.trim() === "" || (n.parentElement && n.parentElement.closest(skip)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const range = document.createRange();
  const charRect = (node, i) => {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const rs = range.getClientRects();
    return rs.length ? rs[rs.length - 1] : range.getBoundingClientRect();
  };
  const starts = [];
  let bottom = -Infinity;
  let node;
  while ((node = walker.nextNode())) {
    range.selectNodeContents(node);
    for (const r of Array.from(range.getClientRects())) {
      if (r.height === 0) continue;
      if (r.top >= bottom - 2) {
        // A new line starts in this node: find the first character on it.
        let lo = 0;
        let hi = node.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          const c = charRect(node, mid);
          if (c.top >= r.top - 1 && c.height > 0) hi = mid;
          else lo = mid + 1;
        }
        while (lo < node.length - 1 && /\\s/.test(node.nodeValue[lo])) lo++;
        starts.push({ node, offset: lo });
        bottom = r.bottom;
      } else {
        bottom = Math.max(bottom, r.bottom);
      }
    }
  }
  starts.forEach((s, i) => (s.n = i + 1));
  for (let i = starts.length - 1; i >= 0; i--) {
    const s = starts[i];
    const mark = document.createElement("span");
    mark.className = d.lineClass;
    mark.dataset.n = String(s.n);
    // After the first character: a marker right at a line break would belong to the line before.
    const at = Math.min(s.offset + 1, s.node.length);
    const rest = at < s.node.length ? s.node.splitText(at) : null;
    s.node.parentNode.insertBefore(mark, rest ? rest : s.node.nextSibling);
  }
  // Move each number to the left edge of the text, whatever box it sits in.
  const left = root.getBoundingClientRect().left;
  for (const mark of Array.from(document.querySelectorAll("." + d.lineClass))) {
    const box = mark.offsetParent || root;
    mark.style.setProperty("--x", (left - box.getBoundingClientRect().left).toFixed(1) + "px");
  }
  return starts.length;
})`;

export class PrintEngine {
  private view: WebviewTag;
  private ready: Promise<void>;

  constructor(parent: HTMLElement) {
    const wrap = parent.createDiv({ cls: "pdf-preview-print-engine" });
    // "webview" is Electron's own element; createEl only knows the standard tag names.
    this.view = wrap.createEl("webview" as "div", { attr: { src: START_PAGE } }) as unknown as WebviewTag;
    this.ready = new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("The print page did not load.")), 20000);
      this.view.addEventListener(
        "dom-ready",
        () => {
          window.clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
  }

  private async run(script: string, data: unknown): Promise<void> {
    await this.ready;
    await this.view.executeJavaScript(`${script}(${JSON.stringify(data)})`);
  }

  setContent(c: PageContent): Promise<void> {
    return this.run(SET_CONTENT, c);
  }

  setPage(css: string, bodyClass: string, lineNumbers: boolean): Promise<void> {
    return this.run(SET_PAGE, { css, bodyClass, lineNumbers, lineClass: LINE_NO_CLASS });
  }

  async pdf(options: object): Promise<Uint8Array> {
    await this.ready;
    return this.view.printToPDF(options);
  }

  async print(options: object): Promise<void> {
    await this.ready;
    await this.view.print(options);
  }

  destroy(): void {
    this.view.parentElement?.remove();
  }
}
