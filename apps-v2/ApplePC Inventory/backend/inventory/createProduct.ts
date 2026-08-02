// Create a product and its pieces in one call — every new product has at
// least one piece, so the two are never entered separately.

import {
  DELETE_PRODUCT,
  INSERT_CHUNK,
  INSERT_PIECES,
  INSERT_PRODUCT,
  PIECE_COLUMNS,
  PRODUCT_COLUMNS,
  chunk,
  clean,
  recordId,
  type PieceColumn,
  type ProductColumn,
} from './_sql'

export type ProductInput = Partial<Record<ProductColumn, string | null>> & { name: string }
export type PieceInput = Partial<Record<PieceColumn, string | null>> & { part_name: string }

export default async function createProduct({
  params,
}: {
  params: { product: ProductInput; pieces: PieceInput[] }
}): Promise<{ uuid: string; id: number; pieceCount: number }> {
  const { product, pieces } = params

  if (!product || clean(product.name) === null) {
    throw new Error('A product needs a name.')
  }

  // Blank rows are expected — the entry grid keeps spare ones around.
  const realPieces = (pieces ?? []).filter((p) => clean(p.part_name) !== null)
  if (realPieces.length === 0) {
    throw new Error('A product needs at least one piece with a part name.')
  }

  const productUuid = recordId()

  await awcomMysql.query(INSERT_PRODUCT, [
    productUuid,
    ...PRODUCT_COLUMNS.map((col) => clean(product[col])),
  ])

  try {
    for (const batch of chunk(realPieces, INSERT_CHUNK)) {
      const statement = INSERT_PIECES[batch.length]
      if (statement === undefined) throw new Error(`No insert statement for ${batch.length} rows.`)
      const args: unknown[] = []
      for (const piece of batch) {
        args.push(recordId(), productUuid, ...PIECE_COLUMNS.map((col) => clean(piece[col])))
      }
      await awcomMysql.query(statement, args)
    }
  } catch (err) {
    // Separate resource calls share no transaction, so undo the product by
    // hand. Leaving it would create exactly the piece-less orphan the Overview
    // flags, out of a submit the user believes failed outright.
    await awcomMysql.query(DELETE_PRODUCT, [productUuid])
    throw err
  }

  const created = await awcomMysql.query<{ id: number }>(
    `SELECT id FROM collection_products WHERE uuid = ? LIMIT 1`,
    [productUuid],
  )

  return {
    uuid: productUuid,
    id: Number(created.data[0]?.id ?? 0),
    pieceCount: realPieces.length,
  }
}
