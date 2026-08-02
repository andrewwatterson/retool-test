// Every distinct value the filter controls offer, with counts, in one round
// trip. 406 distinct companies is too many for a plain dropdown, so the UI
// renders these as searchable lists — the counts let the useful ones surface.

export type Option = { value: string; count: number }

export type FilterOptions = {
  companies: Option[]
  types: Option[]
  /** Subtypes paired with their parent type, so the subtype list can narrow. */
  subtypes: Array<{ type: string; value: string; count: number }>
  platforms: Option[]
  completeness: Option[]
  partTypes: Option[]
  locations: Option[]
  yearRange: { min: number | null; max: number | null }
}

/** NULL and '' both mean "not set"; collapse them into one selectable bucket. */
const UNSET = '__unset__'

function normalize(rows: Array<{ v: string | null; n: number | string }>): Option[] {
  const out: Option[] = []
  let unset = 0
  for (const row of rows) {
    const count = Number(row.n)
    if (row.v === null || row.v === '') unset += count
    else out.push({ value: row.v, count })
  }
  if (unset > 0) out.push({ value: UNSET, count: unset })
  return out
}

export default async function getFilterOptions(): Promise<FilterOptions> {
  const [companies, types, subtypes, platforms, completeness, partTypes, locations, years] =
    await Promise.all([
      awcomMysql.query<{ v: string | null; n: number }>(
        `SELECT company v, COUNT(*) n FROM collection_products GROUP BY company ORDER BY n DESC, company ASC`,
      ),
      awcomMysql.query<{ v: string | null; n: number }>(
        `SELECT type v, COUNT(*) n FROM collection_products GROUP BY type ORDER BY n DESC`,
      ),
      awcomMysql.query<{ t: string | null; v: string | null; n: number }>(
        `SELECT type t, subtype v, COUNT(*) n FROM collection_products
          GROUP BY type, subtype ORDER BY type ASC, n DESC`,
      ),
      awcomMysql.query<{ v: string | null; n: number }>(
        `SELECT platform v, COUNT(*) n FROM collection_products GROUP BY platform ORDER BY n DESC`,
      ),
      awcomMysql.query<{ v: string | null; n: number }>(
        `SELECT complete v, COUNT(*) n FROM collection_products GROUP BY complete ORDER BY n DESC`,
      ),
      awcomMysql.query<{ v: string | null; n: number }>(
        `SELECT part_type v, COUNT(*) n FROM collection_pieces GROUP BY part_type ORDER BY n DESC`,
      ),
      awcomMysql.query<{ v: string | null; n: number }>(
        `SELECT location v, COUNT(*) n FROM collection_pieces GROUP BY location ORDER BY n DESC`,
      ),
      awcomMysql.query<{ min: number | null; max: number | null }>(
        `SELECT MIN(CAST(NULLIF(year, '') AS UNSIGNED)) AS min,
                MAX(CAST(NULLIF(year, '') AS UNSIGNED)) AS max
           FROM collection_products`,
      ),
    ])

  const span = years.data[0]

  return {
    companies: normalize(companies.data),
    types: normalize(types.data),
    subtypes: subtypes.data
      .filter((r) => r.v !== null && r.v !== '')
      .map((r) => ({ type: r.t ?? UNSET, value: r.v as string, count: Number(r.n) })),
    platforms: normalize(platforms.data),
    completeness: normalize(completeness.data),
    partTypes: normalize(partTypes.data),
    locations: normalize(locations.data),
    yearRange: {
      min: span?.min === null || span?.min === undefined ? null : Number(span.min),
      max: span?.max === null || span?.max === undefined ? null : Number(span.max),
    },
  }
}
