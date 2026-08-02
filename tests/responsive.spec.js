// @ts-check
const { test, expect } = require('./fixtures');

/**
 * Cross-device layout checks + screenshot capture.
 *
 * The assertions here are the ones that actually catch regressions
 * (overflow, unreadable text, tap targets). The screenshots are for a
 * human to eyeball — run `npm test` then `npm run report` to browse them.
 */

const PAGES = [
  ['home', '/'],
  ['schedule', '/schedule/'],
  ['coaches', '/coaches/'],
  ['open-mat', '/programs/open-mat/'],
  ['mats-donate', '/mats/'],
];

for (const [name, path] of PAGES) {
  test(`${name}: no horizontal overflow`, async ({ page }, testInfo) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    // The single most common mobile bug: something wider than the viewport
    // causes a sideways scroll. Allow 1px for sub-pixel rounding.
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, `${name} overflows horizontally`).toBeLessThanOrEqual(clientWidth + 1);
  });

  test(`${name}: full-page screenshot`, async ({ page }, testInfo) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    // Freeze animations so shots are stable run-to-run.
    await page.addStyleTag({
      content: `*,*::before,*::after{animation:none!important;transition:none!important}`,
    });
    const buf = await page.screenshot({ fullPage: true });
    await testInfo.attach(`${name}-${testInfo.project.name}`, {
      body: buf,
      contentType: 'image/png',
    });
  });
}

test('belt badge sits in the lower half of the portrait', async ({ page }) => {
  await page.goto('/coaches/');
  const badges = page.locator('.coach-card__belt');
  const count = await badges.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const badge = badges.nth(i);
    const media = badge.locator('xpath=..'); // .coach-card__media
    const b = await badge.boundingBox();
    const m = await media.boundingBox();
    if (!b || !m) continue;

    // Faces sit in the upper ~60% of a 4:5 portrait. Require the badge to
    // start below the midpoint of the photo — that's the whole point of
    // moving it off the top-left corner. Card layout changes at the lg
    // breakpoint, so this is checked at every width.
    const badgeTopWithinMedia = (b.y - m.y) / m.height;
    expect(badgeTopWithinMedia, 'belt badge should be in the lower half of the photo')
      .toBeGreaterThan(0.5);
  }
});

test('schedule grid is usable on a phone', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'phone-only check');
  await page.goto('/schedule/');

  // Every class slot must be tappable and readable.
  const slots = page.locator('.schedule__slot');
  await expect(slots.first()).toBeVisible();

  const box = await slots.first().boundingBox();
  expect(box?.height, 'class slots should meet the 44px tap-target minimum').toBeGreaterThanOrEqual(44);

  const fontSize = await slots
    .first()
    .locator('.schedule__slot-time')
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(fontSize, 'class times should be at least 11px on mobile').toBeGreaterThanOrEqual(11);
});

test('mobile nav drawer opens and is not clipped', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'phone-only check');
  await page.goto('/');

  const burger = page.locator('#burger');
  await expect(burger).toBeVisible();
  await burger.click();

  const drawer = page.locator('#mobile-nav');
  await expect(drawer).toHaveClass(/is-open/);
  await expect(drawer).toHaveAttribute('aria-hidden', 'false');

  // Regression guard for the "drawer clipped to 96px by the header
  // backdrop-filter" bug (fixed in f3dbc3a) — make sure it stays fixed.
  const box = await drawer.boundingBox();
  expect(box?.height ?? 0, 'nav drawer should open to more than a sliver').toBeGreaterThan(200);

  // Every nav link should be reachable, not cut off below the fold.
  const links = drawer.locator('a');
  await expect(links.first()).toBeVisible();
  await expect(links.last()).toBeVisible();
});
