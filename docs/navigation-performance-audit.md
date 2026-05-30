# Navigation Performance Audit — Church Management App

**Date:** 2026-05-30
**Scope:** Frontend ([church-app](.) — Next.js 16 App Router, React 19, TanStack Query v5, openapi-fetch, Firebase auth, Serwist PWA) and Backend ([church-app-backend](../church-app-backend) — NestJS 11, Prisma 7 + `@prisma/adapter-pg`, Firebase Admin, soft-delete Prisma extension).
**Question driving the audit:** *Navigation feels slow.* The user suspected the app is not fully using Next.js (SSR/RSC, streaming, prefetching, caching) and that there may be FE/BE inefficiencies. Both suspicions are confirmed.

## Methodology

This report was produced by a multi-agent audit:

- **11 parallel deep-read dimensions** — each agent owned one slice (SSR/RSC rendering, nav streaming, client data fetching, auth overhead, bundle splitting, caching/PWA/headers, build config, backend N+1, backend DB/Prisma, backend caching/response pipeline, and cross-cutting round-trip traces).
- **Adversarial per-dimension verification** — every finding was independently re-read against the cited file and line numbers; several claims were *adjusted* (severity lowered, impact reframed) or *rejected* where the evidence did not hold. Those adjustments are preserved below so the report does not over-claim.
- **Completeness critics + gap-fill** — a second pass looked for missing dimensions (observability, auth-expiry hard reloads, image pipeline, router client-cache) and added the findings tagged "gap-fill follow-up".

Every finding cites at least one concrete file + line. Backend paths are prefixed `../church-app-backend/`.

---

## 1. Executive Summary

Navigation feels slow because **the app pays the full cost of request-time dynamic rendering on every route change but gets none of the benefits** — no server-fetched data, no streamed skeleton, no warm prefetch — and then makes the browser redo all the work client-side behind a Firebase auth handshake and a fan of network round-trips.

The 8 highest-leverage takeaways, in plain language:

1. **Every page ships an empty shell, then fetches all its data client-side.** RSC data prefetching is essentially unused — `serverApi` exists and is documented for exactly this, but is called in only one place (super-admin slug validation). So each navigation is *blank → spinner → data*, never *arrives with content*. ([finding A1](#a1))
2. **There is no instant loading state.** Zero `loading.tsx`, zero `<Suspense>`, zero `next/dynamic` anywhere in `src/`. The previous page freezes during the dynamic render + auth verification, with no skeleton to make the transition feel instant. This is also why `<Link>` prefetch buys nothing (dynamic routes are only prefetchable when a loading boundary exists). ([finding B1](#b1), [finding B5](#b5))
3. **The session cookie is verified twice per navigation, over the network, un-deduplicated.** `getSessionUser()` runs in both the tenant layout and the perspective layout, each calling `verifySessionCookie(cookie, true)` — `checkRevoked=true` forces a Firebase round-trip. Wrapping it in React `cache()` collapses 2→1; dropping `checkRevoked` removes the network hop entirely. One-line, behavior-preserving quick win. ([finding D1](#d1), [finding D2](#d2))
4. **The backend re-verifies every single API request against Firebase.** A global guard runs `verifyIdToken(idToken, true)` (also `checkRevoked=true`) on every non-public request. Because all page data is client-fetched, a dashboard firing ~9 parallel queries triggers ~9 Firebase revocation round-trips on the backend — the largest avoidable per-request server latency source. ([finding J1](#j1))
5. **Client-side N+1 fan-outs on the most-visited surfaces.** The member dashboard and member campaigns list fire one request *per campaign* for progress (no self-side batch endpoint exists, though the admin side already has one). Pledge lists fan out a full `GET /campaigns/{id}` per visible campaign to read item deadlines the list response *already returns* as `resolvedDeadline`. ([finding H1](#h1), [finding H3](#h3), [finding C3](#c3))
6. **A latent critical backend bug: ~12,360 parallel queries per Member/Transaction detail load.** The "lifetime" summary uses a 1970→2999 date window, and the per-month aggregate loop computes 12,360 months — firing 12,360 `transaction.aggregate` queries whose result (`byMonth`) is then *discarded*. Throttled through a 10-connection pool, this turns a sub-100ms page into multi-second latency. ([finding H-crit](#h-crit))
7. **Heavy JS loads eagerly on first navigation.** All 30 modals (+ zod) are statically imported by `ModalHost` in the root layout; recharts (168 KB gzip, the largest chunk) is imported synchronously in 8 page composites; the dead `getClientDb()` drags the full Firestore SDK into the auth-critical Firebase chunk. None are code-split. ([finding E1](#e1), [finding E2](#e2), [finding E3](#e3))
8. **Forced-dynamic rendering for a CSP nonce that is no longer applied.** `await connection()` in the root layout taints every route as dynamic, blocking static shells, PPR, and useful prefetch — yet the nonce it forces is read into a dead `_nonce` variable and the inline theme script's `nonce={...}` is commented out. The dynamic posture is structural and caps perceived speed no matter how the data layer is tuned. ([finding G1](#g1), [finding A5](#a5))

A cross-cutting blind spot underlies all of this: **there is no telemetry** — no Web Vitals / route-transition timing on the client, no per-request duration logging on the backend. "Feels slow" cannot currently be quantified or attributed to a layer. Instrumentation is the gating fix that turns the rest of this audit into before/after numbers. ([finding D-obs-fe](#d-obs-fe), [finding J-obs-be](#j-obs-be))

---

## 2. Why navigation feels slow today — a concrete trace

Here is what actually happens when an authenticated admin clicks "Dashboard" (`/[slug]/admin/dashboard`). This trace is assembled from the cross-roundtrips findings ([Nav (a)](#x1), [Nav (b)](#x2), [Nav (c)](#x3)) and is line-verified.

```
CLICK  ───────────────────────────────────────────────────────────────────────
  │
  │ (1) <Link> prefetch warmed NOTHING reusable: route is dynamic (connection())
  │     + no loading.tsx + staleTimes.dynamic defaults to 0. So this is a cold,
  │     blocking server round-trip. The previous page just freezes.
  │
  ▼  SERVER (RSC render, fully blocking — no streamed fallback)
  │
  │ (2) [tenantSlug]/layout.tsx:22  → getSessionUser()
  │       → adminAuth.verifySessionCookie(cookie, true)   ← Firebase network RTT #1
  │
  │ (3) (admin)/layout.tsx:22       → getSessionUser()  AGAIN (no React cache())
  │       → adminAuth.verifySessionCookie(cookie, true)   ← Firebase network RTT #2
  │     These two are SERIALIZED (parent renders before child).
  │
  │ (4) RSC streams an EMPTY shell — page.tsx is a one-liner rendering a
  │     "use client" composite. Zero above-the-fold data. No skeleton.
  │
  ▼  BROWSER (hydrate, then the real work begins)
  │
  │ (5) Firebase client auth restore: authStateReady() (IndexedDB) + getIdToken()
  │     gates the FIRST wave of queries (client.ts:14-28).
  │
  │ (6) AdminDashboardPage fires 8 queries in parallel on mount + 1 more
  │     (useCampaignsProgressBatch) that WATERFALLS behind useCampaigns:
  │       useTransactionSummary(week), useTransactionSummary(priorWeek),
  │       useUnattributedSummary, useTransactions(limit:6), useCampaigns,
  │       useUrgentPledges(limit:8), useMembers(limit:1), useMembers(dateRange)
  │       ── then ── useCampaignsProgressBatch(deadlinedIds)   ← stage-2 round-trip
  │
  │ (7) EACH client request hits the backend global guard:
  │       verifyIdToken(idToken, true)   ← Firebase revocation RTT  ×N
  │       TenantGuard tenant.findFirst    ← uncached slug→id DB lookup ×N
  │       then the handler's own aggregate/list queries.
  │
  ▼  MEANINGFUL PAINT (each card resolves independently, popping in)
```

**Round-trip budget for one dashboard navigation:** 1 middleware hop + **2 serialized Firebase session verifies on the RSC** (blank shell, no `loading.tsx`) + 1 empty nav payload + **~9 client API calls**, each carrying **its own Firebase `verifyIdToken` revocation round-trip** + a tenant lookup + the handler's queries. Net **~11 Firebase verifications and ~9 tenant lookups per dashboard nav**, while the user stares at the previous page then an empty shell.

It gets worse on other routes:

- **`/admin/pledges`** ([Nav b](#x2)): same 2 RSC verifies + blank shell, then `usePledges` + `useCampaigns` + `useMembers(limit:500)` fire in parallel (the 500-row member fetch is purely to build a name map and is on the table's loading gate), then a **client N+1 waterfall** — `useCampaignsManyWithItems` fans out one full `GET /campaigns/{id}` per visible campaign, but only *after* the pledge page resolves. A page spanning 10 campaigns = 3 + 10 = **13 client API calls**.
- **`/admin/campaigns/[id]`** ([Nav c](#x3)): a **2-call header waterfall** — `useCampaignProgress` is gated `enabled: Boolean(campaign)`, so it waits a full round-trip for `useCampaign` before starting. Switching to the Pledges tab fires *another* `useMembers(limit:500)` for the same navigation.

Every one of these is multiplied by the **default 10-connection Postgres pool** ([finding I-pool](#i-pool)): parallel fan-outs serialize into batches, converting in-process `Promise.all` concurrency into wall-clock latency.

---

## 3. Findings by area

Severity legend: **CRITICAL** · **HIGH** · **MEDIUM** · **LOW**. Effort: S (small) · M (medium) · L (large).

### A) Rendering & SSR/RSC

<a id="a1"></a>
**A1. All page data is fetched client-side; `serverApi` (the RSC client) is used in exactly one place and never for page data.**
`HIGH` · `L` · `high confidence`

**Evidence:** The RSC client's own comment documents the unrealized use case at [src/lib/api/server.ts:14](src/lib/api/server.ts#L14)-17 ("pre-render dashboards with data instead of waterfalling on the client"). Its only call site is gated behind `!isMember && user.isSuperAdmin` at [src/app/[tenantSlug]/layout.tsx:39](src/app/[tenantSlug]/layout.tsx#L39)-41, so it does not even run for normal members. Both dashboards are `"use client"` and pull every datum through client hooks: [src/components/pages/dashboard/AdminDashboardPage.tsx:1](src/components/pages/dashboard/AdminDashboardPage.tsx#L1), [src/components/pages/member-dashboard/MemberDashboardPage.tsx:1](src/components/pages/member-dashboard/MemberDashboardPage.tsx#L1).

**Impact:** On every route change the server sends an empty shell with no above-the-fold data. The browser hydrates, completes the Firebase auth handshake, then issues API requests before anything paints — *blank → spinner → data*. This is the single largest contributor to navigation feeling slow.

**Recommendation:** Move first-paint reads to RSCs using the existing `serverApi`. Fetch the page's primary queries in the server layout/page and seed the client cache via TanStack Query's `HydrationBoundary` + `dehydrate` so client hooks resolve instantly. Start with the two dashboards and the high-traffic list pages (pledges, transactions, members). This requires lifting fetching out of the `"use client"` composites — fetch in the RSC, hydrate, keep the composite client-side for interactivity. See also [A6 — hydration plumbing](#a6).

<a id="a6"></a>
**A6. RSC layouts resolve auth/membership server-side but seed nothing into the client cache (no `HydrationBoundary`).** *(gap-fill)*
`HIGH` · `L` · `high confidence`

**Evidence:** The client `QueryProvider` is created fresh with no hydration path at [src/lib/api/providers.tsx:1](src/lib/api/providers.tsx#L1)-15. The admin layout already computes memberships server-side ([src/app/[tenantSlug]/(admin)/layout.tsx:34](src/app/[tenantSlug]/(admin)/layout.tsx#L34)-54) but passes none of it to a dehydrated cache. The dashboard then fires ~9 cold queries ([src/components/pages/dashboard/AdminDashboardPage.tsx:50](src/components/pages/dashboard/AdminDashboardPage.tsx#L50)-145).

**Impact:** First meaningful paint is delayed by a full client-side waterfall (`authStateReady` → `getIdToken` → N parallel round-trips) with nothing seeded.

**Recommendation:** Introduce a server `QueryClient` factory (`getQueryClient` via React `cache()`) + a `dehydrate`/`HydrationBoundary` wrapper. In each tenant page's RSC, `serverApi.GET` the first-screen query and `qc.setQueryData`/`prefetchQuery` under the **exact `[path, init]` key** the client hook uses (keys are `[path, init]` per [src/lib/api/hooks.ts:86](src/lib/api/hooks.ts#L86)), then wrap children in `<HydrationBoundary state={dehydrate(qc)}>`.

<a id="a7"></a>
**A7. Super-admin tenant navigation blocks the whole subtree on an awaited `serverApi.GET` whose result is discarded instead of seeded.** *(gap-fill)*
`MEDIUM` · `M` · `high confidence`

**Evidence:** [src/app/[tenantSlug]/layout.tsx:34](src/app/[tenantSlug]/layout.tsx#L34)-52 awaits `serverApi.GET("/api/v1/tenants/{tenantId}")` only to decide 404-vs-render, then throws the payload away — while the comment at [src/lib/api/server.ts:15](src/lib/api/server.ts#L15)-17 warns against exactly this waterfall.

**Impact:** For super-admins, every tenant navigation serially blocks the entire `[tenantSlug]` subtree on a backend round-trip, and the fetched tenant record is then re-fetched client-side.

**Recommendation:** Keep the existence check but reuse its payload — seed the tenant response into a dehydrated `QueryClient` under the client hook's key so the cache starts warm.

<a id="a5"></a>
**A5. Root layout forces app-wide dynamic rendering via `await connection()` for a CSP nonce whose application-level read is dead code.**
`LOW` · `S` · `medium confidence`

**Evidence:** [src/app/layout.tsx:37](src/app/layout.tsx#L37)-47 calls `await connection()`, reads the nonce into `_nonce` (never used), and the inline theme script's `nonce={nonce}` is commented out at [src/app/layout.tsx:66](src/app/layout.tsx#L66)-67. The proxy sets the nonce + CSP per request at [src/proxy.ts:116](src/proxy.ts#L116)-117.

**Impact:** Low on its own — `cookies()` and `headers()` in the same layout already force dynamic rendering, so `connection()` is redundant, not the cause. The real cost is that the global dynamic render produces no server-fetched data ([A1](#a1)), so the tax is paid with no payoff. *(Severity lowered to LOW in verification so it does not compete with the genuine high-severity items; the structural dynamic-rendering ceiling is captured at [G1](#g1).)*

**Recommendation:** Delete the dead `_nonce` read. Do not remove the nonce from the CSP header (it is load-bearing for framework scripts under `strict-dynamic`). `connection()` can be removed (changes nothing functionally). The high-value move is making the already-forced dynamic render earn its cost by fetching data server-side.

---

### B) Navigation & Streaming

<a id="b1"></a>
**B1. Zero `loading.tsx` / `error.tsx` / `template.tsx` / `<Suspense>` / `next/dynamic` anywhere in `src/`.**
`HIGH` · `M` · `high confidence`

**Evidence:** `find src/app` for `loading.tsx`/`error.tsx`/`template.tsx`/`global-error.tsx` → **0 results**; `grep` for `Suspense` and `next/dynamic` across `src` → **0 files**. Only [src/app/not-found.tsx](src/app/not-found.tsx) and [src/app/[tenantSlug]/not-found.tsx](src/app/[tenantSlug]/not-found.tsx) exist. `next.config.ts` has no experimental/streaming config ([next.config.ts:46](next.config.ts#L46)-69).

**Impact:** With no `loading.tsx`, the App Router holds the previous page frozen during the dynamic render + double auth verification — no instant skeleton. With no `<Suspense>`, the server cannot stream partial UI. With no `next/dynamic`, chart-heavy widgets and the modal/sheet hosts inflate each route's first-load JS.

**Recommendation:** Add `loading.tsx` at the `(admin)` and `(member)` group levels (and key list routes) rendering an `AppShell` skeleton so navigation paints instantly — the cheapest perceived-speed win available. Add `error.tsx` for graceful failure. Wrap below-the-fold dashboard cards in `<Suspense>` once RSC data fetching lands. Code-split recharts via `next/dynamic({ ssr: false })`.

<a id="b5"></a>
**B5. `<Link>` prefetch is a no-op: forced-dynamic root + no `loading.js` + `staleTimes.dynamic=0` ⇒ prefetch fetches nothing reusable, so every click is a full RSC round-trip.** *(gap-fill)*
`HIGH` · `M` · `high confidence`

**Evidence:** No `experimental` block in [next.config.ts:46](next.config.ts#L46)-69 (so `staleTimes.dynamic` defaults to 0; docs `staleTimes.md:27-28`). Next's prefetch docs (`prefetching.md:26-30`) state dynamic pages are *not* prefetched and *do* pay a server round-trip on click unless `loading.js` exists. `await connection()` taints every route dynamic ([src/app/layout.tsx:37](src/app/layout.tsx#L37)-40). Nav links use default prefetch against these uncacheable routes: [src/components/layout/sidebar/SidebarNav.tsx:19](src/components/layout/sidebar/SidebarNav.tsx#L19)-21, [src/components/layout/mobile/MobileBottomNav.tsx:64](src/components/layout/mobile/MobileBottomNav.tsx#L64).

**Impact:** Hover/viewport prefetch warms nothing reusable; every sidebar/bottom-nav click triggers a fresh blocking server RSC render with no instant transition. A structural cap on perceived speed that query-cache tuning cannot fix.

**Recommendation:** Three coordinated changes — (1) `experimental.staleTimes: { dynamic: 30, static: 180 }`; (2) `loading.tsx` at the group level so dynamic routes become prefetchable up to the boundary; (3) remove `await connection()` from the root layout (the nonce it forces is unused). After all three, re-navigation hits the client cache instead of the server.

<a id="b6"></a>
**B6. Layouts do uncached runtime data access (cookies + Firebase verify) with no `loading.tsx` and Cache Components off — navigation blocks with no streamed fallback.** *(gap-fill)*
`HIGH` · `M` · `high confidence`

**Evidence:** [src/app/[tenantSlug]/layout.tsx:22](src/app/[tenantSlug]/layout.tsx#L22)-52 awaits `getSessionUser()` (and a `serverApi` fetch for super-admins) before rendering children. No `cacheComponents`/PPR flag in [next.config.ts:46](next.config.ts#L46)-69. Next's layout docs (`layout.md:322`) are explicit: *"Without Cache Components: the navigation will block until the layout finishes rendering, and the `loading.js` fallback will not be shown."*

**Impact:** On the first navigation into a tenant group, the user stares at the previous route until the serialized Firebase round-trips resolve — no skeleton, no streaming.

**Recommendation:** Add `loading.tsx` at the `(admin)`/`(member)` and `[tenantSlug]` levels, and either move the super-admin `serverApi` slug check out of the blocking path or wrap it in its own `<Suspense>`.

<a id="b3"></a>
**B3. Shell (AppShell/Sidebar/TopBar) is correctly preserved across navigation — *ruling out* shell remount as a latency source.**
`LOW` · `S` · `high confidence` · *positive finding*

**Evidence:** `AppShell` is rendered from the group layout ([src/app/[tenantSlug]/(admin)/layout.tsx:42](src/app/[tenantSlug]/(admin)/layout.tsx#L42)-54), so it is not remounted on page-segment changes. The only per-nav client work is `usePathname` string recompute for active links ([src/components/layout/sidebar/SidebarNav.tsx:11](src/components/layout/sidebar/SidebarNav.tsx#L11)-17) and breadcrumbs ([src/components/layout/top-bar/DynamicBreadcrumbs.tsx:25](src/components/layout/top-bar/DynamicBreadcrumbs.tsx#L25)-32) — pure, negligible.

**Impact:** Confirms the slowness is the empty-shell-then-client-fetch pattern, *not* shell re-rendering. Note: because Next reuses unchanged layouts across sibling navigations, the double-`verifySessionCookie` cost ([D1](#d1)) recurs on full loads and cross-layout/cross-tenant navs, **not** on every in-perspective page click.

**Recommendation:** No performance change needed. Keep the shell in the layout. `buildNav()`/breadcrumb mapping are unmemoized ([SidebarRoot.tsx:31](src/components/layout/sidebar/SidebarRoot.tsx#L31), [MobileChrome.tsx:33](src/components/layout/mobile/MobileChrome.tsx#L33)-39) but the cost is microseconds and they do not re-run on cached sibling navs — memoize only for hygiene, not speed.

<a id="b4"></a>
**B4. Middleware runs on every real navigation generating a fresh CSP nonce that is ultimately unused; prefetches are correctly excluded.**
`LOW` · `S` · `high confidence`

**Evidence:** Nonce generated per matched request at [src/proxy.ts:91](src/proxy.ts#L91)-92; prefetch requests skipped via the `missing` matcher at [src/proxy.ts:124](src/proxy.ts#L124)-137. The forwarded nonce is never consumed ([src/app/layout.tsx:47](src/app/layout.tsx#L47),67).

**Impact:** Middleware is **not** a primary latency source (confirming the seed assumption). But the nonce machinery is wasted work and a latent CSP gap.

**Recommendation:** Either consume the nonce (apply `_nonce` to the inline theme script) or switch to a hash-based static CSP. Do not add inline auth bypasses.

---

### C) Client Data Fetching

<a id="c5"></a>
**C5. QueryClient has no `placeholderData`/`keepPreviousData`/`initialData` and no prefetch — every filter, page step, and 30s-stale revisit flashes a skeleton and refetches from scratch.**
`HIGH` · `S` · `high confidence`

**Evidence:** Defaults are `staleTime: 30_000, refetchOnWindowFocus: false, retry: 1` with nothing else at [src/lib/api/providers.tsx:15](src/lib/api/providers.tsx#L15)-23. `useApiQuery` only spreads caller options ([src/lib/api/hooks.ts:86](src/lib/api/hooks.ts#L86)-98). `grep` for `placeholderData|keepPreviousData|initialData|prefetchQuery|HydrationBoundary|dehydrate` across `src` → **0 matches**. The query key is `[path, init]` and `init` carries `offset`/`limit`/filters, so any change is a new key ([src/components/pages/pledges/PledgesListPage.tsx:97](src/components/pages/pledges/PledgesListPage.tsx#L97)-102). `DataTable` swaps rows for skeletons whenever `loading` is truthy ([src/components/primitives/DataTable.tsx:100](src/components/primitives/DataTable.tsx#L100)-110).

**Impact:** Paginated/filtered list navigations (pledges, transactions, members) blank out and show a spinner on every page/filter/date-range change instead of keeping prior rows while refetching. This hits the most frequent in-list interactions and reads as a hard reload each time.

**Recommendation:** Set `placeholderData: keepPreviousData` (import from `@tanstack/react-query`) as a QueryClient default or per list hook. Pair with an `isFetching`-driven opacity dim. Consider raising `gcTime` so back-navigation reuses cache, and raising `staleTime` for slow-changing lookup tables. *Note:* this does **not** smooth tab-switch first-fetches (distinct keys, not paginated variants) — that belongs to the prefetch/hydration work ([A6](#a6)).

<a id="c3"></a>
**C3. Pledge/campaign list surfaces fan out a full `GET /campaigns/{id}` per campaign to read item deadlines the pledge list ALREADY returns as `resolvedDeadline`.**
`MEDIUM` · `S` (FE-only) · `high confidence`

**Evidence:** `useCampaignsManyWithItems` fans out one full campaign-with-items GET per id ([src/components/pages/dashboard/useCampaignsManyWithItems.ts:27](src/components/pages/dashboard/useCampaignsManyWithItems.ts#L27)-61), consumed by [src/components/pages/pledges/PledgesListPage.tsx:133](src/components/pages/pledges/PledgesListPage.tsx#L133)-141 only to feed `resolvePledgeDeadline`. But the pledge list response **already carries** `resolvedDeadline` ([../church-app-backend/src/modules/features/pledge-feature/controllers/tenant/responses/pledge.response.ts:64](../church-app-backend/src/modules/features/pledge-feature/controllers/tenant/responses/pledge.response.ts#L64)), and a sibling surface already consumes it directly ([src/components/pages/members/MemberPledgesTab.tsx:99](src/components/pages/members/MemberPledgesTab.tsx#L99)). The FE `resolvePledgeDeadline` ([src/components/pages/admin-shared.ts:97](src/components/pages/admin-shared.ts#L97)-111) just re-derives `item.deadline ?? campaign.deadline` — exactly what the backend already computed.

**Impact:** N extra round-trips + heavy over-fetch (full campaign DTOs) purely to re-derive a value the API already returns. *(Verification corrected the original premise: no backend change is needed — `resolvedDeadline` is already exposed, dropping effort from M to S.)*

**Recommendation:** **FE-only fix.** Replace `resolvePledgeDeadline(p, c, itemDeadlinesById)` with `p.resolvedDeadline` on every pledge surface and delete `useCampaignsManyWithItems` / `useMyCampaignsManyWithItems` entirely. Re-check `PledgeDetailPage`/`MemberPledgeDetailPage` too. *(Note: a separate finding [I2](#i2) tracks the case where the same hook genuinely needs a batch endpoint; if a true campaign-items view ever needs more than the resolved deadline, add a lightweight `GET /campaigns/items?ids=`.)*

<a id="c4"></a>
**C4. Members list over-fetches `limit:500` transactions on every load to build client-side sparklines.**
`MEDIUM` · `M` · `high confidence`

**Evidence:** [src/components/pages/members/MembersListPage.tsx:78](src/components/pages/members/MembersListPage.tsx#L78)-90 fetches `useTransactions({ dateFrom: 12-months-ago, limit: 500 })` and reduces it into 12-month buckets in JS via `buildMonthlyByMember` ([src/components/pages/members/MembersListPage.tsx:37](src/components/pages/members/MembersListPage.tsx#L37)-56). The in-file comment flags this as preview-quality and a truncation risk at scale.

**Impact:** The members list itself paginates to ~20, so the 500-row transaction fetch dominates the route's transfer + parse cost. Parallel with the list query (not a dependent waterfall), so it inflates payload, not round-trips — hence MEDIUM.

**Recommendation:** Add the backend `members/giving-trend?months=12` rollup the comment already flags and drop the `limit:500` fetch. Removes a large payload and fixes the silent >500-row truncation.

<a id="c2"></a>
**C2. Member dashboard does a dependent 2-stage client N+1 fan-out (one request per campaign for progress, plus one per pledged-campaign for items).**
`HIGH` · `M` · `high confidence`

*(This is the FE-side view of the same defect tracked end-to-end at [H1](#h1); see there for the backend fix.)*

**Evidence:** `useMyCampaignProgressMany` and `useMyCampaignsManyWithItems` both use `useQueries` mapping campaign ids → one GET each ([src/components/pages/member-dashboard/useMyCampaignProgressMany.ts:25](src/components/pages/member-dashboard/useMyCampaignProgressMany.ts#L25)-46, [src/components/pages/member-dashboard/useMyCampaignsManyWithItems.ts:22](src/components/pages/member-dashboard/useMyCampaignsManyWithItems.ts#L22)-45). Ids are derived from prior list queries ([src/components/pages/member-dashboard/MemberDashboardPage.tsx:67](src/components/pages/member-dashboard/MemberDashboardPage.tsx#L67)-95), making it a stage-1 (lists) → stage-2 (per-id fan-out) waterfall. The in-code TODO acknowledges the missing batch endpoint. The admin dashboard already solved this with `useCampaignsProgressBatch` ([src/components/pages/dashboard/AdminDashboardPage.tsx:97](src/components/pages/dashboard/AdminDashboardPage.tsx#L97)).

**Impact:** The member dashboard cannot fan out until `useMyCampaigns` + `useMyPledges` resolve, then fires N + M individual requests. On a member with several campaigns this is the dashboard's slowest path.

**Recommendation:** Mirror the admin fix — add a self-side batch endpoint ([H1](#h1)) and replace the two fan-out hooks with single batched hooks. Combined with RSC hydration ([A1](#a1)), progress can arrive computed server-side.

---

### D) Auth Overhead

<a id="d1"></a>
**D1. `getSessionUser()` runs twice per tenant navigation and is not wrapped in React `cache()`.**
`HIGH` · `S` · `high confidence`

**Evidence:** [src/lib/auth/server.ts:34](src/lib/auth/server.ts#L34)-42 is a plain async function (no `import { cache } from "react"` anywhere in `src/`) that calls `adminAuth.verifySessionCookie(cookie, true)`. It is invoked in the outer tenant layout ([src/app/[tenantSlug]/layout.tsx:22](src/app/[tenantSlug]/layout.tsx#L22)) and again in the perspective layout ([src/app/[tenantSlug]/(admin)/layout.tsx:22](src/app/[tenantSlug]/(admin)/layout.tsx#L22), [src/app/[tenantSlug]/(member)/layout.tsx:18](src/app/[tenantSlug]/(member)/layout.tsx#L18)). 7 callers total exist, but exactly 2 fire per in-tenant nav.

**Impact:** Because RSC renders parent-before-child, the two verifications are serialized at the head of TTFB on every full load / cross-layout nav.

**Recommendation:** Wrap `getSessionUser` in `cache()` — request-scoped, behavior-preserving, collapses 2→1. One line, isolated, high-leverage.

```ts
import { cache } from "react";
export const getSessionUser = cache(async (): Promise<SessionUser | null> => { /* ... */ });
```

<a id="d2"></a>
**D2. `checkRevoked=true` on `verifySessionCookie` forces a Firebase network round-trip on every RSC auth check.**
`HIGH` · `S` · `high confidence`

**Evidence:** `verifySessionCookie(cookie, true)` at [src/lib/auth/server.ts:42](src/lib/auth/server.ts#L42). With `checkRevoked=false` the Admin SDK verifies the cookie signature locally against cached Google public keys (no network); with `true` it additionally calls Firebase to check revocation/disabled state.

**Impact:** One of two real server-side auth-latency contributors (the other being the backend per-request guard, [J1](#j1)). Combined with [D1](#d1), an in-tenant nav pays 2 such round-trips before streaming markup.

**Recommendation:** Prefer `checkRevoked=false` for the high-frequency navigation gate — a revoked session stays valid for navigations until cookie expiry, but the backend guard still re-checks revocation on the next data call (so a revoked user sees 401'd pages almost immediately). If you keep `true`, at minimum pair with the `cache()` fix so it runs at most once per request. Validate revocation requirements before flipping.

<a id="d-obs-fe"></a>
**D-obs-FE. No Web Vitals / route-transition telemetry on the client — navigation latency is unmeasured.** *(gap-fill)*
`HIGH` · `S` · `high confidence`

**Evidence:** Root layout mounts no Web Vitals reporter ([src/app/layout.tsx:37](src/app/layout.tsx#L37)-111); the only dev tool is `ReactQueryDevtools`, gated to development ([src/lib/api/providers.tsx:52](src/lib/api/providers.tsx#L52)-58). `grep` of `package.json` for `vitals|analytics|sentry|otel|posthog` → nothing; `web-vitals` is not a dependency; `find src -name 'instrumentation*'` → nothing.

**Impact:** Without LCP/INP/CLS/TTFB and `onRouterTransitionStart`, "feels slow" cannot be quantified or attributed (transition time vs data waterfall vs bundle parse). Every other FE finding stays a hypothesis until measured.

**Recommendation:** Add `src/app/instrumentation-client.ts` exporting `onRouterTransitionStart(url)` to time client transitions and `useReportWebVitals` (or the `web-vitals` package) to ship LCP/INP/CLS/TTFB tagged by route pattern. **This is the gating fix** — it turns the rest of the audit into before/after numbers.

<a id="d4"></a>
**D4. Client auth middleware awaits `authStateReady()` + `getIdToken()` before every API request.**
`LOW` · `S` · `high confidence`

**Evidence:** [src/lib/api/client.ts:14](src/lib/api/client.ts#L14)-28 awaits `auth.authStateReady()` then `user.getIdToken()` (no force-refresh) per request.

**Impact:** `getIdToken()` returns a cached token until ~5 min before its 1h expiry, so steady-state cost is near-zero; only cold-load-first-wave (IndexedDB restore) and hourly rotation pay a network refresh. The await is documented as fixing a real cold-reload 401 race.

**Recommendation:** Leave the await. This cost largely disappears once first-paint data is fetched server-side ([A1](#a1)). Optional: warm the token once at `AuthProvider` mount. Not a meaningful navigation lever.

<a id="d5"></a>
**D5. `X-Claims-Refreshed` re-mint is fire-and-forget with no de-dup guard.**
`LOW` · `S` · `high confidence`

**Evidence:** [src/lib/api/client.ts:99](src/lib/api/client.ts#L99)-103 fires `void handleClaimsRefreshed()` per matching response; the handler does `getIdToken(true)` + `POST /api/auth/session` ([src/lib/api/client.ts:71](src/lib/api/client.ts#L71)-89). The 401 path *does* have a `signOutInFlight` guard ([src/lib/api/client.ts:41](src/lib/api/client.ts#L41)-53); the claims-refresh path has no equivalent.

**Impact:** A burst of concurrent claim-refresh responses fires one refresh per response, wasting token refreshes + cookie mints and nibbling the rate-limit budget. No infinite loop (GET reads don't re-stamp).

**Recommendation:** Add a module-level in-flight guard mirroring `signOutInFlight` (or a short debounce) so concurrent refreshes collapse into one.

<a id="d6"></a>
**D6. `AuthProvider` wraps `QueryProvider` but does not gate render — no refetch storm; a redundant client-side auth source alongside the cookie gate.**
`LOW` · `S` · `high confidence`

**Evidence:** Children render unconditionally; context is memoized ([src/lib/auth/AuthProvider.tsx:27](src/lib/auth/AuthProvider.tsx#L27)-63). Three `useAuth` consumers only.

**Impact:** Not a navigation-speed lever. Minor triple-gating (proxy cookie check + RSC `getSessionUser` + this client redirect). *(But see [D7](#d7) — the redirect mechanism itself is a hard-reload hazard.)*

**Recommendation:** No performance change needed.

<a id="d7"></a>
**D7. `AuthProvider` hard-reloads the page on a null Firebase user — runs on every route and can false-positive during token restore / cross-tab sign-out.** *(gap-fill)*
`HIGH` · `M` · `high confidence`

**Evidence:** [src/lib/auth/AuthProvider.tsx:32](src/lib/auth/AuthProvider.tsx#L32)-59 wires `onAuthStateChanged` and, when `!user && !isPublic`, does `window.location.href = /login?next=...`. It is mounted in the root layout ([src/app/layout.tsx:88](src/app/layout.tsx#L88)-105) so it evaluates on every nav, keyed on the Firebase *client* user (restored async from IndexedDB) — not the session cookie that [src/proxy.ts:94](src/proxy.ts#L94)-100 actually enforces.

**Impact:** Any transient null (refresh-token hiccup, cross-tab sign-out via Firebase persistence sync, slow IndexedDB restore) flips `loading=false` then fires a **full document reload**, bouncing a user whose cookie is still valid — SPA-destroying and looks like a bug.

**Recommendation:** (1) Swap `window.location.href` for `router.replace`; (2) stop treating transient client-null as ground truth — debounce behind a grace window or remove the client redirect entirely and rely on `proxy.ts` + the 401 handler.

<a id="d8"></a>
**D8. Every 401 forces a full-page reload to `/login` instead of a soft router navigation.** *(gap-fill)*
`HIGH` · `M` · `high confidence`

**Evidence:** [src/lib/api/client.ts:42](src/lib/api/client.ts#L42)-66 (`handleUnauthorized`) does `await signOut()` + `DELETE /api/auth/session` then `window.location.href = /login?next=...`, triggered from the response middleware at [src/lib/api/client.ts:108](src/lib/api/client.ts#L108)-111.

**Impact:** On any expired/revoked session the whole document is re-downloaded, React re-hydrates from scratch, and the entire TanStack Query cache is discarded — the single most jarring perceived-latency event, happening exactly when a session lapses mid-use.

**Recommendation:** Replace `window.location.href` with `router.replace`. Consider one silent token refresh (`getIdToken(true)` + re-mint, plumbing already exists at [client.ts:71](src/lib/api/client.ts#L71)-89) before ejecting, so a one-off rotated-claim 401 doesn't eject the user at all.

<a id="d9"></a>
**D9. Invite "switch account" uses `window.location.reload()` instead of a router refresh.** *(gap-fill)*
`LOW` · `S` · `medium confidence`

**Evidence:** [src/components/pages/invite/InviteTokenPage.tsx:88](src/components/pages/invite/InviteTokenPage.tsx#L88)-91 calls `signOut()` then `window.location.reload()`.

**Impact:** Lower-traffic, but a full reload that discards the React tree and cache when the page already consumes `useAuth()` reactively.

**Recommendation:** Drop the reload; `onAuthStateChanged` will re-render the sign-in CTA. Use `router.refresh()` if an RSC re-fetch is needed.

---

### E) Bundle & Code-Splitting

<a id="e1"></a>
**E1. All 30 modals (and their zod form deps) are eagerly bundled via `ModalHost` in the root layout.**
`HIGH` · `M` · `high confidence`

**Evidence:** 30 static modal imports at [src/lib/modals/host.tsx:8](src/lib/modals/host.tsx#L8)-38; `ModalHost` rendered from the root layout at [src/app/layout.tsx:101](src/app/layout.tsx#L101)-102; barrel re-exports 30 modules ([src/components/modals/index.ts:5](src/components/modals/index.ts#L5)-34). The modal-barrel chunk is **122 KB raw / 31 KB gzip** on disk and contains zod (15 refs). RHF was *not* detected in this specific chunk.

**Impact:** Fetched and parsed on first authenticated navigation before the user opens any modal; most navigations open zero modals, so it is dead weight on time-to-interactive for every route change.

**Recommendation:** Make the modal registry lazy — replace the static imports in [src/lib/modals/host.tsx](src/lib/modals/host.tsx) with a `Record<ModalName, () => Promise<...>>` of `next/dynamic(() => import('@/components/modals/<name>'), { ssr: false })`. Keep the `declare module` type augmentations (type-only, erase at build). Apply the same to `SheetHost` ([src/lib/sheets/host.tsx:9](src/lib/sheets/host.tsx#L9)-12).

<a id="e2"></a>
**E2. recharts (586 KB / 168 KB gzip — the largest chunk) is imported synchronously in 8 page composites and never lazy-loaded; the `Charts.tsx` primitive meant to wrap it is dead code.**
`HIGH` · `M` · `high confidence`

**Evidence:** Direct top-level `import { ... } from "recharts"` in the dead [src/components/primitives/Charts.tsx:3](src/components/primitives/Charts.tsx#L3)-14 (0 importers), [src/components/primitives/Sparkline.tsx](src/components/primitives/Sparkline.tsx), and 8 composites including [src/components/pages/campaigns/CampaignOverviewTab.tsx:5](src/components/pages/campaigns/CampaignOverviewTab.tsx#L5)-14. The recharts chunk is **586 KB raw / 168 KB gzip** (87 refs), the largest static chunk. With zero `next/dynamic`, recharts is parsed synchronously into chart-bearing route chunks even when the chart is below the fold or on a non-default tab.

**Impact:** Blocks first meaningful paint on every chart-bearing route. `Charts.tsx`, the primitive intended to centralize recharts, has zero importers — the abstraction is defeated.

**Recommendation:** Route all chart usage through one lazy boundary — revive `Charts.tsx`, then have composites import it via `next/dynamic(() => import('@/components/primitives/Charts'), { ssr: false, loading: () => <ChartSkeleton/> })`. Delete the 8 direct recharts imports + Sparkline's. recharts is already in Next 16's default `optimizePackageImports`, so the remaining win is the async boundary, not barrel optimization.

<a id="e3"></a>
**E3. Firebase client bundle (293 KB / 90 KB gzip) drags in the full Firestore SDK via the dead `getClientDb()`/`getFirestore` import.**
`HIGH` · `S` · `high confidence`

**Evidence:** [src/lib/firebase/client.ts:3](src/lib/firebase/client.ts#L3) statically imports `getFirestore`; the only consumer, `getClientDb()` ([src/lib/firebase/client.ts:45](src/lib/firebase/client.ts#L45)-51), has zero callers in `src/`. The Firestore *implementation* is confirmed bundled (`firestore.googleapis.com` + `DocumentReference` present in the 293 KB chunk). *(Verification corrected a sub-claim: storage/messaging/performance/remote-config are NOT bundled — those strings are only component-name map entries.)*

**Impact:** The app only uses Firebase Auth (on the critical auth path), but ~90 KB gzip of unused Firestore loads on every fresh navigation before the first API call can fire.

**Recommendation:** Delete `getClientDb()` and the `getFirestore` import from [src/lib/firebase/client.ts](src/lib/firebase/client.ts). With only `firebase/app` + `firebase/auth` imported, Firestore tree-shakes out. Re-measure the chunk after removal.

<a id="e4"></a>
**E4. zod 4 ships a 314 KB / 74 KB-gzip chunk and is pulled onto the first-navigation path via the eager modal host.**
`MEDIUM` · `S` · `medium confidence`

**Evidence:** zod chunk is **314 KB raw / 74 KB gzip** (487 refs); every form modal uses `zodResolver` ([src/components/modals/record-gift/RecordGiftModal.tsx:3](src/components/modals/record-gift/RecordGiftModal.tsx#L3)-5), and zod is confirmed co-located in the eager modal-barrel chunk (15 refs).

**Impact:** zod is on the first-navigation critical path rather than loading only when a form opens. Largely a corollary of [E1](#e1).

**Recommendation:** Once modals are lazy-loaded ([E1](#e1)), verify zod no longer appears in the initial chunk set. Essentially a verification step for the host-lazification fix.

<a id="e5"></a>
**E5. Zero route-level code splitting — whole pages ship as synchronous client composites with no streaming or lazy tabs.**
`MEDIUM` · `M` · `high confidence`

**Evidence:** `find`/`grep` confirm zero `next/dynamic`, `React.lazy`, `<Suspense>`, and `loading.tsx`/`error.tsx`/`template.tsx` across `src`. Heavy optional detail tabs (e.g. `CampaignOverviewTab`'s recharts) sit in the route's synchronous chunk ([src/components/pages/campaigns/CampaignOverviewTab.tsx:5](src/components/pages/campaigns/CampaignOverviewTab.tsx#L5)-14).

**Impact:** On navigation the browser downloads + parses the full route chunk — including tabs the user may never open — before anything renders, with no skeleton.

**Recommendation:** Lazy-load non-default detail tabs (charts, reports) with `next/dynamic` + skeletons; add route-segment `loading.tsx`; lazify the modal/sheet hosts ([E1](#e1)).

---

### F) Caching / PWA / Headers

<a id="f1"></a>
**F1. `connection()` forces dynamic rendering app-wide, weakening `<Link>` prefetch and leaving the SW RSC-prefetch cache mostly cold.**
`HIGH` · `M` · `high confidence`

**Evidence:** [src/app/layout.tsx:37](src/app/layout.tsx#L37)-47 (`connection()` + dead nonce). The SW *does* have an RSC-prefetch bucket — a `NetworkFirst` cache at `@serwist/turbopack/dist/index.worker.mjs:167-176` — but with every route dynamic and no `loading.tsx`, prefetch warms little reusable payload, and the bucket is fed thin, short-lived dynamic RSC payloads. *(Verification corrected two overstatements: the prefetch carve-out in [src/proxy.ts:124](src/proxy.ts#L124)-138 is standard Next CSP hygiene, not evidence prefetch is deprioritized; and the SW bucket is `NetworkFirst`, so it re-validates over the network when online — it accelerates flaky/offline nav, not typical online round-trips.)*

**Impact:** Route changes are largely full server round-trips; the mechanism is "prefetch yields little cacheable payload," not "the SW bucket is forcibly empty."

**Recommendation:** Stop forcing global dynamic rendering for an unused nonce (remove `connection()` from the root layout), add `loading.tsx` skeletons, and consider PPR. Verify with the build route table flipping from ƒ (Dynamic) toward ○/● (Static/PPR) for shells. *(Note the structural ceiling at [G1](#g1): the nonce CSP itself must change for PPR.)*

<a id="f2"></a>
**F2. Service worker precaches build assets only — no app-shell route is precached, so cold/offline launch has no instant shell.**
`MEDIUM` · `M` · `medium confidence`

**Evidence:** `precacheEntries` is `__SW_MANIFEST` plus exactly one entry, `/~offline` ([src/app/sw.ts:32](src/app/sw.ts#L32)-46, [src/app/serwist/[path]/route.ts:13](src/app/serwist/[path]/route.ts#L13)-18). `start_url` is `/` ([src/app/manifest.ts:7](src/app/manifest.ts#L7)-9).

**Impact:** On cold PWA/TWA launch there is no precached HTML/RSC shell — navigation falls to `NetworkFirst` document handlers (live network needed) or `/~offline`. Partly downstream of [A1](#a1): there is no static HTML to precache while everything is dynamic.

**Recommendation:** After unblocking static rendering ([A1](#a1)/[G1](#g1)), add the launch shell to `additionalPrecacheEntries` (revisioned by git SHA), paired with `loading.tsx`. Keep `/api/` excluded (already correct).

<a id="f3"></a>
**F3. Remote avatar photos use a base-ui native `<img>`, not `next/image`; no `images` config, and Google/Firebase photo URLs miss the SW's extension-based image cache.**
`MEDIUM` · `M` · `high confidence`

**Evidence:** Avatars render through base-ui's native `<img>` ([src/components/primitives/Avatar.tsx:45](src/components/primitives/Avatar.tsx#L45) → [src/components/ui/avatar.tsx:28](src/components/ui/avatar.tsx#L28)-39); Google photo URLs have no extension ([src/components/pages/welcome/WelcomePage.tsx:174](src/components/pages/welcome/WelcomePage.tsx#L174)-177). `next.config.ts` has no `images` block. The SW image cache matches strictly by extension (`index.worker.mjs:52`), so extension-less Google URLs fall through to the `NetworkFirst` cross-origin bucket (32 entries / 1h, `index.worker.mjs:207-217`).

**Impact:** Full-size bytes, no resizing, no AVIF/WebP, and `NetworkFirst` re-requests over the network on each online navigation (capped at 32 entries). *(Important scoping — see [F6](#f6): the high-traffic list/dashboard avatars render initials-only and fetch zero remote images, so this is not on the slow-nav critical path.)*

**Recommendation:** Route avatar photos through `next/image` with `images.remotePatterns` for the Google/Firebase hosts (resized, WebP/AVIF, same-origin `/_next/image` SWR-cached), done inside the Avatar primitive. Or, if base-ui keeps the `<img>`, add a `CacheFirst`/`StaleWhileRevalidate` SW rule keyed on the photo host.

<a id="f6"></a>
**F6. Scoping corrections: the church logo is NOT an `<img>`, high-traffic avatars are initials-only, and Google avatars ARE SW-cached.** *(gap-fill, recon corrections)*
`LOW` · `S` · `high/medium confidence` · *positive/scoping findings*

**Evidence:** Church identity is text initials, not a logo `<img>` ([src/components/layout/sidebar/BrandHeader.tsx:21](src/components/layout/sidebar/BrandHeader.tsx#L21)-31, [src/components/layout/mobile/MobileTopBar.tsx:51](src/components/layout/mobile/MobileTopBar.tsx#L51)). List/dashboard avatars pass no `src` ([src/components/pages/members/MembersListPage.tsx:113](src/components/pages/members/MembersListPage.tsx#L113), [src/components/pages/transactions/TransactionsTable.tsx:84](src/components/pages/transactions/TransactionsTable.tsx#L84), [src/components/pages/dashboard/DashboardRecentGifts.tsx:87](src/components/pages/dashboard/DashboardRecentGifts.tsx#L87)). Google avatars are *not* in the SW auth-passthrough ([src/app/sw.ts:20](src/app/sw.ts#L20)-26), so they fall into `defaultCache` and *are* cached.

**Impact:** Correctly de-scopes image work from the navigation-speed complaint. The image pipeline is **not** on the critical path for the slow navigations; the RSC/client-fetch, duplicate `verifySessionCookie`, and campaign N+1 findings remain the real causes.

**Recommendation:** Do not prioritize image work for navigation speed. If a `next/image` change is made, scope it to the few surfaces that pass `src` (AvatarStack, super-admin admins, invite, welcome).

<a id="f4"></a>
**F4. RSC fetches via `serverApi` are globally `cache: "no-store"` — no Next data cache or request memoization.**
`LOW` · `S` · `high confidence`

**Evidence:** [src/lib/api/server.ts:74](src/lib/api/server.ts#L74)-79 sets `cache: "no-store"`.

**Impact:** Correct default for per-user authed reads; since `serverApi` is barely used today the immediate cost is tiny. The value is the note that there is zero server-side caching safety net as RSC adoption grows.

**Recommendation:** Keep `no-store` for user-scoped reads. For genuinely shared/non-tenant lookups added later, use a per-call `next: { revalidate }` override. Wrap `getSessionUser()` + the slug-validation fetch in `cache()` ([D1](#d1)).

<a id="f5"></a>
**F5. No HTTP `Cache-Control` tuning for `/public` assets; large unoptimized PNGs.**
`LOW` · `S` · `high confidence`

**Evidence:** `headers()` only sets security headers for `/:path*` and `no-store` for `/serwist/sw.js` ([next.config.ts:51](next.config.ts#L51)-55, [next.config.ts:20](next.config.ts#L20)-22). On disk: `logo.png` 300 KB, `icon-512.png` 200 KB, `icon-maskable-512.png` 134 KB.

**Impact:** `/_next/static` is already immutable-cached by Next; `/public` assets get only Next's short default. Mostly affects first paint and non-SW clients.

**Recommendation:** Add a `headers()` entry for `/icons/:path*` with `Cache-Control: public, max-age=31536000, immutable`. Compress the PNGs (a 512px maskable icon should be well under 50 KB).

---

### G) Build & Next Config

<a id="g1"></a>
**G1. Root-layout `connection()` + nonce CSP forces dynamic rendering app-wide and blocks PPR/`cacheComponents` — the real ceiling on Next.js perf features.**
`HIGH` · `L` · `high confidence`

**Evidence:** `await connection()` in the root layout ([src/app/layout.tsx:37](src/app/layout.tsx#L37)-47) + the nonce CSP `script-src 'self' 'nonce-...' 'strict-dynamic'` ([src/proxy.ts:50](src/proxy.ts#L50)-52). Next's own docs (`content-security-policy.md:391-397`) state nonce CSP requires all pages to be dynamically rendered and is **incompatible with PPR**; the SRI alternative (`content-security-policy.md:456-540`) preserves static generation.

**Impact:** No static shell to stream instantly on navigation; every route change waits for server render. The user's instinct that Next streaming/static features are unused is correct, and the **root cause is the CSP strategy**, not a forgotten flag.

**Recommendation:** Decide whether app-wide nonce CSP is worth forfeiting static rendering. (a) Static-CDN candidates today are the legal pages ([src/app/(legal)/privacy/page.tsx](src/app/(legal)/privacy/page.tsx), `terms/page.tsx`) — pure static; the landing `/` calls `getSessionUser()` ([src/app/page.tsx:19](src/app/page.tsx#L19)) so it is *not* a free static win as-is. (b) Migrate to the experimental hash-based SRI CSP (`experimental.sri`) to keep a strict nonce-free CSP and preserve static generation, after which `cacheComponents`/PPR can stream a static shell. **Removing `connection()` alone is insufficient while the nonce CSP remains.**

<a id="g6"></a>
**G6. PPR (`cacheComponents`) left entirely on the table in Next 16.**
`MEDIUM` · `M` · `high confidence`

**Evidence:** No `cacheComponents`/`experimental` in [next.config.ts:46](next.config.ts#L46)-69; Next is 16.2.4 (`node_modules/next/package.json`); PPR is opt-in via `cacheComponents: true` (`version-16.md:595-604`).

**Impact:** PPR would let the static parts of each route (AppShell chrome, headers, skeletons) prerender and stream immediately while per-user data streams behind Suspense — exactly the perceived-speed win the app lacks.

**Recommendation:** Sequence **after** [A1](#a1)/[B1](#b1)/[G1](#g1) (PPR needs Suspense boundaries, server data, and a nonce-free CSP). Then enable `cacheComponents`.

<a id="g2"></a>
**G2. `reactCompiler` not enabled and `babel-plugin-react-compiler` not installed.**
`MEDIUM` · `M` · `high confidence`

**Evidence:** No `reactCompiler` in [next.config.ts:46](next.config.ts#L46)-69; the plugin is absent from devDependencies ([package.json:51](package.json#L51)-67) and `node_modules`. React 19.2 + Next 16.2.4 support it.

**Impact:** The app renders essentially all UI client-side, so React render cost is paid on the client; the compiler auto-memoizes data-dense list/dashboard pages. **Caveat:** it reduces *re-render* cost, not time-to-first-data — secondary to [A1](#a1) and the data-layer findings.

**Recommendation:** Install the plugin and set `reactCompiler: true`. Start in default mode; verify typecheck/check/build stay green.

<a id="g3"></a>
**G3. No `experimental.staleTimes` tuning — router client cache for dynamic routes defaults to 0s.**
`MEDIUM` · `S` · `medium confidence`

**Evidence:** No `experimental.staleTimes` in [next.config.ts:46](next.config.ts#L46)-69; dynamic default is 0s (`staleTimes.md:27-28`). *(Verification corrected the original framing: `staleTimes.md:36` states it does NOT change back/forward caching — the avoidable round-trip is on **forward** re-navigation, and only the changing segment is re-requested.)*

**Impact:** Forward re-navigation (dashboard → members → dashboard) re-requests the RSC payload — but these are thin shells since data is client-fetched, so magnitude is modest.

**Recommendation:** Add `experimental: { staleTimes: { dynamic: 30 } }`, consistent with the TanStack `staleTime`. Lower-value than [A1](#a1); the bigger win is enabling prefetch ([B5](#b5)).

<a id="g4"></a>
**G4. Dead `_nonce` read in root layout; the inline theme script is not actually nonce'd.**
`LOW` · `S` · `high confidence`

**Evidence:** Dead `_nonce` at [src/app/layout.tsx:46](src/app/layout.tsx#L46)-47; commented `// nonce={nonce}` at [src/app/layout.tsx:66](src/app/layout.tsx#L66)-68; proxy sets x-nonce + CSP at [src/proxy.ts:116](src/proxy.ts#L116)-117. Next auto-applies the nonce to framework scripts from the CSP header (`content-security-policy.md:187-193`).

**Impact:** Clarity-only, zero runtime cost — but a maintainer could wrongly think the nonce is manually plumbed.

**Recommendation:** Either delete the dead `_nonce` + `headers()` read, or apply `nonce={_nonce}` to the script. Confirm no CSP violation for the theme script afterward.

<a id="g5"></a>
**G5. `optimizePackageImports` not set — but the cited barrel libs are already imported via subpaths, so the win is marginal.**
`LOW` · `S` · `medium confidence`

**Evidence:** No flag in [next.config.ts:46](next.config.ts#L46)-69. `@base-ui/react` is imported via deep subpaths ([src/components/ui/select.tsx:3](src/components/ui/select.tsx#L3)) and firebase via subpaths ([src/lib/firebase/client.ts:1](src/lib/firebase/client.ts#L1)-3). lucide-react and recharts are *default-optimized* in Next 16 (`optimizePackageImports.md:21-41`). Only `zod` is a root-barrel import.

**Impact:** Minimal, possibly zero first-load-JS win.

**Recommendation:** Optional. If pursued, only measure `zod` (`experimental: { optimizePackageImports: ['zod'] }`) and remove if it doesn't move First Load JS. Do not add the subpath/default-optimized libs.

<a id="g7"></a>
**G7. Turbopack persistent filesystem cache for production builds not enabled — affects build time, not navigation.**
`LOW` · `S` · `low confidence`

**Evidence:** No `turbopackFileSystemCacheForBuild` in [next.config.ts:46](next.config.ts#L46)-69; the repo uses `output: "standalone"` and builds via `next build` ([package.json:9](package.json#L9)).

**Impact:** Zero end-user navigation impact — purely repeat `next build` / CI / Docker image build time.

**Recommendation:** Optionally add `experimental: { turbopackFileSystemCacheForBuild: true }`. Deprioritize.

---

### H) Backend N+1 & Query Shaping

<a id="h-crit"></a>
**H-CRIT. Member/Transaction detail loads fan out ~12,360 parallel per-month aggregate queries via the 1970→2999 "lifetime" summary range.**
`CRITICAL` · `M` · `high confidence`

**Evidence:** The summary builds a `months` array sized by the window and fires one `transaction.aggregate` per month inside `Promise.all` ([../church-app-backend/src/modules/core/transaction/repository/transaction.repository.ts:335](../church-app-backend/src/modules/core/transaction/repository/transaction.repository.ts#L335)-387). Two callers pass a 1970→2999 window: member-feature ([../church-app-backend/src/modules/features/member-feature/services/member-feature.service.ts:99](../church-app-backend/src/modules/features/member-feature/services/member-feature.service.ts#L99)-117) and the transaction-feature `lifetime` branch ([../church-app-backend/src/modules/features/transaction-feature/services/transaction-feature.service.ts:350](../church-app-backend/src/modules/features/transaction-feature/services/transaction-feature.service.ts#L350)-358). Running the actual `dayjs` diff yields **monthCount = 12,360**. Both callers read only `total/count/avg/firstDate/lastDate` and **never touch `byMonth`** — the FE only reads scalars ([src/components/pages/transactions/TransactionDetailPage.tsx:73](src/components/pages/transactions/TransactionDetailPage.tsx#L73)-138).

**Impact:** Every Member Detail and Transaction Detail navigation fires **12,360 wasted parallel aggregate queries** (plus 3 useful ones). Bounded by the 10-connection pool ([I-pool](#i-pool)), they serialize ~1,236 batches deep — turning a sub-100ms detail page into multi-second-to-timeout latency, worsening sharply under concurrency. **The single biggest backend contributor to slow detail-route navigation.**

**Recommendation:** Make `byMonth` opt-in — add a `withMonthly` flag to `TransactionRepository.summary` and skip the `months.map()` fan-out when false; the two lifetime callers pass `false`. For surfaces that genuinely need monthly buckets, replace the per-month loop with a single grouped query (a generated `date_trunc('month', date)` column + `groupBy`, **not** `$queryRaw` which bypasses the soft-delete extension). Interim guard: clamp the lifetime window to the tenant's actual first/last gift via the `_min`/`_max` date already in the main aggregate, so an empty future window never generates ~970 years of months.

<a id="h2"></a>
**H2. Super-admin tenant list is a 1+4N query fan-out plus a 2000-row JS count in `getMyChurchSummary`.**
`HIGH` · `M` · `high confidence`

**Evidence:** `enrichTenant` runs 4 queries per tenant (admin count, member count, admins preview, MTD gift aggregate) via `Promise.all` over the list ([../church-app-backend/src/modules/features/tenant-feature/services/tenant-feature.service.ts:108](../church-app-backend/src/modules/features/tenant-feature/services/tenant-feature.service.ts#L108)-122). `getMyChurchSummary` pulls up to 2000 member rows just to count this-month creations in JS ([../church-app-backend/src/modules/features/tenant-feature/services/tenant-feature.service.ts:176](../church-app-backend/src/modules/features/tenant-feature/services/tenant-feature.service.ts#L176)-186), even though `countForTenant` already accepts `createdSince` ([../church-app-backend/src/modules/core/member/repository/member.repository.ts:119](../church-app-backend/src/modules/core/member/repository/member.repository.ts#L119)-132).

**Impact:** At 50 tenants = 201 queries serialized through the 10-connection pool. The 2000-row member transfer is wasted row transfer + deserialization on a once-per-load metric.

**Recommendation:** Replace `enrichTenant`'s loop with set-based `member.groupBy({ by: ['tenantId','role'] })` + `transaction.groupBy({ by: ['tenantId'] })` (collapses 4N to ~3 queries). For `getMyChurchSummary`, replace `getAll({ limit: 2000 })` + JS filter with `countForTenant(tenantId, { createdSince: monthStart })` (no new repo arg needed).

<a id="h1"></a>
**H1. Member-side campaign surfaces fan out N per-campaign `/progress` requests — no self-intent batch endpoint exists.**
`HIGH` · `M` · `high confidence`

**Evidence:** `useMyCampaignProgressMany` fans out one GET per campaign ([src/components/pages/member-dashboard/useMyCampaignProgressMany.ts:25](src/components/pages/member-dashboard/useMyCampaignProgressMany.ts#L25)-46), called by the member dashboard ([src/components/pages/member-dashboard/MemberDashboardPage.tsx:74](src/components/pages/member-dashboard/MemberDashboardPage.tsx#L74)) and the member campaigns list ([src/components/pages/member-campaigns/MemberCampaignsPage.tsx:89](src/components/pages/member-campaigns/MemberCampaignsPage.tsx#L89)). The self controller has only `@Get(":id/progress")` — **no batch route** ([../church-app-backend/src/modules/features/campaign-feature/controllers/self/campaign.self.controller.ts:46](../church-app-backend/src/modules/features/campaign-feature/controllers/self/campaign.self.controller.ts#L46)-102) — whereas the tenant controller already has `@Get("progress/batch")` ([../church-app-backend/src/modules/features/campaign-feature/controllers/tenant/campaign.tenant.controller.ts:114](../church-app-backend/src/modules/features/campaign-feature/controllers/tenant/campaign.tenant.controller.ts#L114)). The aggregation `progressMany` is intent-agnostic and already O(~3 queries) ([../church-app-backend/src/modules/features/campaign-feature/services/campaign-feature.service.ts:303](../church-app-backend/src/modules/features/campaign-feature/services/campaign-feature.service.ts#L303)).

**Impact:** Member surfaces are the highest-traffic perspective, so this is a guaranteed N-round-trip waterfall on the member home + campaigns navigations, each request gated behind `authStateReady`/`getIdToken`.

**Recommendation:** Add `GET /tenants/:tenantId/me/campaigns/progress/batch?ids=` to `CampaignSelfController`, delegating to the existing `progressMany`. Add `useMyCampaignsProgressBatch` and point both callers at it. Thin controller addition, no new service work.

<a id="h4"></a>
**H4. Admin `CampaignsListPage` still uses the per-campaign progress fan-out even though a tenant batch endpoint exists and the dashboard already uses it.**
`MEDIUM` · `S` · `high confidence`

**Evidence:** [src/components/pages/campaigns/CampaignsListPage.tsx:66](src/components/pages/campaigns/CampaignsListPage.tsx#L66)-67 uses `useCampaignProgressMany(tenantSlug, visibleIds)` (one GET per row, [src/components/pages/dashboard/useCampaignProgressMany.ts:19](src/components/pages/dashboard/useCampaignProgressMany.ts#L19)-37). The drop-in `useCampaignsProgressBatch` already exists ([src/lib/api/campaigns/tenant/hooks.ts:85](src/lib/api/campaigns/tenant/hooks.ts#L85)-96) and is already consumed by the dashboard ([src/components/pages/dashboard/AdminDashboardPage.tsx:97](src/components/pages/dashboard/AdminDashboardPage.tsx#L97)-114).

**Impact:** Up to ~20 round-trips (bounded by the page size; 10 on mobile) instead of 1. *(Severity adjusted HIGH→MEDIUM in verification: the fan-out is capped at one page of rows, individual queries are shared across surfaces, and the hottest surface — the dashboard — is already fixed.)*

**Recommendation:** Swap to `useCampaignsProgressBatch(tenantSlug, visibleIds)` and adapt the consumer (the batch hook returns `{ items: [...] }`; reduce into a map exactly as the dashboard does at lines 101-114). Zero backend work.

<a id="h5"></a>
**H5. Pledge aging report and `findUrgent` pull bounded row sets into JS for lifecycle bucketing — acceptable tradeoff but capped.**
`LOW` · `S` · `high confidence`

**Evidence:** Aging `findMany` with `take: 10000` ([../church-app-backend/src/modules/core/pledge/repository/pledge.repository.ts:390](../church-app-backend/src/modules/core/pledge/repository/pledge.repository.ts#L390)-408); `findUrgent` with `take: Math.max(limit*6, 50)` and a 3-branch deadline-horizon OR pre-narrowing in SQL ([../church-app-backend/src/modules/core/pledge/repository/pledge.repository.ts:513](../church-app-backend/src/modules/core/pledge/repository/pledge.repository.ts#L513)-533).

**Impact:** Lifecycle depends on `COALESCE(item.deadline, campaign.deadline)`, not expressible in a Prisma `WHERE`, so JS bucketing is a deliberate, reasonable tradeoff. Both are SQL-narrowed and bounded; not a hot-path N+1. Only risk: the 10000 cap silently truncating the aging chart for a very large tenant.

**Recommendation:** Leave as-is for navigation. If extreme-scale accuracy matters later, move the COALESCE + bucketing into a single `$queryRaw` with `CASE` (adding explicit `deletedAt IS NULL`).

---

### I) Backend DB / Prisma

<a id="i-pool"></a>
**I-POOL. PrismaPg adapter gets no pool config — node-postgres defaults (max=10, idle=10s, no connect/statement timeout) silently apply.**
`MEDIUM` · `S` · `high confidence`

**Evidence:** `new PrismaPg({ connectionString })` with no `max`/timeout options ([../church-app-backend/src/infrastructure/prisma-client/prisma-client.service.ts:21](../church-app-backend/src/infrastructure/prisma-client/prisma-client.service.ts#L21)-23); `.env.example` has no `connection_limit` ([../church-app-backend/.env.example:5](../church-app-backend/.env.example#L5)). `pg-pool` defaults: `max=10`, `idleTimeoutMillis=10000`, no `connectionTimeoutMillis` (`node_modules/pg-pool/index.js:89,99,206`); PrismaPg forwards `pg.PoolConfig` (`@prisma/adapter-pg/dist/index.d.ts:42`).

**Impact:** **This is the multiplier that converts every `Promise.all` fan-out in this report into wall-clock latency.** The 12,360-month summary serializes ~1,236 batches deep; the 4N tenant enrich ~20 batches; the N campaign-progress fan-outs queue. With no `connectionTimeoutMillis`, queries past 10 in-flight queue with **unbounded wait** — a slow request blocks the rest of the nav. The 10s idle timeout closes connections between navs, so the first query of the next nav pays a fresh TCP+TLS+auth handshake (per-nav cold-start tax). No `statement_timeout` means a runaway aggregate pins a connection.

**Recommendation:** **Fix the fan-outs first ([H-CRIT](#h-crit), [H1](#h1), [H2](#h2)) — do not raise the pool to mask them.** Then pass explicit `pg.PoolConfig`: `max` sized to (Postgres `max_connections` / instance count), raise `idleTimeoutMillis` (30-60s) or set a non-zero `min` to avoid reconnect churn, set `connectionTimeoutMillis` (~5000) so exhaustion fails fast, and a `statement_timeout`. If multi-instance/serverless, front Postgres with PgBouncer.

<a id="i2"></a>
**I2. `PledgesListPage` fans out one full `GET /campaigns/{id}` per campaign for item deadlines — no batch items endpoint exists on the backend.**
`MEDIUM` · `M` · `high confidence`

**Evidence:** `useCampaignsManyWithItems` fans out per id, and its own comment admits no bulk endpoint exists ([src/components/pages/dashboard/useCampaignsManyWithItems.ts:7](src/components/pages/dashboard/useCampaignsManyWithItems.ts#L7)-12,27-50), consumed by [src/components/pages/pledges/PledgesListPage.tsx:35](src/components/pages/pledges/PledgesListPage.tsx#L35),133. The tenant controller batches only `progress/batch`; `getById` is per-id ([../church-app-backend/src/modules/features/campaign-feature/controllers/tenant/campaign.tenant.controller.ts:140](../church-app-backend/src/modules/features/campaign-feature/controllers/tenant/campaign.tenant.controller.ts#L140)-170).

> **Cross-reference:** [C3](#c3) shows the *preferred* fix is FE-only — the pledge list response already returns `resolvedDeadline`, so `useCampaignsManyWithItems` can simply be deleted for pledge surfaces. This finding (I2) is the fallback for any *true* campaign-items view that needs more than the resolved deadline.

**Recommendation:** Prefer the FE-only fix in [C3](#c3) (consume `p.resolvedDeadline`, delete the hook). Only if a genuine items view remains, add `GET /campaigns/items?ids=` returning `{ campaignId, itemId, deadline }` rather than the full payload.

<a id="i3"></a>
**I3. Member/self dashboard and campaigns list have no batch progress route, forcing an unavoidable N+1.**
`MEDIUM` · `S` · `high confidence`

*(Same defect as [H1](#h1), tracked from the backend-routing angle.)* The self controller exposes only `@Get(":id/progress")` ([../church-app-backend/src/modules/features/campaign-feature/controllers/self/campaign.self.controller.ts:46](../church-app-backend/src/modules/features/campaign-feature/controllers/self/campaign.self.controller.ts#L46)-102); two live callers fan out ([src/components/pages/member-dashboard/MemberDashboardPage.tsx:74](src/components/pages/member-dashboard/MemberDashboardPage.tsx#L74), [src/components/pages/member-campaigns/MemberCampaignsPage.tsx:89](src/components/pages/member-campaigns/MemberCampaignsPage.tsx#L89)). Fix: add the self-side `progress/batch` route delegating to the existing `progressMany`.

<a id="i4"></a>
**I4. Uncached tenant-by-slug `findFirst` on every tenant-scoped request.**
`MEDIUM` · `S` · `high confidence`

**Evidence:** `TenantGuard` runs `tenant.findFirst({ where: { OR: [{ id }, { slug }] } })` on every `/tenants/:tenantId/*` route ([../church-app-backend/src/infrastructure/firebase-auth/guards/tenant.guard.ts:59](../church-app-backend/src/infrastructure/firebase-auth/guards/tenant.guard.ts#L59)-67). `cache-manager` is installed but `grep` finds zero usage ([../church-app-backend/package.json:35](../church-app-backend/package.json#L35),47). `slug` is `@unique`, `id` is PK ([../church-app-backend/prisma/schema/tenant.prisma:3](../church-app-backend/prisma/schema/tenant.prisma#L3),7).

**Impact:** With the client-side fan-out, each navigation issues this lookup once *per parallel API call* (6 parallel dashboard queries = 6 identical tenant lookups). Cheap per call, but a serialized round-trip + pool pressure multiplied across the burst.

**Recommendation:** Memoize the `{idOrSlug} → {id,slug}` lookup in an in-process Map / cache-manager memory store (short TTL, invalidate on tenant create/slug change/soft-delete). Also split the `OR`: the FE always sends a slug, so do `findUnique({ where: { slug } })` first (hits the unique index). The cache must not serve archived tenants.

<a id="i5"></a>
**I5. Transaction summary fans out one DB aggregate per month in the window (up to ~60 queries) plus 3 more.**
`MEDIUM` · `M` · `high confidence`

*(The bounded-window cousin of [H-CRIT](#h-crit).)* For a default 12-month dashboard window this is ~15 concurrent queries; a long custom range up to ~63 ([../church-app-backend/src/modules/core/transaction/repository/transaction.repository.ts:335](../church-app-backend/src/modules/core/transaction/repository/transaction.repository.ts#L335)-387). Against the unsized pool, a single summary load can occupy the pool and queue concurrent requests.

**Recommendation:** Collapse the per-month `Promise.all` into a single bucketed query via a generated `date_trunc('month', date)` column + `groupBy` (**not** `$queryRaw` — it bypasses the soft-delete extension). One round-trip replaces `monthCount`.

<a id="i6"></a>
**I6. Soft-delete walker runs twice for Deleted/All list views (redundant args-tree re-clone).**
`LOW` · `S` · `medium confidence`

**Evidence:** `applyStateFilter.wrap` calls `withDeleted` (bypass mode) at [../church-app-backend/src/infrastructure/prisma-client/soft-delete/state-filter.helpers.ts:64](../church-app-backend/src/infrastructure/prisma-client/soft-delete/state-filter.helpers.ts#L64)-67, then the extension's `findMany` re-runs `applySoftDeleteFilters` on the same args ([../church-app-backend/src/infrastructure/prisma-client/soft-delete/soft-delete.extension.ts:94](../church-app-backend/src/infrastructure/prisma-client/soft-delete/soft-delete.extension.ts#L94)-95). The second pass no-ops the merge (key already present) but still re-clones the full args tree ([../church-app-backend/src/infrastructure/prisma-client/soft-delete/soft-delete.walker.ts:76](../church-app-backend/src/infrastructure/prisma-client/soft-delete/soft-delete.walker.ts#L76)-79).

**Impact:** Redundant shallow-recursive object clone — genuinely minor CPU/GC, not a navigation bottleneck.

**Recommendation:** Optional micro-optimization: short-circuit the second clone when `args.where` already carries an explicit `deletedAt` key. Not worth doing before the N+1/cache findings.

<a id="i7"></a>
**I7. No composite index includes `deletedAt`, so the always-injected `deletedAt IS NULL` is a heap recheck rather than index-covered.**
`LOW` · `M` · `medium confidence`

**Evidence:** Six composite indexes on Transaction, none include `deletedAt` or are partial ([../church-app-backend/prisma/schema/transaction.prisma:39](../church-app-backend/prisma/schema/transaction.prisma#L39)-44); the stats-index migration adds plain indexes ([../church-app-backend/prisma/migrations/20260526181030_add_stats_indexes/migration.sql:1](../church-app-backend/prisma/migrations/20260526181030_add_stats_indexes/migration.sql#L1)-8); the walker appends `deletedAt: null` to every read ([../church-app-backend/src/infrastructure/prisma-client/soft-delete/soft-delete.walker.ts:339](../church-app-backend/src/infrastructure/prisma-client/soft-delete/soft-delete.walker.ts#L339)-341).

**Impact:** Negligible at current scale (low tombstone ratio); a scaling watch-item, not a current navigation cause.

**Recommendation:** Leave as-is. If a hot table's tombstone ratio grows, convert its busiest read index to a partial index `WHERE "deletedAt" IS NULL`; validate with `EXPLAIN ANALYZE` first.

<a id="i8"></a>
**I8. Bulk transaction create holds an interactive `$transaction` across a serial per-row create+audit loop.**
`LOW` · `M` · `low confidence`

**Evidence:** [../church-app-backend/src/modules/core/transaction/repository/transaction.repository.ts:185](../church-app-backend/src/modules/core/transaction/repository/transaction.repository.ts#L185)-213 opens a `$transaction` and serially awaits `transaction.create` + `auditEvent.create` per item.

**Impact:** A **write path** (recording gifts), not a navigation read — holds one pooled connection for the batch duration, indirectly compounding [I-pool](#i-pool) under concurrent submissions.

**Recommendation:** Lowest priority. For larger batches, consider `createMany` + a single `auditEvent.createMany`, or move audit writes outside the transaction.

---

### J) Backend Caching / Response Pipeline

<a id="j1"></a>
**J1. Firebase token verification runs with `checkRevoked=true` on EVERY request — a network round-trip per API call, uncached.**
`CRITICAL` · `M` · `high confidence`

**Evidence:** Both verify methods hard-code `true` ([../church-app-backend/src/infrastructure/firebase-auth/firebase-admin.service.ts:27](../church-app-backend/src/infrastructure/firebase-auth/firebase-admin.service.ts#L27)-38). The global `FirebaseAuthGuard` runs one of them on every non-`@Public` route ([../church-app-backend/src/infrastructure/firebase-auth/guards/firebase-auth.guard.ts:40](../church-app-backend/src/infrastructure/firebase-auth/guards/firebase-auth.guard.ts#L40)-43), registered as `APP_GUARD` ([../church-app-backend/src/main.module.ts:76](../church-app-backend/src/main.module.ts#L76)).

**Impact:** Because all page data is client-fetched, a dashboard firing ~9 parallel queries incurs **~9 Firebase revocation round-trips on the backend**, each on the critical path before any handler runs. No token/claims cache means identical tokens within one navigation burst are re-verified over the network each time. **The single largest avoidable per-request latency source.**

**Recommendation:** On the read-heavy hot path, verify the ID-token signature locally (`checkRevoked=false`, sub-ms) and reserve `checkRevoked=true` for state-changing/sensitive endpoints — OR add a short-TTL (30-60s) in-process cache keyed by a hash of the credential value (using the already-installed `cache-manager`), invalidated on the sign-out-everywhere path. Quantify with verify-latency logs first ([J-obs-be](#j-obs-be)) before relaxing security posture. *(Note: the FE `cache()` fix in [D1](#d1) does NOT help here — this is the distinct Bearer-token-per-request path.)*

<a id="j2"></a>
**J2. `TenantGuard` runs an uncached Postgres tenant lookup on every tenant-scoped request.**
`HIGH` · `S` · `high confidence`

*(Same code as [I4](#i4), framed as a caching gap.)* The `OR` over id+slug ([../church-app-backend/src/infrastructure/firebase-auth/guards/tenant.guard.ts:59](../church-app-backend/src/infrastructure/firebase-auth/guards/tenant.guard.ts#L59)-64) prevents a clean single-index seek (Postgres does a bitmap OR). Multiplied by the client fan-out, every tenant page load issues this lookup per parallel API call.

**Recommendation:** Cache `slug → {id,slug}` (cache-manager, short TTL, invalidate on create/update/soft-delete). Split the `OR` to a slug-first `findUnique`.

<a id="j3"></a>
**J3. `@nestjs/cache-manager` + `cache-manager` installed but completely unused — no caching layer anywhere.**
`MEDIUM` · `M` · `high confidence`

**Evidence:** `grep` for `CacheModule`/`CACHE_MANAGER`/`CacheInterceptor` → zero; deps present at [../church-app-backend/package.json:35](../church-app-backend/package.json#L35),47; no `CacheModule` in [../church-app-backend/src/main.module.ts:66](../church-app-backend/src/main.module.ts#L66)-73.

**Impact:** The missing lever for [J1](#j1), [J2](#j2), and platform stats. *(Severity adjusted HIGH→MEDIUM: an unused dependency is not itself a latency bug — its value is borrowed from the findings that would use it; keeping it high would triple-count one root cause.)*

**Recommendation:** Register `CacheModule` (in-memory to start) and wire it to (1) tenant slug resolution, (2) `getPlatformStats()`, (3) optionally a token-verify short-TTL cache. Otherwise remove the dead dependency.

<a id="j5"></a>
**J5. No HTTP response compression (gzip/br) — payloads sent uncompressed over the wire.**
`MEDIUM` · `S` · `high confidence`

**Evidence:** `grep` confirms no `compression`/`helmet`/body-limit in the bootstrap ([../church-app-backend/src/main.ts:10](../church-app-backend/src/main.ts#L10)-49).

**Impact:** List endpoints (members, transactions, campaigns-with-items, audit) return JSON that compresses ~70-90%. Sent raw, transfer time is inflated on every list/detail navigation — felt on mobile, which matters for a PWA/TWA.

**Recommendation:** Add `app.use(compression())` before route handling (also `helmet()` + explicit json body `limit`). **Caveat:** if deployed behind a compressing reverse proxy (nginx/Vercel/Cloud Run), this is redundant — confirm the deployment topology first.

<a id="j-obs-be"></a>
**J-obs-BE. No server-side request-timing on the backend — no per-request latency log, no tracing.** *(gap-fill)*
`HIGH` · `S` · `high confidence`

**Evidence:** Plain console logger; the two global interceptors do not measure duration ([../church-app-backend/src/main.ts:11](../church-app-backend/src/main.ts#L11)-22, [../church-app-backend/src/infrastructure/config/interceptors/global-response.interceptor.ts:20](../church-app-backend/src/infrastructure/config/interceptors/global-response.interceptor.ts#L20)-35, [../church-app-backend/src/infrastructure/config/interceptors/claims-refresh.interceptor.ts:22](../church-app-backend/src/infrastructure/config/interceptors/claims-refresh.interceptor.ts#L22)-41). `grep` for OpenTelemetry/pino/winston/`process.hrtime`/`performance.now`/`duration` → nothing.

**Impact:** No TTFB/handler-duration signal, so the suspected double `verifySessionCookie` and Prisma/N+1 costs cannot be confirmed or ranked. A slow navigation cannot be split into network/RSC/handler/DB time.

**Recommendation:** Add a global timing `LoggingInterceptor` (capture `process.hrtime.bigint()` before `next.handle()`, log method+route+status+ms in a `tap`/`finalize`), or adopt `nestjs-pino`, or wire `@opentelemetry` HTTP instrumentation. Pairs with the FE instrumentation ([D-obs-FE](#d-obs-fe)) for end-to-end trace continuity.

<a id="j4"></a>
**J4. Platform stats fan out into 7 parallel uncached aggregate queries per request.**
`LOW` · `S` · `high confidence`

**Evidence:** 7-element `Promise.all` including a cross-tenant 30-day transaction aggregate ([../church-app-backend/src/modules/features/admin-feature/services/admin-feature.service.ts:83](../church-app-backend/src/modules/features/admin-feature/services/admin-feature.service.ts#L83)-99, [../church-app-backend/src/modules/core/transaction/repository/transaction.repository.ts:216](../church-app-backend/src/modules/core/transaction/repository/transaction.repository.ts#L216)-228). Route is `@Roles("SUPER_ADMIN")` ([../church-app-backend/src/modules/features/admin-feature/controllers/platform/admin.platform.controller.ts:31](../church-app-backend/src/modules/features/admin-feature/controllers/platform/admin.platform.controller.ts#L31)).

**Impact:** Real but narrow — super-admin-only, off the ordinary tenant-navigation path. *(Adjusted MEDIUM→LOW.)*

**Recommendation:** Cache output for 60-300s (coarse windows). Ensure `Transaction.date` is indexed for the cross-tenant aggregate.

<a id="j6"></a>
**J6. Swagger/Scalar API reference mounted unconditionally in all environments.**
`LOW` · `S` · `high confidence`

**Evidence:** `setupSwagger(app)` with no env guard ([../church-app-backend/src/main.ts:42](../church-app-backend/src/main.ts#L42)); `/api-docs` + `/api-docs-json` mounted via raw `app.use`, **outside** the Nest guard pipeline, so the full API surface is publicly readable ([../church-app-backend/src/swagger.config.ts:24](../church-app-backend/src/swagger.config.ts#L24)-45).

**Impact:** Per-boot CPU cost + an information-exposure surface; not a per-navigation latency issue.

**Recommendation:** Guard with `if (NODE_ENV !== 'production') setupSwagger(app)` or an `ENABLE_SWAGGER` flag. FE type generation runs against the dev server, so prod doesn't need it.

<a id="j7"></a>
**J7. `@nestjs/throttler` installed but never wired — no rate limiting active.**
`LOW` · `S` · `high confidence`

**Evidence:** Dep at [../church-app-backend/package.json:43](../church-app-backend/package.json#L43); no `ThrottlerModule`/`ThrottlerGuard` in [../church-app-backend/src/main.module.ts:66](../church-app-backend/src/main.module.ts#L66)-78.

**Impact:** Not slowing navigation (the absence of throttling). Dead dependency + no backend abuse protection on the expensive verify path.

**Recommendation:** Either remove the dep, or wire `ThrottlerModule` with generous limits scoped to abuse-prone routes (`@SkipThrottle` on normal reads). **Do not** add a tight global throttle — it would hurt the parallel client-fetch pattern.

<a id="j8"></a>
**J8. Global `ValidationPipe` with transform + implicit conversion runs on every request body/query.**
`LOW` · `S` · `high confidence`

**Evidence:** [../church-app-backend/src/main.ts:23](../church-app-backend/src/main.ts#L23)-30 — `whitelist + forbidNonWhitelisted + transform + enableImplicitConversion`.

**Impact:** Correct/safe config; cost is small for the modest DTOs here. **Not** a measurable navigation-latency contributor.

**Recommendation:** No change now. If a bulk-import endpoint is added later, scope a lighter pipe to it.

---

### Cross-cutting navigation traces

<a id="x1"></a>**Nav (a) `/admin/dashboard`** `HIGH` — see the [§2 trace](#2-why-navigation-feels-slow-today--a-concrete-trace). 2 RSC verifies + blank shell + 8 parallel + 1 waterfalled client query, ~11 Firebase verifies + ~9 tenant lookups per nav. Evidence spans [layout.tsx](src/app/layout.tsx#L37), [[tenantSlug]/layout.tsx:22](src/app/[tenantSlug]/layout.tsx#L22), [(admin)/layout.tsx:22](src/app/[tenantSlug]/(admin)/layout.tsx#L22), [server.ts:42](src/lib/auth/server.ts#L42), [AdminDashboardPage.tsx:50](src/components/pages/dashboard/AdminDashboardPage.tsx#L50)-145, [client.ts:14](src/lib/api/client.ts#L14)-28, [firebase-admin.service.ts:27](../church-app-backend/src/infrastructure/firebase-auth/firebase-admin.service.ts#L27), [tenant.guard.ts:59](../church-app-backend/src/infrastructure/firebase-auth/guards/tenant.guard.ts#L59).

<a id="x2"></a>**Nav (b) `/admin/pledges`** `HIGH` — same 2 RSC verifies + blank shell, then `usePledges` + `useCampaigns` + `useMembers(limit:500)` in parallel, then an N+1 fan-out waterfalled behind the pledge page ([PledgesListPage.tsx:97](src/components/pages/pledges/PledgesListPage.tsx#L97)-136, [useCampaignsManyWithItems.ts:27](src/components/pages/dashboard/useCampaignsManyWithItems.ts#L27)-50). A page across 10 campaigns = 13 client calls. No `keepPreviousData` → table blanks on every filter ([providers.tsx:17](src/lib/api/providers.tsx#L17)-21).

<a id="x3"></a>**Nav (c) `/admin/campaigns/[id]`** `MEDIUM` — 2-call header waterfall: `useCampaignProgress` gated `enabled: Boolean(campaign)` waits a full round-trip for `useCampaign` ([CampaignDetailPage.tsx:49](src/components/pages/campaigns/CampaignDetailPage.tsx#L49)-58, [tenant/hooks.ts:68](src/lib/api/campaigns/tenant/hooks.ts#L68)-78). Pledges tab adds a second `useMembers(limit:500)` ([CampaignPledgesTab.tsx:85](src/components/pages/campaigns/CampaignPledgesTab.tsx#L85)-94). Backend `progress` runs `getById` then 4 aggregates serially (~5 queries in 2 waves, [campaign.repository.ts:213](../church-app-backend/src/modules/core/campaign/repository/campaign.repository.ts#L213)-235). Inline `animate-pulse` masks only the campaign fetch ([CampaignDetailPage.tsx:105](src/components/pages/campaigns/CampaignDetailPage.tsx#L105)-118).

---

## 4. Next.js / React capabilities left on the table

A checklist of unused capabilities, each with one line on applicability **here**:

| Capability | Status | Applicability here |
|---|---|---|
| **RSC data fetching (`serverApi`)** | Unused for page data | The client already exists and is documented for this ([server.ts:14](src/lib/api/server.ts#L14)). Fetch dashboard/list data server-side. ([A1](#a1)) |
| **Streaming via `loading.tsx` + `<Suspense>`** | Zero files | Cheapest perceived-speed win; also re-enables prefetch for dynamic routes. ([B1](#b1)) |
| **Partial Prerendering (`cacheComponents`)** | Off; blocked by nonce CSP | Would prerender + stream the AppShell shell. Needs Suspense + a nonce-free (SRI) CSP first. ([G1](#g1), [G6](#g6)) |
| **`<Link>` prefetch** | No-op today | Forced-dynamic + no `loading.js` + `staleTimes.dynamic=0` ⇒ prefetch warms nothing. ([B5](#b5)) |
| **React `cache()` request dedup** | Absent in all of `src/` | Collapses the double `getSessionUser` verify per nav. One line. ([D1](#d1)) |
| **`experimental.staleTimes`** | Unset (defaults 0s) | Reuse just-visited dynamic segments on forward re-nav. ([G3](#g3)) |
| **`next/dynamic` (charts, modal/sheet registries)** | Zero usage | recharts (168 KB gz) and 30 eager modals belong behind lazy boundaries. ([E1](#e1), [E2](#e2)) |
| **`optimizePackageImports`** | Unset | Marginal — libs are already subpath-imported or default-optimized; only `zod` is a candidate. ([G5](#g5)) |
| **React Compiler (`reactCompiler`)** | Not installed | Auto-memoizes a client-heavy UI; reduces re-render cost, not first-data. ([G2](#g2)) |
| **`useOptimistic`** | Not used | Opportunity for mutation-heavy flows (record gift, pledge) to feel instant; not a navigation-latency item. |
| **`initialData`/`placeholderData`/`keepPreviousData`** | None | `keepPreviousData` stops list-filter/pagination skeleton flash; `initialData` seeds from RSC hydration. ([C5](#c5)) |
| **Client instrumentation (`instrumentation-client.ts`, `useReportWebVitals`, `onRouterTransitionStart`)** | Absent | Gating fix — no way to measure "feels slow" today. ([D-obs-FE](#d-obs-fe)) |

---

## 5. Prioritized roadmap

Sorted by leverage. "Impact" reflects effect on perceived navigation speed.

### Quick wins (high impact / low effort)

| # | Recommendation | Area | Impact | Effort | Confidence |
|---|---|---|---|---|---|
| 1 | **Make `byMonth` opt-in** in `TransactionRepository.summary`; lifetime callers pass `false`. Kills the ~12,360-query fan-out on Member/Transaction detail. | H ([H-CRIT](#h-crit)) | **CRITICAL** | M | high |
| 2 | **Add `loading.tsx`** at `(admin)`/`(member)` (+ key lists) rendering an AppShell skeleton. Instant paint + re-enables prefetch. | B ([B1](#b1)) | **HIGH** | S–M | high |
| 3 | **Wrap `getSessionUser` in React `cache()`.** Collapses 2 session verifies → 1 per nav. One line. | D ([D1](#d1)) | **HIGH** | S | high |
| 4 | **Drop `checkRevoked` to `false`** on the backend guard verify (or add a short-TTL verify cache). Removes ~9 Firebase round-trips per dashboard nav. | J ([J1](#j1)) | **CRITICAL** | M | high |
| 5 | **Add `placeholderData: keepPreviousData`** as a QueryClient default. Stops list-filter/pagination skeleton flash. | C ([C5](#c5)) | HIGH | S | high |
| 6 | **Delete `getClientDb()` + `getFirestore` import** → Firestore tree-shakes out of the auth-critical chunk (~90 KB gz). | E ([E3](#e3)) | MEDIUM | S | high |
| 7 | **Consume `p.resolvedDeadline`** on pledge surfaces; delete `useCampaignsManyWithItems`. FE-only, kills an N+1. | C ([C3](#c3)) | MEDIUM | S | high |
| 8 | **Cache tenant slug→id** in `TenantGuard` (cache-manager) + split the `OR` to a slug-first `findUnique`. | I/J ([I4](#i4), [J2](#j2)) | MEDIUM | S | high |
| 9 | **Add `experimental.staleTimes: { dynamic: 30 }`.** Reuse dynamic segments on forward re-nav. | G ([G3](#g3)) | MEDIUM | S | medium |
| 10 | **Swap `CampaignsListPage`** to the existing `useCampaignsProgressBatch`. Zero backend work. | H ([H4](#h4)) | MEDIUM | S | high |
| 11 | **Add `compression()`** to backend bootstrap (confirm no compressing proxy first). | J ([J5](#j5)) | MEDIUM | S | high |
| 12 | **Add FE + BE telemetry** (`instrumentation-client.ts` + a timing interceptor). Gates measuring everything else. | D/J ([D-obs-FE](#d-obs-fe), [J-obs-be](#j-obs-be)) | HIGH (enabling) | S | high |
| 13 | **Switch hard reloads to `router.replace`** in `handleUnauthorized` + `AuthProvider` redirect. Stops SPA-destroying full reloads on auth lapse. | D ([D7](#d7), [D8](#d8)) | HIGH | M | high |

### Medium

| # | Recommendation | Area | Impact | Effort | Confidence |
|---|---|---|---|---|---|
| 14 | **Lazify the modal registry** (and SheetHost) with `next/dynamic`. Removes 31 KB gz + zod from first-nav. | E ([E1](#e1), [E4](#e4)) | MEDIUM | M | high |
| 15 | **Code-split recharts** behind a single `next/dynamic` boundary via a revived `Charts.tsx`. Removes 168 KB gz from chart routes. | E ([E2](#e2)) | MEDIUM | M | high |
| 16 | **Add the member-side `progress/batch` route** + batched hook; switch member dashboard + campaigns. | H ([H1](#h1), [I3](#i3)) | HIGH | M | high |
| 17 | **De-waterfall the campaign detail header** (drop the `Boolean(campaign)` gate so progress fetches in parallel). | C/X ([Nav c](#x3)) | MEDIUM | S | high |
| 18 | **Set-based tenant enrich** (`groupBy`) + `countForTenant(createdSince)` instead of 2000-row JS count. | H ([H2](#h2)) | HIGH | M | high |
| 19 | **Collapse the per-month transaction summary** into one bucketed `groupBy` (generated month column). | I ([I5](#i5)) | MEDIUM | M | high |
| 20 | **`members/giving-trend` rollup**; drop the `limit:500` transaction fetch on the members list. | C ([C4](#c4)) | MEDIUM | M | high |
| 21 | **Embed member name + resolved deadline on the pledge list response**; drop the `limit:500` member fetch. | C/I ([C3](#c3), [I2](#i2)) | MEDIUM | M | high |
| 22 | **Size the pg pool explicitly** (`max`, `connectionTimeoutMillis`, idle, `statement_timeout`) — *after* fixing the fan-outs. | I ([I-pool](#i-pool)) | MEDIUM | S | high |
| 23 | **Register `CacheModule`** and wire tenant lookup + platform stats (or remove the dead deps). | J ([J3](#j3), [J4](#j4)) | MEDIUM | M | high |
| 24 | **Enable React Compiler.** Cuts client re-render cost on data-dense pages. | G ([G2](#g2)) | MEDIUM | M | high |
| 25 | **Add an in-flight guard** for `X-Claims-Refreshed` re-mint. | D ([D5](#d5)) | LOW | S | high |
| 26 | **Guard Swagger behind non-prod**; close the public API-surface exposure. | J ([J6](#j6)) | LOW | S | high |
| 27 | **Immutable `Cache-Control` for `/icons`** + compress the oversized PNGs. | F ([F5](#f5)) | LOW | S | high |

### Larger architectural

| # | Recommendation | Area | Impact | Effort | Confidence |
|---|---|---|---|---|---|
| 28 | **RSC-prefetch + `HydrationBoundary`** for the dashboards and high-traffic lists, so first paint arrives with data. The heavyweight companion to #2. | A ([A1](#a1), [A6](#a6)) | **HIGH** | L | high |
| 29 | **Migrate the nonce CSP to hash-based SRI** (`experimental.sri`), remove root `connection()`, then enable **PPR (`cacheComponents`)** to stream a static shell. Unblocks the entire class of Next perf features. | G/F ([G1](#g1), [G6](#g6), [F1](#f1)) | **HIGH** | L | high |
| 30 | **Precache the launch shell** in the service worker (after static rendering is unblocked) for instant cold/offline launch. | F ([F2](#f2)) | MEDIUM | M | medium |
| 31 | **`next/image` for remote avatars** with `images.remotePatterns` — low priority for nav speed (initials cover the hot surfaces), do as image-quality cleanup. | F ([F3](#f3), [F6](#f6)) | LOW | M | high |

---

## 6. Appendix

### Methodology details

This audit was produced by a multi-agent pipeline:

1. **Initial recon** seeded a set of hypotheses (noted at the top of the engagement).
2. **11 parallel deep-read dimensions**, each owning a slice and required to cite real `file:line` evidence:
   - `fe-rendering-ssr` — RSC/SSR rendering model
   - `fe-nav-streaming` — navigation, streaming, loading states
   - `fe-data-fetching` — TanStack Query usage, fan-outs, over-fetch
   - `fe-auth-overhead` — client/server auth round-trips
   - `fe-bundle-splitting` — chunk sizes, eager imports, code-splitting
   - `fe-caching-pwa-headers` — Serwist SW, HTTP caching, images
   - `fe-build-config` — `next.config.ts` / capability flags
   - `be-nplus1` — backend N+1 / query fan-out
   - `be-db-prisma` — Prisma/Postgres query shaping, pooling, soft-delete
   - `be-caching-response` — backend guards, caching, response pipeline
   - `cross-roundtrips` — end-to-end navigation traces
3. **Adversarial per-dimension verification** — every finding independently re-read against the cited code. This *adjusted* several findings (e.g. the `connection()` dynamic-rendering claim was reframed as redundant-not-causal; the member N+1 month count corrected from ~12,349 to **12,360**; `CampaignsListPage` severity lowered HIGH→MEDIUM since the dashboard was already migrated; the avatar SW-cache claim corrected — Google avatars *are* cached) and *rejected* one (see below).
4. **Completeness critics + gap-fill** — a second pass added observability, auth-expiry hard-reload, image-pipeline scoping, and router client-cache findings (tagged "gap-fill follow-up").

### Severity distribution (after verification)

- **CRITICAL (2):** [H-CRIT](#h-crit) (12,360-query detail fan-out), [J1](#j1) (per-request Firebase verify).
- **HIGH (many):** the RSC/streaming/auth-roundtrip/bundle umbrella — [A1](#a1), [A6](#a6), [B1](#b1), [B5](#b5), [B6](#b6), [C2](#c2), [C5](#c5), [D1](#d1), [D2](#d2), [D7](#d7), [D8](#d8), [D-obs-FE](#d-obs-fe), [E1](#e1), [E2](#e2), [E3](#e3), [G1](#g1), [H1](#h1), [H2](#h2), [J2](#j2), [J-obs-be](#j-obs-be).
- **MEDIUM / LOW:** config flags, scoped/positive findings, and acceptable tradeoffs.

### Investigated and ruled out

- **`optimizePackageImports` for lucide-react / recharts** — *Rejected.* Next 16's `config.js` default `optimizePackageImports` list **already includes** both `lucide-react` and `recharts`, so the headline recommendation would do nothing. The 67 KB lucide chunk (vs a 39 MB on-disk package) proves optimization is already in effect. Only `@base-ui/react` is absent from the default list, and it is already subpath-imported, so the marginal win is captured (and deprioritized) under [G5](#g5).

### Cross-references / de-duplication note

Several real defects surface across multiple dimensions and are intentionally cross-linked rather than double-counted in the roadmap:

- The **member campaign progress N+1** appears as [C2](#c2) (FE), [H1](#h1) (cross-cutting), and [I3](#i3) (backend routing) — one fix (roadmap #16).
- The **double `getSessionUser` verify** appears in [D1](#d1), the [§2 trace](#2-why-navigation-feels-slow-today--a-concrete-trace), and [Nav (a)](#x1) — one fix (roadmap #3).
- The **`connection()` / nonce CSP** dynamic-rendering ceiling appears in [A5](#a5), [B5](#b5), [F1](#f1), [G1](#g1), and [G4](#g4) — the load-bearing fix is the SRI-CSP migration (roadmap #29).
- The **pledge item-deadline fan-out** is best fixed FE-only ([C3](#c3)); [I2](#i2) is the fallback if a true items view is ever needed.
