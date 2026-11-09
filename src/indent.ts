/**
 * Indentation. Markdown drops the spaces and tabs at the start of a line (and four of them make a code block);
 * here they are kept as non-breaking spaces, so the line is indented as in the editor.
 * Lists, code blocks, math blocks, comments and lines whose start has a meaning (headings, quotes, tables, HTML)
 * are left alone.
 */

const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/;
const FENCE = /^\s*(`{3,}|~{3,})/;
const KEEP_AT_START = /^(?:#{1,6}(?:\s|$)|>|\||<|`{3}|~{3}|\$\$|[-*_](?:\s*[-*_]){2,}\s*$)/;

const countOf = (s: string, part: string) => s.split(part).length - 1;

/** Width of leading spaces and tabs in columns; a tab goes to the next multiple of `tab`. */
export function indentWidth(ws: string, tab = 4): number {
  let col = 0;
  for (const c of ws) col = c === "\t" ? col + tab - (col % tab) : col + 1;
  return col;
}

export function keepIndent(md: string, tab = 4): string {
  let fence: string | null = null;
  let math = false;
  let comment = false;
  let inList = false;
  return md
    .split(/\r?\n/)
    .map((line) => {
      const t = line.trim();
      if (fence !== null) {
        const f = FENCE.exec(line);
        if (f && f[1][0] === fence[0] && f[1].length >= fence.length && t === f[1]) fence = null;
        return line;
      }
      if (math) {
        if (t.endsWith("$$")) math = false;
        return line;
      }
      if (comment) {
        if (countOf(line, "%%") % 2 === 1) comment = false;
        return line;
      }
      if (t === "") return line; // an empty line does not end a list
      const f = FENCE.exec(line);
      if (f) {
        fence = f[1];
        return line;
      }
      if (t.startsWith("$$")) {
        if (!(t.length > 2 && t.endsWith("$$"))) math = true;
        return line;
      }
      if (countOf(line, "%%") % 2 === 1) {
        comment = true;
        return line;
      }
      if (LIST_ITEM.test(line)) {
        inList = true;
        return line;
      }
      const ws = /^[ \t]+/.exec(line);
      if (!ws) {
        inList = false;
        return line;
      }
      // Indented lines under a list item belong to the item.
      if (inList || KEEP_AT_START.test(t)) return line;
      return "&nbsp;".repeat(indentWidth(ws[0], tab)) + line.slice(ws[0].length);
    })
    .join("\n");
}
