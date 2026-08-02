// Shapes returned by the backend functions. The generated hooks type `data` as
// `any`, so pages assert against these to get real checking back.

/** Sentinel for "this field is empty" in a filter list. A handful of products
 *  have no type or completeness at all; without this they'd be unreachable. */
export const UNSET = '__unset__'

export type Option = { value: string; count: number }

export type FilterOptions = {
  companies: Option[]
  types: Option[]
  subtypes: Array<{ type: string; value: string; count: number }>
  platforms: Option[]
  completeness: Option[]
  partTypes: Option[]
  locations: Option[]
  yearRange: { min: number | null; max: number | null }
}

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

export type Product = Omit<ProductRow, 'piece_count'>

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

export type PieceGroup = {
  uuid: string
  name: string
  company: string | null
  year: string | null
  type: string | null
  subtype: string | null
  complete: string | null
  /** `matched` is 1 when the piece matched, and NULL — not 0 — when the
   *  predicate compared against a NULL column. Always test for `=== 1`. */
  pieces: Array<Piece & { matched: number | null }>
}

export type OrphanPiece = Omit<Piece, 'image'> & { reason: 'unassigned' | 'dangling' }

export type Stats = {
  products: number
  pieces: number
  byCompleteness: Array<{ value: string; count: number }>
  productsWithoutPieces: number
  unassignedPieces: number
  danglingPieces: number
}

export type SortKey =
  | 'name'
  | 'company'
  | 'year'
  | 'type'
  | 'subtype'
  | 'complete'
  | 'pieces'
  | 'id'

/** Strongest first. Drives both the sort order and the completeness meter. */
export const COMPLETENESS = ['Complete', 'Mostly Complete', 'Core', 'Partial', 'Non-Original']

/** The two the collection doesn't really represent. */
export const WEAK_COMPLETENESS = ['Partial', 'Non-Original']

export const PRODUCT_FIELDS = [
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

export type ProductField = (typeof PRODUCT_FIELDS)[number]

export const PIECE_FIELDS = [
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

export type PieceField = (typeof PIECE_FIELDS)[number]

export function labelFor(value: string | null): string {
  if (value === null || value === '') return '—'
  if (value === UNSET) return 'Not set'
  return value
}
