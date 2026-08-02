// Collection-level totals for the header, plus the integrity numbers worth
// keeping visible: pieces with no product_id, and pieces whose product_id
// points at a product that no longer exists. Both are silently invisible in
// every product-grouped view, so they get counted here instead.

export type Stats = {
  products: number
  pieces: number
  /** Product completeness breakdown, strongest first. */
  byCompleteness: Array<{ value: string; count: number }>
  /** Products carrying no pieces at all. */
  productsWithoutPieces: number
  /** Pieces with an empty product_id. */
  unassignedPieces: number
  /** Pieces whose product_id matches no product. */
  danglingPieces: number
}

const ORDER = ['Complete', 'Mostly Complete', 'Core', 'Partial', 'Non-Original']

export default async function getStats(): Promise<Stats> {
  const [totals, completeness] = await Promise.all([
    awcomMysql.query<{
      products: number
      pieces: number
      products_without_pieces: number
      unassigned_pieces: number
      dangling_pieces: number
    }>(
      `SELECT
        (SELECT COUNT(*) FROM collection_products) AS products,
        (SELECT COUNT(*) FROM collection_pieces) AS pieces,
        (SELECT COUNT(*) FROM collection_products p
           WHERE NOT EXISTS (SELECT 1 FROM collection_pieces c
             WHERE c.product_id = p.uuid)) AS products_without_pieces,
        (SELECT COUNT(*) FROM collection_pieces
           WHERE product_id IS NULL OR product_id = '') AS unassigned_pieces,
        (SELECT COUNT(*) FROM collection_pieces c
           WHERE c.product_id IS NOT NULL AND c.product_id <> ''
             AND NOT EXISTS (SELECT 1 FROM collection_products p
               WHERE p.uuid = c.product_id)) AS dangling_pieces`,
    ),
    awcomMysql.query<{ v: string | null; n: number }>(
      `SELECT complete v, COUNT(*) n FROM collection_products GROUP BY complete`,
    ),
  ])

  const counts = new Map<string, number>()
  let unset = 0
  for (const row of completeness.data) {
    if (row.v === null || row.v === '') unset += Number(row.n)
    else counts.set(row.v, Number(row.n))
  }

  const byCompleteness = ORDER.filter((v) => counts.has(v)).map((v) => ({
    value: v,
    count: counts.get(v) ?? 0,
  }))
  // Anything outside the five known values, so a typo'd completeness shows up
  // rather than vanishing from the breakdown.
  for (const [value, count] of counts) {
    if (!ORDER.includes(value)) byCompleteness.push({ value, count })
  }
  if (unset > 0) byCompleteness.push({ value: 'Not set', count: unset })

  const row = totals.data[0]
  return {
    products: Number(row?.products ?? 0),
    pieces: Number(row?.pieces ?? 0),
    byCompleteness,
    productsWithoutPieces: Number(row?.products_without_pieces ?? 0),
    unassignedPieces: Number(row?.unassigned_pieces ?? 0),
    danglingPieces: Number(row?.dangling_pieces ?? 0),
  }
}
