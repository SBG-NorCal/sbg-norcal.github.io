// @ts-check
const { test, expect } = require('./fixtures');
const fs = require('fs');
const path = require('path');

/**
 * Content regression tests — one describe block per change request.
 *
 * These assert on rendered HTML, so they catch both data errors
 * (_data/schedule.yml) and template errors (_includes/schedule-grid.html).
 * They run at every viewport in playwright.config.js, which is deliberate:
 * a few of these are things that historically only broke on mobile.
 */

// ---------------------------------------------------------------------------
// 1 + 2. Schedule: no duplicate classes, correct end times
// ---------------------------------------------------------------------------
test.describe('schedule', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/schedule/');
  });

  /** Scrape the rendered grid into [{day, start, end, title, level}]. */
  async function readGrid(page) {
    return page.$$eval('.schedule__day', (days) =>
      days.flatMap((dayEl) => {
        const day = dayEl.querySelector('.schedule__day-name')?.firstChild?.textContent?.trim();
        return [...dayEl.querySelectorAll('.schedule__slot')].map((slot) => {
          const time = slot.querySelector('.schedule__slot-time')?.textContent?.trim() ?? '';
          const [start, end] = time.split(/\s*[–-]\s*/);
          return {
            day,
            start,
            end,
            title: slot.querySelector('.schedule__slot-title')?.textContent?.trim(),
            level: slot.querySelector('.schedule__slot-level')?.textContent?.trim(),
          };
        });
      })
    );
  }

  test('has no duplicate class on the same day', async ({ page }) => {
    const grid = await readGrid(page);
    expect(grid.length).toBeGreaterThan(0);

    // The original bug: Foundations BJJ appeared on Monday at BOTH 06:30
    // and 18:30 — the same class entered twice, once with a mis-typed
    // 12-hour time. Any (day, title, level) appearing twice is suspect.
    const seen = new Map();
    for (const c of grid) {
      const key = `${c.day}|${c.title}|${c.level}`;
      seen.set(key, [...(seen.get(key) ?? []), c.start]);
    }
    const dupes = [...seen.entries()].filter(([, starts]) => starts.length > 1);
    expect(dupes, `duplicate classes: ${JSON.stringify(dupes)}`).toEqual([]);
  });

  test('renders no empty day columns', async ({ page }) => {
    const days = page.locator('.schedule__day');
    const count = await days.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const name = await days.nth(i).locator('.schedule__day-name').textContent();
      const slots = await days.nth(i).locator('.schedule__slot').count();
      expect(slots, `${name?.trim()} column is empty and should not render`).toBeGreaterThan(0);
    }

    // The grid's column count must match the number of days rendered,
    // otherwise the columns go uneven.
    const cols = await page
      .locator('[data-schedule-grid]')
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--schedule-days').trim());
    expect(Number(cols)).toBe(count);
  });

  test('has no early-morning classes (the 06:30 / 18:30 mix-up)', async ({ page }) => {
    const grid = await readGrid(page);
    // Nothing at this gym runs before 09:30. A time before 09:00 means a
    // PM class was entered as AM again.
    const early = grid.filter((c) => c.start < '09:00');
    expect(early, `unexpected AM classes: ${JSON.stringify(early)}`).toEqual([]);
  });

  test('Foundations BJJ ends at 19:45', async ({ page }) => {
    const grid = await readGrid(page);
    const found = grid.filter(
      (c) => c.title === 'Brazilian Jiu-Jitsu' && c.level === 'Foundations' && c.day !== 'Saturday'
    );
    expect(found.length).toBeGreaterThan(0);
    for (const c of found) {
      expect(c.start, `${c.day} Foundations start`).toBe('18:30');
      expect(c.end, `${c.day} Foundations end`).toBe('19:45');
    }
  });

  test('Integrations BJJ ends at 20:45', async ({ page }) => {
    const grid = await readGrid(page);
    const found = grid.filter(
      (c) => c.title === 'Brazilian Jiu-Jitsu' && c.level === 'Integrations' && c.day !== 'Saturday'
    );
    expect(found.length).toBeGreaterThan(0);
    for (const c of found) {
      expect(c.start, `${c.day} Integrations start`).toBe('19:30');
      expect(c.end, `${c.day} Integrations end`).toBe('20:45');
    }
  });

  test('every class has a sane duration (15 min – 3 h)', async ({ page }) => {
    const grid = await readGrid(page);
    const toMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    for (const c of grid) {
      const dur = toMin(c.end) - toMin(c.start);
      expect(dur, `${c.day} ${c.title} ${c.start}-${c.end}`).toBeGreaterThanOrEqual(15);
      expect(dur, `${c.day} ${c.title} ${c.start}-${c.end}`).toBeLessThanOrEqual(180);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Coach belt badge must not cover faces; Oki is a purple belt
// ---------------------------------------------------------------------------
test.describe('coach cards', () => {
  // NOTE: the belt badge's *position* is a layout assertion and lives in
  // responsive.spec.js, where it runs at every width. This file only covers
  // facts that are the same on every screen.

  test('program pages still list coaches', async ({ page }) => {
    // The schedule carries no coach assignments, so this section is driven
    // by the `programs:` list in each coach's front matter. If that wiring
    // breaks, the section silently disappears rather than erroring — hence
    // this test.
    for (const slug of ['brazilian-jiu-jitsu', 'kickboxing', 'youth-martial-arts']) {
      await page.goto(`/programs/${slug}/`);
      const cards = page.locator('.coaches-grid .coach-card');
      await expect(cards.first(), `no coaches listed on /programs/${slug}/`).toBeVisible();
    }
  });

  test('schedule grid does not name coaches', async ({ page }) => {
    await page.goto('/schedule/');
    await expect(page.locator('.schedule__slot-coach')).toHaveCount(0);
  });

  test('Oki is listed as a Purple Belt', async ({ page }) => {
    await page.goto('/coaches/');
    const card = page.locator('.coach-card', { hasText: 'Oki' });
    await expect(card).toBeVisible();
    await expect(card.locator('.coach-card__belt')).toHaveText(/Purple Belt/i);
    await expect(card.locator('.coach-card__belt')).not.toHaveText(/Brown/i);
  });
});

// ---------------------------------------------------------------------------
// 4. Open Mat requires coach approval to roll
// ---------------------------------------------------------------------------
test.describe('open mat', () => {
  test('program page states rolling needs coach approval', async ({ page }) => {
    await page.goto('/programs/open-mat/');
    await expect(page.locator('body')).toContainText(/coach'?s? approval/i);
    await expect(page.locator('body')).toContainText(/rolling|sparring/i);
  });

  test('schedule entry is not a bare "All Levels"', async ({ page }) => {
    await page.goto('/schedule/');
    const openMat = page.locator('.schedule__slot--open-mat').first();
    await expect(openMat).toBeVisible();
    // Must qualify the level, not just say "All Levels".
    await expect(openMat.locator('.schedule__slot-level')).toContainText(/approval/i);
  });
});

// ---------------------------------------------------------------------------
// SEO metadata — canonical must match where the site actually lives
// ---------------------------------------------------------------------------
test.describe('seo', () => {
  // IMPORTANT: `jekyll serve` overrides site.url with the dev server's own
  // address, so canonical tags in a local/CI run always read
  // http://127.0.0.1:4000/... regardless of what _config.yml says. That
  // means a browser assertion here CANNOT catch a bad production `url:`.
  // So we assert against _config.yml directly — that's the value that ships.
  test('_config.yml url points at where the site is actually served', () => {
    const cfg = fs.readFileSync(path.join(__dirname, '..', '_config.yml'), 'utf8');
    const url = cfg.match(/^url:\s*"?([^"\n#]+)"?/m)?.[1].trim();

    expect(url, 'no url: in _config.yml').toBeTruthy();
    // It once pointed at the gym's Wix domain while the site was served
    // elsewhere, making every canonical tag and all 34 sitemap URLs resolve
    // to a page that doesn't exist.
    // NOTE: delete this one assertion at the sbgnorcal.com cutover — that is
    // the point where pointing here becomes correct rather than wrong.
    expect(url, 'url still points at the gym\'s Wix site').not.toMatch(/sbgnorcal\.com/);
    expect(url).toMatch(/^https:\/\//);
    expect(url, 'url should have no trailing slash or path').toMatch(/^https:\/\/[^/]+$/);

    // baseurl must stay empty. This is the org-site repo
    // (SBG-NorCal/sbg-norcal.github.io), so Pages serves from a domain root
    // and actions/configure-pages resolves base_path to "". A non-empty value
    // here breaks local serving and buys nothing in production.
    const baseurl = cfg.match(/^baseurl:\s*"([^"]*)"/m)?.[1];
    expect(baseurl, 'baseurl should be empty in _config.yml').toBe('');
  });

  // `url` and `noindex` have to move together at the sbgnorcal.com cutover.
  // Shipping one without the other is silently wrong in one of two ways: the
  // real site launches with noindex still on (invisible to search), or the
  // staging address gets indexed and competes with the gym's live Wix site.
  // Neither is visible on the page, so assert the invariant instead.
  test('noindex matches whether url is the staging or the real domain', () => {
    const cfg = fs.readFileSync(path.join(__dirname, '..', '_config.yml'), 'utf8');
    const url = cfg.match(/^url:\s*"?([^"\n#]+)"?/m)?.[1].trim();
    const noindex = cfg.match(/^noindex:\s*(true|false)/m)?.[1];

    expect(noindex, 'no noindex: in _config.yml').toBeTruthy();

    if (url.includes('github.io')) {
      expect(
        noindex,
        'url is still the github.io staging address, so noindex must be true',
      ).toBe('true');
    } else {
      expect(
        noindex,
        `url is a real domain (${url}), so noindex must be false or nobody finds the site`,
      ).toBe('false');
    }
  });

  test('stylesheet is cache-busted so CSS changes apply immediately', async ({ page }) => {
    // Without a per-build query string, GitHub Pages' max-age=600 lets a
    // browser pair OLD cached CSS with NEW HTML for up to 10 minutes after a
    // deploy. That reported as two convincing layout bugs — belt badge back
    // on top of faces, and a gap where the Sunday column used to be — when
    // in fact both fixes had shipped correctly.
    await page.goto('/');
    const href = await page.locator('link[rel=stylesheet][href*="main.css"]').getAttribute('href');
    expect(href, 'no local stylesheet link found').toBeTruthy();
    expect(href, 'main.css needs a ?v= cache-buster').toMatch(/main\.css\?v=\d+/);
  });

  test('canonical and og:url agree and are absolute', async ({ page }) => {
    for (const p of ['/', '/schedule/', '/coaches/', '/mats/']) {
      await page.goto(p);
      const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
      const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');

      expect(canonical, `no canonical on ${p}`).toBeTruthy();
      expect(() => new URL(canonical), `canonical not absolute on ${p}`).not.toThrow();
      expect(ogUrl, `og:url disagrees with canonical on ${p}`).toBe(canonical);
    }
  });

  test('sitemap is present and internally consistent', async ({ page }) => {
    const res = await page.request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);

    // Every entry should share one origin — a mix means something is wrong.
    const origins = [...new Set(locs.map((u) => new URL(u).origin))];
    expect(origins, `sitemap spans multiple origins: ${origins.join(', ')}`).toHaveLength(1);

    // Compare against the canonical tag rather than baseURL. Both are derived
    // from site.url, which `jekyll serve` rewrites to whatever --host it was
    // given: `docker compose up` binds 0.0.0.0 while Playwright connects on
    // 127.0.0.1. Asserting sitemap-vs-canonical keeps the real check (the two
    // agree) without coupling it to how the dev server happened to be started.
    await page.goto('/');
    const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
    expect(origins[0]).toBe(new URL(canonical).origin);
  });
});

// ---------------------------------------------------------------------------
// 5. Donations go to Venmo, not PayPal
// ---------------------------------------------------------------------------
test.describe('donate', () => {
  test('donate button points at Venmo @MATS-1450', async ({ page }) => {
    await page.goto('/mats/');
    const venmo = page.locator('a[href*="venmo.com"]').first();
    await expect(venmo).toBeVisible();
    await expect(venmo).toHaveAttribute('href', /venmo\.com\/u\/MATS-1450/);
    await expect(venmo).toContainText(/venmo/i);
    await expect(page.locator('#donate')).toContainText('@MATS-1450');
  });

  test('no PayPal links remain anywhere on the site', async ({ page }) => {
    for (const path of ['/', '/mats/', '/about/', '/contact/', '/get-started/']) {
      await page.goto(path);
      await expect(
        page.locator('a[href*="paypal"]'),
        `PayPal link still present on ${path}`
      ).toHaveCount(0);
    }
  });
});
