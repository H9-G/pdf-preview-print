/**
 * Empty lines. Markdown folds several empty lines into one gap; here every empty line after the first
 * is kept as one more line of space, the way the editor shows it.
 */

export const BLANK_CLASS = "pdf-preview-print-blank";
/** Marks a list item or paragraph inside a list that gets space above it (set as padding, see styles.css). */
export const GAP_CLASS = "pdf-preview-print-gap";
export const GAP_BEFORE_CLASS = "pdf-preview-print-gap-before";
export const LINES_VAR = "--pdf-preview-print-blank-lines";

export interface BlankOptions {
  /** Also between list items and inside list items. */
  lists: boolean;
  /** Also inside math blocks: a block is split into separate formulas at its empty lines. */
  math: boolean;
}

const isBlank = (line: string) => line.trim() === "";
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/;
const LIST_START = /^(\s*(?:(?:[-*+]|\d+[.)])\s+(?:\[.\]\s+)?)?)/;
const FENCE = /^\s*(`{3,}|~{3,})/;
/** Text that must stay at the very start of its line to keep its meaning. */
const KEEP_AT_START = /^(?:`{3}|~{3}|\$\$|[#>|<]|[-*_](?:\s*[-*_]){2,}\s*$)/;

/** Take the YAML front matter off the start of a note. */
export function stripFrontmatter(md: string): string {
  const m = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/.exec(md);
  return m ? md.slice(m[0].length) : md;
}

function countOf(s: string, part: string): number {
  return s.split(part).length - 1;
}

const spacer = (extra: number) => `<div class="${BLANK_CLASS}">${"<br>".repeat(extra)}</div>`;

/** Put a marker at the start of a list item's text (after the bullet and the task box). */
function withGap(line: string, extra: number): string | null {
  const start = LIST_START.exec(line)?.[1] ?? "";
  const rest = line.slice(start.length);
  if (rest.trim() === "" || KEEP_AT_START.test(rest.trimStart())) return null;
  return `${start}<span class="${GAP_CLASS} ${GAP_CLASS}-${extra}"></span>${rest}`;
}

/** A math block whose body has empty lines (outside \begin…\end) becomes several blocks, with space between. */
function splitMath(body: string[]): string[] | null {
  const parts: { lines: string[]; blanks: number }[] = [];
  let cur: string[] = [];
  let depth = 0;
  let run = 0;
  let before = 0;
  for (const l of body) {
    if (depth === 0 && isBlank(l)) {
      run++;
      continue;
    }
    if (run > 0 && cur.length > 0) {
      parts.push({ lines: cur, blanks: before });
      cur = [];
      before = run;
    }
    run = 0;
    cur.push(l);
    depth = Math.max(0, depth + countOf(l, "\\begin{") - countOf(l, "\\end{"));
  }
  if (cur.length > 0) parts.push({ lines: cur, blanks: before });
  if (parts.length <= 1) return null;
  const out: string[] = [];
  parts.forEach((p, i) => {
    if (i > 0) {
      out.push("");
      if (p.blanks > 1) out.push(spacer(p.blanks - 1), "");
    }
    out.push("$$", ...p.lines, "$$");
  });
  return out;
}

/**
 * For the PDF: after each run of two or more empty lines between blocks, put a spacer with one line
 * per extra empty line. Code blocks keep their empty lines by themselves and are not changed.
 */
export function keepBlankLines(md: string, o: BlankOptions = { lists: true, math: true }): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let fence: string | null = null; // the opening ``` or ~~~ of the code block we are in
  let comment = false;
  let blanks = 0;
  let prev: string | null = null; // last line with text

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const free = fence === null && !comment;
    if (free && isBlank(line)) {
      blanks++;
      out.push(line);
      continue;
    }

    if (free && blanks > 0 && prev !== null) {
      const inList = LIST_ITEM.test(prev) || /^[ \t]/.test(prev);
      const indented = /^[ \t]/.test(line);
      if (inList && LIST_ITEM.test(line)) {
        // Between list items: the list shows no gap of its own, so every empty line becomes a line of space.
        // The empty lines are taken out, so the list stays one tight list.
        const marked = o.lists ? withGap(line, blanks) : null;
        if (marked !== null) {
          out.splice(out.length - blanks, blanks);
          line = marked;
        }
      } else if (indented) {
        // A paragraph inside a list item: like other paragraphs, the first empty line is the paragraph gap.
        if (o.lists && inList && blanks > 1) line = withGap(line, blanks - 1) ?? line;
      } else if (blanks > 1) {
        out.push(spacer(blanks - 1), "");
      }
    }
    blanks = 0;

    // Math block: "$$" alone on a line, up to the next "$$" alone.
    if (free && line.trim() === "$$") {
      let end = i + 1;
      while (end < lines.length && lines[end].trim() !== "$$") end++;
      if (end < lines.length) {
        const body = lines.slice(i + 1, end);
        const split = o.math && !/^[ \t]/.test(line) ? splitMath(body) : null;
        out.push(...(split ?? [line, ...body, lines[end]]));
        prev = lines[end];
        i = end;
        continue;
      }
    }

    out.push(line);
    prev = line;

    const f = FENCE.exec(line);
    if (fence !== null) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length && line.trim() === f[1]) fence = null;
      continue;
    }
    if (comment) {
      if (countOf(line, "%%") % 2 === 1) comment = false;
      continue;
    }
    if (f) fence = f[1];
    else if (countOf(line, "%%") % 2 === 1) comment = true;
  }
  return out.join("\n");
}

/** A list item line, also inside a quote or callout. */
const QUOTED_LIST_ITEM = /^(?:\s*>)*\s*(?:[-*+]|\d+[.)])\s/;
const unquote = (line: string) => line.replace(/^(?:\s*>)+/, "");

/**
 * For the reading view: for each list item in lines lineStart…lineEnd (in order), how many empty lines
 * are right above it. Lines in code blocks are skipped; the first line of the range counts as 0.
 */
export function listItemGaps(text: string, lineStart: number, lineEnd: number): number[] {
  const lines = linesOf(text);
  const out: number[] = [];
  let fence: string | null = null;
  for (let i = lineStart; i <= lineEnd && i < lines.length; i++) {
    const line = unquote(lines[i]);
    const f = FENCE.exec(line);
    if (fence !== null) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length) fence = null;
      continue;
    }
    if (f) {
      fence = f[1];
      continue;
    }
    if (!QUOTED_LIST_ITEM.test(lines[i])) continue;
    let n = 0;
    let j = i - 1;
    while (j >= lineStart && isBlank(unquote(lines[j]))) {
      n++;
      j--;
    }
    out.push(j < lineStart ? 0 : n);
  }
  return out;
}

/**
 * For the reading view: the space above the block that starts at `lineStart`.
 * Between two parts of a list every empty line counts (`list: true`); elsewhere the first one is the normal gap.
 */
export function spaceBefore(text: string, lineStart: number, lineEnd = lineStart): { lines: number; list: boolean } {
  const lines = linesOf(text);
  let start = lineStart;
  while (start < lineEnd && start < lines.length && isBlank(lines[start])) start++;
  let i = start - 1;
  let n = 0;
  while (i >= 0 && isBlank(lines[i])) {
    n++;
    i--;
  }
  if (i < 0 || n === 0) return { lines: 0, list: false };
  const prev = lines[i];
  const cur = lines[start] ?? "";
  const list = (QUOTED_LIST_ITEM.test(prev) || /^[ \t]/.test(prev)) && QUOTED_LIST_ITEM.test(cur);
  return list ? { lines: n, list } : { lines: Math.max(0, n - 1), list };
}

let cacheText = "";
let cacheLines: string[] = [];

function linesOf(text: string): string[] {
  if (text !== cacheText) {
    cacheText = text;
    cacheLines = text.split(/\r?\n/);
  }
  return cacheLines;
}

/**
 * For the reading view: how many extra empty lines (beyond the first) are right above the line
 * `lineStart` in `text`. Nothing is added above the first block of the note.
 */
export function extraBlankLinesBefore(text: string, lineStart: number, lineEnd = lineStart): number {
  const lines = linesOf(text);
  let start = lineStart;
  while (start < lineEnd && start < lines.length && isBlank(lines[start])) start++;
  let i = start - 1;
  let n = 0;
  while (i >= 0 && isBlank(lines[i])) {
    n++;
    i--;
  }
  if (i < 0) return 0;
  return Math.max(0, n - 1);
}
