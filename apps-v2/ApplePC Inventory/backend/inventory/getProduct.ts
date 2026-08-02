// One product plus every piece attached to it, for the detail pane.

export type Product = {
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
}

export type Piece = {
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
}

export default async function getProduct({ params }: { params: { uuid: string } }): Promise<{
  product: Product | null
  pieces: Piece[]
}> {
  const { uuid } = params
  if (!uuid) return { product: null, pieces: [] }

  const product = await awcomMysql.query<Product>(
    `SELECT id, uuid, name, version, company, year, type, subtype, platform, complete, notes
       FROM collection_products WHERE uuid = ? LIMIT 1`,
    [uuid],
  )

  const found = product.data[0]
  if (!found) return { product: null, pieces: [] }

  const pieces = await awcomMysql.query<Piece>(
    `SELECT id, uuid, product_id, part_name, part_type, part_no, serial, year,
            location, condition_notes, notes, image
       FROM collection_pieces
      WHERE product_id = ?
      ORDER BY (part_type IS NULL OR part_type = '') ASC, part_type ASC, part_name ASC`,
    [uuid],
  )

  return { product: found, pieces: pieces.data }
}
