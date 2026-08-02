// Selectors for the Products page, kept in one place so a markup change is a
// one-file fix. The app ships no data-testids, but the `iv-*` class names are
// stable and the table is real semantic markup.

import { expect, type Locator, type Page } from '@playwright/test'

/** Mirrors PAGE_SIZE in frontend/pages/Products.tsx. */
export const PAGE_SIZE = 100

/** Column order from the COLUMNS array in frontend/pages/Products.tsx. */
export const COL = {
  product: 0,
  company: 1,
  year: 2,
  type: 3,
  completeness: 4,
  pieces: 5,
} as const

export class ProductsPage {
  readonly rows: Locator
  readonly loadingBar: Locator
  private readonly total: Locator

  constructor(readonly page: Page) {
    this.rows = page.locator('.iv-table tbody tr')
    this.loadingBar = page.locator('.iv-loading-bar')
    // Both the toolbar and the pager render `.iv-count`; the toolbar's is the
    // authoritative total.
    this.total = page.locator('.iv-toolbar .iv-count strong')
  }

  async goto(): Promise<void> {
    await this.page.goto('/')
    await expect(this.page.locator('.iv-wordmark')).toBeVisible()
    await this.settle()
  }

  /**
   * Wait for the list to reflect the last interaction.
   *
   * The fixed wait is deliberate rather than a sleep-and-hope: `q` is debounced
   * 220ms (see useDebounced), so for a beat after typing there is no in-flight
   * request to wait on and the loading bar has not yet appeared.
   */
  async settle(): Promise<void> {
    await this.page.waitForTimeout(400)
    await expect(this.loadingBar).toHaveCount(0, { timeout: 60_000 })
  }

  /** The total reported in the toolbar, e.g. "2,457" -> 2457. */
  async reportedTotal(): Promise<number> {
    const text = (await this.total.innerText()).replace(/,/g, '')
    return Number(text)
  }

  async search(text: string): Promise<void> {
    const box = this.page.locator('.iv-search input')
    await box.fill(text)
    await this.settle()
  }

  /**
   * Text of one column across every rendered row.
   *
   * nth-child, not `.locator('td').nth(i)` — the latter flattens every cell in
   * the table into one list and would return the i-th cell overall.
   */
  async column(index: number): Promise<string[]> {
    return this.page.locator(`.iv-table tbody tr td:nth-child(${index + 1})`).allInnerTexts()
  }

  private filter(label: string): Locator {
    return this.page.locator('.iv-ms', {
      has: this.page.getByText(label, { exact: true }),
    })
  }

  async openFilter(label: string): Promise<Locator> {
    const root = this.filter(label)
    await root.locator('button.iv-ms-trigger').click()
    const panel = root.locator('.iv-ms-panel')
    await expect(panel).toBeVisible()
    return panel
  }

  /** Options in an open filter panel, in the order the backend ranked them. */
  async optionNames(label: string): Promise<string[]> {
    const panel = await this.openFilter(label)
    const names = await panel.locator('.iv-ms-option-name').allInnerTexts()
    await this.page.keyboard.press('Escape')
    return names
  }

  async chooseFilterOption(label: string, option: string): Promise<void> {
    const panel = await this.openFilter(label)
    await panel
      .locator('.iv-ms-option', { has: this.page.getByText(option, { exact: true }) })
      .first()
      .click()
    await this.page.keyboard.press('Escape')
    await this.settle()
  }

  async toggle(text: string): Promise<void> {
    await this.page.locator('label.iv-check', { hasText: text }).locator('input').check()
    await this.settle()
  }

  async sortBy(columnLabel: string): Promise<void> {
    await this.page.locator('th.iv-sortable', { hasText: columnLabel }).click()
    await this.settle()
  }

  async nextPage(): Promise<void> {
    await this.page.locator('.iv-pager button', { hasText: 'Next' }).click()
    await this.settle()
  }
}
