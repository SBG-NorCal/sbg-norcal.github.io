// @ts-check
const base = require('@playwright/test');

/**
 * Shared test fixtures.
 *
 * `docker compose up` — the workflow docs/TESTING.md recommends — runs
 * `jekyll serve --livereload`, which injects a livereload client into every
 * page. That client can reload the page at any moment (it polls, and
 * --force_polling makes rebuilds frequent), which surfaces as
 * "Execution context was destroyed, most likely because of a navigation"
 * partway through a test.
 *
 * Tests should not care how the dev server was started, so block the
 * livereload client. Everything else about the page is unchanged.
 */
const test = base.test.extend({
  page: async ({ page }, use) => {
    await page.route(/livereload\.js/, (route) => route.abort());
    await use(page);
  },
});

module.exports = { test, expect: base.expect };
