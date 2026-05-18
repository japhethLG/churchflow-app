# Components for the New Data Views

> Follow-up to [app-information-architecture.md](./app-information-architecture.md). The IA decided *what* each surface displays; this doc decides *how*, by inventorying the visualization primitives the new views need and whether we have them, can extend them, or need to build them.
> Open questions are now resolved:
> 1. **Giver mix** — toggle between "by type" and "by campaign" (build the toggle, ship both).
> 2. **Weekly digest** — dropped.
> 3. **Anomaly threshold** — dropped (or revisit only if a specific user request lands).
> 4. **Pledge deadline** — pledges inherit `Campaign.deadline` (or `CampaignItem.deadline` when set). **No schema change.** The AR view computes "days remaining" from the campaign relationship.

---

## 1. Re-confirm the data shapes we now need to render

After the IA pass, the universe of widget-shapes shrinks to a small, recurring set. Worth naming them before component-hunting — every primitive should map to one of these shapes, and each shape should be served by exactly one primitive.

| Shape | Example uses | Today |
|---|---|---|
| **A. Headline number + delta** | Dashboard "now snapshot", list-page slice header, Pledges list KPIs | [`StatCard`](../src/components/primitives/StatCard.tsx) — works, formatting bug |
| **B. Dense inline metric strip** | Member detail "stat band", Campaign detail header | None — composed inline today |
| **C. Single goal with two stacked sub-amounts** | Campaign health (pledged + raised vs goal), Pledge row (paid + remaining vs pledged) | Hand-rolled twice in v2 |
| **D. Categorical mix bar (one row, N segments)** | Per-giver mix (types or campaigns), pledge aging composition, "where does giving come from" | None — must hand-roll |
| **E. Tabular row of sparkline + total** | Campaigns list trend column, Members list giving trend, Reports type-mix tile | None |
| **F. Categorical consistency dots** | Reports "gave in 5 of last 6 months", member detail | None |
| **G. Multi-series time chart (current + prior)** | Reports MoM with YoY overlay | v2 `V2MonthChartWithYoY` — usable, needs palette fix |
| **H. Stacked area / stacked bar over time** | Reports type-mix evolution, returning-vs-first-time cohorts | v2 `V2GiverCohorts` — usable |
| **I. 7-cell heat strip (day of week)** | Reports seasonality | v2 `V2DayOfWeek` — fine |
| **J. Ranked horizontal bars (single metric)** | Reports "top givers by total" *(only if we keep)*, "campaigns by raised" | [`ReportsHorizontalLeaderBoard`](../src/components/pages/reports/ReportsHorizontalLeaderBoard.tsx) — works |
| **K. Operational task row** | Dashboard "outstanding pledges due this week", "unattributed gifts to tag" | [`ListRow`](../src/components/primitives/ListRow.tsx) is close, needs composition |
| **L. At-a-glance entity card** | Campaigns list card view, member quick-card on dashboard | Hand-rolled in v2 |
| **M. Inline toggle (mix-by-type / mix-by-campaign)** | Givers report | [`SegmentedControl`](../src/components/primitives/SegmentedControl.tsx) at `size="sm"` — adequate |

Shapes C and D are the central new primitives. Almost everything interesting in the new IA expresses itself as a stacked horizontal bar.

---

## 2. What we already have that's adequate

Don't rebuild these.

- **`StatCard`** for shape A. Two small fixes needed:
  - The `value` prop should compact long numbers. Either accept `compactValue?: boolean` and call [`formatCompact`](../src/lib/format-currency.ts) internally, or have callers pre-format. **Recommendation: pre-format at the call site.** Keeps `StatCard` dumb, makes the call site self-documenting (`formatCompact(total)` vs `formatCurrency(total)`).
  - When `delta` is absent, the top-right slot leaves a gap. Cosmetic; ignore unless we move to a tighter layout.
- **`ReportsHorizontalLeaderBoard`** for shape J. Keep, but only if we keep a "ranked by amount" view at all (see §5 below — we may not).
- **`ListRow`** for shape K. Composes well with `Avatar` + `Badge`; just needs a `right` slot convention.
- **`SegmentedControl`** at `size="sm"` for shape M. The "by type / by campaign" toggle on the Givers view.
- **`DateRangePicker`** with the v2 presets — adequate as-is.
- **`Card`**, **`Badge`**, **`Pill`**, **`Avatar`**, **`AvatarStack`**, **`Pressable`** — composition glue, no changes.

---

## 3. What we need to build

Six new primitives + two palette/token additions. None of them need a heavy library; recharts + Tailwind handles everything.

### 3.1 `<StackedProgressBar>` — shape C (and the foundation for D)

The single most-reused new primitive.

```ts
type Segment = { value: number; color: string; label: string };

<StackedProgressBar
  total={1_500_000}                 // the "100%" — usually a goal
  segments={[
    { value: 1_120_000, color: "var(--muted-foreground)/40", label: "Pledged" },
    { value: 932_400,   color: "var(--chart-current)",        label: "Raised" },
  ]}
  size="md"                         // sm | md | lg
  showLegend?                       // optional inline legend
/>
```

Behavior:
- Segments render in array order on the same track (so the second segment overlays the first — useful for the "pledged behind, raised in front" pattern). For a *true* side-by-side stack (shape D below), use `mode="stack"`.
- Overflow handling: when sum(segments) > total, cap visually at 100% and surface an over-goal indicator (`+12%` chip at the bar's right edge). Campaigns that overshoot their goal should be obvious, not silently truncated.
- A11y: native `<progress>` is wrong here (it doesn't represent two overlapping values cleanly). Use `<div role="progressbar" aria-valuemin aria-valuemax aria-valuenow>` + sr-only legend.

**Use sites:** Campaign Health card, Campaign list row (sparkline column may also use it inline), Pledge AR row, Pledge aging composition (in `mode="stack"`), Per-giver mix (in `mode="stack"`).

### 3.2 `<MixBar>` — shape D (specialization of `StackedProgressBar` `mode="stack"`)

Could literally be `<StackedProgressBar mode="stack" />` with a thinner default size and a tooltip. Worth having a thin wrapper named `MixBar` so use-sites read clearly.

```tsx
<MixBar
  segments={[
    { value: 32_000, color: TYPE_COLOR.TITHE,          label: "Tithe" },
    { value: 8_500,  color: TYPE_COLOR.OFFERING,       label: "Offering" },
    { value: 4_200,  color: TYPE_COLOR.MISSION_GIVING, label: "Mission" },
  ]}
  size="sm"
/>
```

**Use sites:** Per-giver mix (one MixBar per top giver, toggleable between types and campaigns), Pledge aging breakdown, Type-mix snapshot on Transactions list summary.

The "by type vs by campaign" toggle on the Givers view drives only the `segments` array — same component renders both modes, which makes the toggle trivially reactive.

### 3.3 `<Sparkline>` — shape E

Tiny inline line/area, ~80×24px. No axes, no tooltip on hover (tooltip via parent row's hover). Use recharts `AreaChart` with `width`, `height`, no margins.

```ts
<Sparkline
  data={[12, 18, 22, 19, 24, 31, 28, ...]}
  trend="up"                        // optional — drives color
  width={96} height={28}
/>
```

**Use sites:**
- Campaigns list row — last-12-months raised, gives "is this momentum building?" without opening the campaign.
- Members list row — last-12-months given, surfaces lapsed-giver candidates at a glance.
- Reports type-mix tile thumbnails.

We *do not* need this on the Pledges list — pledges aren't a time-series of payments dense enough to spark.

### 3.4 `<ConsistencyDots>` — shape F

A row of N dots, filled or hollow based on whether the giver gave in that period. `period` is usually "month", `windowSize` usually 6.

```tsx
<ConsistencyDots
  values={[true, true, false, true, true, true]}   // last 6 months, oldest first
  filledColor="var(--chart-current)"
/>
```

Pure CSS. ~30 LOC. Pays for itself the first time an admin glances at a Givers table and instantly sees who's been consistent.

**Use sites:** Reports Givers tab (alongside or replacing "ranked by amount"), Member detail "engagement at a glance".

### 3.5 `<StatBand>` — shape B

Horizontal row of label-value pairs, hairlines between, no card chrome. Lives inside an existing `Card` (it's a *layout* primitive, not a card itself).

```tsx
<StatBand
  items={[
    { label: "Lifetime", value: formatCompact(1_842_500) },
    { label: "Gifts",    value: "412" },
    { label: "Avg",      value: formatCompact(4_472) },
    { label: "First",    value: "Mar 2022" },
    { label: "Last",     value: "Apr 2026" },
    { label: "Pledges",  value: "3 active · 5 fulfilled" },
  ]}
/>
```

`StatCard` is too tall and too loud for this — six `StatCard`s in a row drowns the page. `StatBand` is the dense alternative for entity detail pages where stats are context, not the main event.

**Use sites:** Member detail header, Campaign detail header, Pledge detail header.

### 3.6 `<PledgeARRow>` — composite, not a new primitive

The AR-shaped row needs to appear in the Pledges list table and on the Pledge detail. It's a *column composition* on top of `DataTable`, not a new primitive. Specifying it here just so we don't accidentally invent one:

```
| Member | Campaign | Pledged | Paid (bar) | Remaining | Days left | Status |
```

where the "Paid (bar)" column uses `<StackedProgressBar size="sm">` with two segments (paid = primary, remaining = muted) over a `total=pledgedAmount`. No new primitive — just a `DataTable` cell renderer.

The same row shape collapses into a single tile on a campaign detail page's "outstanding pledges" list, where the columns become a vertical key-value list inside a `ListRow`.

---

## 4. Color & palette — fix the "too bland" problem

The bland charts are a token problem, not a chart problem. Today [`Charts.tsx`](../src/components/primitives/Charts.tsx) hardcodes a `ring → primary` gradient on every bar; the leaderboard cycles through `--tx-*` tokens (which are *semantic* — they mean "this slice represents Tithes/Offerings") in places where there's no semantic mapping. Result: every chart is either purple gradient or a rainbow of meaningless brand colors.

### 4.1 Token plan

Introduce explicit **chart-role** tokens that name *what the color means in a chart*, not what brand color it is:

```css
/* in globals.css, light + dark */
--chart-current: var(--primary);          /* the period in focus */
--chart-prior:   var(--muted-foreground); /* prior period / comparison */
--chart-goal:    var(--warning);          /* target / threshold line */
--chart-positive: var(--success);
--chart-negative: var(--destructive);

/* existing --chart-1..5 stays as the "categorical palette" for series
   that have no semantic role (e.g. cohort buckets). */
```

Then update widgets:
- `V2MonthChartWithYoY` bars use `--chart-current` (solid, not gradient); the dashed prior-year line uses `--chart-prior`. Both modes legible in dark mode.
- `V2KpiStrip` delta badges use `--chart-positive` / `--chart-negative` instead of recomputing in JS.
- The current `--tx-*` tokens stay reserved for **type-level visualizations** (donut, type breakdown table, per-giver mix when toggled to "by type"). They never appear on a chart that isn't about transaction types.
- For per-giver mix "by campaign," cycle through `--chart-1..5` (categorical palette). Campaigns aren't an enum so there's no semantic token to assign.

### 4.2 Gradient policy

Reserve the `ring → primary` gradient for **the hero chart on a page** (one per surface, max). Solid fills everywhere else. The gradient signals "this is the headline number" — when it's on every chart, it signals nothing.

### 4.3 What this fixes

- The MoM chart in v2: bars get a clean solid `--chart-current` fill; the YoY line gets `--chart-prior` dashed. Two distinct, readable signals.
- Pledge aging stacked bar: uses `--chart-positive / --warning / --warning / --destructive` from on-track → very-late. Communicates urgency by color.
- Per-giver mix by type: continues to use `--tx-*` palette — but now that's a *deliberate* choice instead of the default.

---

## 5. What I considered and rejected

- **Sankey for pledge → payment flow.** Looked tempting; would be over-engineered. Two `StatCard`s ("Pledged in period: X" / "Of which paid within deadline: Y%") plus a stacked bar (`MixBar`) deliver the same insight in 1/5 the visual cost.
- **Daily heatmap (day × hour).** `Transaction.date` is a date, not a datetime. Hours aren't in the schema. The 7-cell day-of-week strip is the ceiling.
- **Treemap for type/campaign share.** Tempting for "mix at a glance" but a donut or a horizontal `MixBar` does the same work without the labelling pain of small rectangles.
- **Network / relationship graph (member ↔ campaign).** Cute, not actionable.
- **Map view of giver geography.** No address-to-lat/lng pipeline; would need geocoding. Defer.
- **"Top givers ranked by total amount"** as a primary widget. The user is right that this answers the wrong question. **Recommendation: drop ranked-by-total from Reports entirely.** Replace with the Givers-mix table (consistency dots + MixBar + total column, sortable by any column — including total, so the ranking is recoverable). One view, more information.
- **Anomaly badges (gift > 3× member avg).** OQ #3 — defer. Build only if a specific user asks.

---

## 6. Component build list, in priority order

If we commit, this is the order that unblocks the most surfaces fastest. None of them are large:

1. **`StackedProgressBar`** + **`MixBar`** (same file, ~120 LOC together). Unblocks Campaign Health redesign, Pledge AR row, Per-giver mix, Aging composition. Highest leverage.
2. **Chart-role color tokens** in `globals.css` + refactor `Charts.tsx`. ~30 LOC of CSS, ~20 LOC delete in `Charts.tsx`. Fixes the bland-chart complaint everywhere at once.
3. **`Sparkline`** (~40 LOC). Unblocks Campaigns list row, Members list row.
4. **`ConsistencyDots`** (~30 LOC). Unblocks Givers report.
5. **`StatBand`** (~40 LOC). Unblocks the new entity-detail headers.
6. **Pre-format KPI values at call sites** — a one-line audit. Use `formatCompact` for any value over six digits.

That's ~250 LOC of new primitive code + a token pass. Once those land, the IA from the previous doc is buildable without inventing further primitives.

---

## 7. Things I'm not building unless asked

- A chart-tooltip primitive. Each chart's tooltip is small enough to keep inline; trying to generalize leads to a leaky abstraction.
- A KPI strip primitive. `StatCard` + a grid container is already the strip. Wrapping it just hides the grid.
- Theme variants of charts (e.g. "dark" / "light" props). Tokens handle this automatically.
- A "DiffBadge" primitive on top of `Badge`. The 4-line composition (`<Badge color={...}>{sign}{pct}%</Badge>`) is fine. If it appears in 6+ places we revisit.

---

## 8. Open question round 2

1. **`StackedProgressBar` overflow behavior** — when raised > goal (Christmas Outreach in the v2 mock raised 109% of goal), do we (a) cap at 100% + show a `+9%` chip, (b) extend past 100% visually with a different bar, or (c) recompute the scale so the over-goal campaign sets the visual max? **My vote: (a).** Most legible; preserves cross-campaign comparability.
2. **MixBar minimum-segment width.** A segment representing 0.5% of a giver's total renders as 1px — invisible. Should we (a) hide segments below a threshold and add an "Other" bucket, or (b) enforce a 3px min width which distorts the proportions? **My vote: (a) with threshold 2%**, "Other" is honest and rare in practice.
3. **Sparkline data resolution** — monthly (12 buckets) or weekly (~52)? Monthly is consistent with everything else and fits 96px wide cleanly. **Default monthly, allow weekly via prop.**
