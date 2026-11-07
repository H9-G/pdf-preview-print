import { MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
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

  constructor(private enabled: () => boolean) {}

  process(el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
    if (!ctx.getSectionInfo(el)) return; // not a block of a note in reading view
    this.blocks.set(el, ctx);
    const child = new MarkdownRenderChild(el);
    child.register(() => this.blocks.delete(el));
    ctx.addChild(child);
    this.apply(el, ctx);
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
