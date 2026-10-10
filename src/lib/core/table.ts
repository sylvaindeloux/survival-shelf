/** Minimal GitHub-flavored Markdown table reader and writer. */

/** True when the line contains a cell separator that is not escaped. */
export function isTableLine(line: string): boolean {
  return /(^|[^\\])\|/.test(line);
}

/** Splits a table row into trimmed cells, unescaping `\|`. */
export function splitRow(line: string): string[] {
  let text = line.trim();
  if (text.startsWith('|')) text = text.slice(1);
  if (text.endsWith('|') && !text.endsWith('\\|')) text = text.slice(0, -1);
  const cells: string[] = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '\\' && text[i + 1] === '|') {
      current += '|';
      i++;
    } else if (char === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/** True for the `|---|:---:|` line under a table header. */
export function isSeparatorRow(line: string): boolean {
  if (!isTableLine(line)) return false;
  return splitRow(line).every((cell) => /^:?-+:?$/.test(cell));
}

export function escapeCell(text: string): string {
  return text.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();
}

function width(text: string): number {
  return Array.from(text).length;
}

/** Renders an aligned table so the raw file stays easy to read. */
export function formatTable(headers: string[], rows: string[][]): string {
  const escapedHeaders = headers.map(escapeCell);
  const escapedRows = rows.map((row) => headers.map((_, i) => escapeCell(row[i] ?? '')));
  const widths = escapedHeaders.map((header, i) =>
    Math.max(3, width(header), ...escapedRows.map((row) => width(row[i]))),
  );
  const line = (cells: string[]) =>
    `| ${cells.map((cell, i) => cell + ' '.repeat(widths[i] - width(cell))).join(' | ')} |`;
  return [line(escapedHeaders), `|${widths.map((w) => '-'.repeat(w + 2)).join('|')}|`, ...escapedRows.map(line)].join(
    '\n',
  );
}
