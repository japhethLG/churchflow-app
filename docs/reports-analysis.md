# Reports Page — Analysis & Improvement Plan

> **Scope:** [src/components/pages/reports/](../src/components/pages/reports/) — the admin **Reports** surface at [/[tenantSlug]/admin/reports](../src/app/[tenantSlug]/(admin)/admin/reports/page.tsx).
> **Goal:** describe what the page does today, what data the backend can give us that the page ignores, and a concrete plan for raising the *value-per-pixel*. UX polish is incidental — this is mostly about which numbers to show.

---

## 1. What the page is today

Four tabs, all of which boil down to *"rank something by total amount"*:

| Tab | Data source | What it renders | Verdict |
|---|---|---|---|
| **By Type** | `useTransactionSummary(tenantId, 12)` → `summary.byType` + `summary.byMonth` | Donut chart + ranked bar list + a month bar chart (same as By Month) | The only tab that exercises the dedicated summary endpoint. Useful, but only one slice. |
| **By Member** | `useTransactions(tenantId, { limit: 500 })` + `useMembers(..., { limit: 500 })` joined client-side | Top-15 leaderboard by `sum(amount)` | Client-side groupby on a hard-coded 500-row window. Silently incorrect once any of those entities passes 500 rows. |
| **By Campaign** | Same `useTransactions` window + `useCampaigns` | Leaderboard by `sum(amount)` per campaign | Same 500-row truncation. Treats "Unattributed" as a real bucket. Ignores **CampaignItem** entirely. |
| **By Month** | `summary.byMonth` | Bar chart of last 12 months | Fine, but no comparison line, no goal, no YoY. |

Other observations from [AdminReportsPage.tsx](../src/components/pages/reports/AdminReportsPage.tsx):
- The header chip claims "Jan 1 — *today*" but the summary endpoint is being called with `months: 12` (rolling window) — the label lies whenever today is after January.
- "Export CSV" button is `disabled`. Dead control.
- No date-range picker. The user cannot ask "show me Q1" or "show me last year".
- `_ytdMonths` is computed and immediately discarded.
- No filters (type, campaign, member). Every tab shows the same all-up dataset.
- Pledge data is **never read** anywhere on this page even though the entity exists.

---

## 2. What the backend can give us (relevant to reports)

Confirmed by reading [src/lib/api/](../src/lib/api/), [schema.d.ts](../src/lib/api/schema.d.ts), and the backend modules under `church-app-backend/src/modules/`.

### 2.1 Already wired hooks we can use today

| Hook | Endpoint | What it returns |
|---|---|---|
| `useTransactionSummary` | `GET /tenants/:tenantId/transactions/summary` | `{ total, count, byType[], byMonth[] }` for an arbitrary range (`dateFrom`/`dateTo`) OR rolling window (`months`). **The date-range form is already supported** — we just don't use it. |
| `useTransactions` | `GET /tenants/:tenantId/transactions` | Paginated rows with rich filters: `memberId`, `campaignId`, `campaignItemId`, `pledgeId`, `type`, `dateFrom`, `dateTo`. Response metadata already includes a sum. |
| `useCampaigns` / `useCampaign` | `GET /tenants/:tenantId/campaigns[/:id]` | Includes nested `items[]` (CampaignItems) with `targetAmount`, `deadline`, `sortOrder`. |
| `useCampaignProgress` | `GET /tenants/:tenantId/campaigns/:id/progress` | `{ goalAmount, pledgedAmount, raisedAmount, pledgeCount, items[]: { itemId, title, targetAmount, pledgedAmount, raisedAmount, pledgeCount } }`. **The strongest report-shaped endpoint we have, and the page does not call it.** |
| `usePledges` | `GET /tenants/:tenantId/pledges` | Filter by `campaignId`, `memberId`, `status` (`ACTIVE` / `FULFILLED` / `CANCELLED`). |
| `useMembers` | `GET /tenants/:tenantId/members` | `status`, `role`, `createdAt`. |

### 2.2 Domain fields we are not surfacing

- **Transaction.type** — already used, but only as a *grouping* key. Useful as a *filter* too (e.g. "by-member leaderboard, tithes only").
- **Transaction.date** — used only for month bucketing. Day-of-week and intra-month seasonality are derivable.
- **Transaction.pledgeId / campaignItemId** — currently ignored entirely.
- **Pledge.status & pledgedAmount** — fulfillment vs. cancellation is a major narrative we are dropping on the floor.
- **Campaign.deadline / status** — lets us say "Building Fund is 62% funded with 14 days to deadline".
- **Member.status / createdAt** — enables active-giver and first-time-giver counts.

### 2.3 Aggregations the schema supports but no endpoint exposes yet

These are listed because some of the proposed improvements need backend work — not all can be done purely on the frontend.

| Aggregation | Need new backend endpoint? | Notes |
|---|---|---|
| YoY / period-over-period comparison | No — call `useTransactionSummary` twice with different `dateFrom`/`dateTo`. | Pure frontend. |
| Average gift size per type | No — derive from `byType` (`total / count`). | Pure frontend. |
| Pledge fulfillment per campaign / overall | Partly — `useCampaignProgress` gives it per campaign. For a tenant-wide rollup we'd need a new `pledges/summary` endpoint OR aggregate client-side over `useCampaigns` × `useCampaignProgress`. | Tolerable client-side fan-out for small N. |
| Repeat-giver / unique-giver counts | **Yes** — needs `distinct(memberId)` on the backend. Otherwise we'd have to scan the full transactions table client-side. | Recommend a new field on the summary DTO: `uniqueGiverCount`. |
| First-time givers in period | **Yes** — needs `memberId NOT IN (transactions where date < range.from)`. | Recommend new field `firstTimeGiverCount`. |
| Lapsed givers | **Yes** — same shape. | Defer. |
| Member-leaderboard accurate across all transactions | **Yes** — needs a `transactions/by-member` aggregate endpoint, or extend the summary DTO with a `byMember[]` (top-N) field. | Client-side groupby on 500 rows is wrong at scale. |
| Campaign leaderboard accurate across all transactions | **Yes** — same shape: add `byCampaign[]` to summary. | Same scale issue. |
| Day-of-week seasonality | No, in principle — `useTransactions` could feed it — but at the cost of a full table read. **Yes** to do it cheaply. | New `byDayOfWeek[]` field on summary DTO would be tiny. |

---

## 3. Correctness bugs in the current page

These should be addressed before adding new features.

1. **By-Member and By-Campaign are silently truncated.** `useTransactions(..., { limit: 500 })` caps the dataset. As soon as a tenant has > 500 transactions in any one of these windows, the leaderboard becomes wrong. Move both aggregations server-side, or at minimum widen and paginate.
2. **Date-range chip is a lie.** Header says "Jan 1 — today" but the summary uses a rolling 12-month window starting from *today − 12 months*. Either align the label to the window, or call the summary with an explicit `dateFrom = startOfYear`.
3. **By Type tab also renders By Month.** Duplicates the By Month tab. Either pick one home for the chart or change it to be type-segmented on the By Type tab.
4. **"Anonymous" / "Unattributed" buckets are buried.** They are leaderboard rows. For an admin these are *operational gaps* (untagged gifts) and deserve dedicated callouts, not a row among donors/campaigns.
5. **Export CSV is disabled.** Either ship it or remove the button.

---

## 4. Proposed improvements (data-first, not chart-first)

Ordered by **value × ease**. Each item lists what it shows, why it matters to a church admin, and the data dependency.

### Tier 1 — pure frontend, ships now

1. **KPI strip at the top** (always visible).
   - `Total Received`, `Gift Count`, `Average Gift` (= total/count), `Unique Givers (this period)`*, `vs. previous period (Δ%)`.
   - Data: two `useTransactionSummary` calls (current range + previous range of equal length).
   - *`Unique Givers` needs backend work — see §2.3. Until then, show it as "—" with a tooltip, or omit.*

2. **Real date-range picker** in the toolbar.
   - Replace the static "Jan 1 — today" chip with `<DateRangePicker size="sm" autoWidth clearable />` plus preset chips: *This month*, *Last month*, *YTD*, *Last 12 months*, *This year*, *Last year*.
   - Drives every tab's summary call via `dateFrom`/`dateTo` (which `useTransactionSummary` already accepts).

3. **By Type → add the missing dimensions per row.**
   - For each type, show `total`, `count`, `avg gift`, `% of period`, `Δ% vs. previous period`.
   - Pure derivation from two summary calls.

4. **By Month → overlay previous-year line.**
   - Bar chart for current 12 months + thin line series for the same months one year prior.
   - Two summary calls. Adds genuine context to a single-series bar.

5. **Make "Unattributed" / "Anonymous" their own callout.**
   - On By-Campaign and By-Member: surface `unattributedTotal`, `unattributedCount` (and same for anonymous) as warning cards above the leaderboard, with a *Review* link to the transactions list filtered by `campaignId is null` / `memberId is null`. Operationally actionable.

### Tier 2 — small backend changes (one summary DTO extension)

6. **New tab: "By Campaign" → Campaign Health.**
   - Card per active campaign: `useCampaignProgress` rollup — goal, pledged, raised, fulfillment %, time-to-deadline, status pill.
   - Sortable. Replaces the current client-side groupby leaderboard which is both wrong and uninformative.

7. **New tab: "Pledges" — fulfillment.**
   - Tenant-wide: pledged total, paid total, fulfilled count, active count, cancelled count, % fulfillment, average gap-to-target.
   - Per active campaign: same breakdown.
   - Data: `usePledges` (filter by status) plus existing campaign-progress data.

8. **Top givers leaderboard (server-aggregated).**
   - Extend `TransactionSummaryResponseDto` with `byMember?: { memberId, total, count }[]` (top 25) and `byCampaign?: { campaignId, total, count }[]`.
   - Removes the 500-row client-side bug entirely. One DB query gain replaces a noisy frontend join.

### Tier 3 — bigger backend lift, high value

9. **Giver cohorts: unique / new / repeat / lapsed.**
   - Counts shown in the KPI strip + a small bar chart "new vs. returning by month".
   - Needs a new endpoint or DTO fields (see §2.3).

10. **Day-of-week seasonality.**
    - Tiny heatmap (7 cells) — when does giving actually happen?
    - Tells admins which Sundays under-perform. Cheap to compute server-side; expensive to compute client-side.

11. **Export.**
    - Two CSV exports: *transactions (filtered)* and *summary snapshot (the visible report)*. Either backend-streamed CSV, or frontend stringification of the data already loaded.

### Tier 4 — nice but defer

- Custom transaction types: the tenant has `customTransactionTypes`, but reports currently key off the seven enum values. Worth doing only after Tier 1–3.
- Member-detail drill-down from the leaderboard → already routes to the member page; mention as a polish item.
- Per-payment-method breakdown is **not possible** today: the schema does not store payment method on `Transaction`. Don't promise it.

---

## 5. Recommended rebuild of the tab structure

Today: *By Type / By Member / By Campaign / By Month*. Each is one chart.

Proposed:

| Tab | Purpose | Primary widgets |
|---|---|---|
| **Overview** | The one screen a pastor sees on Monday morning | KPI strip + month-over-month chart with YoY line + type donut + top 5 campaigns by fulfillment |
| **Giving** | Where does money come from? | By type (with avg + Δ%), by member leaderboard (server-aggregated), day-of-week seasonality, anonymous/unattributed callouts |
| **Campaigns** | Are we hitting our goals? | Campaign Health cards (goal vs. pledged vs. raised, deadline countdown), campaign-item drill-down |
| **Pledges** | Are commitments being honored? | Pledge fulfillment %, active vs. fulfilled vs. cancelled, aging |

Four tabs, but each one **earns its tab** by answering a distinct question. Today, three of the four tabs answer the same question ("rank by amount") with different group-bys.

---

## 6. Implementation order (suggested)

1. Fix correctness: real `dateFrom`/`dateTo`, remove the misleading chip, kill the duplicate chart on By Type. *Half-day.*
2. Add KPI strip + date-range picker + presets (Tier 1 items 1–4). *1–2 days.*
3. Move By Member / By Campaign onto a `byMember[]` / `byCampaign[]` extension of the summary DTO — backend change, then swap the hooks. *Backend: 1 day. Frontend: 0.5 day.*
4. Replace the By Campaign tab with Campaign Health using `useCampaignProgress`. *1 day.*
5. Add Pledges tab. *1 day.*
6. Defer giver-cohort + day-of-week until backend ships the new fields.

---

## 7. Files to touch

- [AdminReportsPage.tsx](../src/components/pages/reports/AdminReportsPage.tsx) — toolbar (date range), KPI strip, tab restructure.
- [ReportsByType.tsx](../src/components/pages/reports/ReportsByType.tsx) — per-type avg + Δ% columns.
- [ReportsByMonth.tsx](../src/components/pages/reports/ReportsByMonth.tsx) — overlay YoY line.
- [ReportsByMember.tsx](../src/components/pages/reports/ReportsByMember.tsx) — switch source to server-aggregated `byMember[]`; surface anonymous callout.
- [ReportsByCampaign.tsx](../src/components/pages/reports/ReportsByCampaign.tsx) — replace with Campaign Health cards driven by `useCampaignProgress` per campaign.
- New: `ReportsOverview.tsx`, `ReportsKpiStrip.tsx`, `ReportsCampaignHealth.tsx`, `ReportsPledges.tsx`.
- [reports-shared.ts](../src/components/pages/reports/reports-shared.ts) — add `DateRange`-aware helpers, `formatDelta`, period-over-period util.
