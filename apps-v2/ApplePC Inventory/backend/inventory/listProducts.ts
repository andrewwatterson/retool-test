// Filtered, sorted, paginated product list with a piece count per product.
//
// Two schema facts shape the queries in this folder:
//
//   1. collection_pieces.product_id joins collection_products.uuid, NOT .id.
//      Both columns are utf8mb4_0900_ai_ci, so the join needs no COLLATE. (Only
//      an expression like CAST(p.id AS CHAR) picks up the *connection*
//      collation, utf8mb4_unicode_ci, and collides — that's a CAST problem, not
//      a table problem.) Avoiding COLLATE also matters for speed: wrapping a
//      column in COLLATE makes any index on it unusable.
//
//   2. Every column is `text`, including year. Sorting by year has to CAST or
//      it sorts lexically.
//
// Shape of the query, and why:
//
//   * Piece counts come from a LEFT JOIN + GROUP BY rather than a correlated
//     subquery. There is no index on collection_pieces.product_id, so a
//     correlated subquery re-scans all 10,575 pieces once per product row.
//     Sorting by piece count made that catastrophic — every one of the 2,457
//     products had to be counted before the sort could run. Measured on this
//     data: 960ms for a name-sorted page, and 19 SECONDS sorted by piece count.
//     The aggregate join computes every count in one pass: ~200ms either way,
//     which is the network round trip floor.
//
//   * The total row count rides along as COUNT(*) OVER () instead of a second
//     query, saving a whole round trip (~540ms measured). Window functions run
//     after WHERE, GROUP BY and HAVING but before LIMIT, so it counts exactly
//     the matching products. Verified against ground truth, including the
//     `missingPieces` HAVING case.
//
// An index on collection_pieces.product_id would help further, but that's a
// schema change on live data and isn't mine to make.

// Completeness, ordered strongest-first. Unset values sort last rather than
// first, so a null `complete` never masquerades as the best of the collection.
const COMPLETENESS_RANK = `CASE p.complete
  WHEN 'Complete' THEN 1
  WHEN 'Mostly Complete' THEN 2
  WHEN 'Core' THEN 3
  WHEN 'Partial' THEN 4
  WHEN 'Non-Original' THEN 5
  ELSE 6 END`

const SORTABLE = {
  name: 'p.name',
  company: 'p.company',
  year: 'yr',
  type: 'p.type',
  subtype: 'p.subtype',
  complete: 'completeness_rank',
  pieces: 'piece_count',
  id: 'p.id',
} as const

type SortKey = keyof typeof SORTABLE

/** Products the collection doesn't really represent. The "hide weak" toggle. */
const WEAK = ['Partial', 'Non-Original']

const SEARCHABLE = `CONCAT_WS(' ', p.name, p.company, p.version, p.type, p.subtype, p.platform, p.year, p.notes)`

export type ProductRow = {
  id: number
  uuid: string
  name: string
  version: string | null
  company: string | null
  year: string | null
  type: string | null
  subtype: string | null
  platform: string | null
  complete: string | null
  notes: string | null
  piece_count: number
}

export type ListProductsParams = {
  q?: string
  company?: string[]
  type?: string[]
  subtype?: string[]
  platform?: string[]
  complete?: string[]
  yearFrom?: number | null
  yearTo?: number | null
  /** Exclude Partial and Non-Original. */
  hideWeak?: boolean
  /** Only products with no pieces attached. */
  missingPieces?: boolean
  sort?: SortKey
  dir?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/** `%` and `_` are LIKE wildcards; a raw search term must not smuggle them in. */
function likeTerm(raw: string): string {
  return `%${raw.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

function inClause(col: string, values: string[], sql: string[], args: unknown[]): void {
  const real = values.filter((v) => v !== '__unset__')
  const wantsUnset = real.length !== values.length
  const parts: string[] = []
  if (real.length > 0) {
    parts.push(`${col} IN (${real.map(() => '?').join(', ')})`)
    args.push(...real)
  }
  // 2 products have no type/complete at all. Let them be filtered for
  // explicitly instead of being unreachable.
  if (wantsUnset) parts.push(`(${col} IS NULL OR ${col} = '')`)
  if (parts.length > 0) sql.push(`(${parts.join(' OR ')})`)
}

export default async function listProducts({ params }: { params: ListProductsParams }): Promise<{
  rows: ProductRow[]
  total: number
}> {
  const {
    q,
    company = [],
    type = [],
    subtype = [],
    platform = [],
    complete = [],
    yearFrom,
    yearTo,
    hideWeak = false,
    missingPieces = false,
    sort = 'name',
    dir = 'asc',
    limit = 100,
    offset = 0,
  } = params

  const where: string[] = []
  const args: unknown[] = []

  // Every whitespace-separated token must appear somewhere in the row, so
  // "apple laserwriter" narrows instead of widening.
  if (q && q.trim() !== '') {
    for (const token of q.trim().split(/\s+/)) {
      where.push(`${SEARCHABLE} LIKE ? ESCAPE '\\\\'`)
      args.push(likeTerm(token))
    }
  }

  if (company.length > 0) inClause('p.company', company, where, args)
  if (type.length > 0) inClause('p.type', type, where, args)
  if (subtype.length > 0) inClause('p.subtype', subtype, where, args)
  if (platform.length > 0) inClause('p.platform', platform, where, args)
  if (complete.length > 0) inClause('p.complete', complete, where, args)

  if (hideWeak) {
    where.push(`(p.complete IS NULL OR p.complete NOT IN (${WEAK.map(() => '?').join(', ')}))`)
    args.push(...WEAK)
  }

  if (typeof yearFrom === 'number') {
    where.push(`CAST(NULLIF(p.year, '') AS UNSIGNED) >= ?`)
    args.push(yearFrom)
  }
  if (typeof yearTo === 'number') {
    where.push(`CAST(NULLIF(p.year, '') AS UNSIGNED) <= ?`)
    args.push(yearTo)
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
  // piece_count is an aggregate, so it filters in HAVING rather than WHERE.
  const havingSql = missingPieces ? 'HAVING piece_count = 0' : ''

  // `sort` and `dir` are mapped through whitelists, never interpolated raw.
  const orderCol = SORTABLE[sort] ?? SORTABLE.name
  const orderDir = dir === 'desc' ? 'DESC' : 'ASC'
  // Rows missing the sort value always sort last, either direction, so paging
  // never opens on a screen of blanks. `name` is the stable tiebreaker.
  // `yr` is an integer after the CAST — testing it against '' would coerce to 0
  // and push a genuine year 0 to the end, so it only gets the IS NULL test.
  const emptyTest =
    orderCol === 'yr'
      ? `${orderCol} IS NULL`
      : orderCol === 'p.company' || orderCol === 'p.subtype'
        ? `(${orderCol} IS NULL OR ${orderCol} = '')`
        : null

  const rows = await awcomMysql.query<
    ProductRow & { yr: number | null; completeness_rank: number; total: number }
  >(
    `SELECT p.id, p.uuid, p.name, p.version, p.company, p.year, p.type, p.subtype,
            p.platform, p.complete, p.notes,
            CAST(NULLIF(p.year, '') AS UNSIGNED) AS yr,
            ${COMPLETENESS_RANK} AS completeness_rank,
            COUNT(c.id) AS piece_count,
            COUNT(*) OVER () AS total
       FROM collection_products p
       LEFT JOIN collection_pieces c ON c.product_id = p.uuid
       ${whereSql}
      GROUP BY p.id
      ${havingSql}
      ORDER BY ${emptyTest === null ? '' : `${emptyTest} ASC, `}${orderCol} ${orderDir}, p.name ASC
      LIMIT ? OFFSET ?`,
    [...args, Math.min(Math.max(Math.trunc(limit), 1), 500), Math.max(Math.trunc(offset), 0)],
  )

  const first = rows.data[0]
  if (first !== undefined) return { rows: rows.data, total: Number(first.total) }

  // A window function rides on result rows, so an empty page carries no total.
  // At offset 0 that genuinely means "nothing matched". Past the end of the
  // results it does not — reporting 0 there would collapse the pager and strand
  // the user on a page they can't leave. Only that case pays for a second
  // round trip.
  if (offset === 0) return { rows: [], total: 0 }

  const counted = await awcomMysql.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM (
       SELECT p.id, COUNT(c.id) AS piece_count
         FROM collection_products p
         LEFT JOIN collection_pieces c ON c.product_id = p.uuid
         ${whereSql}
        GROUP BY p.id
        ${havingSql}
     ) AS matched`,
    args,
  )

  return { rows: [], total: Number(counted.data[0]?.total ?? 0) }
}
