// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright config for the SBG NorCal × MATS site.
 *
 * Cross-platform by design — nothing here shells out to a platform-specific
 * binary, and the dev server is started through Bundler (macOS/Linux/Windows)
 * or reused if you already have one running (e.g. `docker compose up`).
 *
 *   npm test                     # run everything, all viewports
 *   npm test -- --project=phone  # 360px phone only
 *   npm run test:ui              # interactive runner
 *
 * If a server is already listening on :4000 (Docker, or your own
 * `bundle exec jekyll serve`), Playwright reuses it instead of starting
 * a second one. That's what makes `docker compose up` + `npm test` work.
 */

const PORT = Number(process.env.PORT || 4000);

// `baseurl` in _config.yml is empty, so Jekyll serves at the root locally.
// Override with BASE_URL=... if you ever set a baseurl.
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}/`;

module.exports = defineConfig({
  testDir: './tests',
  // Screenshots live next to the specs so they're easy to eyeball in a PR.
  snapshotDir: './tests/__screenshots__',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /**
   * Two kinds of test, so two kinds of project:
   *
   *   content.spec.js     "Is the information correct?"  — screen size is
   *                       irrelevant, so it runs ONCE.
   *   responsive.spec.js  "Does it look right on this screen?" — runs on each
   *                       device profile below.
   *
   * Running the content tests at every width just turns one broken fact into
   * four identical red lines, which makes failures harder to read, not safer.
   *
   * Every profile is Chromium on purpose. The iPad/Pixel descriptors supply
   * viewport, DPR, touch and UA; only the engine is pinned, because setup and
   * CI install Chromium alone (an unpinned iPad/iPhone descriptor defaults to
   * WebKit and fails with "Executable doesn't exist"). Real Safari coverage
   * comes from opening the site on an actual iPhone — see docs/TESTING.md.
   * Headless WebKit would not catch the iOS bugs that matter here anyway.
   */
  projects: [
    {
      name: 'content',
      testMatch: /content\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },

    // Layout profiles: one on each side of every breakpoint in _tokens.scss.
    {
      // 360px — the narrowest phone worth supporting (Galaxy A-series). If the
      // layout survives here, wider phones follow.
      name: 'phone',
      testMatch: /responsive\.spec\.js/,
      use: { ...devices['Pixel 5'], viewport: { width: 360, height: 740 } },
    },
    {
      // 768px — below the lg breakpoint: 2-column grids, still hamburger nav.
      name: 'tablet',
      testMatch: /responsive\.spec\.js/,
      use: { ...devices['iPad Mini'], browserName: 'chromium' },
    },
    {
      // 1024px — exactly at lg, where the nav flips to horizontal and the
      // schedule becomes a week grid. Breakpoint boundaries are where bugs live.
      name: 'laptop',
      testMatch: /responsive\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 800 } },
    },
    {
      name: 'desktop',
      testMatch: /responsive\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],

  webServer: {
    command: 'bundle exec jekyll serve --host 127.0.0.1 --port ' + PORT,
    url: BASE_URL,
    // Reuse a server you started yourself (docker compose up, or a separate
    // `bundle exec jekyll serve`). Only CI insists on starting its own.
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
