// Pieces grouped under the product they belong to — the main "what do I
// actually have for X" lookup.
//
// `scope` decides what the search text is matched against:
//   product — match the product (name, company, …), list all of its pieces.
//             The common case: "show me everything under LaserWriter".
//   piece   — match individual pieces, still grouped under their product.
//   either  — match either side.
//
// Two piece-level predicates are kept deliberately separate:
//
//   pieceText   — the search box, matched against piece fields. Only meaningful
//                 when the scope actually points at pieces.
//   pieceFilter — the part-type and location filters. These always describe
//                 which pieces the user cares about, whatever the scope.
//
// Conflating them makes "matching pieces only" nonsense in product scope: you'd
// search "LaserWriter", find the product, then hide every piece that doesn't
// itself contain the word "LaserWriter". So "matching" means pieceText AND
// pieceFilter when the scope points at pieces, and pieceFilter alone when it
// doesn't.
//
// Paging is over PRODUCTS, not pieces, so a group is never split across pages.

const PRODUCT_SEARCHABLE = `CONCAT_WS(' ', p.name, p.company, p.version, p.type, p.subtype, p.platform, p.year, p.notes)`
const PIECE_SEARCHABLE = `CONCAT_WS(' ', c.part_name, c.part_type, c.part_no, c.serial, c.location, c.notes, c.condition_notes, c.year)`

const WEAK = ['Partial', 'Non-Original']

export type SearchPiecesParams = {
  q?: string
  scope?: 'product' | 'piece' | 'either'
  company?: string[]
  type?: string[]
  complete?: string[]
  partType?: string[]
  location?: string[]
  hideWeak?: boolean
  /** Show only the pieces that matched, rather than all of the product's pieces. */
  onlyMatching?: boolean
  limit?: number
  offset?: number
}

export type PieceRow = {
  id: number
  uuid: string | null
  product_id: string | null
  part_name: string
  part_type: string | null
  part_no: string | null
  serial: string | null
  year: string | null
  location: string | null
  condition_notes: string | null
  notes: string | null
  image: string | null
  /** 1 when the piece matched. NULL — not 0 — when the predicate compared
   *  against a NULL column, since `NULL IN (…)` is NULL. Test for `=== 1`. */
  matched: number | null
}

export type PieceGroup = {
  uuid: string
  name: string
  company: string | null
  year: string | null
  type: string | null
  subtype: string | null
  complete: string | null
  pieces: PieceRow[]
}

function likeTerm(raw: string): string {
  return `%${raw.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

/** A predicate plus the args it binds, kept together so ordering can't drift. */
type Clause = { sql: string[]; args: unknown[] }

/** `col IN (…)`, with `__unset__` meaning NULL-or-empty. */
function inClause(col: string, values: string[]): Clause | null {
  const real = values.filter((v) => v !== '__unset__')
  const wantsUnset = real.length !== values.length
  const parts: string[] = []
  const args: unknown[] = []
  if (real.length > 0) {
    parts.push(`${col} IN (${real.map(() => '?').join(', ')})`)
    args.push(...real)
  }
  if (wantsUnset) parts.push(`(${col} IS NULL OR ${col} = '')`)
  if (parts.length === 0) return null
  return { sql: [`(${parts.join(' OR ')})`], args }
}

export default async function searchPieces({ params }: { params: SearchPiecesParams }): Promise<{
  groups: PieceGroup[]
  total: number
}> {
  const {
    q,
    scope = 'product',
    company = [],
    type = [],
    complete = [],
    partType = [],
    location = [],
    hideWeak = false,
    onlyMatching = false,
    limit = 40,
    offset = 0,
  } = params

  const terms = q && q.trim() !== '' ? q.trim().split(/\s+/) : []

  const pieceText: Clause = { sql: [], args: [] }
  for (const term of terms) {
    pieceText.sql.push(`${PIECE_SEARCHABLE} LIKE ? ESCAPE '\\\\'`)
    pieceText.args.push(likeTerm(term))
  }

  const pieceFilter: Clause = { sql: [], args: [] }
  for (const [col, values] of [
    ['c.part_type', partType],
    ['c.location', location],
  ] as const) {
    const clause = inClause(col, values)
    if (clause) {
      pieceFilter.sql.push(...clause.sql)
      pieceFilter.args.push(...clause.args)
    }
  }

  // What counts as a matching piece, for the `matched` flag and for
  // `onlyMatching`. In product scope the search text describes the product, so
  // only the piece filters apply.
  const match: Clause =
    scope === 'product'
      ? pieceFilter
      : {
          sql: [...pieceText.sql, ...pieceFilter.sql],
          args: [...pieceText.args, ...pieceFilter.args],
        }
  const matchSql = match.sql.length > 0 ? match.sql.join(' AND ') : '1 = 1'

  const productText: Clause = { sql: [], args: [] }
  for (const term of terms) {
    productText.sql.push(`${PRODUCT_SEARCHABLE} LIKE ? ESCAPE '\\\\'`)
    productText.args.push(likeTerm(term))
  }
  const productTextSql = productText.sql.length > 0 ? productText.sql.join(' AND ') : '1 = 1'

  const existsMatch = `EXISTS (SELECT 1 FROM collection_pieces c
      WHERE c.product_id = p.uuid AND ${matchSql})`

  const where: string[] = []
  const args: unknown[] = []

  // Args are pushed in the same order the SQL text reads them.
  if (scope === 'product') {
    where.push(`(${productTextSql})`)
    args.push(...productText.args)
    // A part-type filter should still exclude products with nothing to show.
    if (pieceFilter.sql.length > 0) {
      where.push(existsMatch)
      args.push(...match.args)
    }
  } else if (scope === 'piece') {
    where.push(existsMatch)
    args.push(...match.args)
  } else {
    where.push(`((${productTextSql}) OR ${existsMatch})`)
    args.push(...productText.args, ...match.args)
  }

  for (const [col, values] of [
    ['p.company', company],
    ['p.type', type],
    ['p.complete', complete],
  ] as const) {
    const clause = inClause(col, values)
    if (clause) {
      where.push(...clause.sql)
      args.push(...clause.args)
    }
  }

  if (hideWeak) {
    where.push(`(p.complete IS NULL OR p.complete NOT IN (${WEAK.map(() => '?').join(', ')}))`)
    args.push(...WEAK)
  }

  const whereSql = `WHERE ${where.join(' AND ')}`

  const products = await awcomMysql.query<{
    uuid: string
    name: string
    company: string | null
    year: string | null
    type: string | null
    subtype: string | null
    complete: string | null
  }>(
    `SELECT p.uuid, p.name, p.company, p.year, p.type, p.subtype, p.complete
       FROM collection_products p
       ${whereSql}
      ORDER BY p.name ASC, p.id ASC
      LIMIT ? OFFSET ?`,
    [...args, Math.min(Math.max(Math.trunc(limit), 1), 200), Math.max(Math.trunc(offset), 0)],
  )

  const counted = await awcomMysql.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM collection_products p ${whereSql}`,
    args,
  )

  const total = Number(counted.data[0]?.total ?? 0)
  const uuids = products.data.map((p) => p.uuid)
  if (uuids.length === 0) return { groups: [], total }

  // One fetch for every piece on this page of products, then bucketed in
  // memory. `matched` appears in the SELECT list, so its args bind before the
  // IN list; the optional repeat of the same predicate binds after.
  const pieceWhere = [`c.product_id IN (${uuids.map(() => '?').join(', ')})`]
  const pieceArgs: unknown[] = [...match.args, ...uuids]
  if (onlyMatching) {
    pieceWhere.push(`(${matchSql})`)
    pieceArgs.push(...match.args)
  }

  const pieces = await awcomMysql.query<PieceRow>(
    `SELECT c.id, c.uuid, c.product_id, c.part_name, c.part_type, c.part_no, c.serial,
            c.year, c.location, c.condition_notes, c.notes, c.image,
            (${matchSql}) AS matched
       FROM collection_pieces c
      WHERE ${pieceWhere.join(' AND ')}
      ORDER BY (c.part_type IS NULL OR c.part_type = '') ASC, c.part_type ASC, c.part_name ASC`,
    pieceArgs,
  )

  const byProduct = new Map<string, PieceRow[]>()
  for (const uuid of uuids) byProduct.set(uuid, [])
  for (const piece of pieces.data) {
    const bucket = piece.product_id === null ? undefined : byProduct.get(piece.product_id)
    if (bucket) bucket.push(piece)
  }

  return {
    groups: products.data.map((p) => ({ ...p, pieces: byProduct.get(p.uuid) ?? [] })),
    total,
  }
}
