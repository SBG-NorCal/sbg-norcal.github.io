# Testing the site locally — web and mobile

This guide covers how to run the site on your own machine and check it on
both desktop and phone layouts. Everything here works on **macOS, Linux,
and Windows**.

## Quick start

**Editing content** (schedule, coaches, events)? You don't need any of
this — edit on github.com, open a pull request, and CI runs the checks for
you. See [`EDITING-GUIDE.md`](EDITING-GUIDE.md).

**Changing layout, styles, or templates?** Copy-paste this once:

```bash
# 1. Start the site  (pick one)
docker compose up                 # no Ruby needed
bundle exec jekyll serve --livereload

# 2. One-time test setup  (needs Node 18+, Python 3)
npm install && npx playwright install chromium
pip install pyyaml
```

Then, per change:

```bash
python tests/crosscheck_schedule.py   # if you touched the schedule
npm test                              # content + 4 devices, 360px -> 1440px
npm run report                        # screenshots + results
```

That's the whole workflow. The rest of this document explains each piece
and how to check things by hand.

---

There are three levels, cheapest first. Most of the time you only need
level 1.

| Level | What it checks | Time | Needs installing? |
|---|---|---|---|
| [1. Eyeball it in a browser](#1-eyeball-it-in-a-browser) | "Does it look right?" — DevTools device mode is the reference for mobile | ~30 s | no |
| [1b. Mobile preview rig](#1b-mobile-preview-rig-no-install) | Quick width-only preview, several sizes at once. [Limited](#what-this-does-not-catch) | ~10 s | no |
| [2. Check the schedule data](#2-check-the-schedule-data) | Validate `_data/schedule.yml` | ~5 s | Python |
| [3. Run the Playwright suite](#3-run-the-playwright-suite) | Every viewport, real device emulation | ~1 min | Node |

**Before shipping a layout or CSS change, use level 3** (or DevTools).
Level 1b is a convenience preview — it gets viewport width right and
nothing else.

Everything also runs automatically in CI on every push and pull request —
see [Continuous integration](#continuous-integration).

---

## 1. Eyeball it in a browser

### Start the site

Pick whichever you have installed. Both serve at <http://localhost:4000>.

**Docker (no Ruby needed — works identically everywhere):**

```bash
docker compose up
```

**Native Ruby:**

```bash
bundle install      # first time only
bundle exec jekyll serve --livereload
```

> Windows note: run these from PowerShell in the repo root, or from a WSL2
> shell. If the file watcher misbehaves on native Windows, add
> `--force_polling`.

Leave it running. Edits to `_data/*.yml`, `_coaches/*.md`, and `.html`
files rebuild automatically in a second or two.

> **`_sass/` changes need a restart.** Jekyll's live-reload does not always
> pick up SCSS partials. If a style change doesn't appear, stop the server
> (`Ctrl+C`) and start it again.

### Check the mobile layout

You do **not** need a phone. Use your browser's device emulator:

**Chrome / Edge / Brave**

1. Open <http://localhost:4000>
2. `Cmd+Option+I` (macOS) or `F12` (Windows/Linux) to open DevTools
3. `Cmd+Shift+M` / `Ctrl+Shift+M` toggles the device toolbar
4. Pick a device from the dropdown at the top

**Safari**

1. Enable Safari → Settings → Advanced → "Show features for web developers"
2. Develop → Enter Responsive Design Mode (`Cmd+Ctrl+R`)

**Firefox**

1. `Cmd+Option+M` / `Ctrl+Shift+M`

### The widths that matter

These are the site's breakpoints (defined in `_sass/_tokens.scss`). Check
one width on each side of every breakpoint you're touching:

| Width | Device | What should happen |
|---|---|---|
| **360 px** | Small Android phone | Single column, hamburger menu, schedule stacked by day. Nothing scrolls sideways. |
| **390 px** | iPhone 13/14/15 | Same as above, a little roomier. |
| **768 px** | iPad portrait | 2-column program/coach grids. Still hamburger nav. |
| **1024 px** | iPad landscape / small laptop | Full horizontal nav appears. Schedule becomes a 7-column week grid. |
| **1440 px** | Laptop / desktop | 3–4 column grids, wide container. |

### On a real phone (same Wi-Fi)

Jekyll binds to localhost by default, so bind to all interfaces instead:

```bash
bundle exec jekyll serve --host 0.0.0.0
# Docker already binds 0.0.0.0 — just use docker compose up
```

Then find your machine's LAN IP and open `http://<that-ip>:4000` on your
phone:

```bash
# macOS
ipconfig getifaddr en0
# Linux
hostname -I | awk '{print $1}'
# Windows (PowerShell)
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object InterfaceAlias -notmatch 'Loopback').IPAddress
```

### Manual checklist for the recent changes

- **`/schedule/`** — no class before 09:30. Foundations BJJ reads
  `18:30 – 19:45`; Integrations BJJ reads `19:30 – 20:45`. No day shows the
  same class twice.
- **`/coaches/`** — the belt badge sits at the **bottom-left** of each
  portrait and doesn't cover anyone's face. Oki reads **Purple Belt**.
- **`/programs/open-mat/`** — states that rolling/sparring needs a coach's
  approval.
- **`/mats/#donate`** — the button says **Donate via Venmo** and links to
  `venmo.com/u/MATS-1450`. No PayPal anywhere.

---

## 1b. Mobile preview rig (no install)

`tests/mobile-preview.html` renders the site at 360 px, 390 px, 768 px, and
1024 px **side by side**, so you can see every breakpoint at once without
resizing anything or opening DevTools.

```bash
# with the dev server running, open the file in your browser:
open tests/mobile-preview.html            # macOS
xdg-open tests/mobile-preview.html        # Linux
start tests\mobile-preview.html           # Windows
```

Pick a page from the dropdown; press **Run checks** for automated
assertions (overflow, tap targets, font sizes, belt-badge position).

**How it works:** an `<iframe>` establishes its own viewport, so CSS media
queries inside it evaluate against the *iframe's* width rather than the
window's. You get real width-driven layout with nothing installed.

### What this does NOT catch

This is a **convenience preview, not a substitute** for DevTools device
mode or Playwright. An iframe gets you the right viewport width and
nothing else. It does not emulate:

| Missing | Bugs it can't catch |
|---|---|
| Touch / pointer type | `hover:` styles that stick on touch, `@media (hover: none)` branches |
| Device pixel ratio | Blurry or wrongly-selected retina assets |
| Mobile user-agent | Anything UA-sniffed |
| Browser chrome + safe areas | Content hidden behind a notch or home indicator |
| Real viewport units | `100vh` / `dvh` bugs from the URL bar showing and hiding |

Those last two matter here specifically — this site has a sticky header
and a full-height mobile drawer, which are exactly the things that behave
differently on a real phone.

**Use this** for a quick "does the layout hold up" check while editing
content. **Use Playwright** (or DevTools, or an actual phone via
[the LAN trick](#on-a-real-phone-same-wi-fi)) before shipping a layout or
CSS change.

> **Note on the checks button.** Opening the file via `file://` lets you
> *see* the previews but not script them — the browser blocks cross-origin
> frame access, and the page will tell you so. The visual preview is still
> completely valid. For scripted assertions either serve this file from the
> same origin as the site, or use the Playwright suite below.

---

## 2. Check the schedule data

`_data/schedule.yml` is the source of truth for the class schedule. After
editing it, run:

```bash
pip install pyyaml                     # one time
python tests/crosscheck_schedule.py
```

It prints the full week grouped by day with each class's duration, then
`PASS` or a list of specific problems.

### What it catches

| Check | Why |
|---|---|
| No class starts before 09:00 | A PM class typed as AM (`06:30` for 6:30 pm) is how the site once grew phantom duplicate morning classes. |
| No duplicate (day, program, level) | The same class entered twice. |
| Foundations BJJ ends 19:45, Integrations BJJ ends 20:45 | These were wrong on the live site once. |
| Durations match the class type | Foundations/Integrations 75 min, Boxing Boot Camp 45 min, Explorers/Teen-Tween 60 min, Leadership/Sticky Monkey 30 min. An odd duration is almost always a typo. |
| `program:` resolves to a file in `_programs/` | A bad slug silently breaks the schedule filter. |
| End time is after start time | |

If you add a genuinely new class type, add its expected length to
`EXPECTED_MINUTES` at the top of the script — otherwise its duration isn't
checked.

> **Coaches aren't in this file.** Who covers a given slot changes week to
> week, so the grid doesn't name coaches. The "Who you'll train with"
> section on each program page comes from the `programs:` list in
> `_coaches/<slug>.md`.

---

## 3. Run the Playwright suite

Automated checks: content once, layout on four device profiles
(360 px phone → 1440 px desktop).
Node is a **test-only** dependency — the site itself is pure Jekyll and
needs no Node to build or deploy.

### Setup (once)

**Prerequisite:** Node.js 18 or newer. Check with `node --version`. If you
don't have it:

| OS | Install |
|---|---|
| macOS | `brew install node` — or download the LTS installer from [nodejs.org](https://nodejs.org/) |
| Linux (Debian/Ubuntu) | `sudo apt install nodejs npm` (check the version; if it's older than 18, use [nodesource](https://github.com/nodesource/distributions)) |
| Linux (Fedora) | `sudo dnf install nodejs` |
| Windows | Download the LTS installer from [nodejs.org](https://nodejs.org/), or `winget install OpenJS.NodeJS.LTS` |

Then, from the repo root:

```bash
npm install                     # installs @playwright/test (~2 s)
npx playwright install chromium # downloads the browser (~130 MB, ~30 s)
```

That's it — two commands, once per machine. `npm install` writes to
`node_modules/`, and the browser goes to a shared cache outside the repo
(`~/Library/Caches/ms-playwright` on macOS, `~/.cache/ms-playwright` on
Linux, `%USERPROFILE%\AppData\Local\ms-playwright` on Windows). Both are
gitignored; neither is ever deployed.

> **Why Node is safe to add here.** It's a test-only dependency. Jekyll
> builds the site, GitHub Pages deploys it, and neither ever reads
> `package.json` — `_config.yml` explicitly excludes it along with
> `tests/` and `playwright.config.js`.

If you'd rather not install anything, skip to
[the mobile preview rig](#1b-mobile-preview-rig-no-install), or just let
[CI](#continuous-integration) run the suite for you on push.

### Run

```bash
# Start the site first if it isn't already running:
docker compose up -d          # or: bundle exec jekyll serve

npm test                      # all viewports
npm test -- --project=phone   # 360px phone only
npm run test:ui               # interactive, watch tests run
npm run report                # open the HTML report + screenshots
```

If nothing is listening on port 4000, Playwright starts `bundle exec jekyll
serve` itself. If something already is, it reuses it — which is why
`docker compose up` + `npm test` works.

### How the suite is organised

Two files answering two different questions, which is why they run
differently:

| File | Question | Runs |
|---|---|---|
| `content.spec.js` | "Is the information correct?" | **once** — screen size can't change the answer |
| `responsive.spec.js` | "Does it look right on this screen?" | on **each** device profile |

Checking "Oki is a Purple Belt" at four widths doesn't make it truer — it
just turns one broken fact into four identical red lines. Keeping content
tests on a single profile means **one bug shows up as one failure.**

The four layout profiles sit on either side of every breakpoint in
`_sass/_tokens.scss`:

| Profile | Width | Why this one |
|---|---|---|
| `phone` | 360 px | Narrowest phone worth supporting. Survive this and wider phones follow. |
| `tablet` | 768 px | Below `lg`: 2-column grids, still hamburger nav. |
| `laptop` | 1024 px | Exactly at `lg`, where the nav flips horizontal. Boundaries are where bugs live. |
| `desktop` | 1440 px | Wide container, 3–4 column grids. |

### What it covers

`tests/content.spec.js` — content, independent of screen size:

- no duplicate class on any day
- no classes before 09:00 (catches the AM/PM mix-up)
- Foundations BJJ ends 19:45, Integrations BJJ ends 20:45
- every class has a plausible duration (15 min – 3 h)
- Oki is a Purple Belt
- Open Mat mentions coach approval, on both the program page and the grid
- donate button points at `venmo.com/u/MATS-1450`; zero PayPal links site-wide
- canonical, `og:url`, and sitemap all agree

`tests/responsive.spec.js` — layout, on all four profiles:

- no horizontal overflow on any key page (the #1 mobile bug)
- belt badge renders in the lower half of the portrait
- schedule slots meet the 44 px tap-target minimum on phones
- class times stay ≥ 11 px on phones
- mobile nav drawer opens fully and isn't clipped
- full-page screenshots attached to the HTML report for eyeballing

### Why only one browser — and how Safari is covered

Every profile runs **Chromium**. That's deliberate, and it does leave a
gap worth understanding.

Playwright can also run WebKit, the engine behind Safari. We don't, for two
reasons:

1. **Headless WebKit is not iOS Safari.** It runs on a desktop OS with no
   collapsing URL bar, so it cannot reproduce the `100vh` / `dvh` bugs that
   are the biggest real iOS risk on this site.
2. A second engine doubles the failure modes for a site whose CSS is
   modest — "passes in Chromium, fails in WebKit" is a poor use of your
   time until it actually happens.

**So cover Safari with a real phone instead.** Before shipping a layout or
CSS change, spend two minutes on
[the LAN trick](#on-a-real-phone-same-wi-fi) and look at the site on an
actual iPhone. That catches everything headless WebKit would, plus the
URL-bar bugs it wouldn't.

> One thing to watch by hand: `backdrop-filter` (used on the sticky header,
> mobile drawer, hero eyebrow, and cards). Safari needed the
> `-webkit-backdrop-filter` prefix until Safari 18, and it is the property
> behind a past mobile-drawer clipping bug. Every use in
> `_sass/_components.scss` is currently paired with its prefix — keep it
> that way when adding new ones.

**Revisit this if a Safari-only bug ever reaches the live site.** That's
the trigger for adding a WebKit project; until then, one engine keeps the
suite fast and its failures readable.

### Screenshots

`npm test` attaches a full-page screenshot of every page on every profile
to the report. `npm run report` opens it — click any "screenshot" test to
see the image. This is the fastest way to review mobile and desktop side by
side without resizing anything by hand.

---

## Continuous integration

`.github/workflows/test.yml` runs on every push to `main` and every pull
request, so these checks happen whether or not anyone runs them locally.

| Job | What it does | Time |
|---|---|---|
| **Schedule data** | `python tests/crosscheck_schedule.py` — no browser needed | ~15 s |
| **Browser** | Builds the site, runs content + 4 device profiles | ~2 min |

The Playwright HTML report (including every screenshot) is uploaded as a
build artifact and kept for 14 days. On a failed run, open the workflow in
the **Actions** tab and download `playwright-report` from the Artifacts
section at the bottom.

Chromium is cached between runs, so only the first run pays the download
cost.

---

## Troubleshooting

**`bundle: command not found`** — Ruby isn't set up. Use Docker instead
(`docker compose up`), or follow the native Ruby setup in the main
[README](../README.md#local-development).

**Styles didn't change** — restart the server. Jekyll's watcher misses
`_sass/` partials.

**Port 4000 already in use** — something's still running.
`docker compose down`, or `lsof -ti:4000 | xargs kill` (macOS/Linux) /
`Get-NetTCPConnection -LocalPort 4000` (Windows).

**Playwright can't reach the site** — confirm <http://localhost:4000> loads
in your browser first. If you use a different port, set it:
`PORT=4001 npm test`.

**Tests fail only on mobile** — that's the suite doing its job. Open
`npm run report`, find the failing viewport, and reproduce it in
`tests/mobile-preview.html` or DevTools at the same width.

**`npx playwright install` fails behind a proxy/firewall** — the browser
download is blocked. Set `PLAYWRIGHT_DOWNLOAD_HOST` if your org mirrors it,
or skip local browser tests and rely on CI, which downloads on GitHub's
runners.

**`node: command not found`** — Node isn't installed or isn't on your PATH.
See [Setup](#setup-once). Nothing else in this repo needs Node, so it's
safe to skip and use the preview rig plus CI instead.
