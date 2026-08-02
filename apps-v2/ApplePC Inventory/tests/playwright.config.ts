import { execFileSync } from 'node:child_process'
import { defineConfig, devices } from '@playwright/test'

// The app has no local dev server — `frontend/hooks/useBackendFunction.ts` is a
// stub that Retool replaces at build time, so the only runnable copy is the one
// Retool builds. Tests therefore point at the preview URL for the current
// branch. Set PREVIEW_URL to override (e.g. a published URL, or to skip the CLI
// round trip in a tight loop).
function previewUrl(): string {
  const override = process.env['PREVIEW_URL']
  if (override !== undefined && override !== '') return override

  const raw = execFileSync('retool', ['preview', '--json'], {
    cwd: '..',
    encoding: 'utf8',
  })
  // `retool preview` prints a human line before the JSON object.
  const json = raw.slice(raw.indexOf('{'))
  const { url, ready, state } = JSON.parse(json) as {
    url: string | null
    ready: boolean
    state: string
  }
  if (!ready || url === null) {
    throw new Error(
      `Preview build is "${state}", not ready. Run \`retool push -m "..."\` then \`retool preview --wait\`.`,
    )
  }
  return url
}

export default defineConfig({
  testDir: './specs',
  // Every action is a real round trip to Retool plus a real MySQL query, so the
  // defaults are too tight.
  timeout: 90_000,
  expect: { timeout: 20_000 },
  // One worker: these run against the live production database, and there is no
  // isolation between them. Being kind to it also keeps timings predictable.
  workers: 1,
  retries: process.env['CI'] !== undefined ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: previewUrl(),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      // Run manually: `npm run auth`. Opens a headed browser, waits for you to
      // finish the Retool login, then saves the session to .auth/state.json.
      name: 'auth',
      testDir: './',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'products',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/state.json' },
    },
  ],
})
