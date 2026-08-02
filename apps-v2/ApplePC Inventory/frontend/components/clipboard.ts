// Clipboard table encoding, kept separate from the grid so it can be reasoned
// about (and fixed) on its own.
//
// Spreadsheets put tab-separated values on the clipboard as text/plain, and
// quote any field containing a tab, newline, or quote — so a piece note with a
// line break in it survives a round trip through Excel or Google Sheets. A
// naive `split('\t')` corrupts exactly those cells, which is why this is a real
// parser rather than a split.

/** Parse clipboard text into a row-major matrix. */
export function parseTable(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]

    if (quoted) {
      if (ch === '"') {
        // A doubled quote inside a quoted field is one literal quote.
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        quoted = false
        i += 1
        continue
      }
      field += ch
      i += 1
      continue
    }

    // A quote only opens a quoted field at the start of that field.
    if (ch === '"' && field === '') {
      quoted = true
      i += 1
      continue
    }

    if (ch === '\t') {
      row.push(field)
      field = ''
      i += 1
      continue
    }

    if (ch === '\r' || ch === '\n') {
      row.push(field)
      field = ''
      rows.push(row)
      row = []
      i += ch === '\r' && text[i + 1] === '\n' ? 2 : 1
      continue
    }

    field += ch
    i += 1
  }

  // A trailing newline shouldn't invent an extra empty row.
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

/** Encode a matrix as clipboard text, quoting only where required. */
export function encodeTable(matrix: string[][]): string {
  return matrix
    .map((row) =>
      row
        .map((cell) => (/[\t\n\r"]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell))
        .join('\t'),
    )
    .join('\n')
}
