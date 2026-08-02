// Create a product and its pieces in one submit.
//
// Every product has at least one piece, so the two are entered together and
// written together — the backend rolls the product back if the piece insert
// fails, rather than leaving a piece-less orphan behind.
//
// The piece grid is the primary surface here, not an afterthought: it takes a
// pasted block from a spreadsheet or from another product's pieces (identical
// columns, so ⌘C over there pastes cleanly here), and it also takes typing when
// there are only one or two.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ClipboardPaste, Loader2, Search } from 'lucide-react'
import {
  useCreateProduct,
  useGetFilterOptions,
  useGetProduct,
  useListProducts,
} from '../hooks/backend/inventory'
import { useAutoTrigger, useDebounced } from '../lib/hooks'
import {
  COMPLETENESS,
  PRODUCT_FIELDS,
  type FilterOptions,
  type Piece,
  type Product,
  type ProductField,
  type ProductRow,
} from '../lib/types'
import { Button, Field, Kbd } from '../components/ui'
import { DataGrid, isRowBlank, makeRow, type GridRow } from '../components/DataGrid'
import { PIECE_GRID_COLUMNS, pieceToRow, rowToPiece } from '../components/pieceColumns'

const MIN_ROWS = 4

/** Fields worth keeping when entering a run of related products back to back. */
const STICKY_FIELDS: ProductField[] = ['company', 'type', 'subtype', 'platform', 'year']

export function NewProduct({ onCreated }: { onCreated: (uuid: string) => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [rows, setRows] = useState<GridRow[]>(() =>
    Array.from({ length: MIN_ROWS }, () => makeRow(PIECE_GRID_COLUMNS)),
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState<{ uuid: string; pieces: number } | null>(null)

  const optionsHook = useGetFilterOptions()
  useAutoTrigger(optionsHook.trigger, {})
  const options = optionsHook.data as FilterOptions | undefined

  const create = useCreateProduct()

  const filledPieces = rows.filter((r) => (r.cells['part_name'] ?? '').trim() !== '').length
  const nameOk = (draft['name'] ?? '').trim() !== ''
  const canSave = nameOk && filledPieces > 0 && !saving

  // Subtype suggestions narrow to the chosen type, matching the list page.
  const subtypeSuggestions = useMemo(() => {
    if (!options) return []
    const chosen = (draft['type'] ?? '').trim()
    const relevant = chosen === '' ? options.subtypes : options.subtypes.filter((s) => s.type === chosen)
    return [...new Set(relevant.map((s) => s.value))]
  }, [options, draft])

  function reset(keepSticky: boolean) {
    setDraft((prev) => {
      if (!keepSticky) return {}
      const kept: Record<string, string> = {}
      for (const field of STICKY_FIELDS) {
        const value = prev[field]
        if (value !== undefined && value !== '') kept[field] = value
      }
      return kept
    })
    setRows(Array.from({ length: MIN_ROWS }, () => makeRow(PIECE_GRID_COLUMNS)))
    setError(null)
  }

  async function submit(then: 'view' | 'again') {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const product: Record<string, string | null> = {}
      for (const field of PRODUCT_FIELDS) {
        const value = (draft[field] ?? '').trim()
        product[field] = value === '' ? null : value
      }

      const pieces = rows.filter((row) => !isRowBlank(row)).map(rowToPiece)

      const created = (await create.trigger({ product, pieces })) as
        | { uuid: string; pieceCount: number }
        | undefined

      // Retool's hook resolves with the handler's return value; fall back to
      // the hook's own data if this build doesn't.
      const result = created ?? (create.data as { uuid: string; pieceCount: number } | undefined)

      if (then === 'again') {
        setJustSaved({ uuid: result?.uuid ?? '', pieces: pieces.length })
        reset(true)
      } else if (result?.uuid !== undefined && result.uuid !== '') {
        onCreated(result.uuid)
      } else {
        // Saved, but without a uuid there's nothing to navigate to.
        setJustSaved({ uuid: '', pieces: pieces.length })
        reset(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="iv-form">
      <div className="iv-form-inner">
        <h1>New product</h1>
        <p className="iv-form-lede">
          A product and its pieces are saved together. Paste a block of pieces from a spreadsheet,
          or clone them from a product you already have.
        </p>

        {error !== null && <div className="iv-error">{error}</div>}

        {justSaved !== null && (
          <div
            className="iv-error"
            style={{
              borderColor: 'hsl(var(--success) / 0.5)',
              background: 'hsl(var(--success) / 0.09)',
              color: 'hsl(var(--success))',
            }}
          >
            <Check size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
            Saved with {justSaved.pieces} {justSaved.pieces === 1 ? 'piece' : 'pieces'}. Company and
            type were kept for the next one.
            {justSaved.uuid !== '' && (
              <>
                {' '}
                <Button size="sm" variant="ghost" onClick={() => onCreated(justSaved.uuid)}>
                  View it
                </Button>
              </>
            )}
          </div>
        )}

        <div className="iv-card">
          <div className="iv-card-head">Product</div>
          <div className="iv-card-body">
            <div className="iv-formgrid">
              <TextField
                field="name"
                label="Name"
                draft={draft}
                setDraft={setDraft}
                required
                autoFocus
              />
              <TextField field="version" label="Version" draft={draft} setDraft={setDraft} />
              <TextField
                field="company"
                label="Company"
                draft={draft}
                setDraft={setDraft}
                suggestions={options?.companies.map((o) => o.value)}
              />
              <TextField field="year" label="Year" draft={draft} setDraft={setDraft} />
              <TextField
                field="type"
                label="Type"
                draft={draft}
                setDraft={setDraft}
                suggestions={options?.types.map((o) => o.value)}
              />
              <TextField
                field="subtype"
                label="Subtype"
                draft={draft}
                setDraft={setDraft}
                suggestions={subtypeSuggestions}
              />
              <TextField
                field="platform"
                label="Platform"
                draft={draft}
                setDraft={setDraft}
                suggestions={options?.platforms.map((o) => o.value)}
              />
              <Field label="Completeness">
                <select
                  className="iv-select"
                  value={draft['complete'] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, complete: e.target.value }))}
                >
                  <option value="">Not set</option>
                  {COMPLETENESS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Notes" wide>
                <textarea
                  className="iv-input"
                  value={draft['notes'] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="iv-card">
          <div className="iv-card-head">
            Pieces
            <span className="iv-hint">
              {filledPieces} {filledPieces === 1 ? 'row' : 'rows'} with a part name · paste with{' '}
              <Kbd>⌘V</Kbd>
            </span>
          </div>
          <div className="iv-card-body">
            <ClonePieces
              onClone={(pieces) => {
                // Append rather than replace, and drop the blank filler rows so
                // cloned pieces don't land after a gap.
                setRows((prev) => [
                  ...prev.filter((r) => !isRowBlank(r)),
                  ...pieces.map((piece) => makeRow(PIECE_GRID_COLUMNS, pieceToRow(piece).cells)),
                ])
              }}
            />
            <div style={{ marginTop: 10 }}>
              <DataGrid
                columns={PIECE_GRID_COLUMNS}
                rows={rows}
                onRowsChange={setRows}
                minRows={MIN_ROWS}
                footerNote={
                  filledPieces === 0 ? 'At least one piece needs a part name' : undefined
                }
              />
            </div>
          </div>
        </div>

        <div className="iv-actions">
          <Button variant="primary" onClick={() => void submit('view')} disabled={!canSave}>
            {saving ? <Loader2 size={12} /> : <Check size={12} />} Save product
          </Button>
          <Button onClick={() => void submit('again')} disabled={!canSave}>
            Save &amp; add another
          </Button>
          <Button variant="ghost" onClick={() => reset(false)} disabled={saving}>
            Clear
          </Button>
          <span className="iv-hint">
            {!nameOk
              ? 'A name is required'
              : filledPieces === 0
                ? 'Add at least one piece'
                : `Ready — ${filledPieces} ${filledPieces === 1 ? 'piece' : 'pieces'}`}
          </span>
        </div>
      </div>
    </div>
  )
}

function TextField({
  field,
  label,
  draft,
  setDraft,
  suggestions,
  required,
  autoFocus,
}: {
  field: ProductField
  label: string
  draft: Record<string, string>
  setDraft: (fn: (d: Record<string, string>) => Record<string, string>) => void
  suggestions?: string[] | undefined
  required?: boolean
  autoFocus?: boolean
}) {
  const listId = suggestions === undefined ? undefined : `iv-new-${field}`
  return (
    <Field label={required === true ? `${label} *` : label}>
      <input
        className="iv-input"
        value={draft[field] ?? ''}
        list={listId}
        autoFocus={autoFocus === true}
        onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
      />
      {/* Suggest values already in the collection so spellings don't drift into
          near-duplicates ("Apple" vs "Apple Computer"). */}
      {suggestions !== undefined && (
        <datalist id={listId}>
          {suggestions.slice(0, 400).map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      )}
    </Field>
  )
}

/**
 * Find an existing product and pull its pieces into the grid as a starting
 * point — the fastest path for the many near-identical products in a
 * collection like this (same manual, same disk set, different revision).
 */
function ClonePieces({ onClone }: { onClone: (pieces: Piece[]) => void }) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState('')
  const debouncedQ = useDebounced(q, 250)
  const applied = useRef('')

  const list = useListProducts()
  useAutoTrigger(
    list.trigger,
    { q: debouncedQ, limit: 8, sort: 'name', dir: 'asc' },
    debouncedQ.trim().length >= 2,
  )
  const matches = (list.data as { rows: ProductRow[] } | undefined)?.rows ?? []

  const detail = useGetProduct()

  useEffect(() => {
    if (picked === '') return
    const data = detail.data as { product: Product | null; pieces: Piece[] } | undefined
    // Ignore data still belonging to a previous pick.
    if (!data?.product || data.product.uuid !== picked) return
    if (applied.current === picked) return
    applied.current = picked
    onClone(data.pieces)
    setPicked('')
    setQ('')
  }, [detail.data, picked, onClone])

  return (
    <div>
      <label className="iv-label">Clone pieces from an existing product</label>
      <div className="iv-search" style={{ maxWidth: 420 }}>
        <span className="iv-search-icon">
          <Search size={13} />
        </span>
        <input
          className="iv-input"
          value={q}
          placeholder="Search by name or company…"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {debouncedQ.trim().length >= 2 && matches.length > 0 && (
        <div
          className="iv-ms-panel"
          style={{ position: 'static', width: 420, marginTop: 4, boxShadow: 'none' }}
        >
          <div className="iv-ms-list" style={{ maxHeight: 180 }}>
            {matches.map((row) => (
              <button
                key={row.uuid}
                className="iv-ms-option"
                onClick={() => {
                  applied.current = ''
                  setPicked(row.uuid)
                  detail.trigger({ uuid: row.uuid })
                }}
                disabled={row.piece_count === 0}
                title={row.piece_count === 0 ? 'This product has no pieces to clone' : undefined}
              >
                <ClipboardPaste size={11} />
                <span className="iv-ms-option-name">
                  {row.name}
                  {row.company !== null && <span className="iv-muted"> · {row.company}</span>}
                </span>
                <span className="iv-ms-option-count">
                  {row.piece_count} {row.piece_count === 1 ? 'piece' : 'pieces'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
