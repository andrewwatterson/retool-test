// The product list: the main way into the collection.
//
// Filtering and sorting are done in SQL, not in the browser — 2,457 products
// with 10,575 pieces is more than is worth shipping down and re-sorting on
// every keystroke, and it keeps the piece counts honest.

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { useGetFilterOptions, useListProducts } from '../hooks/backend/inventory'
import { useAutoTrigger, useDebounced, useResizableWidth } from '../lib/hooks'
import type { FilterOptions, ProductRow, SortKey } from '../lib/types'
import {
  Button,
  Completeness,
  Empty,
  MultiSelect,
  SearchBox,
  Toggle,
  completenessOptions,
} from '../components/ui'
import { ProductDetail } from '../components/ProductDetail'

const PAGE_SIZE = 100

const COLUMNS: Array<{ key: SortKey; label: string; align?: 'right'; width?: string }> = [
  { key: 'name', label: 'Product' },
  { key: 'company', label: 'Company', width: '160px' },
  { key: 'year', label: 'Year', width: '64px' },
  { key: 'type', label: 'Type', width: '190px' },
  { key: 'complete', label: 'Completeness', width: '170px' },
  { key: 'pieces', label: 'Pieces', align: 'right', width: '68px' },
]

export function Products({
  selected,
  onSelect,
  onNewProduct,
}: {
  /** Lifted so a just-created product can be opened from another page. */
  selected: string
  onSelect: (uuid: string) => void
  onNewProduct: () => void
}) {
  const [q, setQ] = useState('')
  const [company, setCompany] = useState<string[]>([])
  const [type, setType] = useState<string[]>([])
  const [subtype, setSubtype] = useState<string[]>([])
  const [platform, setPlatform] = useState<string[]>([])
  const [complete, setComplete] = useState<string[]>([])
  const [hideWeak, setHideWeak] = useState(false)
  const [missingPieces, setMissingPieces] = useState(false)
  const [sort, setSort] = useState<SortKey>('name')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)

  const debouncedQ = useDebounced(q)
  const detail = useResizableWidth(470)

  const optionsHook = useGetFilterOptions()
  useAutoTrigger(optionsHook.trigger, {})
  const options = optionsHook.data as FilterOptions | undefined

  const params = useMemo(
    () => ({
      q: debouncedQ,
      company,
      type,
      subtype,
      platform,
      complete,
      hideWeak,
      missingPieces,
      sort,
      dir,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [debouncedQ, company, type, subtype, platform, complete, hideWeak, missingPieces, sort, dir, page],
  )

  const list = useListProducts()
  const { refetch } = useAutoTrigger(list.trigger, params)
  const result = list.data as { rows: ProductRow[]; total: number } | undefined
  const rows = result?.rows ?? []
  const total = result?.total ?? 0

  // Subtype only makes sense in the context of a type, so the list narrows to
  // the selected types rather than offering all 52 pairs at once.
  const subtypeOptions = useMemo(() => {
    if (!options) return []
    const relevant =
      type.length === 0
        ? options.subtypes
        : options.subtypes.filter((s) => type.includes(s.type))
    const merged = new Map<string, number>()
    for (const s of relevant) merged.set(s.value, (merged.get(s.value) ?? 0) + s.count)
    return [...merged.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
  }, [options, type])

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(key)
      // Year and piece count are most useful highest-first.
      setDir(key === 'year' || key === 'pieces' ? 'desc' : 'asc')
    }
    setPage(0)
  }

  function resetFilters() {
    setQ('')
    setCompany([])
    setType([])
    setSubtype([])
    setPlatform([])
    setComplete([])
    setHideWeak(false)
    setMissingPieces(false)
    setPage(0)
  }

  const filterCount =
    company.length +
    type.length +
    subtype.length +
    platform.length +
    complete.length +
    (hideWeak ? 1 : 0) +
    (missingPieces ? 1 : 0) +
    (q === '' ? 0 : 1)

  // Any filter change invalidates the current page offset.
  function withPageReset<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(0)
    }
  }

  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <div className="iv-main">
      <div className="iv-toolbar">
        <SearchBox value={q} onChange={withPageReset(setQ)} placeholder="Search products…" />

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
          label="Subtype"
          options={subtypeOptions}
          selected={subtype}
          onChange={withPageReset(setSubtype)}
          emptyHint={type.length > 0 ? 'No subtypes for these types' : 'No matches'}
        />
        <MultiSelect
          label="Platform"
          options={options?.platforms ?? []}
          selected={platform}
          onChange={withPageReset(setPlatform)}
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
        <Toggle checked={missingPieces} onChange={withPageReset(setMissingPieces)}>
          No pieces
        </Toggle>

        {filterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear all
          </Button>
        )}

        <div className="iv-toolbar-spacer" />

        <span className="iv-count">
          <strong>{total.toLocaleString()}</strong> {total === 1 ? 'product' : 'products'}
        </span>
        <Button variant="primary" onClick={onNewProduct}>
          <Plus size={13} /> New product
        </Button>
      </div>

      <div className="iv-split">
        <div className="iv-split-left">
          <div className="iv-tablewrap">
            {list.loading && <div className="iv-loading-bar" />}

            {list.error !== null && <div className="iv-error" style={{ margin: 12 }}>{list.error}</div>}

            <table className="iv-table">
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="iv-sortable"
                      style={col.width === undefined ? undefined : { width: col.width }}
                      onClick={() => toggleSort(col.key)}
                    >
                      <span className={col.align === 'right' ? 'iv-num' : undefined}>
                        {col.label}
                        {sort === col.key && (
                          <span className="iv-sort-arrow">
                            {dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.uuid}
                    aria-selected={selected === row.uuid}
                    onClick={() => onSelect(row.uuid)}
                  >
                    <td>
                      <span className="iv-name">{row.name}</span>
                      {row.version !== null && row.version !== '' && (
                        <span className="iv-version">{row.version}</span>
                      )}
                    </td>
                    <td>{row.company ?? <span className="iv-muted">—</span>}</td>
                    <td className="iv-num">{row.year ?? <span className="iv-muted">—</span>}</td>
                    <td>
                      {row.type ?? <span className="iv-muted">—</span>}
                      {row.subtype !== null && row.subtype !== '' && (
                        <span className="iv-muted"> › {row.subtype}</span>
                      )}
                    </td>
                    <td>
                      <Completeness value={row.complete} />
                    </td>
                    <td className="iv-num">
                      {row.piece_count === 0 ? (
                        <span className="iv-muted" title="No pieces recorded">
                          0
                        </span>
                      ) : (
                        row.piece_count
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!list.loading && rows.length === 0 && (
              <Empty title="Nothing matches these filters">
                {filterCount > 0 ? 'Try clearing a filter or two.' : 'The collection is empty.'}
              </Empty>
            )}
          </div>

          {total > PAGE_SIZE && (
            <div className="iv-pager">
              <Button size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(p - 1, 0))}>
                Previous
              </Button>
              <Button size="sm" disabled={to >= total} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
              <span className="iv-count">
                {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {selected !== '' && (
          <>
            <div
              className="iv-resizer"
              data-dragging={detail.dragging}
              onMouseDown={detail.startDrag}
              role="separator"
              aria-orientation="vertical"
            />
            <div className="iv-split-right" style={{ width: detail.width }}>
              <ProductDetail
                uuid={selected}
                options={options}
                onClose={() => onSelect('')}
                onChanged={refetch}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
