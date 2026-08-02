# CLAUDE.md

Context for Claude Code when working in this repo.

## What this is

A Jekyll static site for **SBG NorCal** (a Berkeley BJJ/MMA/kickboxing gym)
and **MATS** (its 501(c)(3)). Deployed to GitHub Pages, served at
<https://sbg-norcal.github.io/>.

No JS framework, no build step beyond Jekyll. Node exists only for the
Playwright tests and is never used to build or deploy the site.

## Content is data, not markup

Almost every content change is a YAML or front-matter edit. Prefer editing
data over editing templates:

| To change | Edit |
|---|---|
| Class schedule | `_data/schedule.yml` |
| Coaches | `_coaches/<slug>.md` (+ portrait in `assets/images/coaches/`) |
| Programs | `_programs/<slug>.md` |
| Events | `_events/<date>-<slug>.md` |
| Nav, contact info, socials, donate links | `_data/site.yml`, `_data/navigation.yml` |

Slugs are referential: `schedule.yml` → `program:` must match a
`_programs/*.md` slug, and `coaches:` entries must match `_coaches/*.md`
slugs. `tests/crosscheck_schedule.py` verifies this.

## Schedule — read this before touching it

`_data/schedule.yml` is the source of truth for the class schedule. Edit it
directly.

**Times are 24-hour.** Writing `06:30` for a 6:30 pm class is how the site
once ended up with phantom duplicate morning classes — the single most
likely mistake in this file. There are no classes before 09:30.

Sanity check after any schedule edit — durations should be consistent:
Foundations/Integrations 75 min, Boxing Boot Camp 45 min, Explorers 60 min,
Leadership 30 min.

```bash
python tests/crosscheck_schedule.py    # AM/PM mix-ups, dupes, bad slugs
```

Coaches are **not** listed per class — who covers a slot changes week to
week. The "Who you'll train with" list on each program page comes from the
`programs:` field in `_coaches/<slug>.md`.

## Local dev

```bash
docker compose up                      # preferred, no Ruby needed
bundle exec jekyll serve --livereload   # native
```

Serves at <http://localhost:4000> (`baseurl` is empty, so no path prefix
locally).

**`_sass/` edits need a server restart** — Jekyll's watcher misses SCSS
partials. This wastes time repeatedly if you forget.

## Testing

See `docs/TESTING.md`. Short version:

```bash
python tests/crosscheck_schedule.py              # schedule data, no browser
open tests/mobile-preview.html                   # phone widths, zero install
npm install && npx playwright install chromium   # once
npm test              # content + 4 device profiles, 360px → 1440px
npm run report        # results + full-page screenshots
```

Playwright reuses a server already on :4000, or starts its own.
CI (`.github/workflows/test.yml`) runs all of it on every push and PR.

`tests/mobile-preview.html` renders the site in phone-width iframes — an
iframe gets its own viewport, so media queries evaluate at the iframe's
width. It's a **convenience preview only**: right width, but no touch
emulation, DPR, mobile UA, safe-area insets, or real `dvh` behaviour. Use
Playwright or DevTools device mode before shipping layout/CSS changes.

When changing layout or CSS, check both a phone width (360px) and a desktop
width — the nav, schedule grid, and coach cards all switch layouts at the
`lg` (1024px) breakpoint.

## Conventions

- **Styles:** SCSS in `_sass/`. Design tokens (colors, spacing, breakpoints,
  type scale) live in `_sass/_tokens.scss` — use the variables and the
  `@include md/lg/xl` mixins, don't hardcode px breakpoints or hex colors.
- **BEM-ish class names:** `.coach-card`, `.coach-card__belt`,
  `.coach-card--featured`.
- **Inline styles** appear in some page-level HTML (`mats.html`, etc.).
  That's existing style; prefer a class in `_sass/_components.scss` for
  anything reusable.
- **Accessibility:** keep `aria-*` attributes and `alt` text intact. The
  mobile nav (`#burger` / `#mobile-nav`) manages `aria-expanded` and
  `aria-hidden` in `_includes/scripts.html`.
- Non-technical contributors edit via github.com using
  `docs/EDITING-GUIDE.md`. Keep that guide accurate when the content model
  changes.

## Deployment / URLs

This repo is `SBG-NorCal/sbg-norcal.github.io` — an **org site** repo, so
Pages serves it from a domain root: <https://sbg-norcal.github.io/>. Staging
home. The gym's Wix site at sbgnorcal.com is still the official one; this
replaces it at cutover.

- `baseurl` is **empty in `_config.yml` and stays empty**. An org-site repo
  has no path prefix — `actions/configure-pages` resolves `base_path` to
  `""`, so local and production agree, and the custom-domain move doesn't
  change it either. Don't "fix" it.
- `url` is `https://sbg-norcal.github.io` and feeds `rel=canonical`,
  `og:url`, `sitemap.xml`, `feed.xml`. Wrong values here are invisible on
  the page but tell Google the content lives elsewhere. Playwright guards it.
- `noindex` is **`true`** — deliberate while this is a staging address, so
  it doesn't compete with the gym's live Wix site. Flip it to `false` in the
  same commit that points `url` at sbgnorcal.com; shipping one without the
  other leaves the site either invisible or duplicated. See README →
  "Cutting over to sbgnorcal.com" for the full checklist.

## Gotchas

- `Gemfile.lock` is gitignored (GitHub Pages resolves its own gem versions).
- `_site/` is build output — never edit it.
- The site must work with JavaScript disabled apart from the schedule
  filter and mobile drawer. Don't add JS-dependent content.
