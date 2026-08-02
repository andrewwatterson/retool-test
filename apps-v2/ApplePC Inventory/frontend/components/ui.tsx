// Small presentational primitives shared by the pages. Styles live in app.css.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { COMPLETENESS, UNSET, type Option } from '../lib/types'

export function Button({
  children,
  onClick,
  variant = 'default',
  size,
  disabled,
  title,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'ghost' | 'danger'
  size?: 'sm'
  disabled?: boolean
  title?: string
  type?: 'button' | 'submit'
}) {
  const classes = ['iv-btn']
  if (variant !== 'default') classes.push(`iv-btn--${variant}`)
  if (size === 'sm') classes.push('iv-btn--sm')
  return (
    <button
      type={type}
      className={classes.join(' ')}
      onClick={onClick}
      disabled={disabled === true}
      title={title}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  children,
  wide,
}: {
  label: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={wide === true ? 'iv-field iv-formgrid--wide' : 'iv-field'}>
      <label className="iv-label">{label}</label>
      {children}
    </div>
  )
}

/** Free-text search with a clear button. Debouncing is the caller's business. */
export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (next: string) => void
  placeholder: string
}) {
  return (
    <div className="iv-search">
      <span className="iv-search-icon">
        <Search size={13} />
      </span>
      <input
        className="iv-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {value !== '' && (
        <button className="iv-search-clear" onClick={() => onChange('')} title="Clear">
          <X size={12} />
        </button>
      )}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  children: ReactNode
}) {
  return (
    <label className={checked ? 'iv-check iv-check--on' : 'iv-check'}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  )
}

/**
 * Searchable multi-select. Company has 406 distinct values, so a plain <select>
 * is unusable — options are filtered by typing and ordered by frequency, with
 * counts visible so the useful values surface first.
 */
export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  align = 'left',
  emptyHint,
}: {
  label: string
  options: Option[]
  selected: string[]
  onChange: (next: string[]) => void
  align?: 'left' | 'right'
  emptyHint?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    // Outside click and Escape both close; focus moves into the filter box so
    // the whole control is reachable without the mouse.
    function onDown(e: MouseEvent) {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    searchRef.current?.focus()
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return options
    return options.filter((o) => {
      const text = o.value === UNSET ? 'not set' : o.value.toLowerCase()
      return text.includes(q)
    })
  }, [options, query])

  function toggle(value: string) {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    )
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const option = filtered[cursor]
      if (option) toggle(option.value)
    }
  }

  const trigger = ['iv-ms-trigger']
  if (selected.length > 0) trigger.push('iv-ms-trigger--active')

  return (
    <div className="iv-ms" ref={root}>
      <button
        className={trigger.join(' ')}
        onClick={() => {
          setOpen((o) => !o)
          setQuery('')
          setCursor(0)
        }}
        title={selected.length > 0 ? selected.join(', ') : label}
      >
        <span className="iv-ms-label">{label}</span>
        {selected.length > 0 && <span className="iv-ms-pill">{selected.length}</span>}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className={align === 'right' ? 'iv-ms-panel iv-ms-panel--right' : 'iv-ms-panel'}>
          <div className="iv-ms-search">
            <input
              ref={searchRef}
              className="iv-input"
              value={query}
              placeholder={`Filter ${label.toLowerCase()}…`}
              onChange={(e) => {
                setQuery(e.target.value)
                setCursor(0)
              }}
              onKeyDown={onListKey}
            />
          </div>

          <div className="iv-ms-list">
            {filtered.length === 0 && (
              <div className="iv-ms-empty">{emptyHint ?? 'No matches'}</div>
            )}
            {filtered.map((option, i) => {
              const classes = ['iv-ms-option']
              if (i === cursor) classes.push('iv-ms-option--cursor')
              return (
                <button
                  key={option.value}
                  className={classes.join(' ')}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => toggle(option.value)}
                >
                  <input type="checkbox" checked={selected.includes(option.value)} readOnly />
                  <span className="iv-ms-option-name">
                    {option.value === UNSET ? <em>Not set</em> : option.value}
                  </span>
                  <span className="iv-ms-option-count">{option.count.toLocaleString()}</span>
                </button>
              )
            })}
          </div>

          <div className="iv-ms-footer">
            <span className="iv-hint">
              {selected.length > 0 ? `${selected.length} selected` : 'None selected'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => onChange([])} disabled={selected.length === 0}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Completeness as a 4-segment meter.
 *
 * It's ordinal data — Complete and Mostly Complete are the hallmarks of the
 * collection, Partial and Non-Original are the thin end — so it reads as a
 * scale rather than a set of coloured tags. Non-Original sits apart: it's a
 * claim about authenticity, not a quantity, so it gets its own hue at one
 * segment instead of a rank on the same scale.
 */
export function Completeness({ value, showText = true }: { value: string | null; showText?: boolean }) {
  const filled =
    value === 'Complete'
      ? 4
      : value === 'Mostly Complete'
        ? 3
        : value === 'Core'
          ? 2
          : value === 'Partial'
            ? 1
            : value === 'Non-Original'
              ? 1
              : 0

  const modifier =
    value === 'Complete'
      ? 'complete'
      : value === 'Mostly Complete'
        ? 'mostly'
        : value === 'Non-Original'
          ? 'nonoriginal'
          : value === null || value === ''
            ? 'unset'
            : 'plain'

  return (
    <span className={`iv-comp iv-comp--${modifier}`} title={value ?? 'Completeness not set'}>
      <span className="iv-meter" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i < filled ? 'on' : ''} />
        ))}
      </span>
      {showText && <span className="iv-comp-text">{value === null || value === '' ? 'Not set' : value}</span>}
    </span>
  )
}

export function Badge({
  children,
  variant,
}: {
  children: ReactNode
  variant?: 'warn' | 'outline'
}) {
  const classes = ['iv-badge']
  if (variant) classes.push(`iv-badge--${variant}`)
  return <span className={classes.join(' ')}>{children}</span>
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="iv-empty">
      <span className="iv-empty-strong">{title}</span>
      {children}
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <span className="iv-kbd">{children}</span>
}

export function Spinner() {
  return <span className="iv-spinner" aria-label="Loading" />
}

/** Completeness options in collection order rather than by frequency. */
export function completenessOptions(options: Option[]): Option[] {
  const byValue = new Map(options.map((o) => [o.value, o]))
  const ordered: Option[] = []
  for (const value of COMPLETENESS) {
    const found = byValue.get(value)
    if (found) ordered.push(found)
  }
  // Anything unexpected still shows up rather than disappearing from the filter.
  for (const option of options) {
    if (!COMPLETENESS.includes(option.value)) ordered.push(option)
  }
  return ordered
}

export { Check }
