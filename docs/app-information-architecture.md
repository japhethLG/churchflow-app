# Admin Information Architecture — Rethink

> Follow-up to [reports-analysis.md](./reports-analysis.md) after the v2 mock review.
> The v2 mock made the wrong-shape problem clearer: it stacked "stats with charts" without asking *what decision does this enable?* This doc rethinks every admin surface around the questions the data can actually answer, then says which surface gets to answer which question so nothing is redundant.

---

## 1. What the v2 mock got wrong

Three concrete bugs from the screenshot review, then a structural one.

**Concrete (cheap to fix later — keep them in mind):**
1. **KPI numbers aren't compacted.** `1,842,500.0` should be `₱1.8M`. We already have [`formatCompact` in `lib/format-currency.ts`](../src/lib/format-currency.ts) — `StatCard.value` should accept either a formatted string or a raw number with a `compact` flag. Long numbers blow up `StatCard`'s `text-5xl` value slot.
2. **Bar/chart palette is bland and inconsistent.** The transaction-type tokens (`--tx-tithe`, `--tx-offering`, etc.) are nice on the donut but month/cohort charts fall back to gradient + grey. We need a coherent "chart accent" palette — one per series role (current, prior, target, "neutral"), not a per-type palette dragged into places where there's no type.
3. **Campaign-Health-next-to-Type-Breakdown is a layout mismatch.** Type breakdown is one tall card; Campaign Health needs to be a list. Stacking unrelated cards in a 2-col grid creates the empty whitespace you saw. The card shape itself doesn't scale past ~4 campaigns either — at 20 active campaigns this is a wall of cards.

**Structural (the real problem):**
4. **"Top givers" answers the wrong question.** Just ranking by `sum(amount)` tells you who is generous, not who is *engaged*. The actually-useful view is "which giver gives to *what*, and how often" — a stacked horizontal bar per giver (their giving broken down by type or campaign) tells you which member to thank for the building fund vs. for general offerings.

---

## 2. The split that fixes the redundancy

The dashboard and the reports page were drifting toward the same chart deck because we never named what each surface is *for*. Naming it:

| Surface | Time horizon | Verb | Question it answers |
|---|---|---|---|
| **List pages** (Members / Campaigns / Pledges / Transactions) | The selected filter window | *Find* | "Show me the rows that match — and give me a couple of headline numbers for the slice I'm looking at." |
| **Entity detail pages** | All time, for one entity | *Inspect* | "Everything about *this* member / campaign / pledge." |
| **Dashboard** | **Now / this week** | *Act* | "What needs me today?" Time-bound, actionable, list-of-things-to-do, never historical analysis. |
| **Reports** | **Periods over time** | *Decide* | "Are we trending the right direction, and why?" Cross-entity, never about a single row. |

If a widget could equally live on the dashboard or the reports page, one of them is wrong. The litmus tests:
- Does the widget tell me to **do something** within the week? → Dashboard.
- Does the widget compare a **period to another period** or a **cohort to another cohort**? → Reports.
- Does the widget describe **one entity** ("Building Fund progress")? → that entity's **detail page**, not Reports.
- Does the widget summarize **the current list filter**? → top of the list page, not Dashboard.

The v2 mock violates this in three ways: Pledge KPIs (belongs on Pledges list / detail), Campaign Health cards (belongs on Campaign detail and the Campaigns list header), and giver leaderboards (belongs on Reports *or* the Members list — pick one).

---

## 3. Per-surface proposal

Each section: **the questions it owns**, **the data it surfaces**, **what should NOT be there**.

### 3.1 Admin Dashboard — "what needs me today?"

The dashboard today already has KPI strip + charts + recent gifts + active campaigns. The charts are the part that doesn't belong — they answer trend questions, which is Reports' job.

**Owns:**
- *Did anything weird happen this week?* — recent activity feed: last 8–10 transactions, with anomaly flags (gift > 3× member's avg, first-time giver, anonymous, no campaign attached).
- *Who do I need to follow up with?* — **Outstanding pledges due this week / past due** (we have the data; nobody surfaces it — see §4).
- *Is anything blocking me?* — unattributed gifts count (anonymous, no-campaign) as an action card.
- *What's coming due?* — campaigns within 14 days of deadline + their fulfillment %.
- *Snapshot of "now"* — current month total, gifts this week, new members this week. Three or four short numbers, not a deep KPI strip.

**Removes / moves to Reports:**
- Month-over-month chart → Reports.
- 12-month type breakdown → Reports.
- Comparison vs. previous period → Reports (the dashboard's "snapshot of now" can show *this week vs last week*, but YoY belongs elsewhere).

### 3.2 Members list — "find a member, see slice stats"

The list page header should have ~3 small stats tied to the **current filter** — not the whole tenant.

**Owns:**
- Total in current view, active vs. inactive ratio, new in last 30 days (within the filter).
- Filterable by status, role, search.

**Does not own:**
- Lifetime totals, giver rankings, retention — that's Reports.
- Per-member giving history — that's [`MemberDetailPage`](../src/components/pages/members/MemberDetailPage.tsx), which already has [`MemberRecentGiving`](../src/components/pages/members/MemberRecentGiving.tsx) and [`MemberPledges`](../src/components/pages/members/MemberPledges.tsx).

**Add to member detail (the one improvement that's not Reports):**
- Lifetime total given · gift count · avg gift · first-gift date · last-gift date · pledges open vs. fulfilled. A 6-stat band at the top of the detail page. The data is already loaded by `MemberRecentGiving` / `MemberPledges`; we just don't show it.

### 3.3 Campaigns list — "find a campaign, see goal progress at a glance"

This is the closest mismatch to fix. The list today is a table; the user thinks of campaigns visually as goal-progress.

**Owns:**
- Per row: title, status, goal, raised, % progress, days to deadline.
- Top of page: count by status (active / draft / completed), aggregate goal vs. aggregate raised across active campaigns.
- Switch between table view and card view (table for finding, cards for skimming progress).

**Does not own:**
- Per-item drilldown, pledge list, transaction list — that's [`CampaignDetailPage`](../src/components/pages/campaigns/CampaignDetailPage.tsx) (already exists, already has [`CampaignProgressCard`](../src/components/pages/campaigns/CampaignProgressCard.tsx) + [`CampaignItemsList`](../src/components/pages/campaigns/CampaignItemsList.tsx) + [`CampaignPledgesList`](../src/components/pages/campaigns/CampaignPledgesList.tsx)).

This means **most of what the v2 mock's "Campaign Health" cards do already exists on the campaign detail page**. The reports tab was duplicating it. Solution: the campaign detail page is the source of truth; the campaigns list adds an aggregate roll-up.

### 3.4 Pledges list — "track who owes what"

This is the page that exposes the AR-shaped reality of pledges, which **nothing currently surfaces**.

**Owns:**
- Per row: member, campaign, pledged amount, **paid amount, remaining, % fulfillment, status**. The "paid" + "remaining" columns are the missing piece — the data is in `Transaction.pledgeId` (pledges have a unique pledgeId on each related transaction) but the table doesn't show it.
- Top of page: status counts (active / fulfilled / cancelled), total pledged in view, total paid in view, fulfillment % of view.
- Filters: status, campaign, member.

**Does not own:**
- Aging analysis, fulfillment trend over time, cohort comparisons — Reports.
- The pledge KPI strip the v2 mock had (Pledged / Paid / Avg fulfillment / Avg pledge) **belongs at the top of THIS page**, not Reports.

### 3.5 Transactions list — already mostly right

[`TransactionsSummaryCard`](../src/components/pages/transactions/TransactionsSummaryCard.tsx) already does the "summary of current filter" pattern. The only addition:
- Inline anomaly markers on rows (first gift, anonymous, > 3× member's avg) so the dashboard's "anomalies" list links here and the row stays self-explanatory.

### 3.6 Reports — strategic, period-over-period, cross-entity

Everything that **isn't** a single-row inspection and **isn't** a now-this-week action. What's left is genuinely valuable and not redundant:

**Trend & growth** (only place these live):
- Month-over-month with YoY overlay (existing v2 widget).
- Giver cohorts: returning vs. first-time per month (existing v2 widget).
- Lapsed givers: members who gave in prior period but not in current — a count + a list. Needs backend.
- Giving seasonality (day-of-week heatmap) — existing v2 widget.

**Mix & composition** (over time, not snapshot):
- Type mix evolution: stacked area of `byType` per month (showing whether tithe-share is rising or falling) — not a one-period donut. The donut belongs on dashboard / transactions list summary.
- Campaign-share of total giving over time.

**Giver behavior** (the real "who gives" view):
- Givers ranked by *consistency* (gave in N of last 6 months), not just amount.
- Per-giver mix: stacked horizontal bar per top giver — segments are types or campaigns, total = their giving in the period. This is the "Top givers" replacement the user described.
- First-time-giver retention: of new givers in month M, what fraction gave again within 90 days?

**Pledge dynamics** (cross-campaign, over time, not per-pledge):
- Pledge-to-payment conversion: of pledges created in period X, what % was paid within deadline?
- Aging *trend* (the in-period aging snapshot lives on Pledges list — Reports shows whether average age of outstanding pledges is rising or falling).
- Cancellation rate over time.

**Anomalies in aggregate** (the only "anomaly" view on Reports):
- Anonymous / unattributed share over time — is this getting better as we tell volunteers to tag gifts?

---

## 4. The view we don't have today but the data demands

The user's most precise observation: *"campaigns and pledges is used mainly for keeping track on what is incoming, but we don't have a way of knowing that info."* This is the AR-style view that none of the existing pages exposes.

For every pledge: `pledgedAmount`, related transactions (`Transaction.pledgeId`), implied deadline (`CampaignItem.deadline` or `Campaign.deadline`). From these three you can compute:

- **Paid to date** — sum of related transactions.
- **Outstanding** — pledged − paid.
- **Days remaining** — deadline − today.
- **On-track / Behind / Past due** — compare paid % vs. elapsed-time %.

Three places this view should appear, each at a different grain:
1. **Pledge detail page** — for one pledge.
2. **Pledges list** — table column.
3. **Campaign detail page** — aggregate "outstanding across this campaign's pledges".

None of these need to live on Reports. Reports comes in only for the *trend* of pledge fulfillment over time.

This is the most concrete unlock in the codebase right now: the schema already supports it, no backend changes needed, and it converts pledges from a passive log into an operational tool.

---

## 5. What Reports actually becomes after this redistribution

Strip everything that belongs elsewhere and Reports is a tighter, more honest page:

- **Trend tab** — MoM with YoY overlay, type mix evolution, day-of-week.
- **Givers tab** — consistency-ranked, per-giver mix bars, first-time retention, lapsed list.
- **Pledge dynamics tab** — conversion, aging trend, cancellation rate.
- (Drop the "Campaigns" tab entirely — campaign goal/raised lives on the campaigns list & campaign detail.)
- (Drop the dashboard-style KPI strip — Reports is about deltas, not levels.)

Three tabs, each genuinely answering questions you can't get anywhere else.

---

## 6. Migration order if we commit to this

Not asking you to commit yet — but if the structure above lands, the implementation order that minimizes throwaway work:

1. **Add the "paid / outstanding / on-track" columns to Pledges list + Pledge detail.** Pure frontend; biggest visible value-per-day.
2. **Add the slice-stats band to Members detail (lifetime total, first/last gift, etc.).** Pure frontend.
3. **Move Pledge KPIs from v2 Reports onto Pledges list header.** Pure frontend; deletes a v2 tab.
4. **Move Campaign Health from v2 Reports onto Campaigns list (aggregate) + Campaign detail (per-campaign — already there).** Pure frontend; deletes a v2 tab.
5. **Replace dashboard charts with "outstanding pledges due this week" + "anomalies this week" + small now-snapshot.** Pure frontend; data already available.
6. **Reports v2 → trim to Trend + Givers + Pledge-dynamics.** Some widgets need backend (cohorts, lapsed, retention, conversion rate) — these are the only items that justify backend work.

Things 1–5 are pure frontend on the existing API surface and would actually move the needle for an admin tomorrow. Backend work only kicks in at step 6.

---

## 7. Open questions for you before any code

1. **One giver-mix view or two?** Per-giver-by-type vs. per-giver-by-campaign are both valuable but they're crowded together. Pick one for v3, or build a toggle?
2. **Do you want a "weekly digest" surface** — a single screen pastors look at on Monday morning that's neither dashboard (today) nor reports (trend) — or is that what the dashboard already is once we add "what happened this week"?
3. **How granular is the anomaly threshold?** "Gift > 3× member's avg" is a heuristic; could also be percentile-based. Are anomalies even useful, or is it just operational noise?
4. **Pledge deadline** — is the implicit deadline (campaign / item deadline) good enough, or should pledges grow their own `dueDate` field for installment plans? If yes, that's a schema change worth deciding on now since it changes the AR view shape.
