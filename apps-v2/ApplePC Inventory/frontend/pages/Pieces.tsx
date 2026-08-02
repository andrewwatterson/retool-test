// Pieces grouped under the product they belong to.
//
// Search scope is explicit because the two readings are genuinely different:
// searching "LaserWriter" against the product shows everything filed under it,
// while searching "manual" against pieces finds manuals across the collection.
// Product is the default — it's the common lookup.
//
// Paging is over products, so a group is never split across a page boundary.

import { useMemo, useState } from 'react'
import { ChevronRight, Copy } from 'lucide-react'
import {
  useGetFilterOptions,
  useGetOrphanPieces,
  useSearchPieces,
} from '../hooks/backend/inventory'
import { useAutoTrigger, useDebounced } from '../lib/hooks'
import type { FilterOptions, OrphanPiece, PieceGroup } from '../lib/types'
import {
  Badge,
  Button,
  Completeness,
  Empty,
  MultiSelect,
  SearchBox,
  Toggle,
  completenessOptions,
} from '../components/ui'
import { encodeTable } from '../components/clipboard'
import { PIECE_GRID_COLUMNS } from '../components/pieceColumns'

const PAGE_SIZE = 40

type Scope = 'product' | 'piece' | 'either'

const PIECE_COLS: Array<{ key: keyof PieceGroup['pieces'][number]; label: string; width?: string; mono?: boolean }> = [
  { key: 'part_name', label: 'Part name' },
  { key: 'part_type', label: 'Type', width: '130px' },
  { key: 'part_no', label: 'Part no.', width: '110px', mono: true },
  { key: 'serial', label: 'Serial', width: '110px', mono: true },
  { key: 'year', label: 'Year', width: '58px' },
  { key: 'location', label: 'Location', width: '140px' },
  { key: 'condition_notes', label: 'Condition', width: '170px' },
]

export function Pieces({ startOnOrphans = false }: { startOnOrphans?: boolean }) {
  const [q, setQ] = useState('')
  const [scope, setScope] = useState<Scope>('product')
  const [company, setCompany] = useState<string[]>([])
  const [type, setType] = useState<string[]>([])
  const [complete, setComplete] = useState<string[]>([])
  const [partType, setPartType] = useState<string[]>([])
  const [location, setLocation] = useState<string[]>([])
  const [hideWeak, setHideWeak] = useState(false)
  const [onlyMatching, setOnlyMatching] = useState(false)
  const [page, setPage] = useState(0)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [showOrphans, setShowOrphans] = useState(startOnOrphans)
  const [copied, setCopied] = useState('')

  const debouncedQ = useDebounced(q)

  const optionsHook = useGetFilterOptions()
  useAutoTrigger(optionsHook.trigger, {})
  const options = optionsHook.data as FilterOptions | undefined

  const params = useMemo(
    () => ({
      q: debouncedQ,
      scope,
      company,
      type,
      complete,
      partType,
      location,
      hideWeak,
      onlyMatching,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [debouncedQ, scope, company, type, complete, partType, location, hideWeak, onlyMatching, page],
  )

  const search = useSearchPieces()
  useAutoTrigger(search.trigger, params, !showOrphans)
  const result = search.data as { groups: PieceGroup[]; total: number } | undefined
  const groups = result?.groups ?? []
  const total = result?.total ?? 0

  const orphansHook = useGetOrphanPieces()
  useAutoTrigger(orphansHook.trigger, {}, showOrphans)
  const orphans = (orphansHook.data as { pieces: OrphanPiece[] } | undefined)?.pieces ?? []

  const pieceTotal = groups.reduce((sum, g) => sum + g.pieces.length, 0)

  function withPageReset<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(0)
    }
  }

  function toggleGroup(uuid: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(uuid)) next.delete(uuid)
      else next.add(uuid)
      return next
    })
  }

  /**
   * Copy a group's pieces as clipboard TSV in the piece-grid column order, so
   * it pastes straight into the new-product grid or another product's pieces.
   */
  async function copyGroup(group: PieceGroup) {
    const matrix = group.pieces.map((piece) =>
      PIECE_GRID_COLUMNS.map((col) => {
        const value = (piece as unknown as Record<string, unknown>)[col.key]
        return value === null || value === undefined ? '' : String(value)
      }),
    )
    const text = encodeTable(matrix)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(group.uuid)
      setTimeout(() => setCopied(''), 1400)
    } catch {
      // Clipboard permission can be refused; the grid's ⌘C path still works.
      setCopied('')
    }
  }

  const filterCount =
    company.length +
    type.length +
    complete.length +
    partType.length +
    location.length +
    (hideWeak ? 1 : 0) +
    (q === '' ? 0 : 1)

  return (
    <div className="iv-main">
      <div className="iv-toolbar">
        <SearchBox
          value={q}
          onChange={withPageReset(setQ)}
          placeholder={scope === 'piece' ? 'Search pieces…' : 'Search products…'}
        />

        <select
          className="iv-select"
          value={scope}
          onChange={(e) => {
            setScope(e.target.value as Scope)
            setPage(0)
          }}
          title="What the search text is matched against"
        >
          <option value="product">Match product</option>
          <option value="piece">Match piece</option>
          <option value="either">Match either</option>
        </select>

        <MultiSelect
          label="Company"
          options={options?.companies ?? []}
          selected={company}
          onChange={withPageReset(setCompany)}
        />
        <MultiSelect
          label="Type"
          options={options?.types ?? []}
          selected={type}
          onChange={withPageReset(setType)}
        />
        <MultiSelect
          label="Part type"
          options={options?.partTypes ?? []}
          selected={partType}
          onChange={withPageReset(setPartType)}
        />
        <MultiSelect
          label="Location"
          options={options?.locations ?? []}
          selected={location}
          onChange={withPageReset(setLocation)}
        />
        <MultiSelect
          label="Completeness"
          options={completenessOptions(options?.completeness ?? [])}
          selected={complete}
          onChange={withPageReset(setComplete)}
        />

        <div className="iv-toolbar-sep" />

        <Toggle checked={hideWeak} onChange={withPageReset(setHideWeak)}>
          Hide Partial &amp; Non-Original
        </Toggle>
        {/* Only meaningful once something narrows pieces — the search text in a
            piece-facing scope, or a part-type / location filter. */}
        {(scope !== 'product' || partType.length > 0 || location.length > 0) && (
          <Toggle checked={onlyMatching} onChange={withPageReset(setOnlyMatching)}>
            Matching pieces only
          </Toggle>
        )}

        {filterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ('')
              setCompany([])
              setType([])
              setComplete([])
              setPartType([])
              setLocation([])
              setHideWeak(false)
              setPage(0)
            }}
          >
            Clear all
          </Button>
        )}

        <div className="iv-toolbar-spacer" />

        <Toggle checked={showOrphans} onChange={setShowOrphans}>
          Unlinked pieces
        </Toggle>
        {!showOrphans && (
          <span className="iv-count">
            <strong>{pieceTotal.toLocaleString()}</strong> pieces in{' '}
            <strong>{total.toLocaleString()}</strong> {total === 1 ? 'product' : 'products'}
          </span>
        )}
      </div>

      {showOrphans ? (
        <OrphanList pieces={orphans} loading={orphansHook.loading} />
      ) : (
        <>
          <div className="iv-groups">
            {search.error !== null && <div className="iv-error">{search.error}</div>}

            {groups.map((group) => {
              const open = !collapsed.has(group.uuid)
              return (
                <div className="iv-group" key={group.uuid}>
                  <div className="iv-group-head" onClick={() => toggleGroup(group.uuid)}>
                    <span className="iv-group-chevron" data-open={open}>
                      <ChevronRight size={13} />
                    </span>
                    <span className="iv-group-name">{group.name}</span>
                    {group.company !== null && group.company !== '' && (
                      <span className="iv-muted">{group.company}</span>
                    )}
                    {group.year !== null && group.year !== '' && (
                      <span className="iv-muted">{group.year}</span>
                    )}

                    <span className="iv-group-meta">
                      <Completeness value={group.complete} showText={false} />
                      <span>
                        {group.pieces.length} {group.pieces.length === 1 ? 'piece' : 'pieces'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void copyGroup(group)}
                        title="Copy these pieces as spreadsheet rows"
                      >
                        <Copy size={11} />
                        {copied === group.uuid ? 'Copied' : ''}
                      </Button>
                    </span>
                  </div>

                  {open && group.pieces.length > 0 && (
                    <div className="iv-group-body">
                      <table className="iv-table">
                        <thead>
                          <tr>
                            {PIECE_COLS.map((col) => (
                              <th
                                key={String(col.key)}
                                style={col.width === undefined ? undefined : { width: col.width }}
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {group.pieces.map((piece) => (
                            <tr
                              key={piece.id}
                              className={
                                // Highlight which pieces actually matched when
                                // the whole group is shown for context. Pointless
                                // once non-matching pieces are hidden, and in
                                // plain product scope with no piece filter
                                // everything matches trivially.
                                piece.matched === 1 &&
                                !onlyMatching &&
                                (scope !== 'product' || partType.length > 0 || location.length > 0)
                                  ? 'iv-piece-match'
                                  : undefined
                              }
                            >
                              {PIECE_COLS.map((col) => {
                                const value = piece[col.key]
                                return (
                                  <td
                                    key={String(col.key)}
                                    className={col.mono === true ? 'iv-mono' : undefined}
                                  >
                                    {value === null || value === '' ? (
                                      <span className="iv-muted">—</span>
                                    ) : (
                                      String(value)
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {open && group.pieces.length === 0 && (
                    <div className="iv-group-body">
                      <div className="iv-empty">No pieces recorded for this product.</div>
                    </div>
                  )}
                </div>
              )
            })}

            {!search.loading && groups.length === 0 && (
              <Empty title="No products match">
                {scope === 'product'
                  ? 'This searches the product, not the pieces — try “Match piece”.'
                  : 'Try widening the search or clearing a filter.'}
              </Empty>
            )}
          </div>

          {total > PAGE_SIZE && (
            <div className="iv-pager">
              <Button size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(p - 1, 0))}>
                Previous
              </Button>
              <Button
                size="sm"
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
              <span className="iv-count">
                Products {(page * PAGE_SIZE + 1).toLocaleString()}–
                {Math.min((page + 1) * PAGE_SIZE, total).toLocaleString()} of{' '}
                {total.toLocaleString()}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Pieces no product-grouped view can reach: an empty product_id, or one
 * pointing at a product that no longer exists. There are only a handful, but
 * they're invisible everywhere else, so they get somewhere to be seen.
 */
function OrphanList({ pieces, loading }: { pieces: OrphanPiece[]; loading: boolean }) {
  return (
    <div className="iv-groups">
      {!loading && pieces.length === 0 && (
        <Empty title="No unlinked pieces">Every piece belongs to a product that exists.</Empty>
      )}

      {pieces.length > 0 && (
        <div className="iv-group">
          <div className="iv-group-head" style={{ cursor: 'default' }}>
            <span className="iv-group-name">Unlinked pieces</span>
            <span className="iv-group-meta">
              <span>{pieces.length} total</span>
            </span>
          </div>
          <div className="iv-group-body">
            <table className="iv-table">
              <thead>
                <tr>
                  <th>Part name</th>
                  <th style={{ width: '130px' }}>Type</th>
                  <th style={{ width: '140px' }}>Location</th>
                  <th style={{ width: '150px' }}>Reason</th>
                  <th style={{ width: '170px' }}>Points at</th>
                </tr>
              </thead>
              <tbody>
                {pieces.map((piece) => (
                  <tr key={piece.id} style={{ cursor: 'default' }}>
                    <td>{piece.part_name}</td>
                    <td>{piece.part_type ?? <span className="iv-muted">—</span>}</td>
                    <td>{piece.location ?? <span className="iv-muted">—</span>}</td>
                    <td>
                      {piece.reason === 'unassigned' ? (
                        <Badge variant="outline">No product set</Badge>
                      ) : (
                        <Badge variant="warn">Missing product</Badge>
                      )}
                    </td>
                    <td className="iv-mono iv-muted">
                      {piece.product_id === null || piece.product_id === '' ? '—' : piece.product_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
