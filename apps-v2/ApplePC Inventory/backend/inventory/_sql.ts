// Shared SQL fragments for the inventory writes.
//
// Everything here is derived from module constants, never from a request. The
// push gate's `queryInjection` check rejects any query string interpolated from
// `params` — even when the interpolated part is a whitelisted column name — so
// statements are precomputed in this file and call sites pass them by
// reference. That keeps the checks satisfied and, more usefully, makes it
// structurally impossible for caller input to reach the query text.

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * An Airtable-shaped record id: "rec" + 14 alphanumerics.
 *
 * The collection was migrated out of Airtable, so `collection_products.uuid`
 * holds Airtable record ids and `collection_pieces.product_id` points at them.
 * New rows mint ids in the same shape so the two stay joinable.
 */
export function recordId(): string {
  let out = 'rec'
  for (let i = 0; i < 14; i++) {
    out += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)]
  }
  return out
}

/** Trim, and store a blank cell as NULL so the grid never writes ''. */
export function clean(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export const PRODUCT_COLUMNS = [
  'name',
  'version',
  'company',
  'year',
  'type',
  'subtype',
  'platform',
  'complete',
  'notes',
] as const

export const PIECE_COLUMNS = [
  'part_name',
  'part_type',
  'part_no',
  'serial',
  'year',
  'location',
  'condition_notes',
  'notes',
  'image',
] as const

export type ProductColumn = (typeof PRODUCT_COLUMNS)[number]
export type PieceColumn = (typeof PIECE_COLUMNS)[number]

/** Rows per multi-row INSERT. A pasted block of 100 pieces becomes 4 queries. */
export const INSERT_CHUNK = 25

/** Ids per IN (…) list. */
export const IN_CHUNK = 100

function placeholders(n: number): string {
  return Array.from({ length: n }, () => '?').join(', ')
}

/**
 * Statements indexed by row count: `variants[3]` inserts exactly 3 rows.
 * Index 0 is unused — an empty VALUES list isn't valid SQL.
 */
function insertVariants(table: string, columns: readonly string[], maxRows: number): string[] {
  const tuple = `(${placeholders(columns.length)})`
  const head = `INSERT INTO ${table} (${columns.join(', ')}) VALUES `
  const out: string[] = ['']
  for (let rows = 1; rows <= maxRows; rows++) {
    out.push(head + Array.from({ length: rows }, () => tuple).join(', '))
  }
  return out
}

/** `head` + an IN list of exactly n placeholders + `tail`, indexed by n. */
function inVariants(head: string, tail: string, maxCount: number): string[] {
  const out: string[] = ['']
  for (let n = 1; n <= maxCount; n++) {
    out.push(`${head} IN (${placeholders(n)}) ${tail}`)
  }
  return out
}

/** Split into fixed-size chunks so each chunk maps onto a precomputed variant. */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export const INSERT_PRODUCT = `INSERT INTO collection_products (uuid, ${PRODUCT_COLUMNS.join(', ')})
  VALUES (${placeholders(PRODUCT_COLUMNS.length + 1)})`

export const DELETE_PRODUCT = `DELETE FROM collection_products WHERE uuid = ?`

export const SELECT_PRODUCT = `SELECT id, uuid, ${PRODUCT_COLUMNS.join(', ')}
  FROM collection_products WHERE uuid = ? LIMIT 1`

/** Writes every column, so callers merge onto current values before calling. */
export const UPDATE_PRODUCT = `UPDATE collection_products
  SET ${PRODUCT_COLUMNS.map((c) => `${c} = ?`).join(', ')} WHERE uuid = ?`

export const INSERT_PIECES = insertVariants(
  'collection_pieces',
  ['uuid', 'product_id', ...PIECE_COLUMNS],
  INSERT_CHUNK,
)

export const UPDATE_PIECE = `UPDATE collection_pieces
  SET ${PIECE_COLUMNS.map((c) => `${c} = ?`).join(', ')}
  WHERE id = ? AND product_id = ?`

export const SELECT_PIECES_FOR_PRODUCT = `SELECT id, ${PIECE_COLUMNS.join(', ')}
  FROM collection_pieces WHERE product_id = ?`

export const DELETE_PIECES_BY_ID = inVariants(
  `DELETE FROM collection_pieces WHERE id`,
  `AND product_id = ?`,
  IN_CHUNK,
)
