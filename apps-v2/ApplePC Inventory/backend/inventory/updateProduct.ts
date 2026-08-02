// Field-level edits to one product.
//
// The UPDATE writes all nine columns from one static statement (see _sql.ts on
// why the SQL can't be built per-call), so the current row is read first and
// `changes` merged onto it. Only keys actually present in `changes` override —
// editing `year` can't blank out `notes`.

import { PRODUCT_COLUMNS, SELECT_PRODUCT, UPDATE_PRODUCT, clean, type ProductColumn } from './_sql'

export default async function updateProduct({
  params,
}: {
  params: { uuid: string; changes: Partial<Record<ProductColumn, string | null>> }
}): Promise<{ updated: number }> {
  const { uuid, changes } = params
  if (!uuid) throw new Error('updateProduct needs a product uuid.')

  const incoming = changes ?? {}
  // An explicit null clears a field; a missing key leaves it alone.
  const columns = PRODUCT_COLUMNS.filter((col) => incoming[col] !== undefined)
  if (columns.length === 0) return { updated: 0 }

  const current = await awcomMysql.query<Record<string, string | null>>(SELECT_PRODUCT, [uuid])
  const row = current.data[0]
  if (!row) throw new Error(`No product with uuid ${uuid}.`)

  const merged = PRODUCT_COLUMNS.map((col) =>
    incoming[col] !== undefined ? clean(incoming[col]) : (row[col] ?? null),
  )

  if (clean(merged[PRODUCT_COLUMNS.indexOf('name')]) === null) {
    throw new Error('A product needs a name.')
  }

  await awcomMysql.query(UPDATE_PRODUCT, [...merged, uuid])

  return { updated: columns.length }
}
