import { App, MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownRenderer } from "obsidian";
import { keepIndent } from "./indent";
import { GAP_BEFORE_CLASS, LINES_VAR, listItemGaps, spaceBefore } from "./blank";

export const READING_CLASS = "pdf-preview-print-blank-before";

function mark(el: HTMLElement, cls: string, n: number): void {
  el.toggleClass(cls, n > 0);
  el.setCssProps({ [LINES_VAR]: n > 0 ? String(n) : "" });
}

/**
 * Shows the extra empty lines of a note as space in reading view: above blocks, and between list items.
 * Each block remembers its context, so the space can be updated when lines are added or removed
 * above a block whose own text did not change (Obsidian does not render such a block again).
 */
export class ReadingBlankLines {
  private blocks = new Map<HTMLElement, MarkdownPostProcessorContext>();
  /** While a block is rendered again for indentation, its own blocks are not indented a second time. */
  private rendering = 0;

  constructor(
    private app: App,
    private enabled: () => boolean,
    private indentEnabled: () => boolean,
  ) {}

  async process(el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> {
    const info = ctx.getSectionInfo(el);
    if (!info) return; // not a block of a note in reading view
    this.blocks.set(el, ctx);
    const child = new MarkdownRenderChild(el);
    child.register(() => this.blocks.delete(el));
    ctx.addChild(child);
    this.apply(el, ctx);
    if (this.indentEnabled() && this.rendering === 0) await this.indent(el, ctx, info, child);
  }

  /**
   * Indentation: a paragraph (or a block that Markdown turned into code because it was indented) is
   * rendered again from its text with the leading spaces kept. Lists and fenced code are not touched.
   */
  private async indent(
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
    info: { text: string; lineStart: number; lineEnd: number },
    child: MarkdownRenderChild,
  ): Promise<void> {
    const first = el.firstElementChild;
    if (!first || (first.tagName !== "P" && first.tagName !== "PRE") || el.querySelector("ul, ol")) return;
    const src = info.text.split(/\r?\n/).slice(info.lineStart, info.lineEnd + 1).join("\n");
    const out = keepIndent(src);
    if (out === src) return;
    el.empty();
    this.rendering++;
    try {
      await MarkdownRenderer.render(this.app, out, el, ctx.sourcePath, child);
    } finally {
      this.rendering--;
    }
  }

  private apply(el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
    const info = this.enabled() ? ctx.getSectionInfo(el) : null;
    // Space above the block. When the block goes on a list from the block above, every empty line counts.
    const above = info ? spaceBefore(info.text, info.lineStart, info.lineEnd) : { lines: 0, list: false };
    el.toggleClass(READING_CLASS, !above.list && above.lines > 0);
    el.toggleClass(GAP_BEFORE_CLASS, above.list && above.lines > 0);
    el.setCssProps({ [LINES_VAR]: above.lines > 0 ? String(above.lines) : "" });

    // Space between list items. The items in the page are matched, in order, with the item lines of the note;
    // if the counts differ (unusual content), each item's own line number is used instead.
    const items = Array.from(el.querySelectorAll<HTMLElement>("li"));
    if (items.length === 0) return;
    const gaps = info ? listItemGaps(info.text, info.lineStart, info.lineEnd) : [];
    items.forEach((li, i) => {
      let n = 0;
      if (info) {
        if (gaps.length === items.length) n = gaps[i];
        else if (li.dataset.line !== undefined) {
          const line = info.lineStart + Number(li.dataset.line);
          if (line > info.lineStart) n = listItemGaps(info.text, info.lineStart, line).pop() ?? 0;
        }
      }
      mark(li, GAP_BEFORE_CLASS, n);
    });
  }

  refresh(): void {
    for (const [el, ctx] of this.blocks) this.apply(el, ctx);
  }

  clear(): void {
    for (const el of this.blocks.keys()) {
      mark(el, READING_CLASS, 0);
      el.removeClass(GAP_BEFORE_CLASS);
      for (const g of Array.from(el.querySelectorAll<HTMLElement>(`.${GAP_BEFORE_CLASS}`))) mark(g, GAP_BEFORE_CLASS, 0);
    }
    this.blocks.clear();
  }
}
