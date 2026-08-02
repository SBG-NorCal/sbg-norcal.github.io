# SBG NorCal × MATS — Combined Website

> **SBG NorCal, powered by MATS** — a single static website for SBG NorCal
> (the East Bay's Brazilian Jiu-Jitsu / MMA / kickboxing / boxing gym)
> and **MATS** (Martial Arts Training and Scholarship), the 501(c)(3)
> that funds free community workshops and youth scholarships.

This is a [Jekyll](https://jekyllrb.com/) site, designed for GitHub Pages.
All content is **YAML-driven**: update a `_data/*.yml` file or a
`_coaches/<name>.md` markdown file and the site rebuilds itself.

---

## 👋 First time here?

**If you're a coach, board member, or front-desk staffer who needs to
update content** (adding a coach, posting an event, fixing a typo), you
do NOT need to install anything. Open the friendly step-by-step guide:

➡️ **[`docs/EDITING-GUIDE.md`](docs/EDITING-GUIDE.md)** — *with screenshots*

It walks you through editing files directly on github.com and opening
a pull request, all from your web browser.

**If you're a developer** working on layouts, styles, or templates, keep
reading for the project structure + local dev setup.

---

## Table of contents

- [Cross-platform support](#cross-platform-support)
- [Local development](#local-development)
- [Testing](#testing)
- [Quick edits — common tasks](#quick-edits--common-tasks)
- [Project structure](#project-structure)
- [Content model](#content-model)
- [Deploying](#deploying)
- [Design system](#design-system)

---

## Quick edits — common tasks

### "We hired a new coach"

Create `_coaches/firstname-lastname.md`:

```yaml
---
name: Firstname Lastname
slug: firstname-lastname
order: 13                      # Display order (1 = first)
role: Foundations Jiu-Jitsu Coach
program: Brazilian Jiu-Jitsu     # Free-text, shown on the coach's page
programs: [brazilian-jiu-jitsu]  # Slugs from _programs/. Controls which
                                 # program pages list this coach under
                                 # "Who you'll train with". Can be several:
                                 # [kickboxing, mma, boxing-bootcamp]
photo: /assets/images/coaches/firstname-lastname.jpg
belt: BJJ Purple Belt
secondary_belt: ""             # Optional
years_training: 5
joined: 2024
specialties:
  - Foundations Jiu-Jitsu
  - Beginner onboarding
short_bio: >-
  One-or-two-sentence bio that shows on the coach card across the site.
---

Long-form bio in Markdown that shows on the coach's individual page.
```

Then drop a portrait JPG into `assets/images/coaches/firstname-lastname.jpg`
(ideally 800×1000, 4:5 ratio).

That's it. The new coach appears on:
- The Coaches page (`/coaches/`)
- The "Meet the team" section of the homepage (if `order` ≤ 4)
- Any Program page where this coach teaches a class (per `_data/schedule.yml`)

### "We changed the schedule"

Edit `_data/schedule.yml`. Each entry:

```yaml
- day: Tuesday
  start: "18:30"               # 24-HOUR format. 6:30 pm is "18:30", not "06:30".
  end:   "19:45"
  program: brazilian-jiu-jitsu  # Must match a slug in _programs/
  level: Foundations            # Free-form label
  coaches: [denny-cheriyan]     # Must match coach slugs in _coaches/; may be []
```

> ⚠️ **Times are 24-hour.** Writing `06:30` for a 6:30 **pm** class is how
> the schedule previously ended up with phantom duplicate classes. After
> any schedule edit, run the checker — it catches exactly this, plus
> duplicates, odd durations, and bad program slugs:
>
> ```bash
> python tests/crosscheck_schedule.py
> ```

Coaches are **not** listed per class. The "Who you'll train with" section on
each program page is driven by the `programs:` list in
`_coaches/<slug>.md` instead — see
[Content model](#content-model).

### "We're hosting a new community event"

Create `_events/2025-12-15-self-defense-workshop.md`:

```yaml
---
title: December Self-Defense Workshop
slug: 2025-12-15-self-defense-workshop
date: 2025-12-15
time: "11:00 AM – 12:30 PM"
location: SBG NorCal
address: "1450 San Pablo Avenue, Berkeley, CA"
hero_image: /assets/images/gallery/mats-5.jpg
host: MATS
cost: Free
audience: "All ages, no experience needed"
status: upcoming               # 'upcoming' or 'past'
# RSVP — first match wins (partiful → luma → eventbrite → register_url):
partiful_url:    "https://partiful.com/e/abc123"   # optional
luma_url:        "https://lu.ma/your-event"        # optional
eventbrite_url:  "https://eventbrite.com/e/123"    # optional
register_url:    "/contact/"                       # fallback
short: >-
  One-paragraph teaser shown in the event listing.
---

Long-form event description here. Markdown supported.
```

**Why not embed Partiful/Luma directly?** All three platforms block
iframe embedding (`x-frame-options`). We link out instead — the listing
shows a colored badge so guests know which platform handles RSVPs.
See `_events/2026-01-new-year-open-mat.md` for a working example.

### "I need to change where the trial form sends submissions"

The trial form on `/get-started/` and the contact form both POST directly
to the gym's existing Google Form *"CB Inquiries ~ SBG NorCal"*.
Submissions land in the same Google Sheet the front desk monitors.

To swap to a different Google Form:

1. Open the new form's `viewform` URL and run this in DevTools to extract
   field IDs:
   ```js
   FB_PUBLIC_LOAD_DATA_[1][1].filter(q => q && q[4]).map(q =>
     ({ label: q[1], ids: q[4].map(s => 'entry.' + s[0]) }))
   ```
2. Update `_data/site.yml` → `google_form.form_id`, `action`, and `fields`.
3. If the program multiple-choice options changed, update
   `google_form.program_options` (map our slugs to the EXACT option strings).

### "How do RSVPs work — Partiful, Luma, Eventbrite, etc.?"

None of those platforms support iframe embedding (`x-frame-options` blocks
it). The pattern: host the event on Partiful / Luma / Eventbrite for the
RSVP UX, and add the link to the matching `_events/*.md` file:

```yaml
partiful_url:    "https://partiful.com/e/abc123"   # optional
luma_url:        "https://lu.ma/your-event"        # optional
eventbrite_url:  "https://eventbrite.com/e/123"    # optional
register_url:    "/contact/"                       # internal fallback
```

The detail page picks the first one that's set (priority: Partiful → Luma →
Eventbrite → register_url) and labels the button accordingly. The events
listing shows a colored badge so guests know what platform is handling
RSVPs. See `_events/2026-01-new-year-open-mat.md` for a working example.

**Note:** Partiful does NOT have a subscribable iCal feed, so we can't
auto-mirror all Partiful events into a calendar feed on the site. If you
want a single calendar feed of all events, treat Google Calendar as the
source of truth (create the event there) and *also* create the Partiful
event for RSVPs.

### "Set up a private members-only calendar"

`/members/` embeds a private Google Calendar with REAL access control
(no DIY password gate, no obfuscation).

**One-time setup:**

1. In Google Calendar, click the **+** next to "Other calendars" →
   **Create new calendar**. Name it something like "SBG NorCal — Members".
2. Open the calendar's **Settings and sharing**.
3. Under **Share with specific people**, add each member's Google account
   email with permission level **See all event details**. Keep this list
   in sync with your roster — Google enforces access; we just render the
   iframe.
4. Scroll to **Integrate calendar** → copy the **Public URL to this calendar**
   (the wording is misleading — when the calendar is private the URL still
   requires viewer auth via Google).
5. Paste the URL into `_data/site.yml` →
   `calendars.members_calendar_url`.

**What members see:** the full calendar.
**What non-members see:** Google's "Sign in to your Google Account"
panel inside the iframe, plus our custom fallback panel below the
calendar that explains how to get access.

This is real, free authentication on a static GitHub-Pages site —
Google handles auth server-side. To revoke a member, remove their email
from the calendar's share list.

### "We need to update the gym phone / address / hours"

Edit `_data/site.yml` — everything in header, footer, schema, and contact
page reads from there.

### "We're adding a new program"

Create `_programs/krav-maga.md`. See `_programs/brazilian-jiu-jitsu.md`
for the full field list.

### "We need a new menu item in the top nav"

Edit `_data/navigation.yml`.

---

## Cross-platform support

| Audience | Status |
|---|---|
| **End-user devices** — phone, tablet, laptop, desktop | ✅ Fully responsive. Verified at 500 px (phone) / 768 px (tablet) / 1024 px (laptop) / 1920 px (desktop). |
| **End-user browsers** | ✅ Modern evergreen browsers (Chrome, Firefox, Safari, Edge). Uses backdrop-filter + grid + flexbox — all 95%+ supported. No JS framework, so it works even with JavaScript disabled (minus the schedule filter and mobile drawer). |
| **Developer OS** — local dev environment | ✅ macOS, Linux, Windows. See [Local development](#local-development) for setup paths. |
| **Deployment** | ✅ GitHub Pages (Linux runners), Docker, or any static host. |

Responsive breakpoints (single source of truth in [`_sass/_tokens.scss`](_sass/_tokens.scss)):

| Breakpoint | Width | What changes |
|---|---|---|
| Default (mobile) | up to 767 px | Single column, hamburger menu, stacked schedule, large tap targets |
| `md` | ≥ 768 px | 2-column program/coach grids, side-by-side stat bar, expanded footer |
| `lg` | ≥ 1024 px | Full horizontal nav, 7-column weekly schedule, 3-column program/coach grids |
| `xl` | ≥ 1280 px | Wider containers (1280 px max content width) |

---

## Local development

The site is built with **Jekyll** (Ruby) and is fully **cross-platform** —
the same source builds identically on macOS, Linux, and Windows. The
deployed site runs on GitHub's Linux runners; locally, you have three
setup paths.

> **You only need a local setup if you're changing layouts, styles, or
> templates.** Updating content (coaches, events, schedule) can be done
> entirely from github.com — see [`docs/EDITING-GUIDE.md`](docs/EDITING-GUIDE.md).

### Option 1 — Docker (recommended, works everywhere)

Zero Ruby installation. Works identically on macOS, Linux, Windows
(WSL2 or Docker Desktop). Requires only Docker.

```bash
# From the repo root — first run takes ~3 min, subsequent runs ~5 sec
docker compose up
```

Open <http://localhost:4000>. Edits to source files trigger a live reload.

To produce a one-shot production build (output to `_site/`):

```bash
docker compose --profile build run --rm build
```

The `Dockerfile` pins the same Ruby version as our local builds
(see `.ruby-version`), so the Docker output is byte-identical to a
native build.

### Option 2 — Native Ruby

You need **Ruby 3.x** and **Bundler**. Pick the section for your OS.

#### macOS

```bash
# rbenv keeps Ruby versions isolated per-project
brew install rbenv ruby-build
rbenv install 3.4.8
rbenv local 3.4.8         # honors the .ruby-version file in this repo
gem install bundler

bundle install            # installs Jekyll + plugins from Gemfile
```

#### Linux (Ubuntu / Debian)

```bash
# Install build prerequisites + a recent Ruby
sudo apt update
sudo apt install -y ruby-full build-essential zlib1g-dev

# Optional: install rbenv for per-project Ruby versions (recommended)
curl -fsSL https://github.com/rbenv/rbenv-installer/raw/HEAD/bin/rbenv-installer | bash
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init - bash)"' >> ~/.bashrc
source ~/.bashrc
rbenv install 3.4.8 && rbenv local 3.4.8

gem install bundler
bundle install
```

Linux (Fedora/RHEL):

```bash
sudo dnf install -y ruby ruby-devel @development-tools redhat-rpm-config
gem install bundler
bundle install
```

#### Windows

**Easy path — RubyInstaller:**

1. Download Ruby+Devkit 3.4.x from <https://rubyinstaller.org/downloads/>
   (choose the **"WITH DEVKIT"** version; pick the x64 build).
2. Run the installer. When it finishes, leave the "ridk install" checkbox
   ticked. In the console it opens, choose option **3 (MSYS2 and MINGW
   development toolchain)**.
3. Open a new PowerShell window and verify:
   ```powershell
   ruby --version       # should print ruby 3.4.x
   gem install bundler
   ```
4. From the repo root:
   ```powershell
   bundle install
   ```

**Better path — WSL2:** install Windows Subsystem for Linux and follow
the **Linux (Ubuntu)** instructions above. This avoids most file-watcher
and gem-build quirks specific to Windows.

### Option 3 — GitHub Codespaces (zero local install)

If you'd rather not install anything:

1. On the GitHub repository page, click the green **`<> Code`** button.
2. Choose the **Codespaces** tab → **Create codespace on main**.
3. A VS Code editor opens in your browser with Ruby preinstalled. In the
   terminal, run `bundle install && bundle exec jekyll serve`. A "Port
   forwarded" notification pops up — click "Open in Browser".

Free Codespaces minutes are generous for occasional editing.

### Run the dev server

Whatever setup you picked, the command is the same:

```bash
bundle exec jekyll serve --livereload
```

Open <http://localhost:4000>. Edits to `_data/`, `_includes/`,
`_layouts/`, and content files trigger live reloads.

On Windows, if file-watching doesn't trigger rebuilds, add `--force_polling`:

```bash
bundle exec jekyll serve --livereload --force_polling
```

### Build a production copy

```bash
JEKYLL_ENV=production bundle exec jekyll build
```

Output goes to `_site/`. PowerShell users prefix with
`$env:JEKYLL_ENV="production"; ` instead.

---

## Testing

Full guide: **[`docs/TESTING.md`](docs/TESTING.md)** — covers browser
device emulation, testing on a real phone over Wi-Fi, and the automated
suite. The short version:

```bash
# 1. Schedule data — validate _data/schedule.yml
pip install pyyaml
python tests/crosscheck_schedule.py

# 2. Mobile layouts, no install — open with the dev server running
open tests/mobile-preview.html      # renders 360/390/768/1024px side by side

# 3. Browser tests — content once, layout on 4 devices (360px–1440px)
npm install && npx playwright install chromium   # once, needs Node 18+
docker compose up -d                             # or: bundle exec jekyll serve
npm test
npm run report                                   # screenshots + results
```

Everything above also runs in **CI** on every push and pull request
(`.github/workflows/test.yml`), so you don't have to remember.

Node is a **test-only** dependency. The site is pure Jekyll and needs no
Node to build or deploy — `_config.yml` excludes `tests/`, `package.json`,
and `playwright.config.js` from the build, and GitHub Pages never reads
them.

Playwright reuses a dev server that's already running on port 4000, and
starts one itself if there isn't one. `tests/content.spec.js` locks in the
content rules (no duplicate classes, no AM/PM mix-ups, correct class end
times, Venmo not PayPal); `tests/responsive.spec.js` checks layout at every
breakpoint and attaches full-page screenshots to the report.

### Troubleshooting

| Symptom | Fix |
|---|---|
| `bundle install` fails on `ffi` / `eventmachine` (Windows) | Re-run the RubyInstaller MSYS2 step from Option 2 above; missing build chain. |
| `Address already in use - bind(2)` | Another Jekyll instance is on port 4000. Use `--port 4001`. |
| Live reload doesn't trigger (Windows / Docker) | Add `--force_polling` to the serve command. |
| `Unable to load 'wdm'` warning | Harmless on Windows. To silence, `gem install wdm`. |
| `LoadError: cannot load such file -- webrick` (Ruby 3.x) | Already in `Gemfile`; if you removed it, add `gem "webrick"`. |

---

## Project structure

```
.
├── _config.yml              # Site settings, plugins, collection config
├── Gemfile                  # Ruby dependencies
├── README.md
│
├── _data/                   # YAML-driven content (no markup, just data)
│   ├── site.yml             # Brand, contact, social, calendars
│   ├── navigation.yml       # Top nav + footer menus
│   ├── schedule.yml         # Weekly class schedule
│   ├── partners.yml         # MATS partner organizations
│   └── testimonials.yml     # Member quotes
│
├── _coaches/                # One markdown file per coach
├── _programs/               # One markdown file per program
├── _events/                 # One markdown file per event
│
├── _layouts/                # Page wrappers
│   ├── default.html         # Base layout (head, header, footer)
│   ├── page.html            # Generic static page
│   ├── coach.html           # Single-coach page
│   ├── program.html         # Single-program page
│   └── event.html           # Single-event page
│
├── _includes/               # Reusable partials
│   ├── header.html
│   ├── footer.html
│   ├── scripts.html
│   ├── cta-banner.html
│   ├── coach-card.html
│   ├── program-card.html
│   ├── schedule-grid.html
│   └── icon-social.html
│
├── _sass/                   # Sass partials (compiled into assets/css/main.css)
│   ├── _tokens.scss         # Colors, type, spacing — edit ONCE to reskin
│   ├── _base.scss           # Resets, typography defaults
│   └── _components.scss     # All UI components
│
├── assets/
│   ├── css/main.scss        # Sass entry (imports the partials above)
│   └── images/
│       ├── coaches/         # Coach portraits (slug.jpg, 4:5 ratio)
│       ├── programs/        # Program hero images (16:9)
│       ├── hero/            # Homepage / page heroes
│       ├── gallery/         # General gym + MATS gallery
│       └── logo-sbg.jpg
│
├── .github/workflows/
│   └── deploy.yml           # GitHub Pages deployment
│
└── index.html, about.md, programs.html, coaches.html, schedule.html,
    mats.html, get-started.html, events.html, contact.html
```

---

## Content model

| Type | Location | Routable? | Fields |
|------|----------|-----------|--------|
| **Site settings** | `_data/site.yml` | No (data) | brand, contact, social |
| **Navigation** | `_data/navigation.yml` | No (data) | primary[], cta, footer{} |
| **Schedule** | `_data/schedule.yml` | No (data) | classes[] |
| **Partners** | `_data/partners.yml` | No (data) | partners[] |
| **Testimonials** | `_data/testimonials.yml` | No (data) | testimonials[] |
| **Coach** | `_coaches/<slug>.md` | `/coaches/<slug>/` | name, role, program, photo, belts, bio |
| **Program** | `_programs/<slug>.md` | `/programs/<slug>/` | title, short, hero_image, levels[], ages |
| **Event** | `_events/<slug>.md` | `/events/<slug>/` | title, date, time, location, status |

All routable types have an `order` or `date` field for sorting.

---

## Deploying

The site auto-deploys to GitHub Pages via `.github/workflows/deploy.yml`.

**Setup (one-time)**:

1. Push this repo to GitHub.
2. In repo settings → **Pages** → **Source**, select **GitHub Actions**.
3. Push to `main` — the workflow runs and publishes the site at
   <https://sbg-norcal.github.io/> (or your custom domain).

### Where the site lives, and the two settings that control it

This repo is `SBG-NorCal/sbg-norcal.github.io` — an **org site** repo, which
is why the site serves from the domain root at <https://sbg-norcal.github.io/>
rather than a `/repo-name/` subfolder. That is a deliberate choice: it is the
same URL shape the site will have at sbgnorcal.com, so the cutover changes a
domain and nothing else.

This is still a **staging home**. The gym's official site is the Wix one at
sbgnorcal.com. Two `_config.yml` settings matter, and they do different jobs:

| Setting | Controls | Current value |
|---|---|---|
| `baseurl` | **Internal links** — nav, CSS, images (`relative_url`) | `""` — and it stays empty, see below |
| `url` | **Absolute self-references** — `rel=canonical`, `og:url`, `sitemap.xml`, `feed.xml` | `https://sbg-norcal.github.io` |

Leave `baseurl` empty. On an org-site repo there is no path prefix to inject:
`actions/configure-pages` resolves `base_path` to an empty string, the deploy
workflow passes that straight through, and `jekyll serve` works at
`localhost:4000` with no prefix. Local and production agree, at a custom
domain too. Nothing about the move to sbgnorcal.com changes this.

`url` is the one that bites, because getting it wrong is **invisible to
visitors**. It once read `https://sbgnorcal.com` while the site was served
elsewhere, which made every page's canonical tag and all 34 sitemap URLs
point at a page that doesn't exist. Search engines read that as "don't index
this page, index that one instead."

The Playwright suite guards this: `tests/content.spec.js` fails if canonical,
`og:url`, or any sitemap URL drifts off the site's own origin, and it asserts
the `url:` and `baseurl:` values in `_config.yml` directly — a browser check
can't, because `jekyll serve` overrides `site.url` with the dev server's
address.

### `noindex`

`_config.yml` has a `noindex` flag. When true it renders
`<meta name="robots" content="noindex, nofollow">` site-wide.

It is currently **true**. This is a staging address, and keeping it out of
the index buys two things:

- It doesn't compete in search results with the gym's still-live Wix site,
  since both cover the same gym.
- No ranking accumulates at a `github.io` address that gets thrown away at
  cutover anyway.

Flip it to `false` in the same commit that points `url` at sbgnorcal.com —
the two belong together, and shipping one without the other is how you end
up either invisible or duplicated.

> A `robots.txt` would also work now that the site sits at a domain root,
> but the meta tag is what's wired up and it survives the domain move
> unchanged.

### Cutting over to sbgnorcal.com

The domain is currently registered through Wix. When the gym is ready to drop
the Wix site:

1. In `_config.yml`, in one commit: set `url: "https://www.sbgnorcal.com"`
   **and** `noindex: false`.
2. Add a file at the repo root named `CNAME` containing `www.sbgnorcal.com`
   (one line, no protocol). Note this file is what tells Pages the site has a
   custom domain.
3. Point DNS at GitHub Pages — either in Wix's DNS panel if the domain stays
   registered there, or at whatever registrar you transfer it to:
   - `www` → `CNAME` to `sbg-norcal.github.io`
   - apex `sbgnorcal.com` → the four GitHub Pages `A` records
     (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`), or `ALIAS`/
     `ANAME` to `sbg-norcal.github.io` if the registrar supports it
4. Repo settings → Pages → enter the custom domain, wait for the DNS check to
   pass, then tick **Enforce HTTPS** once the certificate provisions (can take
   up to ~24h).
5. Run `npm test` — the SEO tests confirm canonical and sitemap follow the new
   domain.

`baseurl` needs no change: it is empty now and stays empty, because an
org-site repo already serves from a root. That is the reason the code lives in
`sbg-norcal.github.io` rather than a project repo.

> Only one custom domain can be attached per Pages site. If you have a second
> domain, point it at the same place via a registrar-level redirect — GitHub
> Pages won't serve two.

---

## Design system

Tokens live in [`_sass/_tokens.scss`](_sass/_tokens.scss) and are the only
file you need to edit to re-skin the entire site:

| Token | Value | Used for |
|-------|-------|----------|
| `$ink` | `#0b0b0e` | Page background |
| `$bone` | `#f5f1ea` | Body text |
| `$red` | `#d22020` | **SBG accent** — CTAs, links, gym-context highlights |
| `$gold` | `#e4b73a` | **MATS accent** — used only in nonprofit-context elements |
| `$font-display` | Anton | Headings (uppercase display) |
| `$font-body` | Inter | Body copy, UI |
| `$font-mono` | JetBrains Mono | Schedule times, code |

Fonts are loaded from Google Fonts in `_layouts/default.html`.

---

## Before going live — placeholders to replace

A handful of values are placeholders. Search and replace these before launch:

| Where | Placeholder | What to set it to |
|---|---|---|
| `_data/site.yml` → `hours:` | Estimated weekday/Saturday hours | Actual front-desk hours |
| `_data/site.yml` → `mats_email` | `info@baymats.org` | Actual MATS contact email if different |
| `_data/site.yml` → `calendars.members_calendar_url` | `REPLACE_WITH_MEMBERS_CALENDAR_ID` | Real members-only Google Calendar URL (see "Set up a private members-only calendar" above) |
| `_data/schedule.yml` | ✅ Done — real schedule | — |
| `mats.html` donate links | ✅ Done — Venmo `@MATS-1450` (`_data/site.yml` → `donate:`) | — |
| `_events/*.md` | 4 sample events incl. 2026-01 demo | Real upcoming events (delete the rest) |
| `_events/2026-01-new-year-open-mat.md` | `partiful_url: …REPLACE_WITH_REAL…` | Real Partiful event URL (or delete the field) |

The trial / contact forms now submit to the gym's existing Google Form
"CB Inquiries ~ SBG NorCal" — submissions land in the same Google Sheet
the front desk already monitors. No form endpoint replacement needed.

Coach bios + portraits, MATS EIN (46-4056114), social handles, and partner
list all came directly from the live sites and are real.

---

## License

Content © Martial Arts Training and Scholarship (MATS) / SBG NorCal.
Site source code is available under the MIT License.
