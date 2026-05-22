# Member Pages — Analysis & Rethink

> Follow-up to [app-information-architecture.md](./app-information-architecture.md) and [components-for-data-display.md](./components-for-data-display.md). The admin surfaces have been refactored around the *Act / Find / Inspect / Decide* split; the member surfaces have not. They were built earlier, in a "personal devotional" style, and never absorbed the primitives (`StackedProgressBar`, `StatBand`, `Sparkline`, `ConsistencyDots`, `StateFilter`, `DataTableShell`) we now ship.
>
> This doc audits every member-side page, names the questions each one should answer, and proposes the smallest change set that turns the member context into what the user described: *a place where members can see the financial state of their church, the state of their own giving, what campaigns exist, how those campaigns are doing, and the state of their pledges.*

---

## 1. What "the member context" is for — the four questions

The admin IA was framed around *what decision does this enable?* The member context needs the same discipline. Members aren't operating the church; they're **participating** in it. The right framing:

| Surface | Verb | Question it answers |
|---|---|---|
| **Member Dashboard** | *Orient* | "What's happening at my church, and where do I stand right now?" |
| **Campaigns** (list + detail) | *Discover* | "What's the church raising money for? How are those drives doing? Where can I help?" |
| **My Pledges** (list + detail) | *Track* | "What did I commit to? What's left to pay? Is anything overdue?" |
| **My Giving** (transactions) | *Reflect* | "What does my giving look like over time — by type, by campaign, by consistency?" |
| **Profile** | *Manage* | Identity / contact / sign-out. Out of scope here. |

If a widget could equally live on the dashboard or on My Giving, one of them is wrong. The litmus tests:
- Tells me **the state of my church right now**? → Dashboard ("church pulse" panel).
- Tells me **something I should do soon** (pledge due, campaign closing)? → Dashboard ("attention" panel).
- Tells me **how my own giving has trended**? → My Giving (or its own Insights tab if it grows).
- Describes **one campaign**? → that campaign's detail page.
- Describes **one pledge**? → that pledge's detail page.

The current dashboard violates this in three ways: it shows only personal KPIs (no church state), it mixes orientation and discovery (campaigns + pledges crammed into one card), and it ends with a randomized Bible-adjacent affirmation that occupies prime real estate but answers no question.

---

## 2. What's wrong today — concrete audit

### 2.1 [MemberDashboardPage](../src/components/pages/member-dashboard/MemberDashboardPage.tsx)

**Structural bugs**

1. **Zero church-level context.** The dashboard answers "how much have *I* given this month/year/most-recently". It says nothing about the church the member belongs to — no this-month-received, no number of active campaigns, no top campaign's progress. This is the user's stated #1 goal for the member context and the current page misses it entirely. The greeting line *names* the church ("at {tenant.name}") but no number on the page is about the church.
2. **N+1 fan-out, capped at 3.** The page calls [`useMyCampaignProgress`](../src/lib/api/campaigns/self/hooks.ts) three times — once each for `activeCampaigns[0..2]`. Any 4th+ active campaign renders in `MemberCampaignsPledges` with `goal = 0` and no progress bar. Either pick one canonical "featured campaign" or batch via a list endpoint; the hand-rolled 3-hook fan-out is the worst of both worlds.
3. **`MemberCampaignsPledges` is a junk drawer.** It renders active campaign cards *and* orphan pledges (pledges whose campaign isn't in the active set) inside the same scroll column, with two different visual languages. The "campaign + my pledge" relationship gets buried because the card is also doing the work of a campaign-progress list.
4. **No outstanding-pledge surface.** The admin dashboard's [`OutstandingPledgesCard`](../src/components/pages/dashboard/OutstandingPledgesCard.tsx) is exactly the AR-shape view of "this is what's coming due." The member version of this — *my* outstanding commitments, sorted by what's due first — does not exist anywhere on the member side. The data is on every `Pledge` row (`paidAmount`, `remainingAmount`, plus campaign deadline) and we already compute lifecycle bands in [`admin-shared.ts`](../src/components/pages/admin-shared.ts) via `pledgeLifecycle`.
5. **`MemberThankYou` rotates four Bible-adjacent affirmations by `dayjs().date() % 4`** — occupies a full-width slab on Row 3 and answers no question. Either delete it or replace with a single church-wide "thank you" sourced from real data (e.g. "Your gifts this month helped fund {top campaign}" — derived, not random).

**Implementation smells**

6. **Hand-rolled progress bars.** `MemberCampaignsPledges` builds `<div class="h-1.5 ... bg-[linear-gradient(90deg,var(--ring),var(--primary))]">` in JSX. The `StackedProgressBar` primitive [exists](../src/components/primitives/StackedProgressBar.tsx) and is what the admin side now uses everywhere. The gradient policy from §4.2 of the data-display doc says solid `--chart-current` everywhere except the page's hero — this card violates it.
7. **Hand-rolled gift rows.** [`MemberRecentGiving`](../src/components/pages/member-dashboard/MemberRecentGiving.tsx) builds a `grid-cols-[70px_110px_1fr_auto]` 5-row strip. Admin's [`DashboardRecentGifts`](../src/components/pages/dashboard/DashboardRecentGifts.tsx) uses `DataTableShell` with rich cells (Avatar, campaign link, relative date). The member version is intentionally simpler — fine — but it omits the **campaign attribution** which is the one thing a member would ask *("which campaign did that ₱2,000 go to?"*) and which the admin row has.
8. **Greeting is static**. Admin uses time-aware "Good morning / afternoon / evening" via [`getGreeting()`](../src/components/pages/dashboard/AdminDashboardPage.tsx). Member just says "Hello, {firstName}". Small, but the asymmetry is gratuitous.
9. **KPI strip has no delta.** Admin's [`NowSnapshotStrip`](../src/components/pages/dashboard/NowSnapshotStrip.tsx) shows "vs last week" with up/down arrows. The member equivalents ("this month vs last month", "this year vs last year") would actually answer "am I on track relative to my own habit" — a useful, personal framing.

### 2.2 [MemberCampaignsPage](../src/components/pages/member-campaigns/MemberCampaignsPage.tsx)

1. **Card-grid only, no toolbar.** Admin's [`CampaignsListPage`](../src/components/pages/campaigns/CampaignsListPage.tsx) has search + status filter + state filter + aggregate stats in `DataTableShell`. Member version has none of those — no search, no filter, no sort. With >6 campaigns the page becomes scroll-only. There's no way to find a specific campaign by name.
2. **Per-card progress fan-out.** Every `CampaignCard` calls `useMyCampaignProgress(...)` on render. For a tenant with 30 active campaigns this is 30 queries. Admin solves this with [`useCampaignProgressMany`](../src/components/pages/dashboard/useCampaignProgressMany.ts) — same problem, batched solution. Member side should reuse or get a self-intent variant.
3. **No aggregate header.** Admin shows `raised/goal (in view)`, `active`, `completed`. Member sees zero numbers above the cards. Adding even one stat — "Your church is raising for {N} active campaigns · {₱X} raised toward {₱Y}" — converts the page from a passive gallery into an orienting view.
4. **Items inlined inside each card.** Each card renders up to all `progress.items` with their own micro progress bars (`item.title` + `raised/target`). This makes a card 200-300px tall and crowds out the next card. Items belong on the **campaign detail page**, which the member can already navigate to. Card view should be the "skim" surface; click-through gets the depth.
5. **CTA on every card.** "Make a pledge" / "Add another pledge" renders on every active card as a full-width primary button. Visual weight is too high — a card becomes "button with header." Either move the CTA to detail page only, or make it secondary on the card and primary on detail.
6. **Hand-rolled gradient bar.** Same `bg-linear-to-r from-ring to-primary` issue as the dashboard. Use `StackedProgressBar` + `--chart-current`. The chart-role tokens in §4 of the data-display doc were introduced precisely to kill these one-offs.
7. **Past campaigns get the same card shape.** Completed/cancelled campaigns render as full cards with progress bars, items, pledge CTA — but they're done. Past campaigns should collapse to a compact row (title · raised/goal · final %, no items, no CTA).
8. **No "your involvement" pivot.** A member can't see, in one glance, "campaigns I've pledged to" vs. "everything else." Today they have to read every card looking for the indigo "Your pledge: ₱X" badge.

### 2.3 [MemberCampaignDetailPage](../src/components/pages/member-campaigns/MemberCampaignDetailPage.tsx)

This is the **best member page today** — uses `EntityRestoreBanner`, `DeletedLabel`, narrows pledges to the campaign, surfaces pledged/paid/remaining as badges. Still has fixable misses:

1. **Hand-rolled progress bar** instead of `StackedProgressBar` (would surface `pledged` and `raised` as overlapping segments — current bar only renders raised).
2. **No `StatBand`** for the "Goal / Raised / Pledged / Your pledged / Your paid" row. Today these are split between an "info card" (goal/raised/pledged) and "Your pledges" header badges. One unified `StatBand` (admin uses this on [`CampaignOverviewTab`](../src/components/pages/campaigns/CampaignOverviewTab.tsx)) reads better.
3. **No deadline urgency badge.** Admin renders a colored badge on the `PageHeader` subtitle (`Past due · 3d ago` in red, `Due in 7d` in amber). Member version says "Deadline · April 12, 2026 (12 days left)" as plain muted text — accurate but doesn't communicate urgency.
4. **"Your pledges" mini-table has its own column shape.** It's `[date, status, pledged, paid]` — `MemberPledgesTable` is `[campaign, pledged, paid, status]`. Two adjacent surfaces showing the same entity in two different column orderings is a smell; they should share the column factory and just hide the redundant `campaign` column when scoped.
5. **No campaign timeline** for the member. Admin shows "When the money came in" as a bar chart. Members would benefit from a *light* version — e.g. a `Sparkline` of monthly raised — so they can see if a drive has momentum or is stalling. The data is on the existing transactions query (would need a member-visible aggregate, or compute client-side from `MyTransactions { campaignId }`).
6. **No "what each item is for".** When a campaign has line items, the member sees "Building repairs · ₱120k / ₱300k". They don't see *which item their pledge went to*. The pledge row has `campaignItemId` but the detail page doesn't surface it.

### 2.4 [MemberMyPledgesPage](../src/components/pages/member-pledges/MemberMyPledgesPage.tsx) + [MemberPledgesTable](../src/components/pages/member-pledges/MemberPledgesTable.tsx)

1. **The AR shape is half-built.** Columns are `[campaign, pledged, paid, status]`. The `Pledge` row already carries `remainingAmount` and we know the campaign's deadline → we can compute lifecycle (past-due / due-soon / on-track) with `pledgeLifecycle` from `admin-shared.ts`. Missing today:
   - A `paid (bar)` column rendering `StackedProgressBar size="sm"` over `total=pledged` with one segment `value=paid` — the AR primitive named in [components-for-data-display §3.6](./components-for-data-display.md#36-pledgearrow--composite-not-a-new-primitive).
   - A `remaining` column.
   - A `lifecycle` badge (the same one admin uses on `OutstandingPledgesCard`).
   - A `days left` cell (computed from the campaign's deadline).
2. **Header stats are weak.** Today: `pledges count · active count · total active ₱`. Better (and what the data supports): `pledged ₱ · paid ₱ · remaining ₱ · fulfillment %`. The Pledged/Paid/Remaining triad is what the admin pledges list shows; member side should match.
3. **No state filter (`active / all / cancelled`).** Member has a 4-option status select instead of the `StateFilter` segmented control. Inconsistent with every admin list. (Note: members never see *deleted* pledges, so the soft-delete "Deleted" mode doesn't apply — but the *active / fulfilled / cancelled* trichotomy could still use the same segmented primitive instead of a dropdown.)
4. **No sort.** Default ordering is whatever the API returns. Members likely want "most overdue first" or "biggest first" — both are sort directions, both should be available via column-header click (`DataTable` already supports it on the admin side).

### 2.5 [MemberPledgeDetailPage](../src/components/pages/member-pledges/MemberPledgeDetailPage.tsx)

1. **Hero strip is hand-rolled `flex-wrap gap-8`** instead of `StatBand` — the same primitive admin's pledge detail uses. Visual asymmetry across pledge detail vs every other detail page.
2. **No `StackedProgressBar`** showing `paid` overlaid on `pledged`. The member sees the numbers but not the picture.
3. **`text-green-600` hardcoded** for the "Paid" amount. Should be `--chart-positive` / `--success`. This is the only place in the member tree that hardcodes a Tailwind color token, and it does it twice (`MemberPledgeDetailPage` and indirectly via badges).
4. **Payments table has no running total or pace.** A simple right-aligned `running balance` column ("after this payment: ₱X remaining") would make installment progress tangible.
5. **No "next expected payment" hint.** If the campaign deadline is 30 days out and the member has ₱9k remaining, "₱300/day or ₱2,100/week pace to fulfill" tells them what to actually do. The admin Campaign Overview already computes the inverse for the whole campaign — copy the math.
6. **No status-aware messaging.** If the pledge is `FULFILLED`, the page still shows "Remaining: ₱0" instead of celebrating "Fully paid · {date}". If `CANCELLED`, no explanation of *why* and no "you can pledge again" CTA. The page treats all three statuses identically structurally.

### 2.6 [MemberTransactions](../src/components/pages/member-transactions/MemberTransactions.tsx)

This page is mostly fine; uses `DataTableShell`. Issues:

1. **`Reference #` column shows `note`, not `referenceNumber`.** Bug. The schema has both fields; this column is mis-mapped.
2. **No mix breakdown.** Member's natural question: "what fraction of my giving is tithe vs offering vs mission?" A small `MixBar` above the table (sourced from the filtered transactions) is one component (it exists, we just don't use it here).
3. **No sparkline trend.** A `Sparkline` of monthly totals for the current filter would answer "is my giving rising or falling" without leaving the page.
4. **No campaign filter.** Type filter only. Members may want to scope to one campaign.
5. **`memberQ` is fetched then immediately ignored** (`useMyProfile(tenantSlug)` with no destructure). Dead call — remove.

### 2.7 Cross-cutting gaps

1. **No "church pulse" surface.** Members have no way to see *the church's* state — total received this period, number of active campaigns, biggest active drive's progress. This is the user's stated #1 goal.
2. **No "Insights" / personal giving report.** Members give over years; they have a relationship to their giving. There's nowhere to see a year-over-year view of their own giving, consistency dots, type mix, or top campaigns. Today My Giving is a transaction log; a "this is what your giving looks like" report is missing.
3. **No "giving statement" / annual receipt export.** A tax/giving statement (PDF or CSV by year) is a near-universal church-finance need. Out of scope for v1 but worth naming.
4. **No notifications surface.** "You have 1 pledge past due" / "Building Fund closes in 5 days" — today the member has to navigate to find these. Even a small "attention" panel on the dashboard is enough to close the loop.

---

## 3. Per-surface proposal

### 3.1 Member Dashboard — "what's happening at my church, and where do I stand right now?"

Three bands, top to bottom. Each band answers one of the four member-context questions.

**Band 1 — `PageHeader` + church pulse strip.**
Header overline `Orient · {today}`, time-aware greeting, subtitle "Here's how things are at {church} and where you stand."
Below it, a 4-tile `NowSnapshotStrip` *for the church* (mirrors admin's pattern but member-visible numbers only):
- **Received this month** at the church (compact, with WoW delta if cheap).
- **Active campaigns** count + " {n} closing this month".
- **Members at your church** count (or "{n} new this month"), if the backend exposes it to self-intent.
- **Your giving this year** (member's own — anchors the personal frame on the right edge).

This band converts the dashboard from "personal-only" to "you + your church." If a number isn't safely member-visible (e.g. total received per church), gate it behind a tenant-side feature flag — most churches will want this transparent.

**Band 2 — two-column action grid.**
Left: **My outstanding pledges** (the member-side mirror of admin's `OutstandingPledgesCard`). Uses the same `StackedProgressBar size="xs"` + lifecycle badge composition. Renders top 5 by urgency (past-due first, then due-soon, then earliest-deadline). Empty state: "Nothing outstanding — you're caught up." This is the single most valuable widget on this page and doesn't exist today.

Right: **Campaigns near deadline** (member-side mirror of admin's `DeadlineWatchCard`). 5 campaigns with ≤30 days remaining, each with a `StackedProgressBar`, raised/goal, days-left badge. Click → campaign detail. Doubles as a "where can I help" surface.

**Band 3 — Recent giving.**
Replace `MemberRecentGiving` (5-row hand-rolled grid) with a `DataTableShell` of last 8 transactions, columns `[date, type, campaign, amount]`. Shares the column factory with `MemberTransactions`. "View all" link → My Giving.

**Delete:** `MemberThankYou` (random affirmation). If we want a "thank-you" beat, derive it from real data: "Your gifts this year totaled ₱X across N campaigns — thank you." One line in the header subtitle, not a whole row.

### 3.2 Campaigns list — "what's the church raising for?"

**Drop the card grid entirely.** Past two open questions confirmed the card layout breaks at scale (and looks bad even at small scale). Make the campaigns list a `DataTableShell` — same chrome as the admin campaigns list — so the member side and admin side share one mental model.

- **Toolbar:** search by title, status filter (`Active / Upcoming / Completed / All`), date range. No view toggle, no card mode.
- **Header stats:** `Active · ₱raised / ₱goal (across active) · upcoming count · past-30-days raised`. Tells the member, in one row, *how vital is church fundraising right now*. Aligned with OQ #1: church-level aggregate stats are fine to show; only per-member rows are private.
- **Columns** (mirror admin's `CampaignsListPage` shape):
  - `Campaign` — title + truncated description, with a small `Your pledge: ₱X` indigo chip below the title when the member has pledged. Keeps the personal hook without occupying a whole column.
  - `Progress` — `StackedProgressBar size="sm"` (pledged translucent + raised solid), with `raised / goal` and `%` underneath. Same renderer admin uses.
  - `Deadline` — date + colored "Xd left / Xd past" badge.
  - `Status` — `StatusBadge`.
- **Row click** → campaign detail (where the pledge CTA lives).
- **Pledge CTA moves to detail-only.** Removes the per-card primary button noise and matches OQ #4 — pledging is a deliberate act that should happen on the page that shows the items list anyway.
- **Past campaigns** — same table, just filtered by status. No need for a separate visual treatment; the status badge does the work.

Batch progress via a `useMyCampaignProgressMany` helper (the self-intent variant of the admin's [`useCampaignProgressMany`](../src/components/pages/dashboard/useCampaignProgressMany.ts)). Until that lands, the table can do paginated fan-out (one progress query per visible row, bounded by the page size — same approach admin uses for ≤25 visible).

### 3.3 Member campaign detail — "how is *this* drive doing, and what's my piece?"

Keep current structure (`EntityRestoreBanner`, header, then content cards), but:

- Replace the inline progress bar with `StackedProgressBar size="lg"` showing `pledged` (translucent) + `raised` (solid `--chart-current`).
- Replace the goal/raised/pledged trio with a `StatBand` — same primitive admin uses on `CampaignOverviewTab`.
- Add a `deadline urgency` badge to the header subtitle (red / amber / neutral via `daysUntil`).
- Items list: keep, but use the same row shape admin uses (`StackedProgressBar size="xs"` per item, no inline tooltip).
- **Add a "When the money came in" sparkline.** Tiny monthly bar chart of raised — derived from `useMyTransactions({ campaignId })` aggregated by month. ~80px tall card. Same insight as admin's full chart, fraction of the cost.
- **Your pledges sub-table** should reuse `MemberPledgesTable` column factory with `campaign` column omitted. Adds the AR-shape columns (paid bar, remaining, lifecycle) automatically once those land in §3.4.
- If a pledge points at a `campaignItem`, show the item title in the "Your pledges" row so the member sees what their commitment is funding.

### 3.4 My Pledges list — "track who owes what" (member version)

Add the AR-shape columns the admin pledge list already has:

- `pledged` (current).
- `paid (bar)` — `StackedProgressBar size="sm"` over `total=pledgedAmount`, one segment `value=paidAmount`. The cell shows `{paid} / {pledged}` below the bar plus `%` right-aligned. This is the [`PledgeARRow`](./components-for-data-display.md#36-pledgearrow--composite-not-a-new-primitive) column spec.
- `remaining` — right-aligned, muted when zero.
- `lifecycle` — pill from `pledgeLifecycle` (past-due / due-soon / on-track / fulfilled). Sortable.
- `days left` — small caption under lifecycle.

Header stats become: `pledges · pledged ₱ · paid ₱ · remaining ₱ · fulfillment %`. The page splits into **Active** (default landing) and **Past** (fulfilled + cancelled). Per OQ #3 the past pledges get their own surface — a top-of-page `SegmentedControl` `Active / Past / All`, or a sibling route — rather than being hidden behind a dropdown filter. Past pledges read differently (they're memorabilia, not AR) and the table should reflect that: the `lifecycle` column collapses to a final `Fulfilled / Cancelled` chip with the close date.

**Deadline-source fix (applies here and everywhere lifecycle is computed).** Per OQ #2, when a pledge has a `campaignItemId`, the **item's deadline takes precedence** over the campaign's deadline — items can have advance deadlines (a material that's needed before the campaign closes). The current admin code is wrong: [`pledgeLifecycle`](../src/components/pages/admin-shared.ts#L101) is fed `campaign.deadline` only across [`OutstandingPledgesCard`](../src/components/pages/dashboard/OutstandingPledgesCard.tsx#L45-L46), [`PledgesListPage`](../src/components/pages/pledges/PledgesListPage.tsx#L123-L124), and [`PledgeDetailPage`](../src/components/pages/pledges/PledgeDetailPage.tsx#L194-L195). The fix is one helper:

```ts
// admin-shared.ts
export const resolvePledgeDeadline = (
  pledge: { campaignItemId?: string | null },
  campaign: { deadline?: string | null } | undefined,
  campaignItemsById: Record<string, { deadline?: string | null }>,
): string | null => {
  const itemId = pledge.campaignItemId ?? null;
  const itemDeadline = itemId ? campaignItemsById[itemId]?.deadline ?? null : null;
  return itemDeadline ?? campaign?.deadline ?? null;
};
```

Every admin surface that calls `pledgeLifecycle(...)` needs to also load campaign items (or the items off the campaign-progress endpoint) and resolve the deadline through this helper. Same helper used on the member surfaces. This is a **prerequisite** for shipping the AR columns above — without it, the "due soon" / "past due" pills are wrong wherever item deadlines exist.

### 3.5 Pledge detail — "everything about *this* commitment"

- Replace the 6-cell flex-wrap with `StatBand` (`Pledged · Paid · Remaining · Status · Pledged on · Note`).
- Add `StackedProgressBar size="lg"` showing paid-over-pledged with `%`.
- Replace `text-green-600` with `--chart-positive` (or `text-success-foreground` token).
- Add a "Pace" microcopy line below the bar: *"To fulfill by {deadline}, give ~₱X/week"* — same math as admin's campaign-overview pace projection, scoped to the pledge. **Use the resolved deadline (item > campaign) from §3.4, not the raw campaign deadline.**
- Status-aware empty/celebration states:
  - `FULFILLED` → green banner "Fully paid on {date}. Thank you."
  - `CANCELLED` → muted banner "Pledge cancelled on {date}." with link to campaign for a new pledge.
- Payments table: add a right-aligned `Running remaining` column.

**Backend bug — fixed.** Pre-fix: the backend never auto-transitioned `pledge.status`. `paidAmount` / `remainingAmount` were computed at read time by aggregating `Transaction.pledgeId` sums, but `pledge.status` was only ever set via an explicit `UpdatePledgeRequestDto.status` value. A pledge whose transactions covered `pledgedAmount` stayed `ACTIVE` forever — every `paidAmount >= pledgedAmount && status === "ACTIVE"` row was a stale state the admin had to close manually.

Shipped fix (option 1): [`pledge.repository.ts`](../church-app-backend/src/modules/core/pledge/repository/pledge.repository.ts) now derives `status` at read time alongside `paidAmount` via a `deriveStatus(storedStatus, paidAmount, pledgedAmount)` helper:

- `storedStatus === "ACTIVE"` and `paidAmount >= pledgedAmount` → surface as `FULFILLED`.
- Anything else → surface the stored value.

This is the one-way upgrade rule. Explicit `CANCELLED` and admin-set `FULFILLED` (e.g. a forgiven $0-paid pledge) are preserved — only the natural `ACTIVE → FULFILLED` transition is automated. No migrations, no write hooks, no persisted state to drift.

The status filter on `findAll` also follows the derivation, otherwise `?status=ACTIVE` could return rows whose response says `FULFILLED`. The fix computes `autoFulfilledIds` (stored-ACTIVE rows that derive to FULFILLED in the current filter scope) once per request and folds the set into the SQL `where`:

- `?status=ACTIVE` → `status = "ACTIVE" AND id NOT IN (autoFulfilledIds)`.
- `?status=FULFILLED` → `status = "FULFILLED" OR id IN (autoFulfilledIds)`.
- `?status=CANCELLED` / no filter → unchanged.

`count` and `_sum.pledgedAmount` use the same predicate, so pagination and aggregate totals stay correct.

**Trade-off:** the inverse transition (a payment is deleted and `paidAmount` drops below `pledgedAmount` on a pledge whose stored status is still `ACTIVE`) now works automatically too — the row was always stored-ACTIVE, the derivation just stops upgrading it. A pledge that was *manually* set to `FULFILLED` and then loses a payment will keep its stored `FULFILLED` and admins must reopen it explicitly. That asymmetry is intentional: stored values are authoritative for human decisions, derivation only handles the natural completion case.

### 3.6 My Giving (transactions) — "reflect on what I've given"

Keep the table; add the missing surfaces above it:

- **Fix the `Reference #` column** — should render `referenceNumber`, not `note`.
- **Mix snapshot card** above the table: a `MixBar` of the filtered transactions by type, with chip legend (`Tithe ₱X · Offering ₱Y · …`). Re-renders with the filter.
- **12-month sparkline** beside the mix bar showing monthly totals (clip to the date filter, or always YTD — pick one; I'd default to last 12 months independent of filter so the trend stays stable).
- **Campaign filter** in the toolbar (`useMyCampaigns({ includeDeleted: true })` already loaded by sibling pages).
- Drop the unused `useMyProfile` call.

### 3.7 New: Insights — top-level member page

Per OQ #5, this is its own top-level surface (sibling of Dashboard / Campaigns / My Pledges / My Giving / Profile), not a sub-tab. Sidebar entry "Insights".

The personal mirror of the admin Reports page — *Decide* shape, but scoped to the member's own giving:

- **Year-over-year totals** — bar chart of the last 3–5 years' giving.
- **Last 12 months trend** — `Sparkline` (or area chart) of monthly totals, with the biggest month annotated.
- **`ConsistencyDots`** — "gave in N of last 6 months" + "gave in N of last 12 months." Same primitive admin uses on the Givers tab.
- **Type mix** — `MixBar` of lifetime giving broken down by transaction type, with chip legend (`Tithe · Offering · Mission · …`). Same primitive admin uses on per-giver rows.
- **Top campaigns I've given to** — ranked by lifetime amount, with `StackedProgressBar` of pledged-vs-paid where applicable. ~5 rows.
- **Lifetime band** — `StatBand` at the top: `Lifetime · Gifts · Avg gift · First gift · Last gift · Pledges open`.
- **Export "{Year} giving statement"** — PDF/CSV download. Common church-finance need; deferred for v1 but the page is the right home for it.

Backend implication: a `/me/transactions/summary` endpoint (mentioned in §4) becomes load-bearing here. Without it, every Insights widget has to fetch transactions with `limit: 1000+` and compute client-side — works for small giving histories, falls over for long-time members.

---

## 4. What needs to be built vs. reused

Everything proposed above maps to existing primitives. The new work is composition, not primitives.

| Need | Existing primitive |
|---|---|
| 4-tile dashboard strip | `StatCard` grid (mirror `NowSnapshotStrip`) |
| Outstanding-pledge rows with AR shape | `Card` + `Pressable` + `StackedProgressBar` + `Badge` (mirror `OutstandingPledgesCard`) |
| Deadline-watch rows | mirror `DeadlineWatchCard` 1:1 |
| Recent-giving table | `DataTableShell` + shared column factory |
| Campaign card with progress | `Card` + `StackedProgressBar` |
| Campaign list table view | `DataTableShell` |
| Pledge AR columns | `StackedProgressBar size="sm"` cell renderer (see [data-display §3.6](./components-for-data-display.md#36-pledgearrow--composite-not-a-new-primitive)) |
| Detail-page stat band | `StatBand` |
| Mix snapshot | `MixBar` |
| Trend trail | `Sparkline` |
| Consistency view | `ConsistencyDots` |
| Status segmented control | `SegmentedControl` (`StateFilter` for the 3-state archive case isn't relevant on member side) |

**New backend asks (minimal, batchable):**
1. Self-intent **church pulse summary** — `/me/church/summary` returning `{ receivedThisMonth, activeCampaignCount, memberCount, newMembersThisMonth }`. Tenants gate which fields are member-visible.
2. Self-intent **batch campaign progress** — same `/me/campaigns/progress` shape but accepting an `ids[]` filter (or a list endpoint that includes progress inline). Without this, the campaigns list keeps doing N hooks.
3. Optional: self-intent **transactions summary** — `/me/transactions/summary` mirroring `useTransactionSummary` so the My Giving mix/sparkline don't have to be computed client-side from a `limit: 1000` fetch.

Everything else is pure frontend on the existing API surface.

---

## 5. Migration order

Two **prerequisites** land first — they're admin-side fixes that also unblock every member AR surface. After that, member-side work in leverage order:

**Prereq A — Resolve pledge deadline correctly (admin + member).** ✅ Shipped.
`resolvePledgeDeadline(pledge, campaign, itemDeadlinesById)` in [`admin-shared.ts`](../src/components/pages/admin-shared.ts) (item deadline wins, falls back to campaign deadline). Item deadlines are loaded via the new `useCampaignsManyWithItems(tenantId, campaignIds)` fan-out (mirror of `useCampaignProgressMany`), which fetches `CampaignWithItemsResponseDto` per id and builds an `itemDeadlinesById` map. Wired into every admin surface that computes lifecycle: `PledgeDetailPage` (uses `useCampaign` natively for items), `OutstandingPledgesCard` (admin dashboard supplies the map), `PledgesListPage`, `MemberPledgesTab` (admin member-detail), `PledgeDynamicsTab` (admin reports). Member surfaces re-use the same helper.

**Prereq B — Backend: pledge status reflects actual paid amount.** ✅ Shipped. See §3.5 for the read-time derivation + filter translation that landed in [`pledge.repository.ts`](../church-app-backend/src/modules/core/pledge/repository/pledge.repository.ts).

Then, member-side work:

1. **Dashboard: "My outstanding pledges" card** — ✅ shipped as [`MemberOutstandingPledgesCard`](../src/components/pages/member-dashboard/MemberOutstandingPledgesCard.tsx) (member-side mirror of admin's `OutstandingPledgesCard`).
2. **My Pledges list: AR columns + Active/Past/All** — ✅ shipped in [`MemberPledgesTable`](../src/components/pages/member-pledges/MemberPledgesTable.tsx) + [`MemberMyPledgesPage`](../src/components/pages/member-pledges/MemberMyPledgesPage.tsx). Paid (bar), remaining, lifecycle pill with days-left caption, header stats updated to pledged/paid/remaining/fulfillment%.
3. **Pledge detail polish** — ✅ shipped in [`MemberPledgeDetailPage`](../src/components/pages/member-pledges/MemberPledgeDetailPage.tsx). StatBand + StackedProgressBar (using `--chart-positive`) + per-week/day pace projection (uses resolved deadline) + status-aware banners (FULFILLED celebration, CANCELLED muted) + running-remaining column on payments table. Replaced bottom-flex hero, killed `text-green-600`. Now uses `useMyCampaign(...)` so item deadlines come along natively.
4. **Campaigns list rework** — ✅ shipped in [`MemberCampaignsPage`](../src/components/pages/member-campaigns/MemberCampaignsPage.tsx). Card grid replaced with `DataTableShell` table (search + status filter + aggregate stats). Pledge CTA moved to detail page. Per-card fan-out replaced with `useMyCampaignProgressMany` scoped to the visible page.
5. **My Giving fixes** — ✅ shipped in [`MemberTransactions`](../src/components/pages/member-transactions/MemberTransactions.tsx). `Reference #` column now reads `referenceNumber`, not `note`. Added MixBar (filtered transactions by type) + 12-month Sparkline (trailing window, stable under filter). Added campaign filter. Dropped unused `useMyProfile`.
6. **Dashboard: church pulse strip** — ✅ shipped. Backend endpoint `GET /tenants/{tenantId}/me/church/summary` returns aggregate-only church stats ([`tenant.self.controller.ts`](../church-app-backend/src/modules/features/tenant-feature/controllers/self/tenant.self.controller.ts) + `getMyChurchSummary` in [`tenant-feature.service.ts`](../church-app-backend/src/modules/features/tenant-feature/services/tenant-feature.service.ts)). Frontend hook `useMyChurchSummary` + 4-tile `MemberChurchPulseStrip` (received this month with MoM delta, active campaigns, member count, your-year total).
7. **Dashboard rework** — ✅ shipped in [`MemberDashboardPage`](../src/components/pages/member-dashboard/MemberDashboardPage.tsx). `MemberThankYou` gone; replaced with two-column action grid (`MemberOutstandingPledgesCard` + `MemberDeadlinesWatchCard`) + `MemberRecentGiving` (now a `DataTableShell` with campaign attribution + relative dates).
8. **Member campaign detail polish** — ✅ shipped in [`MemberCampaignDetailPage`](../src/components/pages/member-campaigns/MemberCampaignDetailPage.tsx). `StatBand` + `StackedProgressBar` (pledged translucent over raised solid) + deadline-urgency badge (red/amber/neutral) in header subtitle + Sparkline of the member's own monthly giving to this campaign (last 12 months) + items list now uses `StackedProgressBar` per item + pledge sub-table reuses `memberPledgeColumns` (campaign column filtered out, item titles surfaced).
9. **Insights (top-level page)** — ⏸ deferred. Largest scope; needs a `/me/transactions/summary` endpoint to avoid `limit: 2000+` client-side aggregation for long-time members. Lifetime band, YoY, consistency dots, type mix, top campaigns. Defer until next planning round.

Cleanup outstanding: three orphan files in [`member-dashboard/`](../src/components/pages/member-dashboard/) — `MemberThankYou.tsx`, `MemberKpiStrip.tsx`, `MemberCampaignsPledges.tsx` — no longer imported anywhere or re-exported from the barrel; safe to delete when convenient.

---

## 6. Open questions — resolved

1. **Church transparency** — *resolved.* Show overall church stats freely (totals, type breakdowns, campaign progress, event/campaign counts, member counts). Do **not** surface individual transactions or individual pledges from other members on any member-facing screen. The goal is for the member to feel informed about the church's finances and events without violating peer privacy. Concretely: aggregate stats good (`receivedThisMonth`, `byType`, `activeCampaigns`, `memberCount`, `topCampaigns`); per-row reads of other members' giving bad. The `/me/church/summary` endpoint in §4 returns only the aggregate shape.
2. **Pledge deadline source** — *resolved.* Item deadline takes precedence; campaign deadline is the fallback when the item has none. Items can carry an *advance* deadline (e.g. a material is needed before the campaign as a whole closes). **The admin code is currently wrong** and uses `campaign.deadline` only — see §3.4 for the helper fix that needs to land before any AR-style pledge surface (admin or member) is trusted.
3. **Past pledges visibility** — *resolved.* Past pledges get their own view. Default landing is **Active**, with a `SegmentedControl` `Active / Past / All` (Past = fulfilled + cancelled). Past rows shed the AR shape (paid bar, lifecycle pill) in favor of a `Fulfilled / Cancelled` chip + close date. **Related backend bug:** today nothing auto-transitions `pledge.status` to `FULFILLED` when `paidAmount >= pledgedAmount` — see §3.5 for the fix. The Past view will look empty for tenants with paid-but-unclosed pledges until that lands.
4. **Card CTA on campaigns list** — *resolved.* Drop the card view. The member campaigns list becomes a `DataTableShell` table identical in chrome to the admin campaigns list (different intent, same shape). Pledge CTA lives on the campaign detail page only. See §3.2.
5. **Insights placement** — *resolved.* Top-level page (sidebar entry), not a sub-tab of My Giving. See §3.7.

## 7. Cross-cutting fixes folded out of the audit

Two non-member-only items surfaced while writing this analysis and should be tracked separately, since they block trustworthy AR shapes everywhere (admin + member):

- **`resolvePledgeDeadline(pledge, campaign, itemDeadlinesById)` helper** in [`admin-shared.ts`](../src/components/pages/admin-shared.ts) — ✅ shipped. Backed by `useCampaignsManyWithItems` fan-out. Covers all five admin surfaces that compute pledge lifecycle.
- **Backend `pledge.status` derivation** in [`pledge.repository.ts`](../church-app-backend/src/modules/core/pledge/repository/pledge.repository.ts) — ✅ shipped (read-time derivation + status-filter translation). See §3.5.

These two land *before* the member surfaces are shipped, since the member version will show "Past due" or "Active" pills that are wrong without them.
