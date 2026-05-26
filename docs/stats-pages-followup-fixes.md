# Stats pages — follow-up fixes

Companion to [stats-pages-analysis.md](./stats-pages-analysis.md). That
doc proposed the initial refactor (commits `ea75789` FE / `014c0f7` BE);
a recall-biased code review of the result surfaced 10 findings, plus
two extra TZ instances discovered during verification. This doc records
exactly what changed, what we deliberately left unresolved, and where
to look next.

---

## What was done

### Backend (`church-app-backend`)

| File | Change | Why |
|---|---|---|
| `src/modules/core/transaction/repository/transaction.repository.ts:348` | `dayjs(row.date)` → `dayjs.utc(row.date)` in `summary().byMonth` | `giversReport` and the FE skeleton bucket by UTC month. Local-TZ bucketing caused the same gift to land in two different months between endpoints when the server TZ was not UTC. |
| `src/modules/core/pledge/repository/pledge.repository.ts:124-126` | `dayjs(resolvedDeadline)` and `dayjs()` → `dayjs.utc(...)` in `deriveLifecycle` | Lifecycle bucket flipped between `due-soon` / `on-track` depending on what UTC hour the request landed. Reviewer's convention: BE processes dates in UTC 0. |
| `src/modules/core/pledge/repository/pledge.repository.ts:356-359` | Same TZ fix in `toWithRelations` (`daysUntil`) | `daysUntil` is wire-visible — drove pill labels in the FE. Same off-by-one near midnight UTC. |
| `src/modules/core/pledge/repository/pledge.repository.ts:findUrgent` | SQL-side narrowing: 3-branch OR (own item-deadline / campaign deadline / item with null-deadline fallback) + `take: max(limit*6, 50)` | Previously loaded **every** `ACTIVE` pledge in the tenant before JS-filtering to top N. 50k-ACTIVE-pledge tenant would burn ~50k object allocations per dashboard hit. |
| `src/modules/core/pledge/repository/pledge.repository.ts:pledgesReport` | Added `orderBy: createdAt desc` + `take: 10000` backstop | All-time report with no date filter was unbounded — 100k-pledge tenant could OOM Node or hit a Postgres statement timeout. |
| `src/modules/core/transaction/repository/transaction.repository.ts:summary` | Added `byCampaign` bucket. New `groupBy({ by: ['campaignId'] })` runs in parallel with the existing `byType` groupBy; titles + tombstone flags resolved via a single `findMany({ where: { id: { in: ... } } })` wrapped in `withDeleted`. | `MemberOverviewTab` was iterating a `limit: 2000` transaction list to compute the same breakdown — silent truncation for long-tenure members. Now sourced from the same uncapped summary that drives the headline KPIs. |
| `…/transaction-feature/.../tenant/responses/transaction-summary-by-campaign.response.ts` (new) | New DTO `TransactionSummaryByCampaignDto` | OpenAPI surface for the new bucket. |
| `…/transaction-feature/.../tenant/responses/transaction-summary.response.ts` | Added `byCampaign: TransactionSummaryByCampaignDto[]` field | Wires the bucket into the response contract. |
| `…/transaction-feature/.../tenant/responses/index.ts` | Re-exports the new DTO | Standard barrel update. |
| `…/campaign-feature/.../tenant/requests/campaign-progress-batch.request.ts` | Body DTO (`campaignIds: string[]`) → query DTO (`ids: string`, transformed to `string[]`) with `@Transform`, `@ArrayMinSize(1)`, `@ArrayMaxSize(100)`, `@ArrayUnique`, `@IsString({ each: true })` | Switch to GET so the FE can use the standard `useApiQuery` (`[path, init]` query key). |
| `…/campaign-feature/.../tenant/campaign.tenant.controller.ts:progressBatch` | `@Post → @Get`; `@Body → @Query`; added `@ApiQuery({ name: 'ids' })` | Same reason. Static `progress/batch` path still declared above the `:id` routes so Nest's matcher doesn't capture `progress` as a campaign id. |

### Frontend (`church-app`)

| File | Change | Why |
|---|---|---|
| `src/lib/api/pledges/keys.ts` | Added `/pledges/urgent` and `/pledges/reports/dynamics` to `PLEDGE_PATHS` | `invalidatePledges` was skipping these on every pledge or transaction mutation — OutstandingPledgesCard + PledgeDynamicsTab stayed stale until `staleTime` expired. |
| `src/lib/api/transactions/keys.ts` | Added `/transactions/unattributed` and `/transactions/reports/givers` to `TRANSACTION_PATHS` | Same class of bug — UnattributedCallout + GiversTab never refreshed after a transaction attribution change. |
| `src/lib/api/members/keys.ts` | Added `/members/{id}/summary` to `MEMBER_PATHS` | MemberOverviewTab's summary card kept pre-mutation totals after edits. |
| `src/lib/api/campaigns/keys.ts` | Added `/campaigns/progress/batch` to `CAMPAIGN_PATHS` | Dashboard deadline-watch card kept stale `raisedAmount` after a new transaction. |
| `src/lib/api/campaigns/tenant/hooks.ts:useCampaignsProgressBatch` | Switched from hand-rolled `useQuery({ queryKey: [path, tenantId, idsKey], queryFn: api.POST(...) })` to standard `useApiQuery` against the new GET endpoint, with `ids` as comma-separated query param | Original key shape `[path, tenantId, ...]` couldn't be matched by `invalidateCampaigns` (which expects `init.params.path.tenantId` at slot 2). |
| `src/components/pages/transactions/TransactionDetailPage.tsx:73` | Lifetime summary now passes explicit `dateFrom: "1970-01-01T00:00:00.000Z"`, `dateTo: "2999-12-31T23:59:59.999Z"` | BE's feature service applies a rolling 12-month fallback when both bounds are missing. The "Gifts from X · $Y lifetime" strip was actually showing the last 12 months. |
| `src/components/pages/members/MemberTransactionsTab.tsx:74` | Summary call now forwards `...toStateFilterFlags(state)` | When the admin toggled StateFilter to "Deleted", the list showed tombstones but the summary card above kept showing active-only totals. |
| `src/components/pages/members/MemberOverviewTab.tsx:114-117` | Reduced `useTransactions({ memberId, limit: 2000 })` → `limit: 8`. Used only for the recent-gifts strip now. | The byCampaign breakdown was iterating this list — silent truncation past 2000. |
| `src/components/pages/members/MemberOverviewTab.tsx:byCampaign useMemo` | Replaced FE reduction with `last12Q.data?.byCampaign` mapping | Reads server-aggregated buckets directly. No `limit` cap. |
| `src/lib/api/schema.d.ts` | Regenerated via `npm run api:types` | Picks up the new `byCampaign`, the `progress/batch` GET shape, and DTO additions. |

---

## Gaps in the implementation

### 1. `pledgesReport` is still a load-then-aggregate pattern with a 10k cap

The current shape:
```ts
const pledges = await this.prisma.pledge.findMany({
  where,
  include: PLEDGE_RELATION_INCLUDE,
  orderBy: { createdAt: "desc" },
  take: 10000,
});
// → loops to compute status totals, aging buckets, fulfillment % …
```

The 10k cap prevents the OOM scenario but **silently truncates** beyond
that. For very large tenants the totals will be biased toward the
most-recent cohort.

The correct fix is two SQL-side aggregations:
- `pledge.groupBy({ by: ['status'], _count, _sum: { pledgedAmount } })` — accurate status counts + pledged totals
- `transaction.groupBy({ by: ['pledgeId'], where: { pledge: cohort }, _sum: { amount } })` joined to pledge.status in JS — accurate per-status paid totals

Aging buckets still need per-pledge lifecycle derivation (depends on
deadline + paidAmount), which Prisma can't express in SQL without
`$queryRaw` (and we've banned that). Aging is the genuine ceiling on
this endpoint — the 10k cap mainly hurts the aging accuracy, not the
top-line totals.

### 2. `findUrgent` oversample is a best-guess

`take: Math.max(limit * 6, 50)` is enough for the normal case where most
candidate pledges fall into the `past-due` / `due-soon` buckets. It can
under-pull when the tenant has many pledges with deadlines very near the
30-day horizon — those rows arrive in arbitrary Prisma order (no
`orderBy`) and JS-side sort might prefer entries that were pruned by the
`take`. Symptom: top-8 occasionally misses a pledge that should rank.

Mitigation: pass `orderBy: { campaignItem: { deadline: 'asc' } }` (Prisma
allows ordering by 1-to-1 relations) or oversample more aggressively
(`limit * 20`). Neither is in this PR.

### 3. `TransactionSummary.byCampaign` reuses the soft-delete shape

The new bucket lookup uses `withDeleted("Campaign", …)` so an archived
campaign still surfaces a title + `campaignDeletedAt` flag. **Soft-
deleted transactions** are filtered by the extension naturally (via
`applyStateFilter`), so the `byCampaign` totals match the soft-delete
state the caller asked for. No bug, but: there's no UI yet that surfaces
`campaignDeletedAt` on the breakdown — `MemberOverviewTab` ignores the
flag. Mode-B label rendering is a follow-up.

### 4. Date-range "lifetime" sentinels are FE-side magic

`TransactionDetailPage` sends `1970-01-01` → `2999-12-31` to defeat the
BE's 12-month fallback. It works but it's brittle:
- Anyone migrating that call has to know to copy the sentinels.
- The fallback's existence is a quiet trap — if a new page forgets to
  pass dates, it silently gets the 12-month window instead of "all
  time".

Better: add a `range: 'lifetime' | 'window'` discriminator to the BE
request DTO, or kill the fallback entirely and require explicit dates
on every call. Not in this PR — would change behavior elsewhere.

### 5. Removed-features still removed

The original analysis ([T4](./stats-pages-analysis.md#t4)) called out
two things the code-review re-flagged but we did not restore:
- **Per-transaction sequence number** ("Gift #47 of M") on
  `TransactionDetailPage`. Needs either a BE window function or a
  maintained counter. Out of scope for this PR.
- **PledgeDynamicsTab cancellation-rate metric**. User explicitly
  decided to drop it during the previous refactor; flagged here only
  for traceability.

### 6. `MemberOverviewTab.byCampaign` matches the 12-month window, not lifetime

The summary used by the breakdown is the same `last12Q` that drives the
by-type donut and the monthly chart — last 12 months. The headline
"Lifetime giving" KPI above it comes from `useMemberSummary` (truly
lifetime, via BE-side `RANGE_FLOOR` / `RANGE_CEILING`).

If admins read the donut + segments as lifetime, they're wrong by
construction. The label on the segmented control reads "By campaign" —
no explicit "last 12 months" caveat. Worth either:
- Add a `byCampaign` field to `MemberSummaryResponseDto` (true lifetime,
  matching the headline), or
- Add a "Last 12 months" label to the breakdown card so the scope is
  legible.

---

## Areas to revisit

### Performance backstops

The numbers `take: 10000` (pledgesReport), `take: max(limit*6, 50)`
(findUrgent), and `limit: 8` (recent-gifts strip) were chosen for
correctness against the local dev dataset (one tenant, a few hundred
rows). They are reasonable starting points, not data-driven choices.
Once we have a production sample with realistic tail behavior, revisit:

- pledgesReport — does any tenant push past 10k pledges in the typical
  cohort window? If so, the SQL-only aggregation plan above becomes
  load-bearing.
- findUrgent — does the oversample miss pledges in the top-N for any
  real tenant? Easiest signal: log a warning when `enriched.length >=
  take` and the FE-side count of urgent items equals `limit` (i.e. the
  bucket may have been clipped).

### Invalidation coverage tests

`_PATHS` arrays are the load-bearing contract for FE cache freshness.
The 4 finds in this PR (one per entity's keys file) were all silent
misses — adding an endpoint without updating the path set produces no
type error and no test failure. Worth a quick assert at module-init
that every `useApiQuery` path in the FE appears in some `_PATHS` set,
or a generated check from `schema.d.ts`. Not implemented here.

### `useCampaignsProgressBatch` cache hit-rate

The query key now includes `{ ids: "a,b,c" }` after sorting. Two
dashboards rendering the same set of campaigns will share the cache;
different sets won't. That's fine for the current usage (always the
same 5 deadline-watch campaigns per render), but if a new caller passes
arbitrary ID combinations the cache effectively becomes per-combination.
At that point a per-id `useCampaignProgress` fan-out (with
`enabled: false` gating) might cache better despite the extra requests.

### `withDeleted` on byCampaign lookup

`transactionSummary` resolves campaign titles via `withDeleted` so
archived campaigns still surface a label. That's consistent with the
embedded `t.campaign` on every `TransactionResponseDto`. But the
*active* dataset filtering still depends on whether the caller passed
`includeDeleted` / `onlyDeleted` — and that flag governs **transaction**
soft-delete state, not the campaign's. The two are independent: an
active transaction can reference an archived campaign. Confirmed
correct, but worth a comment in the repo if anyone reads it later
expecting the flag to gate the campaign lookup too.

---

## Important notes

- **TZ convention is BE-in-UTC, FE-renders-local.** Anything new that
  uses `dayjs(...)` on a `Date` from Prisma should be `dayjs.utc(...)`.
  Two places in `pledge.repository.ts` slipped through the original
  refactor; both are now fixed. Grep `dayjs(row\.` periodically.

- **Hot-reload caveat.** The backend's `start:dev` (SWC watch) picks up
  controller/route changes automatically. Verified after this PR via
  `curl /api-docs-json` — confirmed `progress/batch` is `get`,
  `transaction-summary` has `byCampaign`. If a future change isn't
  showing in the OpenAPI JSON, restart manually before
  `npm run api:types`.

- **Cache-key contract.** Every `*_PATHS` array drives a predicate-
  matched invalidation. New endpoints **must** be added to the entity's
  `keys.ts`. The lint check doesn't enforce this — it only enforces UI
  primitives.

- **Pre-existing lint warnings.** `npm run check` reports 14 warnings
  in files this PR didn't touch (all `noArrayIndexKey` in
  `components/primitives/*` and one `noNonNullAssertion` in the auth
  layouts). They predate this work; left alone to keep the diff
  focused.

- **GET with comma-separated ids.** The `progress/batch` request format
  is `?ids=uuid1,uuid2,uuid3`. The 100-id cap from the previous POST
  shape is preserved via `@ArrayMaxSize(100)` post-transform. For a
  tenant pushing past 100 active campaigns near deadline, the FE would
  need to paginate the batch — currently it sends the dashboard's
  top-5 only, so we're nowhere near the cap.

- **Findings dropped during ranking.** Two real but lower-severity
  items were dropped from the top-10 and remain unaddressed:
  - `PledgeCampaignItemDto` / `TransactionCampaignItemDto` omit
    `deletedAt`, so the FE can't render a Mode-B `DeletedLabel` for an
    archived campaign-item earmark.
  - `MemberFeatureService.summary` calls `pledgeService.getAll(..., {
    memberId, limit: 10000 })` — same class as the pledgesReport cap,
    affects one member's lifetime pledge stats. Both are tracked here
    explicitly so they don't get lost.

- **Verification status.**
  - BE `tsc --noEmit`: clean
  - BE `biome check`: clean
  - FE `tsc --noEmit`: clean
  - FE `biome check`: 14 pre-existing warnings, none in touched files
  - OpenAPI JSON inspected to confirm `byCampaign`, GET `progress/batch`
  - **No runtime / UI smoke testing performed** — typecheck only

---

## Round 2 — Phases 1–5 + soft-delete extension fix

Follow-up rollout addressing the gaps + the database-layer audit. Closes
most of the items above; the deferred ones are listed in **What's next**.

### Phase 1 — Indexes + DTO/UI tweaks

| Change | Detail |
|---|---|
| Indexes | `Pledge(tenantId, createdAt)`, `Pledge(tenantId, status)`, `Member(tenantId, createdAt)` — added via `prisma migrate dev --name add_stats_indexes`. Targets `pledgesReport` cohort filter, `findUrgent`'s status filter, and the dashboard's new-members-this-week count. |
| `deletedAt` on DTOs | Added to `PledgeCampaignItemDto`, `TransactionCampaignItemDto`, `MyPledgeCampaignItemDto`; matching `select` widening in repos. Closes the Mode-B label gap flagged in the **Findings dropped during ranking** note above. |
| MemberOverviewTab scope label | The card title already reads `"Breakdown (last 12 months)"` — no change needed. (Phase 1 originally proposed adding a caption.) |

### Phase 2 — `Pledge.paidAmount` denormalization

| Change | Detail |
|---|---|
| Schema migration | `paidAmount Decimal @default(0)` added via `prisma migrate dev --name add_pledge_paid_amount`. |
| Backfill | `scripts/backfill-pledge-paid-amount.ts` — sums non-deleted transactions per pledge + flips status to match (`ACTIVE → FULFILLED` if paid ≥ pledged). Idempotent; safe to re-run. |
| `PledgeRepository.adjustPaidAmount(tenantId, id, delta)` | Atomic `$transaction` — increments `paidAmount` + auto-transitions status between ACTIVE and FULFILLED. Symmetric: a void/delete that drops paid below pledged flips FULFILLED → ACTIVE. CANCELLED never touched. |
| `TransactionFeatureService` wired | All mutation paths call `adjustPaidAmount`: `record`, `recordMany` (batched per pledge), `update` (delta-aware: revert old + apply new on pledgeId change), `delete`, `restore`. |
| Integration test | `test/integration/pledge-paid-amount.integration.test.ts` — 10 cases: increment, accumulate, decrement, zero-delta no-op, auto-promote, overpayment, auto-demote on void, CANCELLED untouched, threshold non-crossing on either side. All passing. |
| Dropped `deriveStatus` | JS-side derivation removed — `pledge.status` is now authoritative in storage. |
| Dropped `findAutoFulfilledIds` | No longer needed; status filter is a direct column match. |

### Phase 3 — Reports rewrite (uses Phase 2 fields)

| Change | Detail |
|---|---|
| `pledgesReport` | Two-half rewrite. `statusBreakdown` is now a single `pledge.groupBy({ by: ['status'], _sum: { pledgedAmount, paidAmount } })` — uncapped, accurate. Aging buckets narrow to `status: ACTIVE` + `paidAmount: { lt: pledgedAmount }` in SQL before JS-bucketing; the 10k cap now only affects truly-active-underpaid rows (closes original Gap #1's bias issue for top-line totals; aging is still capped but on a much smaller set). |
| `findUrgent` | Added `paidAmount: { lt: this.prisma.pledge.fields.pledgedAmount }` to the SQL filter. Uses stored `paidAmount` directly — eliminated the per-call `transaction.groupBy`. |
| `transactionSummary.byMonth` | Replaced `findMany + JS bucketing` with N parallel `transaction.aggregate` calls — one per UTC month in the window. Uses `@@index([tenantId, date])`. No more "pull every row in window" pattern. |
| `MemberFeatureService.summary` | New `PledgeService.getStatsForMember` does a single `pledge.groupBy(['status'])` returning counts + pledgedTotal + paidTotal. **Closes the `limit: 10000` cap** flagged in the dropped-findings note. |

### Phase 4 — `lifetime?: boolean` flag

| Change | Detail |
|---|---|
| `TransactionSummaryQueryRequestDto.lifetime?: boolean` | Added with `@Transform` for string/bool coercion. |
| Feature service | When `lifetime: true` (and no explicit bounds), skips the 12-month rolling-window fallback and uses `RANGE_FLOOR`/`RANGE_CEILING` server-side. |
| `TransactionDetailPage` | Replaced FE-side `1970-01-01` / `2999-12-31` sentinels with `{ lifetime: true }`. **Closes original Gap #4.** |

### Phase 5 — Invalidation-coverage tooling

| Change | Detail |
|---|---|
| `scripts/check-invalidation-paths.mjs` | Walks each `src/lib/api/<entity>/` folder, extracts every `/api/v1/...` literal queried in `.ts` files, and verifies it appears in the entity's `keys.ts` `*_PATHS` array. Heuristic owns-the-path: only flags paths whose URL segment matches the entity folder name (cross-entity references are handled by the other entity's invalidator). |
| Wired into `npm run check` | Runs alongside `enforce-ui-primitives.mjs` and Biome. Fails CI on unlisted paths. |
| Caught 5 real misses | 3 in `invitations/keys.ts` (`/invitations/accept`, `/invitations/lookup`, `…/invitations/{id}/cancel`); 2 in `members/keys.ts` (`{id}/merge-preview`, `{id}/merge`). All added. |

### Bonus — Soft-delete extension bug found via `findUrgent`

While verifying the urgent card after Phase 3, a real past-due pledge wasn't
showing on the dashboard. Root cause turned out to be a latent bug in
[soft-delete.walker.ts](../../church-app-backend/src/infrastructure/prisma-client/soft-delete/soft-delete.walker.ts):

For Prisma's explicit `is:` / `isNot:` to-one filter syntax, the walker was
injecting `deletedAt: null` **alongside** `is:`, producing invalid Prisma
syntax that threw `PrismaClientValidationError`:

```ts
campaignItem: {
  is: { deadline: { lte: horizon } },
  deletedAt: null,  // ← Prisma rejects: sibling of `is:`
}
```

`findUrgent`'s 3-branch OR uses `is:` extensively (necessary for nullable
to-one relations), so the endpoint silently returned `undefined` →
TanStack Query swallowed the error → empty card. Wasn't caught by Phase 2
tests because they only exercise `adjustPaidAmount`, not `findUrgent`'s
where clause.

**Fix:** detect `is`/`isNot` keys and recurse **into** them instead of
merging at the outer level. `{ is: null }` and `{ isNot: null }` (sentinel
"no related row" / "any related row") are left alone — no inner where to
inject into.

Regression coverage: `test/integration/find-urgent.integration.test.ts`
— 4 cases pinning the past-due / status / data-drift scenarios.
71/71 integration tests passing.

### What got closed from the original gaps + dropped findings

| Original item | Status |
|---|---|
| Gap #1 — `pledgesReport` 10k cap on top-line totals | **Closed** by Phase 3 SQL-side `groupBy`. Aging still uses the cap but on the narrowed ACTIVE+underpaid set. |
| Gap #4 — lifetime sentinels are FE-side magic | **Closed** by Phase 4 `lifetime` flag. |
| Dropped finding — `PledgeCampaignItemDto` / `TransactionCampaignItemDto` missing `deletedAt` | **Closed** by Phase 1 DTO updates. |
| Dropped finding — `MemberFeatureService.summary` 10k pledge cap | **Closed** by Phase 3.4 (`getStatsForMember`). |
| Areas to revisit — Invalidation coverage tests | **Closed** by Phase 5 script. |

---

## What's next

Remaining items, ordered by ROI.

### 1. UI smoke testing (still pending)

Round 2 verified everything at the type-check + integration-test layer.
Browser-level smoke is still owed. The list from the previous doc still
applies — most of it is now more likely to pass because Phase 2/3 fixed
the underlying correctness issues:

- Dashboard → record a transaction → DeadlineWatchCard + OutstandingPledgesCard refresh (cache invalidation).
- Dashboard → OutstandingPledgesCard shows past-due pledges regardless of when created (soft-delete extension fix).
- Pledge fulfillment auto-transition: create pledge → record meeting tx → status flips to FULFILLED on the list.
- Auto-demotion: void the fulfilling tx → status flips back to ACTIVE.
- MemberOverviewTab → headline lifetime + by-campaign donut numbers add up.
- TransactionDetailPage → lifetime number is truly lifetime, not 12-month.
- Reports → Pledge Dynamics → status breakdown and aging update when cohort dates change.

### 2. `findUrgent` oversample heuristic (original Gap #2)

Still relies on `take: Math.max(limit * 6, 50)`. Phase 3.2 added the
`paidAmount: { lt: pledgedAmount }` SQL filter, which narrows the
candidate set significantly — but the oversample can still theoretically
under-pull for tenants with a heavy concentration of pledges near the
30-day horizon. Mitigation if it becomes a real problem: add
`orderBy: { campaignItem: { deadline: 'asc' } }` (Prisma supports
ordering by 1-to-1 relations) so the oversample picks the most-urgent
first instead of arbitrary Prisma order.

Probably revisit when we have prod telemetry — current backstop is
~50 rows, which is plenty for the dashboard's `limit: 8` use case.

### 3. Performance backstop tuning (data-driven)

Three numbers still need real-tenant data to validate:
- `pledgesReport` aging cap — `take: 10000` against the narrowed
  ACTIVE+underpaid set. Likely fine in practice; reconsider if any
  tenant pushes past 10k *open underpaid* pledges (unlikely outside the
  largest churches).
- `findUrgent` oversample — see #2.
- `useCampaignsProgressBatch` cache key — sorted comma-separated `ids`
  string. Dashboard always sends the same 5 ids, so cache hit-rate is
  ~100%. If a new caller passes arbitrary id sets, the cache becomes
  per-combination; switch to per-id fan-out at that point.

### 4. Deliberately deferred (decided not to do)

- **"Gift #N of M" sequence** on `TransactionDetailPage` — user
  confirmed to skip; the page already shows "Gift from X · $Y lifetime"
  which carries the load-bearing info.
- **`PledgeDynamicsTab` cancellation-rate metric** — user dropped during
  the original refactor; no plans to revive.
- **`MemberOverviewTab.byCampaign` lifetime vs 12-month** — user chose
  to keep on `transactionSummary` (12-month window matching the donut)
  and rely on the existing `"Breakdown (last 12 months)"` card title.
- **`Campaign.goalAmount` denormalization** — CLAUDE.md domain model
  keeps the goal computed as `sum(items.targetAmount)`. The extra
  groupBy per progress call is fine at current scale; reconsider only
  if many-progress-bar pages emerge.
- **`Transaction.dateMonth` generated column** — N parallel aggregates
  cover the current `byMonth` use case (N is always small). Worth
  revisiting only if we add a multi-dimensional time report (e.g.
  campaign × month matrix) where a single `groupBy(['campaignId',
  'dateMonth'])` would replace N×M aggregates.

### 5. Soft-delete extension hardening (follow-up to the bonus fix)

The walker fix only patched the to-one `is:` / `isNot:` path. There's no
test in the extension suite that covers Prisma's explicit-filter syntax —
worth adding so a future change can't silently regress it. The
`find-urgent` integration test covers the production code path, but a
focused test in `soft-delete.integration.test.ts` would catch it
earlier (and document the supported syntax explicitly).

### Verification status (Round 2)

- BE `tsc --noEmit`: clean
- BE `biome check`: clean
- BE `test:integration`: **71/71 passing** (10 new `pledge-paid-amount`, 4 new `find-urgent`, 57 existing soft-delete)
- FE `tsc --noEmit`: clean
- FE `biome check`: 14 pre-existing warnings, none in touched files
- FE `check-invalidation-paths.mjs`: green
- Live OpenAPI inspected: `lifetime` flag visible on `/transactions/summary`; `/pledges/urgent` accepts `dateFrom`/`dateTo` (unused by current dashboard, retained for future cohort-scoped callers)
- **Browser smoke: still pending**
