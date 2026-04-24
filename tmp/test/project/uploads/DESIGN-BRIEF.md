# ChurchFlow — Per-Page Design Brief

> **Purpose:** A comprehensive, self-contained design brief written to be fed directly to an AI design tool (e.g. Stitch, v0, Galileo, Uizard). It describes *what to draw* for every screen — layout, components, content, states — not how to code it.
> **Source of truth:** Derived from [SPECS.md](SPECS.md) (functional spec) and [design-system.md](design-system.md) (visual system — "Sanctuary").
> **Version:** 1.0 · **Date:** 2026-04-23

---

## Table of Contents

1. [Product Context (read this first)](#1-product-context-read-this-first)
2. [Audience & Tone](#2-audience--tone)
3. [Global Visual Language (Sanctuary)](#3-global-visual-language-sanctuary)
4. [Global Layout Shell](#4-global-layout-shell)
5. [Universal UI Patterns & States](#5-universal-ui-patterns--states)
6. [Page Designs — Public / Auth](#6-page-designs--public--auth)
7. [Page Designs — Member (User)](#7-page-designs--member-user)
8. [Page Designs — Admin](#8-page-designs--admin)
9. [Page Designs — Super Admin](#9-page-designs--super-admin)
10. [Email Templates](#10-email-templates)
11. [Responsive Rules](#11-responsive-rules)
12. [Deliverables Checklist](#12-deliverables-checklist)

---

## 1. Product Context (read this first)

### What is ChurchFlow?

**ChurchFlow** is a multi-tenant **church management web application** whose single focus is **recording incoming financial gifts** — tithes, offerings, mission giving, first-fruit offerings, and event-specific commitments. It is explicitly **not** an accounting tool: there are **no expenses, no payroll, no budgets, no outgoing money**. Think of it as a digital version of a church secretary's ledger — but privacy-aware, cloud-hosted, and organized per person and per event.

### Who uses it?

Three distinct user types, each with a different view of the product:

1. **Super Admin (platform operator)** — onboards churches, invites church admins, oversees tenants. Technical, small audience, power-tools feel.
2. **Admin (church administrator / finance secretary)** — the primary power user. Records transactions, manages members, creates events, reviews reports. Spends the most time inside the app. Often non-technical (a volunteer or staff member), on desktop most of the time.
3. **Member (church attendee)** — read-only, privacy-scoped. Logs in to see **their own giving history** and **upcoming church events**. May use mobile more than desktop. Needs reassurance, warmth, and zero complexity.

### What makes it different from a generic SaaS CRM?

- **Tone matters.** Churches are community-oriented, non-corporate. The design system ("Sanctuary") deliberately resembles a premium journal — warm, calm, spacious — not a finance dashboard.
- **Privacy is sacred.** A member's giving is visible only to that member and admins. The UI should *feel* discreet, not flashy.
- **Multi-tenant.** A user can belong to multiple churches; the app must support switching between them.
- **Income-only.** Every financial UI element reinforces that this is about receiving and stewardship, never spending.
- **Two mental modes:** Admins think in *lists, filters, totals, records*. Members think in *my giving, my church, what's next*.

### Success criteria for the design

- An admin can record a transaction in **under 20 seconds** from the dashboard.
- A member logging in for the first time understands within 5 seconds: "this is where I can see my giving."
- Nothing on the member side ever looks like a "payment gateway" — there is no online giving in this product.
- Visual vocabulary stays consistent: cards float on tonal backgrounds, no 1px dividers, generous whitespace, indigo gradients reserved for primary action.

---

## 2. Audience & Tone

| Persona | Device mix | Emotional goal | Don't |
|---|---|---|---|
| Super Admin | Desktop-only | Feel in control, efficient | Don't make it feel like "customer support software" |
| Admin | Desktop-primary, tablet-secondary | Feel trusted, organized, unrushed | Don't overload with KPIs; this is not a trading terminal |
| Member | Mobile-primary, desktop-secondary | Feel welcomed, private, informed | Don't show totals they don't own; no "progress-to-goal" guilt |

**Voice in copy:** Calm, plain, second-person ("Your giving this month"). Avoid finance jargon ("transaction volume", "revenue"). Prefer "gift", "giving", "record", "contribution".

---

## 3. Global Visual Language (Sanctuary)

> Full tokens live in [design-system.md](design-system.md). Summary for the designer:

- **Palette root:** Indigo `#4F46E5` (primary-container) / `#3525CD` (primary). Neutrals are tinted warm-cool, never pure gray. Background `#F7F9FB` (surface). Cards `#FFFFFF` on `#ECEEF0` grouping.
- **Accent:** Tertiary `#7E3000` (warm clay) — used *sparingly* for human-touch moments (birthdays, anniversaries, thank-you copy).
- **Typography:** Inter everywhere. Headlines `-0.02em` tracking, labels ALL-CAPS `+0.05em`. Never pure black text — use `#191C1E`.
- **Radii:** Buttons `24px`, cards `16px`, inputs `12px`, badges `full`.
- **No 1px borders.** Separate regions with background-tone shifts and whitespace.
- **No drop shadows.** Use tonal layering. Only modals get an ambient indigo-tinted shadow.
- **Primary buttons:** gradient `primary-container → primary` at 135°, pill-rounded, no shadow.
- **Inputs:** filled (`surface-container-highest`), no border at rest, soft indigo glow on focus.
- **Status colors:** green (active/upcoming), amber (pending), gray (completed), `error-container` (cancelled), `outline-variant` (inactive).
- **Transaction-type color coding** (used for badges, chart slices, row accents):
  Tithe → Indigo · Offering → Green · Mission → Blue · First Fruit → Amber · Commitment → Purple · Donation → Teal · Other → Neutral.
- **Illustration style (for empty states, auth pages):** soft duotone line-art, indigo + warm clay, rounded, minimal. No stock photography of hands/crosses/money.

---

## 4. Global Layout Shell

### Authenticated shell (all post-login pages)

```
┌─────────────────────────────────────────────────────────────┐
│  [Sidebar 260px]  │        [Main Content — max 1200px]       │
│                   │  ┌────────────────────────────────────┐  │
│                   │  │  [Top Bar — 72px tall]              │  │
│                   │  └────────────────────────────────────┘  │
│                   │  ┌────────────────────────────────────┐  │
│                   │  │                                     │  │
│                   │  │         Page content                │  │
│                   │  │                                     │  │
│                   │  └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Sidebar (fixed, `surface-container-lowest` on `surface`):**
- Church logo + church name at top (click → switch church if user has ≥2).
- Primary nav items (role-dependent, see below), icon + label, rounded pill hover state.
- Bottom: current user chip (avatar, name, role badge), clicking opens profile/sign-out menu.

**Sidebar nav by role:**
- **Super Admin:** Tenants · Admins · Settings
- **Admin:** Dashboard · Members · Events · Transactions · Reports · Invitations · Settings
- **Member:** Dashboard · My Giving · Events · Profile

**Top bar:**
- Left: breadcrumb (Section / Subsection) in `label-md` all-caps.
- Center: none (page title lives *inside* content area).
- Right: global search (inputs pattern), notifications bell (badge if pending invitations to admins), church switcher pill if user has multiple tenants.

**Content area:**
- Max-width 1200px, centered, page gutter `spacing-16` on mobile, `spacing-24` on desktop.
- Each page opens with an **editorial page header block**: overline label (all-caps), H1 headline (-0.02em), and one-line supporting sentence.

### Unauthenticated shell (login, invite)

- No sidebar. Centered card on full-bleed background with soft indigo→clay gradient wash at 135°.
- ChurchFlow wordmark top-left.
- Bottom footer: small `label-sm` legal links (Privacy, Terms) and "Built for churches".

---

## 5. Universal UI Patterns & States

Every page must specify, explicitly:

1. **Empty state** — illustration + one-line helper + single CTA.
2. **Loading state** — skeletons matching the final layout (no spinners on page-level loads). Skeletons use `surface-container` shimmer.
3. **Error state** — inline card with `error-container` bg, plain-language message, retry action.
4. **Permission-denied state** — friendly 403 card, "Ask your church admin" copy.

**Standard components the designer should draw once and reuse:**
- `PageHeader` (overline + H1 + subtitle + optional right-aligned primary action)
- `StatCard` (label, big number, delta chip, sparkline)
- `DataTable` (see below)
- `FilterBar` (chips + dropdowns, no borders, sits in `surface-container-low` strip)
- `EmptyState`
- `Modal` (frosted glass overlay, indigo-tinted ambient shadow)
- `Drawer` (right-side slide-in for detail views on tablet)
- `ToastStack` (bottom-right, `surface-container-lowest`)
- `FormField` (label above, helper below, error in `on-error-container` on `error-container` pill)
- `TransactionTypeBadge` (uses the color mapping above)
- `StatusBadge` (active/pending/completed/cancelled/inactive)
- `Avatar` (circular, initials fallback in muted indigo)
- `AmountDisplay` (currency-prefixed, tabular-nums, 3-tier size: display / row / label)

**Data-table pattern (critical — reused across Members, Events, Transactions, Tenants):**
- No header borders; header row uses `label-md` all-caps on transparent bg.
- Zebra-striping is **forbidden**. Rows separate via 8px vertical spacing + hover state to `surface-container-low`.
- Row height 64px, vertically centered content.
- Right-aligned monetary columns with tabular-nums.
- Trailing action column: kebab menu (⋮) revealing Edit / Delete / View.
- Sticky header on scroll.
- Pagination: rounded pill buttons, "Showing 1–20 of 243".

---

## 6. Page Designs — Public / Auth

### 6.1 `/` — Landing Redirect
No visible design needed. It resolves to `/login` or `/dashboard`.

### 6.2 `/login` — Sign In

**Purpose:** Only way into the app. Google SSO is the sole method.

**Layout:**
- Full-bleed page, soft diagonal gradient background (indigo `primary-fixed` → white, top-left to bottom-right).
- Centered card, 440px wide, `surface-container-lowest`, radius `lg`, internal padding `spacing-8`.
- Card contents top-to-bottom:
  1. ChurchFlow wordmark (24px, indigo).
  2. H1 `headline-lg`: "Welcome back".
  3. Body `body-md` muted: "Sign in to your church's dashboard."
  4. Primary button, full-width: "Continue with Google" (Google G icon + label, gradient fill).
  5. Tertiary caption below: "By continuing you agree to our Terms & Privacy Policy." (underlined links).
- Right side (desktop only, ≥1024px): vignette illustration — a soft duotone of an open journal with a bookmark, conveying "record-keeping", no overtly religious icons.
- Mobile: card centered, illustration hidden.

**States:** default · signing-in (button shows inline spinner, disabled) · error ("We couldn't sign you in" in `error-container` pill above button).

### 6.3 `/invite/[token]` — Accept Invitation

**Purpose:** Landing page for someone clicking the invite email. Could be an admin invite or a member invite.

**Layout:**
- Same background + card shell as Login.
- Card contents:
  1. Wordmark.
  2. Overline `label-md`: "INVITATION".
  3. H1: "You've been invited to **{ChurchName}**" (church name in indigo gradient text).
  4. Body: "{InviterName} invited you to join as **{Role}**. Sign in with Google to accept."
  5. Small meta row: church logo avatar + church contact email, inviter avatar + name.
  6. Primary button: "Accept & Continue with Google".
  7. Tertiary link: "This wasn't meant for me".

**States:**
- **Valid** (above).
- **Expired:** same shell, H1 "This invitation has expired.", body "Ask {ChurchName} to send a new one.", muted clay illustration of a wilted envelope.
- **Already accepted:** "You're already a member of {ChurchName}", button "Go to Dashboard".
- **Invalid token:** generic "This link isn't valid" with soft error illustration.

---

## 7. Page Designs — Member (User)

Members see a subset. Tone: warm, private, restful.

### 7.1 `/select-church` — Tenant Selector

**Shown only when** the signed-in user belongs to 2+ tenants.

**Layout:**
- Unauthenticated shell style (no sidebar yet — user has not picked a church).
- H1: "Which church today?"
- Subtitle: "You're a member of more than one community."
- Grid of **Church Cards** (2 columns on desktop, 1 on mobile):
  - Church logo (48px rounded square), church name (`headline-sm`), role chip ("Member" or "Admin"), meta "Joined Jan 2024".
  - Full-card hover: lifts to `surface-container-lowest`, subtle indigo ring.
  - Click → enters dashboard scoped to that tenant.
- Footer: "You can switch churches anytime from the sidebar."

### 7.2 `/dashboard` (Member view)

**Purpose:** A quiet home screen that says "here's what matters to you this week".

**Layout:**
- PageHeader:
  - Overline "WELCOME"
  - H1 `headline-lg`: "Hello, {FirstName}." (first name only; no surname — feels personal)
  - Subtitle: "Here's a gentle summary of your giving and upcoming services at {ChurchName}."

- **Row 1 — Personal Snapshot (3-column grid on desktop, stacked on mobile):**
  1. `StatCard` — "Your giving this month" · amount · small caption "{n} gifts recorded".
  2. `StatCard` — "Your giving this year" · amount · caption "Fiscal year started {Month}".
  3. `StatCard` — "Most recent gift" · amount · type badge · relative date ("3 days ago").
  - All stat cards use plain numbers. **No comparisons to other members, ever.**

- **Row 2 — Two-column split (60/40):**
  - **Left (60%): "Recent giving"** card.
    - Lists last 5 transactions of this member.
    - Each row: date (muted), type badge, amount (right-aligned, `body-md` tabular), payment-method icon.
    - Footer link: "View all my giving →" links to `/transactions`.
    - Empty: illustration of an open ledger + "No gifts recorded yet. When {ChurchName} records a gift from you, it'll appear here."
  - **Right (40%): "Upcoming at {ChurchName}"** card.
    - List of next 3 events: date chip (day-num + month all-caps), title, location, type badge.
    - Footer link: "See all events →".

- **Row 3 (optional, below the fold): "A note from the tertiary accent"** — a thin warm-clay banner, italicized: "Thank you for your faithful giving." Only shown if the member has ≥1 transaction this month. Uses `tertiary` color sparingly. This is the "Human Touch" moment from the design system.

### 7.3 `/transactions` (Member view — "My Giving")

**Purpose:** Full private history of this member's giving.

**Layout:**
- PageHeader: Overline "MY GIVING", H1 "Your giving history", subtitle "Everything {ChurchName} has recorded for you.".
- **FilterBar:** date-range picker (presets: This month, This year, All time, Custom), type multi-select chips, payment-method dropdown. No "member filter" (obviously — it's always the user).
- **Summary strip** (between filter and list): 3 inline stats — "Total in range", "Gifts in range", "Average per gift". Small, single row, no cards; just label + number, separated by vertical whitespace.
- **DataTable** columns: Date · Type (badge) · Event (if linked) · Payment method (icon + label) · Reference # (muted) · Amount (right-aligned, tabular). No actions column — members cannot edit.
- **Row hover:** background shift to `surface-container-low`; clicking opens the transaction detail drawer (see 7.4) instead of a full-page navigation — feels lighter.
- Empty state: soft illustration + "No gifts in this range. Try widening your filters."

### 7.4 `/transactions/[id]` (Member view) — Drawer, not full page

**Purpose:** Details of one gift.

**Layout — right-side drawer, 480px wide:**
- Header: date in big `headline-md`, type badge, close button (X).
- Amount display: full-width, `display-md`, indigo gradient numerals.
- Meta rows (label left, value right, 48px per row, tonal separators via whitespace):
  - Payment method · icon + label
  - Reference number · monospace
  - Event · linked pill (click → event detail)
  - Recorded on · date + admin name ("Recorded by Admin Name")
  - Note (if present) · italicized quote block on `surface-container-low` bg
- Footer: "This is a private record between you and {ChurchName}."

### 7.5 `/events` (Member view)

**Purpose:** What's happening at my church.

**Layout:**
- PageHeader: Overline "CALENDAR", H1 "Upcoming events", subtitle "Gatherings, services, and special moments.".
- **Tabs (pill style, no bg on inactive):** Upcoming · Past · All.
- **Masonry-style card grid** — 3 columns desktop, 2 tablet, 1 mobile:
  - Each card: big date chip (top-left overlay), event title, type badge, location line with pin icon, 2-line description preview, "Recurring" chip if applicable.
  - Card height varies with description — masonry feel per the "editorial" rule.
- Past events are visually dimmed (reduced saturation, smaller date chip).
- Empty state: "No upcoming events yet. Check back soon."

### 7.6 `/events/[id]` (Member view)

**Layout:**
- PageHeader with a **hero band**: gradient indigo background, H1 event title, subtitle "{Event type} · {Date, time}".
- Two-column below:
  - **Left (primary):** Full description (rich text, generous line-height), location card with map-less location string (no embedded map — out of scope).
  - **Right (sidebar card):** "At a glance" — date, duration, type badge, recurrence rule in plain English ("Every Sunday"), status badge.
- No transaction data visible to members.

### 7.7 `/profile` (Member view)

**Layout:**
- PageHeader: "Your profile".
- Two-column:
  - **Left card — "Account":** avatar (from Google), name, email, Google-connected chip. No edit (Google is source of truth). Sign-out secondary button.
  - **Right card — "Churches":** list of tenants this user belongs to, each with logo, name, role chip, "joined" date, and a subtle "Switch to this church" link.

---

## 8. Page Designs — Admin

Admins get the densest screens. Tone: organized, efficient, never cluttered.

### 8.1 `/dashboard` (Admin view)

**Purpose:** Situational awareness for the person running the church's ledger.

**Layout:**
- PageHeader: Overline "OVERVIEW · {CurrentMonth} {Year}", H1 "Good {morning/afternoon}, {FirstName}.", subtitle "Here's how giving is trending at {ChurchName}."
- Right of header: primary gradient button **"Record a gift"** (opens quick-record modal, see 8.10 below).

- **Row 1 — KPI strip (4 StatCards, equal width):**
  1. "Total this month" — amount + delta chip vs. previous month ("▲ 12%").
  2. "Gifts recorded this month" — count + delta chip.
  3. "Active members" — count + "X new this month".
  4. "Upcoming events" — count + next event title preview.

- **Row 2 — Charts (2-column):**
  - **Left (60%) — "Monthly trend":** 12-month bar chart, indigo gradient bars, tooltip on hover. Y-axis labels muted, no gridlines — just subtle horizontal tonal bands. X-axis: short month labels.
  - **Right (40%) — "Income breakdown":** donut chart by transaction type, using the type-color mapping. Legend below with percentages. Center of donut shows total amount for the selected range.
  - Shared range selector above both charts: segmented control "30d / 90d / YTD / Custom".

- **Row 3 — Two lists side-by-side:**
  - **"Recent gifts"** (last 10 transactions): member avatar + name, type badge, amount, date. Row hover + click → drawer. Footer link "View all transactions →".
  - **"Coming up"** (next 5 events): date chip, title, type badge, location. Footer link "See events →".

- **Optional Row 4 — "Needs attention" card** (only shows if applicable):
  - Pending invitations past 3 days
  - Anonymous transactions that could be linked to temp members
  - Each shown as a list item with a CTA pill on the right ("Resend", "Link now").

### 8.2 `/members` — Members List

**Layout:**
- PageHeader: H1 "Members", subtitle "Everyone giving at {ChurchName}."
- Header-right actions: secondary button "Invite member" · primary button **"+ Add member"**.
- **FilterBar:** Search (by name or email) · status dropdown (Active / Inactive / All) · linked-status dropdown (Linked / Temp / All) · sort dropdown.
- **Summary strip:** "234 members · 189 active · 45 temp (unlinked)".
- **DataTable** columns:
  - Member — avatar + first + last name, with small "temp" chip if not linked
  - Email — muted, with envelope icon if null shows "—"
  - Phone — muted, "—" if null
  - Status — badge
  - Linked — checkmark icon in indigo if linked, empty circle if temp
  - Last gift — date + amount (small)
  - Actions — kebab (View · Edit · Invite to link · Deactivate)
- Row click → `/members/[id]`.
- Empty state: "No members yet. Add your first member to start recording gifts."

### 8.3 `/members/new` — Add Member

**Layout:**
- PageHeader: H1 "Add a new member", subtitle "You can fill in only a name — the rest is optional."
- **Single centered form card, 640px wide:**
  - Two-column fields: First name * · Last name *
  - Single-column: Email (optional), Phone (optional), Address (optional, textarea 2 rows)
  - Help callout in `surface-container-low` pill: "Adding a member without an email creates a **temp member**. You can invite them to link their Google account later."
  - Form actions right-aligned: tertiary "Cancel" · primary "Create member".
- On submit → redirect to `/members/[id]` with success toast.

### 8.4 `/members/[id]` — Member Detail

**Layout:**
- **Hero header block:**
  - Left: large avatar (80px), name `headline-lg`, meta row "Member since {date} · Status: {badge} · Linked: {yes/no}".
  - Right: action buttons — secondary "Edit" · tertiary "Invite to link" (hidden if already linked) · tertiary-destructive "Deactivate".
- **Tabs:** Overview · Giving history · Details.
- **Overview tab:**
  - 3 StatCards: "Total given (lifetime)", "Given this year", "Gifts recorded".
  - Bar chart: last 12 months of this member's giving.
  - "Recent gifts" list (last 5).
- **Giving history tab:** same as the admin transactions table but pre-filtered to this member, with a "Filter locked to this member" chip that cannot be removed.
- **Details tab:** contact info card (email, phone, address), account-link card (Google avatar if linked, "Invite to link" CTA if temp).

### 8.5 `/events` — Events List (Admin view)

**Layout:**
- PageHeader: H1 "Events", subtitle "Services, conferences, fundraisers, special gatherings."
- Right actions: primary **"+ Create event"**.
- Tabs: Upcoming · Ongoing · Past · Cancelled · All (each with count).
- **View toggle** (segmented control): List · Calendar.
- **List view** — similar data-table pattern:
  - Columns: Event (title + type badge) · Date (or date range) · Location · Status · Transactions (count + total amount linked to this event) · Actions (kebab).
- **Calendar view** — month grid, no borders, event pills colored by type. Click a day → modal with that day's events.
- Empty state: illustration of a calendar with a bookmark, "No events yet. Create your first service or fundraiser."

### 8.6 `/events/new` & `/events/[id]/edit` — Event Form

**Layout:**
- PageHeader: "Create event" / "Edit event".
- **Form card, 720px wide:**
  - Title * (full width)
  - Type * (segmented radio chips: Service · Conference · Fundraiser · Special · Other)
  - Two-column: Start date * · End date (optional)
  - Location (optional)
  - Description (rich textarea, 6 rows, character counter)
  - Recurrence card (tonal sub-card on `surface-container-low`):
    - Toggle "Recurring event"
    - If on: radio (Weekly / Monthly / Yearly / Custom), with plain-English preview line: "Repeats every Sunday".
  - Actions: tertiary "Cancel" · secondary "Save as draft" (optional) · primary "Create event".

### 8.7 `/events/[id]` — Event Detail (Admin view)

**Layout:**
- Hero band (gradient indigo) with H1 title, type badge, date + location meta, status badge, right-side "Edit" and "Cancel event" actions.
- **Row 1 — Stats:** 3 StatCards specific to this event: "Total linked gifts", "Number of gifts", "Unique givers".
- **Row 2:** Description card (left, 60%) · "At a glance" card (right, 40%) — date, duration, recurrence, visibility.
- **Row 3 — "Linked gifts" table:** same columns as `/transactions` but filtered to this event. Inline primary action "+ Record gift for this event" opens the quick-record modal with event pre-filled.

### 8.8 `/transactions` — Transactions List (Admin)

**Purpose:** The admin's workhorse screen. Must be efficient, filterable, scannable.

**Layout:**
- PageHeader: H1 "Transactions", subtitle "Every gift recorded at {ChurchName}."
- Right actions: secondary "Export" (disabled with tooltip "Coming soon") · primary **"+ Record gift"**.
- **FilterBar (sticky under header on scroll):**
  - Search (member name, note, reference #)
  - Date range picker (presets)
  - Type multi-select chips
  - Payment method dropdown
  - Event dropdown (searchable)
  - Member dropdown (searchable, includes "Anonymous")
  - Reset chip on right
- **Summary strip** (always reflects current filter): "Total: $X,XXX · Gifts: NNN · Avg: $XX". Right side: small pie preview (mini donut) showing type distribution for current filter.
- **DataTable** columns:
  - Date
  - Member (avatar + name, "Anonymous" in muted italic if null)
  - Type (badge)
  - Event (linked pill, "—" if null)
  - Payment method (icon + label)
  - Reference #
  - Amount (right-aligned, tabular)
  - Actions (kebab: View · Edit · Link to member · Delete)
- Clicking a row opens the detail drawer (8.9).
- Bulk select (checkbox column, optional): bulk actions bar slides up from bottom when rows are selected — "Link {n} to member…" · "Delete {n}".

### 8.9 `/transactions/[id]` — Transaction Drawer (Admin)

**Layout — right-side drawer, 520px wide:**
- Header: date `headline-md`, type badge, close (X).
- Amount display `display-md`, indigo gradient numerals.
- Meta rows (editable inline by admins — pencil icon on hover, or a single "Edit" button in header):
  - Member (or "Anonymous" with inline "Link to member…" link)
  - Event (with "Link to event…" if null)
  - Payment method
  - Reference number
  - Recorded by (admin name, avatar, timestamp)
  - Note (quote block)
- Footer actions: tertiary-destructive "Delete" · secondary "Edit" · primary "Done".

### 8.10 `/transactions/new` — Record Transaction (Modal *and* full page)

**Purpose:** Admin's most frequent action. Should be fast from anywhere in the app (dashboard, event detail, member detail).

**Modal version (default, launched by "+ Record gift"):**
- Modal width 560px, frosted overlay, radius `lg`, internal padding `spacing-8`.
- Header: H1 `headline-sm` "Record a gift", close (X).
- Form fields (top-down, tight vertical rhythm):
  1. **Amount *** — big input, currency symbol prefix, numeric keyboard on mobile, `display-md` text.
  2. **Type *** — segmented chips row, scrollable horizontally if too many custom types (Tithe, Offering, Mission, First Fruit, Commitment, Donation, Other). If "Other" selected, a text input appears inline for custom label.
  3. **Date *** — date picker, defaults to today.
  4. **Member** — searchable dropdown of members. Top option always "Anonymous". Selected member shows avatar + name pill inside the field.
  5. **Event** — searchable dropdown of upcoming + recent events, with "None" option.
  6. **Payment method *** — icon grid chips (Cash, Check, Bank transfer, Online, Mobile money, Other).
  7. **Reference #** — shown only if payment method is Check or Bank transfer.
  8. **Note** — optional textarea, 2 rows, placeholder "Anything worth remembering…".
- Footer: tertiary "Cancel" · primary "Record gift" (gradient).
- After submit: modal fades out, toast "Gift recorded · $XX from {Member}" with a quick "View" button that opens the drawer.
- **Keyboard:** Cmd/Ctrl+Enter submits; ESC cancels. Feature this in a tiny hint at the bottom of the modal.

**Full-page version** (`/transactions/new`, for deep links from email, etc.): same fields, centered 640px card, identical flow.

### 8.11 `/reports`

**Purpose:** Deeper reporting than the dashboard. Admins come here to answer "how did we do last quarter?" or "who are my top givers this year?".

**Layout:**
- PageHeader: H1 "Reports", subtitle "Income insights across members, types, events, and time."
- **Top — Report switcher (tabs):** By Type · By Member · By Event · By Month.
- **Global controls** (below tabs): date range, currency (read-only, from tenant), group-by granularity.
- **Each report view:**
  - **By Type:** donut + ranked list; rows show type, amount, % of total, gift count, sparkline of last 6 months.
  - **By Member:** leaderboard table (admins only). Columns: Member, Total, Gifts, Avg, Last gift, Streak (consecutive months given). **NOTE:** Add copy above: "These reports are private administrative views. Members never see each other's totals."
  - **By Event:** table of events with total linked giving, unique givers, average gift per giver.
  - **By Month:** line chart + table combo showing month-over-month totals with % delta.
- **Export button** (secondary) in top-right — "Export CSV" (can show "coming soon" state for MVP).

### 8.12 `/invitations`

**Purpose:** Admin manages pending invitations (both member link-invites and admin-invites, though admins can only send member invites).

**Layout:**
- PageHeader: H1 "Invitations", subtitle "Pending and recently accepted invitations."
- Tabs: Pending · Accepted · Expired · Cancelled.
- **DataTable:**
  - Columns: Invited email · Role · Member (if link-invite) · Sent on · Expires in (relative, red if <24h) · Invited by · Actions.
  - Actions: Resend · Copy link · Cancel.
- Top-right primary action: "+ Invite member".
- Empty: "No pending invitations. Nice and tidy."

### 8.13 `/settings` — Church Settings

**Layout:**
- PageHeader: "Church settings".
- **Left nav sub-menu** (tonal list, no borders): General · Transaction types · Fiscal year · Team (admins).
- **General tab:**
  - Cards: Church identity (name, logo upload, phone, address, contact email) · Currency (read-only after creation, with explanation) · Timezone.
- **Transaction types tab:**
  - Shows built-in types as locked chips (with muted "built-in" label).
  - List of custom types with inline rename/remove.
  - "+ Add custom type" inline input.
- **Fiscal year tab:** month picker, helper "This controls the start of your annual giving summaries.".
- **Team tab:** list of admins (avatar, name, email, invited-on), "+ Invite admin" — but for admins this is read-only; only super admins can add admins. Show disabled state with tooltip "Ask your platform administrator to add more admins."

---

## 9. Page Designs — Super Admin

Super admin lives at `/admin/*`. Tone: control-center, still Sanctuary-styled but slightly denser.

### 9.1 `/admin/tenants` — Tenants List

**Layout:**
- PageHeader: H1 "Churches", subtitle "All tenants on ChurchFlow."
- Right action: primary **"+ Create church"**.
- **DataTable:**
  - Columns: Church (logo + name) · Admins (stacked avatars + count) · Members (count) · Transactions (count + total this month) · Created · Actions (View · Suspend · Delete).
- Empty state: "No churches yet. Create the first one to get started."

### 9.2 `/admin/tenants/new` — Create Church

**Layout:**
- PageHeader: H1 "Add a new church", subtitle "You'll be able to invite its admin next."
- Form card 720px:
  - Church name *
  - Contact email · phone · address (optional)
  - Currency * (searchable dropdown, ISO list)
  - Timezone * (searchable dropdown, IANA list)
  - Logo upload (dropzone on `surface-container-high`, rounded, preview 64px)
  - Fiscal year start (month picker, default January)
- Actions: Cancel · "Create church & invite admin" (primary, takes user to the admin-invite screen after creation).

### 9.3 `/admin/tenants/[id]` — Tenant Detail

**Layout:**
- Hero block: church logo, name `headline-lg`, meta (created on, currency, timezone), right-side actions "Edit", "Suspend".
- **Tabs:** Overview · Admins · Activity.
- **Overview:**
  - StatCards: Total admins · Total members · Total transactions · Total income.
  - Activity sparkline over last 90 days.
- **Admins:** see 9.4 embedded.
- **Activity:** audit-log-like list of major events (tenant created, admin invited, etc.).

### 9.4 `/admin/tenants/[id]/admins` — Manage Admins

**Layout:**
- PageHeader: "Admins for {ChurchName}".
- Right action: primary "+ Invite admin".
- Table: Admin (avatar + name) · Email · Invited by · Invited on · Last active · Actions (Remove).
- Invite flow: small inline drawer with email input, "This person will get an email invitation to join as admin."

---

## 10. Email Templates

Email templates use the **React Email** style: centered 600px container, white card on soft `surface` bg, Inter throughout, indigo accents.

### 10.1 Admin Invitation Email
- Subject: "You're invited to manage {ChurchName} on ChurchFlow"
- Preheader: "Click to accept and sign in with Google."
- Body sections:
  1. ChurchFlow wordmark top.
  2. H1: "You've been invited to **{ChurchName}**".
  3. Paragraph: "{InviterName} ({InviterEmail}) invited you to join as an **admin** — that means you'll record gifts, manage members, and create events for {ChurchName}."
  4. Primary button (full width on mobile): "Accept invitation".
  5. Fallback link (monospace, truncated).
  6. Footer: expires on {date} · "If you weren't expecting this, you can ignore it."

### 10.2 Member Invitation Email
- Subject: "Link your giving at {ChurchName}"
- Body emphasizes privacy: "Linking your account lets you see the gifts {ChurchName} has recorded for you. Nothing is shared with other members."
- Same visual shell as 10.1.

### 10.3 Welcome Email
- Subject: "Welcome to {ChurchName} on ChurchFlow"
- Soft tertiary-clay accent at top as a thin band (the "Human Touch" moment).
- Short copy: "You're all set. Next time you log in, your giving history will be right there on your dashboard."
- CTA: "Open ChurchFlow".

---

## 11. Responsive Rules

| Breakpoint | Behavior |
|---|---|
| **Mobile (<768px)** | Sidebar collapses into a top drawer (hamburger). Page gutters drop to `spacing-6`. KPI rows stack vertically. Data tables become **card lists** (each row a card with label:value pairs). Drawers become full-screen sheets. |
| **Tablet (768–1023px)** | Sidebar collapses to icons-only. 2-column layouts collapse to 1. Charts resize fluidly. |
| **Desktop (≥1024px)** | Full sidebar + multi-column layouts as described. |
| **Wide (≥1440px)** | Max content width stays at 1200px; extra space becomes breathing room (never stretch charts beyond 1200). |

**Touch targets:** min 44px. **Focus rings:** 2px `primary` with 2px offset, radius-matched.

---

## 12. Deliverables Checklist

For each page listed in sections 6–9, the AI designer should produce:

- [ ] Desktop layout (1280px wide artboard)
- [ ] Mobile layout (390px wide artboard)
- [ ] All referenced states (empty, loading, error, permission-denied where applicable)
- [ ] Primary interactive states for buttons (default, hover, focus, disabled)
- [ ] One sample with realistic content (not Lorem Ipsum — use plausible church, member, and transaction names; reasonable amounts in $ or ₦; recent dates)
- [ ] A dark-mode is **out of scope for v1** — light-mode only

**Cross-page consistency to audit before delivery:**

- Same `PageHeader` treatment on every page
- Same FilterBar pattern on Transactions, Events, Members
- Same DataTable row height, hover, kebab menu
- Same drawer dimensions (480/520px) for member / admin detail views
- Same modal dimensions (560px) for quick-record
- No 1px borders used for sectioning anywhere
- Indigo gradient used only on primary CTAs, hero bands, and big numeric displays — never on body backgrounds or cards
- Tertiary clay accent appears **only** on: welcome email band, thank-you note on member dashboard, anniversary/birthday hints

---

### Appendix A — Sample copy library (for realistic artboards)

- Church names: *Grace Community Church*, *Mount Zion Assembly*, *New Hope Fellowship*
- Member names: *Amara Okonkwo*, *Daniel Tan*, *Maria Reyes*, *Josh Whitfield*
- Event titles: *Sunday Worship*, *Annual Harvest Thanksgiving*, *Mission Sunday*, *New Year Watchnight Service*
- Transaction notes: *"End-of-year first fruit"*, *"Monthly commitment — May"*, *"Anonymous cash gift after evening service"*
- Currencies: default `$` for mockups unless explicitly Nigerian context, then `₦`.
