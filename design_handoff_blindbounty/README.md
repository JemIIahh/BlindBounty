# Handoff — BlindBounty Design System

A privacy-first task marketplace where instructions encrypt client-side, execute inside a TEE (trusted execution environment), and settle on cryptographic proof. This bundle contains **high-fidelity HTML design references** for the full product — marketing site plus a seven-screen authenticated dashboard — and everything a developer needs to rebuild them in a production codebase.

---

## About the design files

The files in `design_files/` are **design references built in HTML + React (inline via Babel)** — not production code to copy directly. Their job is to lock down the look, behavior, spacing, copy voice, and interaction patterns.

**Your task is to recreate these designs in a real codebase.** My recommendation, which the imported `source/` folder supports: **React + TypeScript + Tailwind, Next.js App Router.** That's the stack in BlindBounty's existing repo (Landing, Earnings, Verification, Settings were all `.tsx`). Use whatever your codebase already has — the tokens and patterns translate.

Do not ship the HTML prototypes. Do not copy the inline-style objects verbatim. Treat the HTML as a pixel-level spec and rebuild with your project's component primitives.

---

## Fidelity

**High-fidelity.** Every color, spacing value, typography setting, border, and interaction state in the prototypes is intentional and final. Rebuild pixel-accurate.

What is *not* final:
- **Content values** — `$14,820`, `#1847`, `0x4a2f…9b1c`, `tdx-α`, worker reputation `94.2`, all task titles, all payout amounts, all timestamps — these are illustrative placeholders. Wire them to real data. The *shape* of the data is the spec; the *numbers* are not.
- **Mock interactions** — the verification form "runs" a fake enclave verification on click; the attestation feed ticks randomly. Replace with real TEE attestation + on-chain reads.

---

## Visual system — the non-negotiables

The entire product reads as one system because of these rules. Break any of them and it'll look generic.

### 1. Single font family: IBM Plex Mono

Every piece of UI text — headlines, body, numbers, buttons, nav, chips — is **IBM Plex Mono**. No sans-serif for body copy, no secondary display face. The whole design rests on the monospace grid.

```
font-family: 'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace;
```

Weights used: `400` (body), `500` (emphasized body), `600` (labels, small caps), `700` (headlines, numbers). Do not use `800/900`.

Google Fonts import: `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap`.

### 2. Color palette — minimal, semantic

Sole warm accent is **cream (`#f5efe0`)**. There is **no amber, no orange, no brand gradient**. Greens and reds exist only as semantic status colors (PASSED / FAILED / VERIFYING). Everything else is grayscale.

| Token             | Light        | Dark         | Usage                                              |
|-------------------|--------------|--------------|----------------------------------------------------|
| `--bb-bg`         | `#fafaf9`    | `#09090b`    | Page background                                    |
| `--bb-surface`    | `#ffffff`    | `#0d0d0d`    | Cards, panels, sidebar                             |
| `--bb-surface-2`  | `#f5f5f4`    | `#111113`    | Inset/secondary surfaces (chart bg, code blocks)   |
| `--bb-line`       | `#e7e5e4`    | `#27272a`    | Hairline borders (1px, everywhere)                 |
| `--bb-line-2`     | `#d6d3d1`    | `#3f3f46`    | Stronger dividers                                  |
| `--bb-ink`        | `#09090b`    | `#fafaf9`    | Primary text, headlines                            |
| `--bb-ink-2`      | `#52525b`    | `#a1a1aa`    | Secondary text                                     |
| `--bb-ink-3`      | `#a1a1aa`    | `#52525b`    | Meta text, section labels                          |
| `--bb-invert`     | `#09090b`    | `#f5efe0`    | Primary button bg (inverts per theme)              |
| `--bb-invert-fg`  | `#fafaf9`    | `#09090b`    | Primary button fg                                  |
| `--bb-cream`      | `#f5efe0`    | `#f5efe0`    | Warm accent — section numbers, highlights         |
| `--bb-ok`         | `#059669`    | `#10b981`    | PASSED, attested, green status                     |
| `--bb-warn`       | `#d97706`    | `#f59e0b`    | AWAITING, pending (used sparingly)                 |
| `--bb-err`        | `#dc2626`    | `#ef4444`    | FAILED, disputes                                   |
| `--bb-info`       | `#2563eb`    | `#3b82f6`    | VERIFYING, in-flight                               |

Light is default. `html[data-theme="dark"]` flips everything. Persist choice to `localStorage('bb.theme')`.

### 3. Sharp corners — zero border-radius

**No rounded corners anywhere.** Buttons, cards, inputs, chips, avatars, modals — all `border-radius: 0`. This is the single biggest visual signature of the system. If you see a rounded corner in your build, it's wrong.

### 4. Hairline borders, never shadows

Every surface boundary is a **1px solid border** in `--bb-line`. **No box-shadows on cards.** The one exception: a subtle `0 1px 0 rgba(0,0,0,0.04)` is acceptable on floating modals. Sidebar, cards, tables, inputs, chips all use hairline only.

### 5. Terminal grammar — copy voice

The whole product sounds like a terminal. Section numbers, bracketed buttons, dollar prompts, ASCII status glyphs.

- **Section labels:** `§01 ─ SECTION TITLE` — number in cream (`--bb-cream`), dash, title in uppercase with `letter-spacing: .22em`.
- **Buttons:** primary CTAs are wrapped in literal brackets: `[ post_task ]`, `[ connect_wallet ]`. The brackets are dimmer than the label.
- **Status glyphs:** `●` (filled dot) for active/ok, `◌` (hollow dot) for inactive, `✓` for done, `▸` for current, `▸` for bullets. Never use emoji.
- **CLI prompts:** `$ command --arg=value` appears in terminal panels and empty states. Prompt symbol `$` is cream.
- **Lowercase everything** except headlines (h1/h2 only). Nav items: `browse`, `how_it_works`, `trust`, `docs`. Button labels: `post_task`, `view_on_chain ↗`.
- **Snake_case** over space-separated in UI labels: `connect_wallet`, `post_task`, `seal_and_verify`.

### 6. Logo — the aperture mark

Six-blade iris with a sealed slit through the center. Represents the lens/enclave sealing user instructions. Provided in `design_files/assets/logo.svg`. Usage:

- **Default size:** 24px in nav, 26px in dashboard sidebar, 44px in marketing footer/hero.
- **On dark:** blades `#f5efe0`, slit `#0d0d0d`, background transparent or `#0d0d0d`.
- **On light:** blades `#09090b`, slit `#fafaf9`.
- **Favicon:** 32×32 version with full blade contrast.

Do not re-interpret, flatten, or rotate the aperture. It's a fixed mark.

---

## Spacing & layout

- **Base unit:** 4px. Use multiples only (4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 112).
- **Section padding:** `56px 0` (marketing), `28px` (dashboard cards).
- **Grid gutter:** 0 — adjacent cards share a single hairline border rather than having gaps. Grids are `grid-template-columns: repeat(N, 1fr)` with `gap: 0` and `border: 1px solid var(--bb-line)` on the parent plus individual cell borders.
- **Max content width:** `1120px` (marketing), fluid (dashboard main column with 240px sidebar).
- **Letter-spacing:** `-.02em` on h1, `-.01em` on h2/h3, `+.22em` on uppercase labels, `+.18em` on small meta text, `+.02em` on body.

---

## Component inventory

Every component referenced in the designs, with its source file and a short spec. Treat the source file as the implementation reference; rebuild in your framework.

### Marketing primitives — `ui_kits/marketing/primitives.jsx`

| Component     | What it is                                                                        |
|---------------|-----------------------------------------------------------------------------------|
| `LogoMark`    | Aperture SVG. Props: `size`, `bg`, `blade`, `slit`.                              |
| `Icon`        | Hairline SVG icon. Set: `lock`, `shield`, `bolt`, `arrow`, `check`, `briefcase`, `clock`, `external`. 1.5px stroke, square joins. |
| `Button`      | `[ label ]` terminal button. Variants: `primary` (cream bg), `outline`, `ghost`. |
| `Tag`         | Uppercase chip. Tones: `ok`, `warn`, `err`, `neutral`. 1px border, no fill.      |
| `Panel`       | Hairline card. Sharp corners. Dark bg.                                            |
| `SectionRule` | `§N ─ TITLE ───────── side`. Full-width rule with section number + optional side tag. |
| `Prompt`      | `$ ~/path command_` with optional blinking cursor.                                |
| `Navbar`      | Sticky top nav, status-bar style. Links marked with `▸ ` when active.            |
| `Footer`      | Status-bar footer mirroring dashboard's bottom rail.                              |

### Marketing sections — `ui_kits/marketing/sections.jsx`

| Section    | Pattern                                                            |
|------------|--------------------------------------------------------------------|
| `Hero`     | Boot-log typewriter + stat rail. 72px headline, 700 weight.       |
| `Problem`  | Two-column command-block diff. "today" (err tag) vs "blindbounty" (ok tag). |
| `HowItWorks` | Four numbered rows: `[01] seal`, `[02] escrow`, `[03] execute`, `[04] attest`. |
| `Trust`    | Live attestation log (streaming), plus three-column guarantees.    |
| `Roles`    | Two panels side-by-side: `/agent` and `/worker`.                   |

### Dashboard primitives — `ui_kits/dashboard/primitives.jsx`

| Component          | Spec                                                                         |
|--------------------|------------------------------------------------------------------------------|
| `Sidebar`          | 240px fixed rail. Logo, section groups (`DOCS`, `MARKETPLACE`, `ACCOUNT`), footer status. Active item: cream left-border + `▸ ` prefix. |
| `TopBar`           | 64px. Search (⌘K), `[ POST TASK ]`, wallet pill (`0x4a2f…9b1c`), LIGHT/DARK toggle. |
| `Breadcrumb`       | `MARKETPLACE / TASKS` — uppercase, .22em tracking, `--bb-ink-3`.            |
| `PageHeader`       | h1 40px/700/-.02em + one-line description 14px/`--bb-ink-2`. Right-aligned meta. |
| `StatCard`         | 4-col grid. Uppercase label, 32px number, green delta or subtext underneath. |
| `Card`             | Hairline border, 28px padding, sharp corners. Optional `§NN ─ TITLE` header row. |
| `Table`            | Header row: 11px/600/.22em tracking. Body: 13px. Zebra not used; only hairlines. |
| `StatusChip`       | `[ STATUS ]` uppercase pill. Tones map to semantic colors. No bg in neutral; colored bg + matching border for status. |
| `LifecycleRow`     | `●` + label + timestamp. Completed rows full-ink; pending rows 40% ink with `◌`. |
| `FormField`        | Label 11px/600/.22em, input with hairline border. Focus: 1px cream border. No rounded. |
| `Button` (bracket) | Same as marketing but supports `sm` / `md` sizes.                            |
| `Tabs`             | `▸ TRIGGER   EVIDENCE_CHAIN   AUDIT_LOG`. Active: `▸` + cream underline.    |
| `CodeBlock`        | `--bb-surface-2` bg, Plex Mono 12px, hairline border.                        |

### Dashboard screens — `ui_kits/dashboard/screens.jsx` + `extra_screens.jsx`

See the per-screen sections below.

---

## Screens

The dashboard has one layout: `Sidebar | (TopBar stacked over main content)`. Every screen fills the main region. Breadcrumb → PageHeader → content.

### 00 — Marketing landing (`ui_kits/marketing/index.html`)

**Purpose:** single-page marketing site. Hero, problem, how-it-works, trust, roles, footer. Dark-only by design.

**Layout:** max-width 1120px, 40px side padding, sections 56px tall. Sticky nav at top, status-bar footer at bottom. Full scroll.

**Interactions:**
- Hero boot log types in one line every 320ms (six lines total), then shows blinking cursor
- Trust section's attestation feed pushes a new random event every ~2.1s
- CTA `[ post_task ]` → link to `/dashboard/agent`
- Nav links scroll to section anchors

See screenshots: `00-marketing-hero.jpg`, `00-marketing-problem.jpg`, `00-marketing-how.jpg`, `00-marketing-trust.jpg`.

### 01 — How it works (`/how-it-works`)

**Purpose:** authenticated version of the marketing how-it-works. Six-step command log, each step clickable to see details.

**Layout:** PageHeader + single-column command log. Each step is a row: `[01]` · name · `●` status · description · example command in code block.

See `01-how-it-works.jpg`.

### 02 — Task feed (`/tasks`)

**Purpose:** browse open bounties. Left: task table. Right: detail panel for selected task.

**Layout:** 4 stat cards across top (OPEN BOUNTIES $14,820 · ACTIVE TASKS 47 · MY REPUTATION 94.2 · ESCROW BALANCE $1.2M). Below: `1fr 380px` split. Left is task table (ID · TITLE · BOUNTY · TYPE · STATUS · AGE). Right is detail panel: task title, bounty/deadline stats, encrypted instruction block (truncated hex), lifecycle timeline, `[ ACCEPT TASK ]` + `[ VIEW ON CHAIN ↗ ]`.

**Interactions:** click row → right panel updates. Status chip colors: OPEN (neutral outline), VERIFYING (blue bg), ASSIGNED (neutral filled), PASSED (green), FAILED (red).

See `02-tasks.jpg`, `09-dark-tasks.jpg`.

### 03 — Agent / Post task (`/agent`)

**Purpose:** wizard to post a new encrypted task. Multi-step: define → seal → escrow → publish.

**Layout:** progress rail at top showing steps with `●/◌` glyphs. Form card for current step. Preview panel on right showing the task as workers will see it (with sealed fields masked).

**Fields (step 1 — define):** title, category dropdown, requirements (textarea), deadline, bounty amount, chain. **Step 2 — seal:** shows AES-256-GCM seal progress, key derivation, ciphertext preview. **Step 3 — escrow:** network gas estimate, tx preview, `[ sign_and_lock ]`. **Step 4 — publish:** confirmation with task hash + on-chain link.

See `03-agent.jpg`.

### 04 — Worker (`/worker`)

**Purpose:** accept an assigned task, view sealed instructions post-decrypt, submit evidence.

**Layout:** selected task summary at top. Two columns below: left = decrypted instructions (client-side) with per-section checkboxes, right = evidence submission form (summary textarea, attachments drop-zone, `[ seal_and_submit ]`).

Worker never uploads raw files — only the hash + summary go through the platform. Emphasize this in copy.

See `04-worker.jpg`.

### 05 — A2A (`/a2a`)

**Purpose:** agent-to-agent executor marketplace. Register your TEE executor or browse executors to delegate to.

**Layout:** two top tabs: `▸ REGISTER` and `  BROWSE`. Register form: executor name, TEE type (TDX / SEV / H100), supported categories, rate card, stake amount. Browse view: executor list table (NAME · TEE · CATEGORIES · RATE · UPTIME · REPUTATION · JOBS).

See `05-a2a.jpg`.

### 06 — Earnings (`/earnings`)

**Purpose:** worker/agent wallet. Balance, pending payouts, transaction history, withdrawal.

**Layout:** 4 stat cards (TOTAL EARNED · AVAILABLE · PENDING · THIS MONTH with delta). Bar chart of payout history with week/month/year toggle (15 bars shown, peak labeled). Pending payments table (TASK · TITLE · BOUNTY · SUBMITTED · EXPECTED · STATUS) with AWAITING/REVIEWING/RELEASING chips. Transaction log (30d) with TIME · TYPE · REF · AMOUNT · NET · TX HASH · STATUS. `[ ↗ withdraw ]` button top-right.

See `06-earnings.jpg`, `10-dark-earnings.jpg`.

### 07 — Verification (`/verification`)

**Purpose:** TEE-attested evidence verification. Trigger verification on a submitted task; browse evidence chain; view audit log.

**Layout:** 4 stat cards (TEE ENCLAVE ONLINE · MY VERIFIED 42 · AVG CONFIDENCE 96.1% · DISPUTES OPEN 0). Three tabs: `▸ TRIGGER`, `EVIDENCE_CHAIN`, `AUDIT_LOG`.

- **Trigger tab:** left = form (task id, category, requirements textarea, evidence summary textarea, `[ seal_and_verify ]` + `[ reset ]`). Right = "what the enclave checks" 5-step explainer. On submit, shows result card with `PASSED` + confidence + model + DCAP attestation signature + reasoning.
- **Evidence chain tab:** timeline of hash entries, each with action tag (sealed/executed/attested/released) + BLAKE3 hash + timestamp + actor.
- **Audit log tab:** dense event table (TIME · EVENT · TASK · ACTOR · HASH).

See `07-verification.jpg`, `11-dark-verification.jpg`.

### 08 — Settings (`/settings`)

**Purpose:** identity, payment network, notifications, language, privacy.

**Layout:** two columns. Left (wider): numbered sections `§01 IDENTITY`, `§02 PREFERRED PAYMENT NETWORK`, `§03 NOTIFICATIONS`, `§04 LANGUAGE & LOCALE`, danger zone at bottom. Right: `§I SESSION STATE`, `§II IN-BROWSER KEYS`, `▸ PRIVACY` explainer.

- **§01 Identity:** wallet address, tier + reputation, social OAuth (X / @jem_11ah ✓ VERIFIED), human proof (World ID Orb ✓).
- **§02 Payment network:** grid of chain pills — Base / Ethereum / Polygon / Arbitrum / Avalanche / Optimism / Celo / Monad. Some marked FAST. Single-select.
- **§03 Notifications:** three toggles (email, browser push, weekly digest).
- **§04 Language:** dropdown.

See `08-settings.jpg`, `12-dark-settings.jpg`.

---

## Interactions & state

### Theme
- `html[data-theme="light" | "dark"]` on root
- Toggle in top-right of TopBar (`◌ LIGHT / ● DARK`, sharp corners, hairline border)
- Persist to `localStorage("bb.theme")`
- Read on mount, apply before first paint (inline script in `<head>`) to avoid flash
- **Marketing is dark-only** — no toggle. Dashboard has both.

### Routing
Dashboard screens are a router (right-pane swap). Left sidebar groups:
- **DOCS** → `how_it_works`
- **MARKETPLACE** → `tasks`, `agent`, `worker`, `a2a`
- **ACCOUNT** → `earnings`, `verification`, `settings`

Active route: cream left-border + `▸ ` prefix + ink color.

### Status chip colors

```
OPEN         → neutral outline, no bg
VERIFYING    → --bb-info bg (at 20% alpha), --bb-info text, --bb-info border
ASSIGNED     → --bb-ink bg, --bb-surface text
PASSED       → --bb-ok bg (20% alpha), --bb-ok text, --bb-ok border
FAILED       → --bb-err bg (20% alpha), --bb-err text, --bb-err border
AWAITING     → --bb-warn bg (20% alpha), --bb-warn text
REVIEWING    → --bb-info bg (20% alpha), --bb-info text
RELEASING    → --bb-ok bg (20% alpha), --bb-ok text
```

All chips: uppercase, 9px, 600 weight, .18em letter-spacing, 3px/8px padding, `white-space: nowrap`.

### Form focus

Inputs are 1px `--bb-line` at rest, **1px `--bb-cream` on focus**. No focus ring, no outline glow. Caret color = `--bb-cream`.

### Animations

Keep them minimal. Only these are approved:
- `bbFade` — 300ms opacity + 6px y-translate. For initial mount of top-level sections.
- `bbBlink` — 1.05s step-end, for terminal cursors.
- `bbPulse` — 1.6s ease-in-out, for "streaming" status dots.

No spring physics, no hero transitions, no page slide-ins. The terminal aesthetic requires stillness.

### Empty states

Render as a `$` prompt followed by a plausible command the user should run to populate the state. Example for empty task feed: `$ blindbounty tasks --filter=open` / `no results. try ▸ [ post_task ] to be first.`

---

## Design tokens — canonical file

`design_files/colors_and_type.css` contains every token as CSS custom properties. Use this as your Tailwind config source. An illustrative Tailwind mapping:

```js
// tailwind.config.ts
colors: {
  bg:        'var(--bb-bg)',
  surface:   'var(--bb-surface)',
  'surface-2': 'var(--bb-surface-2)',
  line:      'var(--bb-line)',
  'line-2':  'var(--bb-line-2)',
  ink:       'var(--bb-ink)',
  'ink-2':   'var(--bb-ink-2)',
  'ink-3':   'var(--bb-ink-3)',
  invert:    'var(--bb-invert)',
  'invert-fg': 'var(--bb-invert-fg)',
  cream:     'var(--bb-cream)',
  ok:        'var(--bb-ok)',
  warn:      'var(--bb-warn)',
  err:       'var(--bb-err)',
  info:      'var(--bb-info)',
},
fontFamily: {
  mono: ['IBM Plex Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
},
borderRadius: { DEFAULT: '0', none: '0' }, // enforce sharp corners
```

---

## Assets

- `design_files/assets/logo.svg` — canonical aperture mark, 44×44 viewBox
- Icons are inline SVG (1.5px stroke, square caps, square joins). The set in `primitives.jsx` is complete — port as a single `<Icon name="…">` component in your codebase.

---

## Files in this bundle

```
design_handoff_blindbounty/
├── README.md                                   ← you are here
├── screenshots/                                ← reference images for every screen
│   ├── 00-marketing-hero.jpg
│   ├── 00-marketing-problem.jpg
│   ├── 00-marketing-how.jpg
│   ├── 00-marketing-trust.jpg
│   ├── 01-how-it-works.jpg
│   ├── 02-tasks.jpg
│   ├── 03-agent.jpg
│   ├── 04-worker.jpg
│   ├── 05-a2a.jpg
│   ├── 06-earnings.jpg
│   ├── 07-verification.jpg
│   ├── 08-settings.jpg
│   ├── 09-dark-tasks.jpg
│   ├── 10-dark-earnings.jpg
│   ├── 11-dark-verification.jpg
│   └── 12-dark-settings.jpg
└── design_files/
    ├── SKILL.md                                ← design-system authoring skill (for future iteration)
    ├── colors_and_type.css                    ← canonical tokens
    ├── assets/
    │   └── logo.svg                            ← aperture mark
    └── ui_kits/
        ├── marketing/
        │   ├── index.html                      ← entry: full marketing scroll
        │   ├── primitives.jsx                  ← LogoMark, Icon, Button, Tag, Panel, SectionRule, Prompt, Navbar, Footer
        │   └── sections.jsx                    ← Hero, Problem, HowItWorks, Trust, Roles
        └── dashboard/
            ├── index.html                      ← entry: full dashboard shell with router
            ├── primitives.jsx                  ← Sidebar, TopBar, StatCard, Card, Table, StatusChip, LifecycleRow, FormField, Button, Tabs
            ├── screens.jsx                     ← HowItWorks, Tasks, Agent, Worker, A2A
            └── extra_screens.jsx               ← Earnings, Verification, Settings
```

**To preview a design file locally:** open `design_files/ui_kits/dashboard/index.html` or `design_files/ui_kits/marketing/index.html` directly in a browser. They run entirely in-browser via inline Babel — no build step.

---

## Implementation order (suggested)

1. **Tokens + fonts.** Wire `colors_and_type.css` into Tailwind config. Load IBM Plex Mono. Confirm theme toggle works end-to-end.
2. **Primitives.** Build `Button`, `Tag`, `StatusChip`, `Card`, `SectionRule`, `FormField`, `Icon`, `LogoMark` as reusable React components. Write Storybook stories if you use Storybook.
3. **Layout.** Sidebar + TopBar + routing shell. Get the chrome right before filling screens.
4. **Screens in this order:** tasks → earnings → verification → settings → agent → worker → a2a → how-it-works. Task feed is the hero and sets the component baselines.
5. **Marketing site.** Separate route or subdomain. Reuse primitives.
6. **Real data.** Replace every placeholder. Start with wallet + tasks + escrow contract reads.

---

## Notes for Claude Code

- **Do not introduce new colors.** If you feel the urge to add an accent, stop — the monochrome + cream + 4 semantic colors system is intentional and finished.
- **Do not round corners.** Even if your component library defaults to `rounded-md`, override.
- **Do not add box-shadows to cards.** Hairline borders only. Shadows are reserved for modals/dropdowns floating above content.
- **Do not swap IBM Plex Mono for a "more readable" sans.** The monospace grid is the design.
- **Do reuse the bracket-button pattern for all primary CTAs.** `[ label ]` — the brackets are part of the component, not decoration.
- **Do lowercase nav and action labels.** `post_task`, not `Post Task`.
- **When in doubt:** open the HTML prototype and measure.

---

*Generated from the design system in `ui_kits/` — see `SKILL.md` for how the system was authored and how to extend it.*
