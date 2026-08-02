// One column definition shared by every piece grid in the app.
//
// This is deliberately a single exported constant rather than per-page config:
// copying rows out of an existing product and pasting them into a new one only
// lands cleanly if both grids have the same columns in the same order. Change
// the set here and both sides stay aligned.

import type { GridColumn } from './DataGrid'
import type { Piece } from '../lib/types'
import { makeRow, type GridRow } from './DataGrid'

export const PIECE_GRID_COLUMNS: GridColumn[] = [
  { key: 'part_name', header: 'Part name', width: 'minmax(180px, 1.5fr)', required: true },
  { key: 'part_type', header: 'Type', width: 'minmax(120px, 0.9fr)', placeholder: '3.5" Disk' },
  { key: 'part_no', header: 'Part no.', width: 'minmax(96px, 0.7fr)', mono: true },
  { key: 'serial', header: 'Serial', width: 'minmax(96px, 0.7fr)', mono: true },
  { key: 'year', header: 'Year', width: '68px' },
  { key: 'location', header: 'Location', width: 'minmax(110px, 0.8fr)' },
  { key: 'condition_notes', header: 'Condition', width: 'minmax(120px, 1fr)' },
  { key: 'notes', header: 'Notes', width: 'minmax(140px, 1.2fr)' },
  { key: 'image', header: 'Image', width: 'minmax(90px, 0.6fr)', mono: true },
]

/** Column keys in grid order — the shape a pasted block is expected to have. */
export const PIECE_GRID_KEYS = PIECE_GRID_COLUMNS.map((c) => c.key)

/** A database piece as a grid row. Nulls become '' so cells are always strings. */
export function pieceToRow(piece: Piece): GridRow {
  const cells: Record<string, string> = {}
  for (const col of PIECE_GRID_COLUMNS) {
    const value = (piece as unknown as Record<string, unknown>)[col.key]
    cells[col.key] = value === null || value === undefined ? '' : String(value)
  }
  return { key: `db-${piece.id}`, id: piece.id, cells }
}

export function blankPieceRow(): GridRow {
  return makeRow(PIECE_GRID_COLUMNS)
}

/** Grid row → the payload savePieces/createProduct expect. */
export function rowToPiece(row: GridRow): Record<string, string | null> & { part_name: string } {
  const out: Record<string, string | null> = {}
  for (const col of PIECE_GRID_COLUMNS) {
    const value = (row.cells[col.key] ?? '').trim()
    out[col.key] = value === '' ? null : value
  }
  return { ...out, part_name: (row.cells['part_name'] ?? '').trim() }
}
