// Read-only checks against the live collection.
//
// Nothing here writes: there is no delete-product function in the backend
// (DELETE_PRODUCT exists in _sql.ts but only as createProduct's rollback), so a
// test that created a product would leave it in the real inventory forever.
//
// Because the data is live, assertions are relational ("every visible row
// matches the filter", "this column is non-increasing") rather than absolute
// ("there are 47 results"). Absolute counts would rot the next time a product
// is added.

import { expect, test } from '@playwright/test'
import { COL, PAGE_SIZE, ProductsPage } from '../products-page'

test.describe('product list', () => {
  test('loads with a total and a full page of rows', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    expect(await products.reportedTotal()).toBeGreaterThan(0)
    await expect(products.rows.first()).toBeVisible()
  })

  test('the reported total agrees with the rows actually rendered', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    // Exercises COUNT(*) OVER () against LIMIT: the header counts every match,
    // the table shows at most one page of them.
    const total = await products.reportedTotal()
    expect(await products.rows.count()).toBe(Math.min(total, PAGE_SIZE))
  })

  test('paging keeps the total steady and fills the last page correctly', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    // Narrow to something spanning a couple of pages but not the whole table.
    await products.search('apple')
    const total = await products.reportedTotal()
    test.skip(total <= PAGE_SIZE, `"apple" matched ${total}, too few to page`)

    await products.nextPage()
    expect(await products.reportedTotal()).toBe(total)
    expect(await products.rows.count()).toBe(Math.min(total - PAGE_SIZE, PAGE_SIZE))
  })
})

test.describe('filtering', () => {
  test('search tokens AND together instead of widening', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    await products.search('apple')
    const apple = await products.reportedTotal()

    await products.search('apple laserwriter')
    const both = await products.reportedTotal()

    // The old app substring-matched the whole query per field, which would find
    // nothing; an OR across tokens would return >= apple. Neither is right.
    expect(both).toBeGreaterThan(0)
    expect(both).toBeLessThan(apple)
  })

  test('a company filter constrains every visible row', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    // Options come back ranked by frequency, so the first is the safest pick.
    const [company] = await products.optionNames('Company')
    expect(company).toBeTruthy()

    await products.chooseFilterOption('Company', company!)
    expect(await products.rows.count()).toBeGreaterThan(0)

    for (const cell of await products.column(COL.company)) {
      expect(cell.trim()).toBe(company)
    }
  })

  test('the no-pieces toggle shows only products with zero pieces', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    // piece_count is an aggregate, so this filters in HAVING rather than WHERE.
    await products.toggle('No pieces')
    expect(await products.rows.count()).toBeGreaterThan(0)

    for (const cell of await products.column(COL.pieces)) {
      expect(cell.trim()).toBe('0')
    }
  })

  test('the subtype list narrows to the selected type', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    const all = await products.optionNames('Subtype')

    const [type] = await products.optionNames('Type')
    await products.chooseFilterOption('Type', type!)
    const narrowed = await products.optionNames('Subtype')

    expect(narrowed.length).toBeLessThan(all.length)
    expect(new Set(all)).toEqual(new Set([...all, ...narrowed]))
  })
})

test.describe('sorting', () => {
  test('sorting by pieces orders the column descending', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    // Piece count defaults to descending — most useful highest-first.
    await products.sortBy('Pieces')

    const counts = (await products.column(COL.pieces)).map((c) => Number(c.trim()))
    expect(counts.length).toBeGreaterThan(1)
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]!).toBeLessThanOrEqual(counts[i - 1]!)
    }
  })

  test('the sort order holds across a page boundary', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.sortBy('Pieces')

    const total = await products.reportedTotal()
    test.skip(total <= PAGE_SIZE, 'not enough products to page')

    const firstPage = (await products.column(COL.pieces)).map((c) => Number(c.trim()))
    await products.nextPage()
    const secondPage = (await products.column(COL.pieces)).map((c) => Number(c.trim()))

    // ORDER BY + OFFSET agreeing across pages is the thing unit tests can't prove.
    expect(secondPage[0]!).toBeLessThanOrEqual(firstPage[firstPage.length - 1]!)
  })
})
