// An editable, copy/paste-capable grid.
//
// Copying and pasting between existing products and new ones is a primary flow
// here, so the grid behaves like a spreadsheet rather than a form: a cell
// cursor, extendable range selection, and clipboard round-trips that survive
// Excel and Google Sheets.
//
//   arrows / tab / enter   move the cursor        shift+arrows  extend range
//   type                   replace and edit      F2 / dblclick edit in place
//   cmd/ctrl+C / X / V     copy / cut / paste    cmd/ctrl+D    fill down
//   delete / backspace     clear the range       cmd/ctrl+Z    undo (shift: redo)
//   shift/alt+enter        soft return, in a multiline column only
//
// Paste grows the grid: dropping 40 rows onto the last row appends what it
// needs. Cells are divs in a CSS grid rather than a <table> so the range tint
// can be painted without fighting table layout.
//
// The grid is controlled — the parent owns `rows` and applies `onRowsChange`.
// Selection, editing, and the undo stack are internal.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Kbd } from './ui'
import { encodeTable, parseTable } from './clipboard'

export type GridColumn = {
  key: string
  header: string
  /** A CSS grid track size, e.g. '1.4fr' or '90px'. */
  width: string
  placeholder?: string
  mono?: boolean
  /** Empty cells in this column mark the row invalid. */
  required?: boolean
  /**
   * Prose column: the editor is a textarea that takes soft returns, and it
   * floats over the rows below rather than growing the row. The closed cell
   * still renders on one line — hover for the full value.
   */
  multiline?: boolean
}

export type GridRow = {
  /** Stable client-side key. Not the database id. */
  key: string
  /** The database id, or null for a row that doesn't exist yet. */
  id: number | null
  cells: Record<string, string>
}

type Cursor = { r: number; c: number }

let rowCounter = 0

/** A blank row with every column present, so cell writes never hit undefined. */
export function makeRow(columns: GridColumn[], seed?: Record<string, string>): GridRow {
  const cells: Record<string, string> = {}
  for (const col of columns) cells[col.key] = seed?.[col.key] ?? ''
  rowCounter += 1
  return { key: `new-${rowCounter}`, id: null, cells }
}

export function isRowBlank(row: GridRow): boolean {
  return Object.values(row.cells).every((v) => v.trim() === '')
}

/** Grow a multiline editor to its content. CSS caps it and scrolls past that. */
function autosize(el: HTMLInputElement | HTMLTextAreaElement | null): void {
  if (!(el instanceof HTMLTextAreaElement)) return
  const before = el.style.height
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
  // An editor opened on the last visible row hangs past the bottom of the
  // grid's scroll box. Nudge it into view, but only when it actually changed
  // height, so ordinary typing doesn't jitter the grid.
  if (el.style.height !== before) el.scrollIntoView({ block: 'nearest' })
}

export function DataGrid({
  columns,
  rows,
  onRowsChange,
  dirtyCells,
  minRows = 0,
  onDeleteRow,
  footerNote,
}: {
  columns: GridColumn[]
  rows: GridRow[]
  onRowsChange: (next: GridRow[]) => void
  /** `${rowKey}:${columnKey}` for cells changed since load. */
  dirtyCells?: Set<string> | undefined
  /** Keep at least this many rows present, topping up with blanks. */
  minRows?: number | undefined
  /** Called instead of a plain splice, so a persisted row can be tracked. */
  onDeleteRow?: ((row: GridRow) => void) | undefined
  footerNote?: string | undefined
}) {
  const [anchor, setAnchor] = useState<Cursor>({ r: 0, c: 0 })
  const [focus, setFocus] = useState<Cursor>({ r: 0, c: 0 })
  const [editing, setEditing] = useState<Cursor | null>(null)
  const [draft, setDraft] = useState('')
  const dragging = useRef(false)
  const container = useRef<HTMLDivElement>(null)
  const activeCell = useRef<HTMLDivElement>(null)
  // Either editor element, so it's set through a callback ref rather than
  // handed to both — a ref object is invariant in its element type.
  const editInput = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  /** Caret position to restore after a draft change React has yet to render. */
  const pendingCaret = useRef<number | null>(null)

  // Undo/redo hold whole-grid snapshots. The grids here are tens of rows, so
  // the memory is irrelevant and the correctness is free.
  const undoStack = useRef<GridRow[][]>([])
  const redoStack = useRef<GridRow[][]>([])

  const rect = useMemo(
    () => ({
      top: Math.min(anchor.r, focus.r),
      bottom: Math.max(anchor.r, focus.r),
      left: Math.min(anchor.c, focus.c),
      right: Math.max(anchor.c, focus.c),
    }),
    [anchor, focus],
  )

  const commitRows = useCallback(
    (next: GridRow[]) => {
      undoStack.current.push(rows)
      if (undoStack.current.length > 60) undoStack.current.shift()
      redoStack.current = []
      onRowsChange(next)
    },
    [rows, onRowsChange],
  )

  // Top up to minRows so there's always somewhere to type.
  useEffect(() => {
    if (minRows > 0 && rows.length < minRows) {
      const extra = Array.from({ length: minRows - rows.length }, () => makeRow(columns))
      onRowsChange([...rows, ...extra])
    }
  }, [rows, minRows, columns, onRowsChange])

  // Keep the cursor on a cell that exists after rows are removed.
  useEffect(() => {
    const maxRow = Math.max(rows.length - 1, 0)
    if (anchor.r > maxRow || focus.r > maxRow) {
      setAnchor((a) => ({ r: Math.min(a.r, maxRow), c: a.c }))
      setFocus((f) => ({ r: Math.min(f.r, maxRow), c: f.c }))
    }
  }, [rows.length, anchor.r, focus.r])

  useEffect(() => {
    function onUp() {
      dragging.current = false
    }
    document.addEventListener('mouseup', onUp)
    return () => document.removeEventListener('mouseup', onUp)
  }, [])

  useLayoutEffect(() => {
    if (editing === null) activeCell.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [anchor, focus, editing])

  // Where the caret lands depends on how the edit was opened. F2, Enter and
  // double-click open on the cell's existing value, and select-all is what a
  // spreadsheet does there. An edit opened by typing already holds that first
  // character, so selecting it would make the second keystroke replace it —
  // the caret goes after it instead.
  const selectAllOnEdit = useRef(true)

  useLayoutEffect(() => {
    if (editing === null) return
    const input = editInput.current
    if (input === null) return
    input.focus()
    if (selectAllOnEdit.current) input.select()
    else input.setSelectionRange(input.value.length, input.value.length)
    autosize(input)
  }, [editing])

  // A soft return sets the draft and asks for the caret to land after it, which
  // can only happen once React has rendered the longer value.
  useLayoutEffect(() => {
    const input = editInput.current
    if (input === null) return
    const caret = pendingCaret.current
    if (caret !== null) {
      input.setSelectionRange(caret, caret)
      pendingCaret.current = null
    }
    autosize(input)
  }, [draft])

  const setCell = useCallback(
    (list: GridRow[], r: number, c: number, value: string): GridRow[] => {
      const column = columns[c]
      const row = list[r]
      if (!column || !row) return list
      const next = [...list]
      next[r] = { ...row, cells: { ...row.cells, [column.key]: value } }
      return next
    },
    [columns],
  )

  function move(dr: number, dc: number, extend: boolean) {
    const r = Math.min(Math.max(focus.r + dr, 0), Math.max(rows.length - 1, 0))
    const c = Math.min(Math.max(focus.c + dc, 0), columns.length - 1)
    setFocus({ r, c })
    if (!extend) setAnchor({ r, c })
  }

  function beginEdit(at: Cursor, initial?: string) {
    const column = columns[at.c]
    const row = rows[at.r]
    if (!column || !row) return
    selectAllOnEdit.current = initial === undefined
    setEditing(at)
    setDraft(initial ?? row.cells[column.key] ?? '')
  }

  /**
   * Insert a soft return at the caret.
   *
   * Done by hand rather than left to the textarea: Enter is preventDefault-ed
   * so plain Enter can still commit, and Alt+Enter doesn't reliably produce
   * input of its own anyway. Both modifiers therefore behave identically.
   */
  function insertNewline() {
    const el = editInput.current
    if (el === null) return
    const start = el.selectionStart ?? draft.length
    const end = el.selectionEnd ?? start
    pendingCaret.current = start + 1
    setDraft(`${draft.slice(0, start)}\n${draft.slice(end)}`)
  }

  function commitEdit(then: 'down' | 'right' | 'stay' | 'up' | 'left') {
    if (editing === null) return
    const { r, c } = editing
    // A click away from an open editor fires both mousedown-commit and
    // blur-commit. Skipping the no-op keeps a second identical snapshot off the
    // undo stack, so one ⌘Z undoes one edit.
    const column = columns[c]
    const current = column ? (rows[r]?.cells[column.key] ?? '') : ''
    if (current !== draft) commitRows(setCell(rows, r, c, draft))
    setEditing(null)
    const target =
      then === 'down'
        ? { r: Math.min(r + 1, rows.length - 1), c }
        : then === 'up'
          ? { r: Math.max(r - 1, 0), c }
          : then === 'right'
            ? { r, c: Math.min(c + 1, columns.length - 1) }
            : then === 'left'
              ? { r, c: Math.max(c - 1, 0) }
              : { r, c }
    setAnchor(target)
    setFocus(target)
    container.current?.focus()
  }

  /** The selected range as a matrix, for copy and for fill-down. */
  function selectedMatrix(): string[][] {
    const out: string[][] = []
    for (let r = rect.top; r <= rect.bottom; r++) {
      const row = rows[r]
      if (!row) continue
      const line: string[] = []
      for (let c = rect.left; c <= rect.right; c++) {
        const column = columns[c]
        line.push(column ? (row.cells[column.key] ?? '') : '')
      }
      out.push(line)
    }
    return out
  }

  function clearSelection() {
    let next = rows
    for (let r = rect.top; r <= rect.bottom; r++) {
      for (let c = rect.left; c <= rect.right; c++) next = setCell(next, r, c, '')
    }
    commitRows(next)
  }

  function fillDown() {
    const top = rows[rect.top]
    if (!top) return
    let next = rows
    for (let r = rect.top + 1; r <= rect.bottom; r++) {
      for (let c = rect.left; c <= rect.right; c++) {
        const column = columns[c]
        if (column) next = setCell(next, r, c, top.cells[column.key] ?? '')
      }
    }
    commitRows(next)
  }

  function applyPaste(text: string) {
    const matrix = parseTable(text)
    if (matrix.length === 0) return

    // A single pasted value fills the whole selection — the usual way to set
    // one location or part type across a batch of rows.
    const single = matrix.length === 1 && matrix[0]?.length === 1
    if (single) {
      const value = matrix[0]?.[0] ?? ''
      let next = rows
      for (let r = rect.top; r <= rect.bottom; r++) {
        for (let c = rect.left; c <= rect.right; c++) next = setCell(next, r, c, value)
      }
      commitRows(next)
      return
    }

    const startR = rect.top
    const startC = rect.left
    // Grow to fit rather than truncating the paste.
    const needed = startR + matrix.length - rows.length
    let next = needed > 0 ? [...rows, ...Array.from({ length: needed }, () => makeRow(columns))] : rows

    matrix.forEach((line, dr) => {
      line.forEach((value, dc) => {
        const c = startC + dc
        // Columns past the right edge are dropped; there's nowhere to put them.
        if (c < columns.length) next = setCell(next, startR + dr, c, value)
      })
    })

    commitRows(next)
    const lastRow = startR + matrix.length - 1
    const lastCol = Math.min(startC + Math.max(...matrix.map((l) => l.length)) - 1, columns.length - 1)
    setAnchor({ r: startR, c: startC })
    setFocus({ r: Math.min(lastRow, next.length - 1), c: lastCol })
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey

    if (editing !== null) {
      // While editing, the input owns most keys; only commit/cancel here.
      if (e.key === 'Enter') {
        e.preventDefault()
        if (columns[editing.c]?.multiline === true && (e.shiftKey || e.altKey)) insertNewline()
        else commitEdit('down')
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setEditing(null)
        container.current?.focus()
      } else if (e.key === 'Tab') {
        e.preventDefault()
        commitEdit(e.shiftKey ? 'left' : 'right')
      }
      return
    }

    if (mod && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault()
      if (e.shiftKey) {
        const next = redoStack.current.pop()
        if (next) {
          undoStack.current.push(rows)
          onRowsChange(next)
        }
      } else {
        const prev = undoStack.current.pop()
        if (prev) {
          redoStack.current.push(rows)
          onRowsChange(prev)
        }
      }
      return
    }

    if (mod && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault()
      fillDown()
      return
    }

    if (mod && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault()
      setAnchor({ r: 0, c: 0 })
      setFocus({ r: Math.max(rows.length - 1, 0), c: columns.length - 1 })
      return
    }

    // Let the browser's own copy/cut/paste events fire for these.
    if (mod && ['c', 'C', 'x', 'X', 'v', 'V'].includes(e.key)) return

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        move(-1, 0, e.shiftKey)
        return
      case 'ArrowDown':
        e.preventDefault()
        move(1, 0, e.shiftKey)
        return
      case 'ArrowLeft':
        e.preventDefault()
        move(0, -1, e.shiftKey)
        return
      case 'ArrowRight':
        e.preventDefault()
        move(0, 1, e.shiftKey)
        return
      case 'Tab':
        e.preventDefault()
        move(0, e.shiftKey ? -1 : 1, false)
        return
      case 'Enter':
        e.preventDefault()
        beginEdit(focus)
        return
      case 'F2':
        e.preventDefault()
        beginEdit(focus)
        return
      case 'Escape':
        e.preventDefault()
        setAnchor(focus)
        return
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        clearSelection()
        return
      case 'Home':
        e.preventDefault()
        move(0, -columns.length, e.shiftKey)
        return
      case 'End':
        e.preventDefault()
        move(0, columns.length, e.shiftKey)
        return
      default:
        break
    }

    // A printable character replaces the cell and drops into edit mode.
    if (!mod && !e.altKey && e.key.length === 1) {
      e.preventDefault()
      beginEdit(focus, e.key)
    }
  }

  function onCopy(e: React.ClipboardEvent) {
    if (editing !== null) return
    e.preventDefault()
    e.clipboardData.setData('text/plain', encodeTable(selectedMatrix()))
  }

  function onCut(e: React.ClipboardEvent) {
    if (editing !== null) return
    e.preventDefault()
    e.clipboardData.setData('text/plain', encodeTable(selectedMatrix()))
    clearSelection()
  }

  function onPaste(e: React.ClipboardEvent) {
    if (editing !== null) return
    e.preventDefault()
    applyPaste(e.clipboardData.getData('text/plain'))
  }

  function onCellMouseDown(r: number, c: number, e: React.MouseEvent) {
    // Committing first means a click away from an open editor keeps the edit.
    if (editing !== null) commitEdit('stay')
    container.current?.focus()
    if (e.shiftKey) {
      setFocus({ r, c })
    } else {
      setAnchor({ r, c })
      setFocus({ r, c })
      dragging.current = true
    }
  }

  function deleteRow(index: number) {
    const row = rows[index]
    if (!row) return
    if (onDeleteRow) onDeleteRow(row)
    commitRows(rows.filter((_, i) => i !== index))
  }

  const template = `36px ${columns.map((c) => c.width).join(' ')}`

  return (
    <>
      <div
        className="iv-grid"
        ref={container}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onCopy={onCopy}
        onCut={onCut}
        onPaste={onPaste}
      >
        <div className="iv-grid-row iv-grid-head" style={{ gridTemplateColumns: template }}>
          <div className="iv-grid-gutter" />
          {columns.map((col) => (
            <div className="iv-grid-cell" key={col.key} title={col.header}>
              {col.header}
              {col.required === true && <span className="iv-muted"> *</span>}
            </div>
          ))}
        </div>

        {rows.map((row, r) => (
          <div className="iv-grid-row" key={row.key} style={{ gridTemplateColumns: template }}>
            <div className="iv-grid-gutter">
              {r + 1}
              <button
                className="iv-grid-del"
                title="Delete row"
                onClick={() => deleteRow(r)}
                tabIndex={-1}
              >
                <Trash2 size={11} />
              </button>
            </div>

            {columns.map((col, c) => {
              const selected = r >= rect.top && r <= rect.bottom && c >= rect.left && c <= rect.right
              const isActive = focus.r === r && focus.c === c
              const isEditing = editing !== null && editing.r === r && editing.c === c
              const value = row.cells[col.key] ?? ''
              const invalid = col.required === true && value.trim() === '' && !isRowBlank(row)

              const classes = ['iv-grid-cell']
              if (selected) classes.push('iv-grid-cell--sel')
              if (isActive) classes.push('iv-grid-cell--active')
              if (isEditing) classes.push('iv-grid-cell--editing')
              // The floating editor needs the cell to stop clipping, and the
              // cell's own ring would cut across it at the first line.
              if (isEditing && col.multiline === true) classes.push('iv-grid-cell--editing-multi')
              if (invalid) classes.push('iv-grid-cell--invalid')
              if (dirtyCells?.has(`${row.key}:${col.key}`) === true) classes.push('iv-grid-cell--dirty')
              if (col.mono === true) classes.push('iv-mono')

              return (
                <div
                  key={col.key}
                  ref={isActive ? activeCell : undefined}
                  className={classes.join(' ')}
                  onMouseDown={(e) => onCellMouseDown(r, c, e)}
                  onMouseEnter={() => {
                    if (dragging.current) setFocus({ r, c })
                  }}
                  onDoubleClick={() => beginEdit({ r, c })}
                  title={value === '' ? undefined : value}
                >
                  {isEditing && col.multiline === true ? (
                    <textarea
                      ref={(el) => {
                        editInput.current = el
                      }}
                      rows={1}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => commitEdit('stay')}
                    />
                  ) : isEditing ? (
                    <input
                      ref={(el) => {
                        editInput.current = el
                      }}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => commitEdit('stay')}
                    />
                  ) : value === '' ? (
                    <span className="iv-grid-placeholder">{col.placeholder ?? ''}</span>
                  ) : (
                    value
                  )}
                </div>
              )
            })}
          </div>
        ))}

        <div className="iv-grid-foot">
          <Button
            size="sm"
            onClick={() => onRowsChange([...rows, makeRow(columns)])}
            title="Append a blank row"
          >
            <Plus size={12} /> Add row
          </Button>
          <span className="iv-hint">
            <Kbd>⌘V</Kbd> paste grows the grid · <Kbd>⌘D</Kbd> fill down · <Kbd>⌘Z</Kbd> undo
            {columns.some((c) => c.multiline === true) && (
              <>
                {' '}
                · <Kbd>⇧↵</Kbd> soft return
              </>
            )}
          </span>
          {footerNote !== undefined && <span className="iv-hint" style={{ marginLeft: 'auto' }}>{footerNote}</span>}
        </div>
      </div>
    </>
  )
}
