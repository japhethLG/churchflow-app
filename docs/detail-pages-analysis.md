# Admin Detail Pages — Analysis & Rethink

> Follow-up to [app-information-architecture.md](./app-information-architecture.md). The list pages have been redesigned around *Find* and *Decide* surfaces; this doc audits the *Inspect* surface — the per-entity detail pages — and proposes what each one should actually answer.
>
> Detail pages were built incrementally and show it. Layouts are inconsistent (inline-styled hero on Campaign, flex-wrap card on Pledge, two-card grid on Transaction), the back-navigation pattern differs across all four pages, and the headline data is buried under structural metadata.

---

## 1. The back button — pick one pattern

Today every detail page handles "go back" differently:

| Page | Where the back affordance lives | What it looks like |
|---|---|---|
| Member | `PageHeader.action` (right side, next to Edit/Remove) | a `<Button variant="secondary">Back</Button>` competing with destructive actions |
| Campaign | same as Member | same |
| Transaction | same as Member | same |
| Pledge | `<Link>` above the `PageHeader` | `← Pledges` — small caps, muted, breadcrumb-style |

**Pledge's pattern wins.** "Back" is parent-pointer info, not an action; rendering it inside the actions slot makes it compete with `Delete` (which is the actual hazardous click) and pushes the primary action away from the right edge where the cursor expects it. The breadcrumb form gives "back" a stable home (top-left, muted) and reinforces hierarchy — the page label is `Members`, the title is the member's name. Cursor pattern matches reading order.

**Proposed primitive (cleanest):** add a `back` prop to [`PageHeader`](../src/components/primitives/PageHeader.tsx):

```tsx
<PageHeader
  back={{ href: `/${tenantSlug}/admin/members`, label: "Members" }}
  title={fullName}
  subtitle="..."
  action={<>{/* only real actions — no Back button */}</>}
/>
```

`PageHeader` renders the link above the title in the same small-caps muted style as `overline`. Replaces the `overline` prop for detail pages (an overline like "Directory / Members" is just a non-functional breadcrumb; the back link does the job better). For list pages and dashboards, `overline` stays.

This removes one button from every detail page's action slot, normalizes the visual, and the `← Members` text is shorter and clearer than a square "Back" button.

---

## 2. The action-slot overload

Once Back leaves the action slot, what remains is still too crowded on two pages.

**Member detail today:** Back · Send sign-in invite · Merge · Edit · Remove — five buttons. The two yellow/red buttons (Merge, Remove) shout at the user every time they look at the page. Most of those actions are rare.

**Pattern:** one primary action visible, everything else in a kebab/overflow menu.

| Page | Primary (visible) | Overflow (kebab) |
|---|---|---|
| Member | **Edit** | Send sign-in invite · Merge · Remove |
| Campaign | **Edit** | Cancel campaign · Delete |
| Pledge | **Record payment** (new — see §4) | Edit · Delete |
| Transaction | **Edit** (when we add it) — or just keep Delete in kebab | Delete |

We already have [`RowActionsMenu`](../src/components/primitives/RowActionsMenu.tsx) — a `PageActionsMenu` would be the same primitive with a different trigger size. Avoid building a separate `Dropdown` from scratch.

**On the deleted-row banner.** When `EntityRestoreBanner` is showing, the primary action becomes `Restore` (the kebab disappears since destructive actions don't apply to a tombstone). That's already how it works for the row variant; just keep it consistent.

---

## 3. Member detail — the worst offender

Today's layout: `MemberInfoCard` (huge — name/avatar/role/status/email/phone/address), then a 2-column grid below with `MemberRecentGiving` and `MemberPledges`.

**What's wrong:**
1. The **hero card answers the wrong question.** Email/phone/address are admin metadata; they belong below the fold. The first thing you want to know about a member is *what's their giving relationship* — how much, how often, when did they start, are they still active. Today that data is loaded by `MemberRecentGiving` and `MemberPledges` but never summarized. The IA doc already flagged this exact gap.
2. **`MemberPledges` is the old pledge shape** — only `pledged amount` and `status`. No paid/remaining/% fulfillment. Same AR-shape problem the Pledges list had pre-rework.
3. **`MemberRecentGiving` is a flat 10-row table** — no 12-month sparkline, no type breakdown, no "this member's mix." We have all of these primitives now (`Sparkline`, `MixBar`, `StackedProgressBar`).
4. **No "when" answers.** First gift date, last gift date, longest gap, gift cadence (monthly tither vs. sporadic) — these tell the pastor whether to follow up.

**Proposed structure** (top to bottom):

- **Identity strip** — avatar, name, role/status badges, contact (email + phone inline, small). Replaces the current hero card. ~80px tall.
- **Giving relationship band** (`StatBand`) — 6 stats:
  - Lifetime total · gifts · avg gift · first gift · last gift · pledges open
- **Last 12 months** — `Sparkline` (monthly bars or area) + small caption "gave in 9 of 12 months · biggest month ₱42k in Dec '25." Tells consistency *and* magnitude.
- **Their mix** (`MixBar`, full width) — broken down by type (Tithe / Offering / …) with chips below showing the top 4 with amounts. Same pattern we built for the Givers tab.
- **Pledges (AR-shape)** — same column shape as the Pledges list: pledged · paid · remaining · lifecycle. With the new column shape this is a useful "what does this member still owe across all campaigns?" view.
- **Recent gifts** — last 8 rows, clickable to transaction detail. Same shape as `DashboardRecentGifts` (rich rows with type badge, campaign link, relative date).
- **Address** — single line, low in the page since it's reference data, not insight.

This converts the page from "member's profile card + two tables" into "what does this person's giving look like, can I act on it" — which is the only reason an admin clicks into a member.

---

## 4. Campaign detail — visually loud, operationally vague

Today: `CampaignHero` (gradient banner with title/status/deadline/description) → `CampaignProgressCard` (3 StatCards + custom track bar) → `CampaignItemsList` (items with inline-styled progress bars) → `CampaignPledgesList` (table).

**What's wrong:**
1. **Hero uses inline `style={{...}}` and hardcoded gradient.** Doesn't compose with our tokens, doesn't react to theme, doesn't match the rest of the app. Visual quality fine in isolation, but it's the only page with a banner like this — the rest use `PageHeader`.
2. **`CampaignProgressCard` reimplements `StackedProgressBar`** — we built that primitive specifically for goal/pledged/raised mixes. Same with `CampaignItemsList` per-item bars.
3. **"Progress" answers `how much?` but not `pace?`.** The actionable question for an active campaign is: *given how much time is left and how much is in, are we on pace?* We should compute and show a daily-pace projection — "to hit goal you need ₱4.2k/day for the next 12 days. Last 7 days averaged ₱1.8k/day." That's the difference between a static progress bar and a steering wheel.
4. **No "who's contributing" view.** For a campaign that matters (Building Fund, Mission Trip), the admin's recurring question is "who has pledged or paid the most to this?" Today they'd need to filter the global pledges list themselves.
5. **Pledges list within campaign uses the old shape** — no paid/remaining columns. Same fix as everywhere else.
6. **Items list has the same** — shows pledged/raised but not how each item is doing relative to its target as a `% fulfillment + lifecycle pill`.
7. **No timeline.** When did money come in? Was there a launch spike and now a long tail? A simple weekly-bar mini-chart over the campaign's lifetime answers this in one glance.

**Proposed structure:**

- **`PageHeader`** with back link to `Campaigns`, title, subtitle = deadline + status pill, primary action Edit, overflow kebab Cancel/Delete. **Kill the inline-styled hero.** Deadline urgency goes into a `Badge` next to the title — `Past due · 3d ago` in red, `Due soon · 7d left` in amber.
- **Description** — short paragraph below the header, only if present. No card needed; just typography.
- **Progress band** — repurpose `StackedProgressBar` size="xl" with goal/pledged/raised segments. Above the bar: 4 stats — Goal · Raised · Pledged · Outstanding. Below: pace projection (one line) — *"At current pace you'll hit ₱X by deadline · need ₱Y/day to close the gap."*
- **Timeline** — `Sparkline` or thin bar chart, daily/weekly buckets from campaign start → today. Shows pacing visually. Optional: overlay a "linear-to-goal" reference line so you can read pace at a glance.
- **Top contributors** — top 5 pledgers ranked by paid amount (or pledged, with toggle), member name → clickable link, paid/pledged inline. Same "who do I thank" view from the Reports Givers tab, scoped to this campaign. **The biggest missing operational view.**
- **Items list** — keep, but switch to `StackedProgressBar` + add a small lifecycle pill per item (`Past due`, `Due soon`, `Funded`).
- **Pledges list** — keep, but adopt the new column shape (paid/remaining/lifecycle) so it matches the global pledges list and the member-detail pledges section.

The user said *"members and campaign needs a rethink, it's design and how the details is presented is lacking."* This is the rethink: replace decoration with steering data.

---

## 5. Pledge detail — already close, three additions

Today's pledge detail is the best of the four — back link is right, stats row is clear, transactions table is useful. The user agreed: *"pledge can be improved."* Three concrete additions:

1. **Lifecycle badge in the header.** Right now the status is `Active` / `Cancelled` / `Fulfilled`. The new lifecycle vocabulary (Past due · Due soon · On track · Fulfilled · No deadline) tells the admin *whether to act* — `Active` doesn't. Stick the lifecycle pill next to the subtitle.
2. **Progress bar in the stats card.** Four numbers (Pledged · Paid · Remaining · Status) is right but doesn't visually answer "how close are we to done?". Add a `StackedProgressBar` size="md" under the numbers with paid/total segments, plus the `% fulfillment` next to it. Same shape as the new Pledges list cell.
3. **"Record payment" primary action.** When you land on a pledge with outstanding amount, the operational golden path is "log a payment toward this pledge." Today you have to leave the page and go to Record Gift, then re-select the member and campaign. Primary action: **Record payment** → opens `record-gift` modal pre-filled with this pledge's member, campaign, and pledge link. Disabled when status is `FULFILLED` / `CANCELLED` / deleted.

The stats row should also switch from the inline flex-wrap div to the new `StatBand` primitive so it's visually consistent with the proposed Member identity strip.

Days-to-deadline next to the status pill (`On track · 12d left`) would tighten the "is this urgent?" read without adding a row.

---

## 6. Transaction detail — small refinements

User said: *"transaction detail page is already ok but check if you can still improve it."* It is. Three small things:

1. **Adopt the unified back link** — drop the `Back` button from the action slot, render `← Transactions` above the header.
2. **DetailRow / Label helpers can collapse into a primitive.** Today they're defined locally; if we end up using the "label + value rows" pattern on multiple detail pages, promote to `<KeyValue label="…" value={…} />` and use it consistently. Not urgent — only do this if the Member/Campaign rethinks pull this pattern in.
3. **Add a context strip below the title.** When you arrive at a transaction from a list, the first question is "is this normal?" One line — *"Gift #14 from Juan · ₱45,000 lifetime over 18 months"* — gives orientation without scrolling. Cheap to compute (we have a member-scoped transactions query).

The Attribution card is well-structured; the only nit is that on a narrow viewport it stacks below Details and looks empty. A small media query that switches to single-column ≤ 1024px would clean it up. Tailwind grid + a `lg:` breakpoint, not a real refactor.

---

## 7. Cross-cutting: primitives we'll touch

This rethink converges five things we already have or built recently into the detail pages:

| Primitive | Where it lands |
|---|---|
| `StackedProgressBar` | Campaign progress, Campaign items, Pledge stats row, Member pledges |
| `MixBar` | Member detail (their giving mix), Campaign detail (top contributors mix — optional) |
| `Sparkline` | Member detail (12mo), Campaign detail (timeline) |
| `StatBand` | Member identity stats, Pledge stats row |
| `PageHeader.back` (**new prop**) | All four detail pages |
| `PageActionsMenu` (**new — same as `RowActionsMenu` with a bigger trigger**) | Member overflow, Campaign overflow, Pledge overflow |

The two **new** items are small: a prop on an existing primitive, and a re-use of an existing primitive with a different trigger. No new dependencies.

---

## 8. Migration order if we commit

Same approach as last time — preview route first, then swap. Suggested sequence (each step ships independently):

1. **`PageHeader.back` prop + `PageActionsMenu`** — pure primitive work. Touched by every detail page.
2. **Pledge detail polish** — quickest win: lifecycle pill, progress bar, Record-payment CTA, `StatBand` swap. Reinforces the column shape.
3. **Member detail rethink** — biggest UX delta. Identity strip + Giving relationship band + 12mo sparkline + Mix + new-shape pledges + recent gifts.
4. **Campaign detail rethink** — drop the inline hero, switch to `PageHeader` + urgency badge + new progress band + pace line + timeline + top contributors + new-shape items + new-shape pledges.
5. **Transaction detail polish** — back link migration, context strip, responsive 2-col grid.

Steps 1–2 are pure cleanup + a feature CTA. Steps 3–4 are real layout work but no schema changes — every datum (paid, remaining, lifecycle, mix, sparkline buckets) is already derivable from data we already fetch.

---

## 9. Decisions (locked in)

1. **Overline goes away on detail pages.** `PageHeader.back` replaces it. Lists and dashboards keep `overline`.
2. **Member-detail mix has a type / campaign toggle**, and **Member detail goes tabbed** (same pattern as Reports). Per-member pledges and transactions are full list-shape, not summaries — they get their own tabs so the Overview tab stays scannable:
   - **Overview** — identity strip · giving-relationship `StatBand` · 12mo `Sparkline` · `MixBar` (type/campaign toggle) · recent gifts (8 rows)
   - **Pledges** — same shape as the global pledges list, pre-filtered to this member
   - **Transactions** — same shape as the global transactions list, pre-filtered to this member
3. **Campaign timeline buckets auto-pick by duration:** ≤30d → daily, 31–365d → weekly, >365d → monthly. Caps chart density at ~50 bars regardless of campaign length, preserves launch-day signal on short campaigns, stays readable on long ones.
4. **Record-gift / Record-pledge CTAs land on Member detail too.** Primary action on Member detail = a small split: **Record gift** (most common) with a secondary **Record pledge** next to it. Both open the existing modals pre-filled with this member. On Pledge detail, the primary stays **Record payment** (record-gift modal pre-filled with member + campaign + pledge).
5. **Member contact info stays grouped in one card.** No splitting — phone/email/address live together in a "Contact" card at the bottom of the Overview tab (below the giving sections), not in the identity strip.

### Apply tabs to Campaign detail too

While we're tabbing Member detail, the same fix applies to Campaign — it already has four distinct sections (progress, items, pledges, contributors) that compete for vertical space:

- **Overview** — progress band + pace line + timeline + top contributors
- **Items** — line items list (new-shape)
- **Pledges** — pledges list (new-shape)

Pledge detail and Transaction detail stay flat — they're single-concern pages.

---

Migration order updated: step 1 still primitives (`PageHeader.back` + `PageActionsMenu`), step 2 Pledge polish, then Member rethink (now with tabs), then Campaign rethink (now with tabs), then Transaction polish. I'll start on step 1.
