// One-time login, saved for the real specs to reuse.
//
//   npm run auth
//
// A headed browser opens on the preview URL. Sign in to Retool however you
// normally do; as soon as the app itself renders, the session is written to
// .auth/state.json and the browser closes. Re-run whenever the session expires.

import { expect, test } from '@playwright/test'

const STATE = '.auth/state.json'

test('save a signed-in session', async ({ page, context }) => {
  test.setTimeout(5 * 60_000)

  await page.goto('/')

  // The app's own wordmark — proof we're past every login redirect and the
  // sandbox has actually booted the bundle.
  await expect(page.locator('.iv-wordmark')).toBeVisible({ timeout: 5 * 60_000 })
  // And that the first backend call succeeded, so we don't bank a session that
  // authenticates the page but not the resource.
  await expect(page.locator('.iv-table tbody tr').first()).toBeVisible()

  await context.storageState({ path: STATE })
  console.log(`\n  Saved session to tests/${STATE}\n`)
})
