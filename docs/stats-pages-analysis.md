# Admin Stats Pages — Deep Analysis

**Scope:** Dashboard, Transactions, Reports, Member Detail (admin perspective).
**Date:** 2026-05-22
**Goal:** Identify (1) inefficient calculations/queries, (2) work done on the FE that belongs on the BE, and (3) cases where the *displayed metric* doesn't match the *actual computation*.

---

## TL;DR

Across the four pages, the same five anti-patterns repeat:

1. **Silent pagination truncation of aggregates.** Cards titled "Total" / "Lifetime" / "Top givers" are computed by summing/grouping a `limit: 500` (or `200`) list. When real data exceeds that limit, totals are wrong with no UI indicator.
2. **Filter-state mismatch between summary card and list.** Summary endpoints accept fewer filters than list endpoints, so the KPI card and the table below it diverge whenever the admin filters by type/campaign/state.
3. **N HTTP fan-out for relationship data.** Pledge lifecycle needs campaign-item deadlines → FE fans out one `GET /campaigns/{id}` per unique campaign (`useCampaignsManyWithItems`). Same shape used in Pledge Dynamics, Outstanding Pledges, Member Pledges.
4. **Client-side aggregation that should be SQL.** Top givers, monthly trends, by-type/by-campaign breakdowns, lifetime totals — many of these `reduce` over fetched rows when `GROUP BY` would be one query.
5. **FE-side lookup maps (members/campaigns) prefetched at `limit: 500`.** Every list page front-loads a 500-row member list just to render `memberId → name` in row cells. Breaks at 500+ members, and is wasted bandwidth on smaller tenants.

The Trend tab of Reports is the only place doing it right — it uses `useTransactionSummary` and trusts the backend. Every other "stats" surface re-rolls aggregation in JS.

---

## 1. Admin Dashboard
**Files:** [src/components/pages/dashboard/](../src/components/pages/dashboard/)

### What it displays
- **NowSnapshotStrip** — week-over-prior-week giving (uses `/transactions/summary` ✅), member count, active campaigns, deadline-watch count.
- **UnattributedCallout** — this-week anonymous + no-campaign gift counts and totals.
- **OutstandingPledgesCard** — top 8 urgent pledges by lifecycle.
- **DeadlineWatchCard** — top 5 campaigns near deadline, with progress bars.
- **DashboardRecentGifts** — last 6 transactions with member/campaign links.

### Findings

#### 🔴 D1 — UnattributedCallout sums a paginated list
[AdminDashboardPage.tsx:125-142](../src/components/pages/dashboard/AdminDashboardPage.tsx#L125)
Fetches up to 500 transactions for the week, then counts/sums those where `memberId == null` or `campaignId == null` in JS. If the church exceeds 500 transactions/week, the "X anonymous gifts this week" number is silently incomplete.

**Fix:** Add `GET /transactions/unattributed?dateFrom=&dateTo=` returning `{ anonymousCount, anonymousTotal, noCampaignCount, noCampaignTotal }` as a single SQL aggregate.

#### 🔴 D2 — Unbounded campaign list + N fan-out progress queries
[AdminDashboardPage.tsx:66](../src/components/pages/dashboard/AdminDashboardPage.tsx#L66), [useCampaignProgressMany.ts](../src/components/pages/dashboard/useCampaignProgressMany.ts)
`useCampaigns(tenantSlug)` runs with no `limit`, then for each active campaign with a deadline a separate `GET /campaigns/{id}/progress` request fires (which itself runs 4 separate Prisma aggregations). 20 active deadline-bearing campaigns = 20 parallel HTTP calls × 4 aggregations = 80 DB queries per dashboard load.

**Fix:**
- Add a bulk progress endpoint: `POST /campaigns/progress/batch { campaignIds: [...] }`.
- Or expose `?includeProgress=true` on the campaign list endpoint.

#### 🔴 D3 — OutstandingPledgesCard fetches 200, shows 8
[AdminDashboardPage.tsx:67-70](../src/components/pages/dashboard/AdminDashboardPage.tsx#L67), [OutstandingPledgesCard.tsx:45-85](../src/components/pages/dashboard/OutstandingPledgesCard.tsx#L45)
Fetches 200 active pledges, then in JS: resolves deadlines (requires the fan-out from D4), computes lifecycle, sorts by urgency, slices top 8. If a tenant has >200 active pledges, the "top 8 urgent" can miss the actually-most-urgent ones beyond position 200 in the unsorted fetch.

**Fix:** `GET /pledges/urgent?limit=50` — BE filters by lifecycle, computes `daysUntil`, sorts by urgency.

#### 🟠 D4 — `useCampaignsManyWithItems` fan-out
[useCampaignsManyWithItems.ts](../src/components/pages/dashboard/useCampaignsManyWithItems.ts)
To compute pledge lifecycle correctly (item deadline overrides campaign deadline), the FE has to call `GET /campaigns/{id}` for each unique campaign in the pledge list — just to read `campaign.items[].deadline`. This is the same N+1 that hits Pledge Dynamics (R2) and Member Pledges (M4).

**Fix:** Embed `campaignDeadline` and `itemDeadline` in the pledge response DTO (resolved at query time). Eliminates the hook entirely.

#### 🟠 D5 — "New members this week" filters 200-member list in memory
[AdminDashboardPage.tsx:160-165](../src/components/pages/dashboard/AdminDashboardPage.tsx#L160)
`members.filter(m => dayjs(m.createdAt).isAfter(startOfWeek)).length` — fetches 200, runs date filter in JS. Wrong if tenant has >200 members; wasteful otherwise.

**Fix:** `GET /members/count?createdAfter=` or include `newThisWeek` in a member-stats endpoint.

#### 🟡 D6 — `deadlineSoonCount` filters full campaign list in JS
[AdminDashboardPage.tsx:148-158](../src/components/pages/dashboard/AdminDashboardPage.tsx#L148) — should be a BE `COUNT(WHERE deadline BETWEEN now AND now+14d)`.

#### 🟡 D7 — Members lookup map depends on `limit: 200`
[DashboardRecentGifts.tsx:77-89](../src/components/pages/dashboard/DashboardRecentGifts.tsx#L77) — falls back to "Unknown" if member isn't in the 200. Better: embed `memberName`/`memberDeletedAt` in transaction DTO.

---

## 2. Admin Transactions
**Files:** [src/components/pages/transactions/](../src/components/pages/transactions/)

### What it displays
- **TransactionsListPage** — filter bar (date range, type, campaign, state) + summary KPI card + paginated table.
- **TransactionsSummaryCard** — total, count, average, by-type donut.
- **TransactionDetailPage** — single-transaction view with member, campaign, pledge cards and "lifetime giving" context for the member.

### Findings

#### 🔴 T1 — Summary card ignores type/campaign/state filters
[TransactionsListPage.tsx:83-86](../src/components/pages/transactions/TransactionsListPage.tsx#L83)
`useTransactionSummary` only forwards `dateFrom`/`dateTo`. The card is titled "In this filter" — but when the admin picks "Offerings, Campaign A, March," the card still totals **all types, all campaigns, all states** in March. The card and the table below it show different scopes.

**Fix:** Extend `TransactionSummaryQueryRequestDto` to accept `type`, `campaignId`, `includeDeleted`, `onlyDeleted`. Thread through to the repo `summary()` query. Frontend passes the same filter object to both `useTransactions` and `useTransactionSummary`.

#### 🔴 T2 — Card/table scope confusion
[TransactionsSummaryCard.tsx:59-77](../src/components/pages/transactions/TransactionsSummaryCard.tsx#L59), [TransactionsListPage.tsx:169-172](../src/components/pages/transactions/TransactionsListPage.tsx#L169)
Card shows period totals (full filter), table footer shows "page sum" (sum of current page only). Without distinct labels, admins on page 2+ misread "Total $50K" as the page total.

**Fix:** Rename card heading to "Period totals" and move "page sum" inside the table footer, with explicit "(this page)" label. Add a "Showing X of Y" tie.

#### 🔴 T3 — Detail page = 4 sequential lookups + a 5th unfiltered fetch
[TransactionDetailPage.tsx:54-85](../src/components/pages/transactions/TransactionDetailPage.tsx#L54)
```
GET /transactions/{id}
GET /members/{memberId}
GET /campaigns/{campaignId}
GET /pledges/{pledgeId}
GET /transactions?memberId={memberId}&limit=500   ← for "lifetime" context
```
The transaction response already carries `memberId/campaignId/pledgeId`, but the FE re-fetches each. Detail-page TTI scales linearly with RTT.

**Fix:** `GET /transactions/{id}/detail` returning `{ transaction, member, campaign, campaignItem, pledge, memberLifetimeStats }` in one call. The lifetime stats should come from `/transactions/summary?memberId=...` (already exists, no truncation), not from a `limit: 500` list.

#### 🔴 T4 — "Lifetime giving" on detail page silently truncates at 500
[TransactionDetailPage.tsx:81-85, 138-162](../src/components/pages/transactions/TransactionDetailPage.tsx#L81)
`useTransactions({ memberId, limit: 500 })` then JS `reduce` to compute lifetime sum and "gift #N". If member has 600+ transactions, you display "Gift #X of 500" — wrong both ways:
- `lifetime` sum is partial.
- `giftNumber` is computed from a truncated window.

**Fix:** Use the existing `/transactions/summary?memberId=...` (no date range) for lifetime totals. For "gift #N", expose `transaction.sequenceNumber` on the transaction DTO (computed server-side via window function or a maintained counter).

#### 🟠 T5 — Summary endpoint missing `includeDeleted`/`onlyDeleted`
[transaction-summary-query.request.ts](../../church-app-backend/src/modules/features/transaction-feature/dto/transaction-summary-query.request.ts)
List endpoint supports state filter via `StateFilterRequestDto`; summary doesn't. Toggling "Deleted" in the table doesn't move the card.

#### 🟠 T6 — Money math in JS Number
[admin-shared.ts:63-68](../src/components/pages/admin-shared.ts#L63)
Backend returns `Decimal` serialized as string; FE coerces via `num()` to IEEE 754, then divides/sums. Averages and large lifetime totals can drift by cents. For a giving ledger this is an audit-class concern.

**Fix:** Backend returns pre-computed averages alongside totals (`{ total, count, avg }`). Frontend never divides currency. For sums, use a Decimal lib or integer-cents on the wire.

#### 🟠 T7 — Upfront 500-member / all-campaigns fetch on list page
[TransactionsListPage.tsx:65-80](../src/components/pages/transactions/TransactionsListPage.tsx#L65)
Pulls 500 members + all campaigns on every page load just to render member name + campaign title cells in the table. At >500 members, falls back to "Unknown."

**Fix:** Embed `member: { id, firstName, lastName, deletedAt }` and `campaign: { id, title, deletedAt }` directly in the transaction list response (one JOIN on the BE).

#### 🟡 T8 — FE recomputes per-type averages
[TransactionsSummaryCard.tsx:59-77](../src/components/pages/transactions/TransactionsSummaryCard.tsx#L59) — re-divides total/count per segment. Backend should return `avg` per segment.

---

## 3. Admin Reports
**Files:** [src/components/pages/reports/](../src/components/pages/reports/)
This is the highest-leverage page because every card is by definition a stat.

### Tab 1 — Trend ✅ (the model)
[TrendTab.tsx](../src/components/pages/reports/TrendTab.tsx) uses `useTransactionSummary` (current + prior year) and renders the response. No FE aggregation. This is the shape the other tabs should converge to.

### Tab 2 — Givers
[GiversTab.tsx](../src/components/pages/reports/GiversTab.tsx)

#### 🔴 R1 — Top givers built from a `limit: 500` transactions fetch + 500-member map + all campaigns
[AdminReportsPage.tsx:131-150](../src/components/pages/reports/AdminReportsPage.tsx#L131), [GiversTab.tsx:50-92](../src/components/pages/reports/GiversTab.tsx#L50)
`buildGivers()` `reduce`s 500 transactions into a `Map<memberId, GiverRow>`, accumulating `byType`, `byCampaign`, and 6 monthly buckets per member. Then sorts and slices top 15. If the church does >500 transactions in the selected range, the #1 giver might literally not appear in the list.

**Fix:** New endpoint:
```
GET /reports/givers?dateFrom=&dateTo=&limit=50
→ items: [{
    memberId, memberName, memberDeletedAt,
    total, count, avg,
    byType: [{ type, amount, count, share }],
    byCampaign: [{ campaignId, campaignTitle, amount, share }],
    monthlyTotals: [{ month, amount }]   // window matches dateFrom/dateTo
  }]
```
Single SQL with `GROUP BY memberId` + joined name + per-axis subqueries. Replaces 3 list fetches + JS aggregation.

#### 🟠 R2 — Monthly mini-bars hardcoded to last 6 months, ignore the date picker
[GiversTab.tsx:54-87](../src/components/pages/reports/GiversTab.tsx#L54)
The page-level filter says "Last 12 months" but the sparkline always shows `dayjs().startOf("month").subtract(5, "month")`. Pick "Last week" → all six bars are empty. The intent of the sparkline (consistency over the selected window) is broken by the hardcoded window.

#### 🟠 R3 — Top-15 with no overflow indicator
[GiversTab.tsx:183](../src/components/pages/reports/GiversTab.tsx#L183) — `slice(0, 15)` with no "+N more" footer or "view all" link.

### Tab 3 — Pledge Dynamics
[PledgeDynamicsTab.tsx](../src/components/pages/reports/PledgeDynamicsTab.tsx)

#### 🔴 R4 — Fulfillment % computed from a `limit: 500` pledges fetch with NO date filter
[AdminReportsPage.tsx:141-154](../src/components/pages/reports/AdminReportsPage.tsx#L141), [PledgeDynamicsTab.tsx:126-132](../src/components/pages/reports/PledgeDynamicsTab.tsx#L126)
Two compounding issues:
1. The page's date-range picker is **ignored** for the pledges query — fulfillment % is always "all time" even when the rest of the page is filtered to "This month."
2. `limit: 500` truncates: if tenant has 600 pledges, fulfillment % is wrong.

**Intent question:** what does "fulfillment % for March" even mean? Pledges *created* in March? *Due in March*? *Receiving payments in March*? This needs to be defined before the endpoint can be built.

#### 🔴 R5 — Same N campaign-fan-out as Dashboard/Member Pledges
`useCampaignsManyWithItems(pledgeCampaignIds)` again — up to 500 individual `GET /campaigns/{id}` calls in the worst case.

#### 🟠 R6 — "Cancellation rate" metric is ambiguous
[PledgeDynamicsTab.tsx:185-188](../src/components/pages/reports/PledgeDynamicsTab.tsx#L185)
Denominator is `cancelled + fulfilled` (closed pledges), denominator defaults to `1` when no closed pledges exist (renders 0% in a way that looks like "no cancellations" but means "no data"). Also temporally unbounded — is it "this period" or "all time"?

**Fix:** New endpoint with explicit scope:
```
GET /reports/pledges?dateFrom=&dateTo=&dateBasis=created|deadline|paymentActivity
→ {
    fulfillment: { totalPledged, totalPaid, fulfillmentPct, totalRemaining,
                   activeCount, fulfilledCount, cancelledCount, cancellationRate },
    agingByLifecycle: { "on-track": {...}, "due-soon": {...}, "past-due": {...}, "no-deadline": {...} }
  }
```
BE resolves item/campaign deadlines and lifecycles in SQL. Frontend just renders.

---

## 4. Admin Member Detail
**Files:** [src/components/pages/members/MemberDetailPage.tsx](../src/components/pages/members/MemberDetailPage.tsx) + three tabs

### What it displays
- **Overview** — identity card, lifetime totals, recent gifts table, 12-month chart, type/campaign mix.
- **Pledges** — filterable pledge table with lifecycle.
- **Transactions** — filterable transaction list with summary card.

### Findings

#### 🔴 M1 — Lifetime giving on Overview is truncated at 500 transactions
[MemberOverviewTab.tsx:98-140](../src/components/pages/members/MemberOverviewTab.tsx#L98)
Fetches `useTransactions({ memberId, limit: 500 })` and `reduce`s into `lifetime.total`, `byType`, `byCampaign`, `firstISO`, `lastISO`. The recently-added "transaction summary breakdown card" inherits this. Card is labeled "All-time given" but is actually "all-time, capped at the most recent 500."

The Transactions tab on the *same page* uses `useTransactionSummary(... { memberId })` which is uncapped and computed in SQL — so the two tabs disagree on totals for members with >500 gifts.

**Fix:** Overview should call `useTransactionSummary(tenantSlug, { memberId })` (no date filter) for all aggregates. Use a separate `useTransactions({ memberId, limit: 8 })` query *only* for the recent-gifts preview table. This is the change with the largest correctness payoff.

#### 🔴 M2 — MemberTransactionsTab fetches 500 members purely for the lookup map
[MemberTransactionsTab.tsx:64-67](../src/components/pages/members/MemberTransactionsTab.tsx#L64)
The page is scoped to *one* member — the member is already in scope as a prop. Yet it pulls the full 500-member list to populate `transactionColumns`' member-name resolver. Pure waste.

**Fix:** Pass the resolved `{ [member.id]: member }` map (one entry) to `transactionColumns`, or have the transaction DTO embed `memberName`.

#### 🔴 M3 — Pledge status counts on Overview are truncated and stale
[MemberOverviewTab.tsx:142-146](../src/components/pages/members/MemberOverviewTab.tsx#L142)
`pledges.filter(p => p.status === "ACTIVE").length` from a `limit: 200` fetch. Status itself may be backend-computed; FE counts can drift from authoritative state.

**Fix:** Member summary endpoint should return `activePledgesCount`, `fulfilledPledgesCount`, `pledgedTotal`, `paidTotal`.

#### 🟠 M4 — Pledges tab uses the same campaign-fan-out as Dashboard
[MemberPledgesTab.tsx:95-127](../src/components/pages/members/MemberPledgesTab.tsx#L95) — same `useCampaignsManyWithItems` as D4/R5. Same fix: embed deadlines in pledge DTO.

#### 🟠 M5 — Soft-delete inclusion is unstated
[MemberOverviewTab.tsx:98-101](../src/components/pages/members/MemberOverviewTab.tsx#L98)
Lifetime giving doesn't pass `includeDeleted`, so soft-deleted transactions are excluded. Is that intentional? If an admin voids a 5-year-old transaction, should it disappear from "Lifetime giving"? The MemberInsights (self) page explicitly sets `includeDeleted: true` for pledges. The two perspectives differ silently.

**Fix:** Decide the intent per metric ("lifetime" includes voided? probably yes for historical relationship view; almost-certainly no for compliance / receipt-issuance contexts) and document on each metric.

#### 🟡 M6 — 12-month chart's window is partial-month aligned
[MemberOverviewTab.tsx:150-175](../src/components/pages/members/MemberOverviewTab.tsx#L150)
`dayjs().startOf("month").subtract(11, "month")` — MemberInsights does it correctly (`.utc().startOf("month").subtract(11, "month")`); MemberOverview drops the UTC and starts at the start of *the current* month, producing a partial-month leading bucket.

#### 🟡 M7 — Mix segment colors assigned by pre-sort index
[MemberOverviewTab.tsx:177-212](../src/components/pages/members/MemberOverviewTab.tsx#L177) — `pickCategorical(i)` runs before `sort`, so a campaign at displayed position 3 may get the color for original-position 5. Cosmetic but visible across renders.

### Overlap with MemberInsights (member self-view)
The self-side dashboard already does it correctly: it uses `useMyTransactionSummary` and trusts the backend. Admin MemberDetail should mirror this pattern (different intent endpoint — `tenant/*` instead of `self/*` — same shape).

---

## 5. Cross-cutting recommendations

### 5.1 New / extended backend endpoints

Ordered by impact:

**A. Extend `GET /transactions/summary`** — accept full filter set
```ts
TransactionSummaryQuery = {
  dateFrom?, dateTo?,
  memberId?,             // already supported
  campaignId?,           // NEW
  type?,                 // NEW
  includeDeleted?,       // NEW
  onlyDeleted?,          // NEW
}
TransactionSummaryResponse = {
  total, count, avg,                              // avg precomputed
  byType:    [{ type, total, count, avg, share }],
  byMonth:   [{ month, total, count }],
  byCampaign:[{ campaignId, campaignTitle, total, count }],  // optional
  byMember:  [{ memberId, memberName, total, count }],       // optional
  firstDate, lastDate,                            // for member-scoped queries
}
```
This single change collapses **T1, T2, T4, T5, T8, M1, M3, parts of R1**.

**B. `GET /reports/givers?dateFrom=&dateTo=&limit=`** — collapses R1, R2.

**C. `GET /reports/pledges?dateFrom=&dateTo=&dateBasis=`** — collapses R4, R5, R6. Requires product decision on `dateBasis`.

**D. `GET /pledges/urgent?limit=` + lifecycle in pledge DTO** — BE resolves item-vs-campaign deadline, computes `daysUntil` and `lifecycle`. Collapses D3, D4, M4, R5.

**E. `GET /transactions/unattributed?dateFrom=&dateTo=`** — collapses D1.

**F. `GET /members/{id}/summary`** — `{ lifetimeGiving, transactionCount, firstGiftDate, lastGiftDate, activePledgesCount, fulfilledPledgesCount, pledgedTotal, paidTotal }`. Collapses M1, M3.

**G. Embed lookups in list DTOs.** Transaction list returns `member: { id, firstName, lastName, deletedAt }` + `campaign: { id, title, deletedAt }`. Pledge list returns `campaign: { id, title, deadline, deletedAt }` + `campaignItem: { id, title, deadline }`. Collapses D7, T7, M2, M4 simultaneously, plus removes the need for `useCampaignsManyWithItems` entirely.

**H. `POST /campaigns/progress/batch`** — accepts campaign IDs, returns map. Collapses D2.

### 5.2 Frontend conventions to add

- **Never compute a "Total" or "Lifetime" from a paginated list.** Either call a summary endpoint or surface "(showing X of Y)" with no fake total.
- **Currency arithmetic stays on the backend.** FE displays, never sums or divides.
- **Filter object is one source of truth.** A page's filter state should be passed to *all* hooks on that page; summary and list cannot diverge.
- **Lookup maps prefetched at `limit: 500` are a code smell.** Replace with embedded DTOs.
- **Hardcoded `limit: 500` / `limit: 200` should be reviewed at PR time.** Any aggregation downstream of a `limit:` is suspect.

### 5.3 Intent clarifications the product owner needs to resolve

These are not bugs but decisions blocking correct implementation:

1. **Does "Lifetime giving" include voided/refunded/soft-deleted transactions?** (M5)
2. **Does "Pledge fulfillment % this period" mean pledges created, due, or paid in the period?** (R4, R6)
3. **Does "Cancellation rate" use `cancelled / (cancelled + fulfilled)` or `cancelled / total ever created`?** (R6)
4. **For a transaction allocated across multiple campaign items, do reports group by transaction or by allocation?** (not yet addressed — flag for review when allocations land)

---

## 6. Suggested rollout order

1. **Extend `/transactions/summary` (item A)** — biggest correctness gain, smallest BE change. Fixes T1/T2/T4/T5/M1/M3 the moment FE swaps the call.
2. **Embed lookups in list DTOs (item G)** — drop `useCampaignsManyWithItems` + 500-member prefetches everywhere.
3. **`/pledges/urgent` + lifecycle in pledge DTO (item D)** — unblocks dashboard accuracy + simplifies Pledge Dynamics.
4. **`/reports/givers` (item B)** — replaces the Givers tab's aggregation entirely.
5. **`/reports/pledges` (item C)** — after the product decisions in §5.3.
6. **`/transactions/unattributed` (item E)** + **`/members/{id}/summary` (item F)** — small focused wins.
7. **Campaign progress batch (item H)** — performance, not correctness.

After step 1+2 alone, the dashboard's anonymous/no-campaign counts, the transactions card/list disagreement, and the member-detail lifetime undercount are all gone — that's the highest-ROI delivery.
