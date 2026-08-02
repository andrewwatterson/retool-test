// Persist a round of grid edits for one product's pieces: update the rows that
// already exist, insert the ones that don't, delete the ones removed.
//
// Every write is scoped to `productUuid`. Ids that belong to a different
// product are refused rather than silently reassigned or deleted, so a stale
// grid can't reach across products. The single SELECT below does double duty:
// it establishes ownership and supplies the current values that partial edits
// are merged onto.

import {
  DELETE_PIECES_BY_ID,
  INSERT_CHUNK,
  INSERT_PIECES,
  IN_CHUNK,
  PIECE_COLUMNS,
  SELECT_PIECES_FOR_PRODUCT,
  UPDATE_PIECE,
  chunk,
  clean,
  recordId,
  type PieceColumn,
} from './_sql'

export type PieceUpsert = Partial<Record<PieceColumn, string | null>> & {
  /** Absent or null for a new row. */
  id?: number | null
  part_name: string
}

export default async function savePieces({
  params,
}: {
  params: { productUuid: string; upserts?: PieceUpsert[]; deleteIds?: number[] }
}): Promise<{ inserted: number; updated: number; deleted: number }> {
  const { productUuid, upserts = [], deleteIds = [] } = params
  if (!productUuid) throw new Error('savePieces needs a product uuid.')

  // Blank trailing rows in the grid aren't edits.
  const rows = upserts.filter((r) => clean(r.part_name) !== null)
  const existing = rows.filter((r): r is PieceUpsert & { id: number } => typeof r.id === 'number')
  const fresh = rows.filter((r) => typeof r.id !== 'number')
  const removals = deleteIds.map((n) => Math.trunc(n))

  const owned = await awcomMysql.query<Record<string, string | number | null>>(
    SELECT_PIECES_FOR_PRODUCT,
    [productUuid],
  )
  const byId = new Map<number, Record<string, string | number | null>>()
  for (const row of owned.data) byId.set(Number(row['id']), row)

  const foreign = [...existing.map((r) => r.id), ...removals].filter((id) => !byId.has(id))
  if (foreign.length > 0) {
    throw new Error(
      `Refusing to write pieces that don't belong to this product: ${foreign.join(', ')}.`,
    )
  }

  let updated = 0
  for (const row of existing) {
    const current = byId.get(row.id)
    // An explicit null clears a cell; a missing key leaves it alone.
    const touched = PIECE_COLUMNS.filter((col) => row[col] !== undefined)
    if (touched.length === 0) continue
    const merged = PIECE_COLUMNS.map((col) => {
      if (row[col] !== undefined) return clean(row[col])
      const value = current?.[col]
      return value === undefined || value === null ? null : String(value)
    })
    if (merged[PIECE_COLUMNS.indexOf('part_name')] === null) {
      throw new Error(`Piece ${row.id} needs a part name.`)
    }
    await awcomMysql.query(UPDATE_PIECE, [...merged, row.id, productUuid])
    updated++
  }

  for (const batch of chunk(fresh, INSERT_CHUNK)) {
    const statement = INSERT_PIECES[batch.length]
    if (statement === undefined) throw new Error(`No insert statement for ${batch.length} rows.`)
    const args: unknown[] = []
    for (const piece of batch) {
      args.push(recordId(), productUuid, ...PIECE_COLUMNS.map((col) => clean(piece[col])))
    }
    await awcomMysql.query(statement, args)
  }

  let deleted = 0
  for (const batch of chunk(removals, IN_CHUNK)) {
    const statement = DELETE_PIECES_BY_ID[batch.length]
    if (statement === undefined) throw new Error(`No delete statement for ${batch.length} ids.`)
    await awcomMysql.query(statement, [...batch, productUuid])
    deleted += batch.length
  }

  return { inserted: fresh.length, updated, deleted }
}
