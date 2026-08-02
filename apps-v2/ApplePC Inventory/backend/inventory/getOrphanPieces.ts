// The pieces no product-grouped view can reach: empty product_id, or a
// product_id pointing at a product that no longer exists. There are only a
// handful, but they're invisible everywhere else, so they get their own view.

export type OrphanPiece = {
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
  reason: 'unassigned' | 'dangling'
}

export default async function getOrphanPieces(): Promise<{ pieces: OrphanPiece[] }> {
  const rows = await awcomMysql.query<Omit<OrphanPiece, 'reason'> & { reason: string }>(
    `SELECT c.id, c.uuid, c.product_id, c.part_name, c.part_type, c.part_no, c.serial,
            c.year, c.location, c.condition_notes, c.notes,
            CASE WHEN c.product_id IS NULL OR c.product_id = ''
                 THEN 'unassigned' ELSE 'dangling' END AS reason
       FROM collection_pieces c
      WHERE c.product_id IS NULL OR c.product_id = ''
         OR NOT EXISTS (SELECT 1 FROM collection_products p
              WHERE p.uuid = c.product_id)
      ORDER BY reason ASC, c.part_name ASC`,
  )

  return {
    pieces: rows.data.map((r) => ({
      ...r,
      reason: r.reason === 'unassigned' ? ('unassigned' as const) : ('dangling' as const),
    })),
  }
}
