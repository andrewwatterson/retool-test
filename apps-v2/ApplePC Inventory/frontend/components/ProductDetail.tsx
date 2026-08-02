// The right-hand pane: one product's fields, and its pieces in the editable
// grid.
//
// The pieces here use the same grid and the same columns as the new-product
// form, so a range can be copied out of an existing product and pasted straight
// into a new one — the flow this app is mostly for.

import { useEffect, useMemo, useState } from 'react'
import { Save, Undo2, X } from 'lucide-react'
import {
  useGetProduct,
  useSavePieces,
  useUpdateProduct,
} from '../hooks/backend/inventory'
import { useAutoTrigger } from '../lib/hooks'
import {
  COMPLETENESS,
  PRODUCT_FIELDS,
  type FilterOptions,
  type Piece,
  type Product,
  type ProductField,
} from '../lib/types'
import { Button, Completeness, Empty, Field, Spinner } from './ui'
import { DataGrid, isRowBlank, type GridRow } from './DataGrid'
import { PIECE_GRID_COLUMNS, pieceToRow, rowToPiece } from './pieceColumns'

type Loaded = { product: Product | null; pieces: Piece[] }

export function ProductDetail({
  uuid,
  options,
  onClose,
  onChanged,
}: {
  uuid: string
  options: FilterOptions | undefined
  onClose: () => void
  onChanged: () => void
}) {
  const { data, loading, error, trigger } = useGetProduct()
  const { refetch } = useAutoTrigger(trigger, { uuid }, uuid !== '')
  const loaded = data as Loaded | undefined
  const product = loaded?.product ?? null

  const [rows, setRows] = useState<GridRow[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [editingProduct, setEditingProduct] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)

  const savePieces = useSavePieces()
  const updateProduct = useUpdateProduct()
  const [saving, setSaving] = useState(false)

  // Baseline for dirty marks: what the rows looked like when loaded.
  const baseline = useMemo(() => {
    const map = new Map<string, Record<string, string>>()
    for (const piece of loaded?.pieces ?? []) {
      const row = pieceToRow(piece)
      map.set(row.key, row.cells)
    }
    return map
  }, [loaded])

  // Adopt server data only when its *content* changes, not on every new object
  // identity the hook hands back. Keying the reset on `loaded` alone would let
  // an unrelated re-render discard in-progress edits, which in a data-entry
  // tool means silently losing typing.
  const serverSignature = useMemo(
    () => JSON.stringify([loaded?.product?.uuid ?? '', loaded?.pieces ?? []]),
    [loaded],
  )

  useEffect(() => {
    setRows((loaded?.pieces ?? []).map(pieceToRow))
    setDeletedIds([])
    setEditingProduct(false)
    setSaveError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSignature])

  const dirtyCells = useMemo(() => {
    const out = new Set<string>()
    for (const row of rows) {
      const before = baseline.get(row.key)
      for (const col of PIECE_GRID_COLUMNS) {
        const now = row.cells[col.key] ?? ''
        // A row with no baseline is new, so every filled cell counts as changed.
        const then = before?.[col.key] ?? ''
        if (now !== then) out.add(`${row.key}:${col.key}`)
      }
    }
    return out
  }, [rows, baseline])

  const hasPieceChanges = dirtyCells.size > 0 || deletedIds.length > 0

  function revertPieces() {
    setRows((loaded?.pieces ?? []).map(pieceToRow))
    setDeletedIds([])
    setSaveError(null)
  }

  async function onSavePieces() {
    if (!product) return
    setSaving(true)
    setSaveError(null)
    try {
      const upserts = rows
        .filter((row) => !isRowBlank(row))
        .filter((row) => row.id === null || PIECE_GRID_COLUMNS.some((c) => dirtyCells.has(`${row.key}:${c.key}`)))
        .map((row) => ({ ...rowToPiece(row), id: row.id }))

      // Nothing to do is a no-op, not an error.
      if (upserts.length === 0 && deletedIds.length === 0) {
        setSaving(false)
        return
      }

      await savePieces.trigger({ productUuid: product.uuid, upserts, deleteIds: deletedIds })
      setDeletedIds([])
      refetch()
      onChanged()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function onSaveProduct() {
    if (!product) return
    setSaving(true)
    setSaveError(null)
    try {
      const changes: Record<string, string | null> = {}
      for (const field of PRODUCT_FIELDS) {
        const next = (draft[field] ?? '').trim()
        const before = product[field] ?? ''
        if (next !== before) changes[field] = next === '' ? null : next
      }
      if (Object.keys(changes).length > 0) {
        await updateProduct.trigger({ uuid: product.uuid, changes })
        refetch()
        onChanged()
      }
      setEditingProduct(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  function startEditProduct() {
    if (!product) return
    const next: Record<string, string> = {}
    for (const field of PRODUCT_FIELDS) next[field] = product[field] ?? ''
    setDraft(next)
    setEditingProduct(true)
  }

  if (uuid === '') return null

  if (loading && !loaded) {
    return (
      <div className="iv-split-right">
        <div className="iv-placeholder">
          <Spinner />
        </div>
      </div>
    )
  }

  if (error !== null) {
    return (
      <div className="iv-split-right">
        <div className="iv-detail-head">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={12} /> Close
          </Button>
        </div>
        <div className="iv-error" style={{ margin: 12 }}>
          {error}
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="iv-split-right">
        <div className="iv-detail-head">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={12} /> Close
          </Button>
        </div>
        <Empty title="Product not found">It may have been deleted.</Empty>
      </div>
    )
  }

  const pieceCount = rows.filter((r) => !isRowBlank(r)).length

  return (
    <>
      <div className="iv-detail-head">
        <div className="iv-detail-title">
          <h2>
            {product.name}
            {product.version !== null && product.version !== '' && (
              <span className="iv-version">{product.version}</span>
            )}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} title="Close panel">
            <X size={13} />
          </Button>
        </div>
        <div className="iv-detail-sub">
          <Completeness value={product.complete} />
          <span>·</span>
          <span>{product.company ?? 'Unknown company'}</span>
          {product.year !== null && product.year !== '' && (
            <>
              <span>·</span>
              <span>{product.year}</span>
            </>
          )}
          <span>·</span>
          <span>
            {pieceCount} {pieceCount === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
      </div>

      <div className="iv-detail-body">
        {saveError !== null && (
          <div className="iv-error" style={{ margin: '10px 12px 0' }}>
            {saveError}
          </div>
        )}

        <div className="iv-section">
          <div className="iv-section-head">
            Details
            {editingProduct ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => setEditingProduct(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" onClick={onSaveProduct} disabled={saving}>
                  <Save size={11} /> Save
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={startEditProduct}>
                Edit
              </Button>
            )}
          </div>

          {editingProduct ? (
            <div className="iv-card-body">
              <div className="iv-formgrid">
                <ProductFieldInput field="name" label="Name" draft={draft} setDraft={setDraft} />
                <ProductFieldInput field="version" label="Version" draft={draft} setDraft={setDraft} />
                <ProductFieldInput
                  field="company"
                  label="Company"
                  draft={draft}
                  setDraft={setDraft}
                  suggestions={options?.companies.map((o) => o.value)}
                />
                <ProductFieldInput field="year" label="Year" draft={draft} setDraft={setDraft} />
                <ProductFieldInput
                  field="type"
                  label="Type"
                  draft={draft}
                  setDraft={setDraft}
                  suggestions={options?.types.map((o) => o.value)}
                />
                <ProductFieldInput
                  field="subtype"
                  label="Subtype"
                  draft={draft}
                  setDraft={setDraft}
                  suggestions={options?.subtypes.map((o) => o.value)}
                />
                <ProductFieldInput
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
          ) : (
            <dl className="iv-props">
              <dt>Company</dt>
              <dd>{product.company ?? <span className="iv-muted">—</span>}</dd>
              <dt>Year</dt>
              <dd>{product.year ?? <span className="iv-muted">—</span>}</dd>
              <dt>Type</dt>
              <dd>
                {product.type ?? <span className="iv-muted">—</span>}
                {product.subtype !== null && product.subtype !== '' && (
                  <span className="iv-muted"> › {product.subtype}</span>
                )}
              </dd>
              <dt>Platform</dt>
              <dd>{product.platform ?? <span className="iv-muted">—</span>}</dd>
              <dt>Completeness</dt>
              <dd>
                <Completeness value={product.complete} />
              </dd>
              <dt>Notes</dt>
              <dd>{product.notes ?? <span className="iv-muted">—</span>}</dd>
            </dl>
          )}
        </div>

        <div className="iv-section">
          <div className="iv-section-head">
            Pieces
            {hasPieceChanges && (
              <>
                <Button size="sm" variant="ghost" onClick={revertPieces} disabled={saving}>
                  <Undo2 size={11} /> Revert
                </Button>
                <Button size="sm" variant="primary" onClick={onSavePieces} disabled={saving}>
                  {saving ? <Spinner /> : <Save size={11} />} Save pieces
                </Button>
              </>
            )}
          </div>
          <div style={{ padding: 8 }}>
            <DataGrid
              columns={PIECE_GRID_COLUMNS}
              rows={rows}
              onRowsChange={setRows}
              dirtyCells={dirtyCells}
              minRows={1}
              onDeleteRow={(row) => {
                // Persisted rows need an explicit delete; unsaved ones just go.
                if (row.id !== null) setDeletedIds((ids) => [...ids, row.id as number])
              }}
              footerNote={
                hasPieceChanges
                  ? `${dirtyCells.size} edited cell${dirtyCells.size === 1 ? '' : 's'}${
                      deletedIds.length > 0 ? `, ${deletedIds.length} deleted` : ''
                    }`
                  : 'Select rows and press ⌘C to copy into a new product'
              }
            />
          </div>
        </div>
      </div>
    </>
  )
}

function ProductFieldInput({
  field,
  label,
  draft,
  setDraft,
  suggestions,
}: {
  field: ProductField
  label: string
  draft: Record<string, string>
  setDraft: (fn: (d: Record<string, string>) => Record<string, string>) => void
  suggestions?: string[] | undefined
}) {
  const listId = suggestions === undefined ? undefined : `iv-sug-${field}`
  return (
    <Field label={label}>
      <input
        className="iv-input"
        value={draft[field] ?? ''}
        list={listId}
        onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
      />
      {/* Existing values as suggestions, so company and type spellings stay
          consistent instead of drifting into near-duplicates. */}
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
