# ChurchFlow Frontend

Next.js 16 frontend for the multi-tenant church-management app. Admins
record tithes, offerings, and fundraising campaigns; members pledge and
pay against them. Super-admins run platform ops across every tenant.

Backend lives in [../church-app-backend](../church-app-backend). 

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript 6** (strict)
- **TanStack Query v5** — server state
- **openapi-fetch 0.17** + **openapi-typescript 7** — typed HTTP client
  generated from the backend's OpenAPI spec. Two clients: one in the
  browser (Bearer ID token), one for RSCs (forwards the session cookie
  under a custom `SessionCookie` auth scheme)
- **Zustand 5** — minimal UI-only client state (modals, mobile bottom
  sheets, the mobile page-action FAB)
- **react-hook-form 7** + **zod 4** — forms, wrapped in
  `components/formElements/*`
- **Firebase** (client SDK) + **firebase-admin** (server) — Google SSO;
  ID tokens for REST, session cookies for SSR
- **Tailwind 4** + CSS variables — tokens in `globals.css`
- **dayjs** — sole date library
- **lucide-react**, **react-day-picker**, **@base-ui/react** — vendored
  through primitives, never imported directly from a page
- **recharts** — never imported synchronously in a page composite; loaded
  only behind a `next/dynamic` boundary (`primitives/charts/DonutChart`,
  `primitives/Sparkline`, or a colocated `*Chart.tsx`)
- **React Compiler** (`reactCompiler: true`) — auto-memoization at build time
- **Biome 2** — lint + format
- **husky** — git hooks
- **Serwist** (`@serwist/turbopack`) — installable PWA / offline shell;
  also packaged as a TWA/APK

## Setup

```bash
# 1. Install
npm install

# 2. Configure env — fill .env.local with:
#    - NEXT_PUBLIC_FIREBASE_*       (client SDK config)
#    - FIREBASE_ADMIN_*             (server-side Admin SDK)
#    - NEXT_PUBLIC_API_BASE_URL     (defaults to http://localhost:8001 in dev)

# 3. Start the backend first (sibling repo). Backend dev server runs on :8001
#    and exposes /api-docs-json on :8000 for type generation.

# 4. Generate types + run dev server (waits for backend automatically):
npm run api:types
npm run dev                    # Next on :3000
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Wait for backend, then start Next on :3000 |
| `npm run dev:test` | Same as `dev`, loading `.env.development.local` |
| `npm run build` | Production build (loads `.env.production`) |
| `npm run build:test` | Production build with `.env.development.local` |
| `npm run start` | Serve production build on :3002 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `format` | Biome lint / format |
| `npm run check` | `enforce-ui-primitives.mjs` + `biome check --write` |
| `npm run api:types` | Regenerate `src/lib/api/schema.d.ts` from `:8000/api-docs-json` |

`scripts/enforce-ui-primitives.mjs` (run as part of `npm run check`)
fails if any native HTML element (`<button>`, `<input>`, `<select>`,
`<textarea>`, `<img>`, `<label>`, `<table>`, `<hr>`, `<a>`) appears
outside `components/primitives/` and `components/ui/`.

## Architecture overview

```
src/
├── app/                                # Next App Router (RSC by default)
│   ├── layout.tsx                      # AuthProvider → QueryProvider → ModalHost/SheetHost/WebVitalsReporter
│   ├── page.tsx                        # landing redirect
│   ├── (auth)/                         # /login, /select-church, /invite/[token]
│   ├── (super-admin)/super-admin/      # platform-ops; not tenant-scoped
│   │   └── { tenants, admins, audit, profile }
│   ├── [tenantSlug]/                   # ALL tenant-scoped pages
│   │   ├── (admin)/  (member)/         # each has loading.tsx + error.tsx streaming boundaries
│   │   ├── (admin)/admin/{ dashboard, members, campaigns, pledges, transactions, … }
│   │   ├── (member)/member/{ dashboard, campaigns, my-pledges, my-transactions, … }
│   │   └── welcome/
│   ├── api/auth/session/               # POST mints / DELETE clears the session cookie
│   ├── logout/
│   └── manifest.ts  sw.ts  serwist/    # PWA: web manifest + Serwist service worker
│
├── proxy.ts                            # middleware: cookie gate + per-request CSP nonce
│
├── components/
│   ├── primitives/                     # OUR design system (Button, Input, Card, DataTable, …)
│   ├── ui/                             # raw shadcn-style wrappers — used BY primitives only
│   ├── formElements/                   # react-hook-form bindings (FormInput, FormSelect, FormSubmit, …)
│   ├── layout/                         # AppShell + Sidebar + TopBar; layout/mobile/ = sub-md chrome
│   ├── pages/                          # page-level composites (DashboardKpiStrip, CampaignForm, …)
│   ├── modals/                         # BaseModal + 25+ registered modals
│   ├── sheets/                         # BaseSheet + mobile bottom sheets (mirrors modals/)
│   ├── illustrations/                  # SVG components
│   └── auth/                           # client pieces of the auth flow
│
└── lib/
    ├── api/                            # one folder per backend entity, intent-split
    │   ├── client.ts                   # browser openapi-fetch + Bearer ID token + 401/claims-refresh middleware
    │   ├── server.ts                   # RSC openapi-fetch + "SessionCookie" scheme middleware
    │   ├── query-client.server.ts      # cache()'d per-request QueryClient (RSC prefetch)
    │   ├── prefetch.tsx                 # prefetchApiQuery + <HydrateClient> (RSC → client hydration)
    │   ├── hooks.ts                    # useApiQuery, useApiMutation, invalidateByPaths, invalidateAllApiQueries
    │   ├── errors.ts / coerce.ts       # typed errors + nullable-field helpers
    │   ├── schema.d.ts                 # GENERATED — never edit
    │   ├── auth/   health/             # flat (not intent-split — per-user / global)
    │   └── tenants/ members/ pledges/ transactions/ campaigns/ invitations/ admin/
    │       ├── keys.ts                 # <ENTITY>_PATHS + invalidate<Entity>(qc, tenantId?)
    │       ├── tenant/   self/         # /tenants/:tenantId/<entity>     /tenants/:tenantId/me/<entity>
    │       └── platform/   public/     # /platform/<entity>              /<token-route>
    ├── modals/                         # registry, Zustand store, ModalHost
    ├── sheets/                         # registry, store, SheetHost, useSheetDrill (mobile sheets)
    ├── mobile-actions/                 # Zustand bridge for the mobile page-action FAB
    ├── auth/                           # AuthProvider, server.getSessionUser, actions, rate-limit
    ├── firebase/                       # client + admin SDK factories
    ├── design/   utils.ts   dayjs.ts   format-currency.ts
```

### Routing model — URL is the source of truth

Tenant scope is encoded in the URL: `/[tenantSlug]/(admin|member)/…`.
There is **no** "active tenant" state and **no** `switchTenant` API
call — to switch tenants, you navigate. Three layers gate access
(outermost first):

1. `proxy.ts` — middleware redirects unauthenticated visitors to
   `/login` (except `/login`, `/invite`, `/logout`).
2. `[tenantSlug]/layout.tsx` — verifies caller is a member of the slug
   OR a super-admin. For super-admins, pre-validates the slug exists
   via `serverApi`.
3. `(admin)/layout.tsx` / `(member)/layout.tsx` — narrow further to
   ADMIN role / any role and render `AppShell` with the matching
   perspective.

`(super-admin)/super-admin/*` is gated by its own top-level layout
(signed-in + `isSuperAdmin`).

### Data layer — intent-split hooks

Every backend endpoint is wrapped in a typed hook in an entity folder
under `src/lib/api/<entity>/`. Each entity is split by **intent**:

| Subfolder | Backend URL | Hook prefix |
|---|---|---|
| `tenant/` | `/tenants/:tenantId/<entity>` | none — `usePledges` |
| `self/` | `/tenants/:tenantId/me/<entity>` | `My` — `useMyPledges` |
| `platform/` | `/platform/<entity>` | mostly `Platform` — `usePlatformTenants` |
| `public/` | token-based / unauthenticated | mostly `Public` |

Member surfaces call `self/*` hooks; admin surfaces call `tenant/*`.
Authorization is enforced server-side; the FE picks the right intent.

```tsx
const { data, isPending } = useMyPledges(tenantId);
const createPledge = useCreatePledge(tenantId);

createPledge.mutate({
  params: { path: { tenantId } },
  body: { campaignItemId, amount, memberId, … },
});
```

Paths, params, bodies, and responses are inferred from the OpenAPI spec
— regenerate with `npm run api:types`. Mutations call
`invalidate<Entity>(qc, tenantId)` from the entity's `keys.ts` in
`onSuccess`. See [CLAUDE.md §6](CLAUDE.md#6-api-layer--one-folder-per-entity-split-by-intent).

List hooks share a common query shape: `offset` / `limit`, the
3-state archive flags (`includeDeleted` / `onlyDeleted`), and — where
the backend supports it — an inclusive `dateFrom` / `dateTo` pair as
ISO 8601 UTC instants. The same trio is enforced on the backend via
shared `StateFilterRequestDto` / `DateRangeRequestDto` /
`PaginationRequestDto` base classes. List/dashboard surfaces read
`member` / `campaign` / `resolvedDeadline` / `daysUntil` / `lifecycle`
**embedded** in list responses and use batch endpoints
(`useMyCampaignsProgressBatch`, `useMembersGivingTrend`) instead of
per-row fan-out queries.

**RSC prefetch + hydration.** Dashboard `page.tsx` files are async RSCs
that `prefetchApiQuery(...)` their deterministic-key queries (e.g.
`useCampaigns` / `useMyChurchSummary` / `useMyCampaigns`) into a
`cache()`'d per-request `QueryClient` and wrap the `"use client"`
composite in `<HydrateClient>`, so it hydrates from cache instead of
waterfalling. The `[tenantSlug]` layout seeds the tenant it already
fetched for super-admin slug validation. Queries keyed on a
client-computed dayjs window or a viewport-dependent page size are
intentionally **not** prefetched (the key wouldn't match) — they stay
client-fetched, smoothed by `loading.tsx` + `placeholderData:
keepPreviousData` (the QueryClient default, so paginating/filtering keeps
prior rows instead of flashing a skeleton).

### Auth (dual-path)

```
Google SSO (Firebase client SDK)
        │
        ▼
    ID token ──┬──► POST /api/v1/auth/session   (backend upserts User + writes claims)
               └──► POST /api/auth/session       (Admin SDK mints HTTP-only session cookie)
```

Subsequent client API calls carry the Bearer ID token (browser
middleware); RSC API calls carry the session cookie under a custom
`SessionCookie` scheme; Next navigations carry the session cookie via
the browser.

The Next session-cookie route is rate-limited (20 req/min/IP via
in-memory token bucket — replace with KV before scaling horizontally).

When the backend mutates Firebase claims (admin grants a role, invite
accepted, super-admin toggle, sign-out-everywhere) the response carries
`X-Claims-Refreshed: 1`; the browser middleware sees that header,
force-refreshes the ID token, and re-mints the session cookie. You
don't have to call `refreshSession()` manually unless your flow bypasses
the typed API client.

RSCs read auth via `getSessionUser()`, wrapped in React `cache()`
(per-request memo) and verifying the session cookie's signature locally
(`verifySessionCookie(cookie, false)` — no network; the backend guard
still enforces revocation). `AuthProvider` is a pure state provider — it
does **not** redirect on a null user; the 401 handler and invite
"switch account" eject via a **soft** `router.replace`/`refresh`
(`setLoginRedirector` in `client.ts` + `AuthNavigationBridge` mounted in
`QueryProvider`), not a full-page `window.location` reload.

### UI primitive enforcement

Page code lives at the **primitive** layer
(`components/primitives/Button`, `Input`, `DataTable`, …), not at the
raw HTML or the `components/ui/` wrappers. `npm run check` fails the
build on native `<button>`/`<input>`/`<a>`/etc. outside the allowed
folders. Forms compose RHF + zod via the
`components/formElements/Form*` wrappers.

Dates are picked through a custom three-view (`day` / `month` / `year`)
[`Calendar`](src/components/primitives/Calendar.tsx) primitive — built
on dayjs rather than react-day-picker — and wrapped by
[`DatePicker`](src/components/primitives/DatePicker.tsx) and
[`DateRangePicker`](src/components/primitives/DateRangePicker.tsx). The
range picker has an optional preset sidebar (`presets="default" | false
| DateRangePreset[]`) and a compact `size="sm" autoWidth clearable`
variant for list-page toolbars. See
[CLAUDE.md §7.2](CLAUDE.md#72-date-primitives--calendar-datepicker-daterangepicker).

### Soft delete

Tombstones are first-class on every list and detail page. Admin lists
expose a 3-state "Active / Deleted / All" switcher through
[`StateFilter`](src/components/primitives/StateFilter.tsx) (mapped to
the backend's `includeDeleted` / `onlyDeleted` flags via
`toStateFilterFlags`). Cross-entity references that point at archived
rows render through
[`DeletedLabel`](src/components/primitives/DeletedLabel.tsx) (muted
text + "deleted" pill + tooltip); detail pages for archived entities
render an
[`EntityRestoreBanner`](src/components/primitives/EntityRestoreBanner.tsx)
with a Restore button that opens a per-entity
`confirm-restore-<entity>` modal. See
[CLAUDE.md §13](CLAUDE.md#13-soft-delete--frontend-ux-patterns).

### Modals

Every modal lives in its own folder under `src/components/modals/<name>/`
and renders inside the shared
[BaseModal](src/components/modals/BaseModal.tsx) shell. Open one from
anywhere with:

```ts
openModal("confirm-delete", { title, message, onConfirm });
```

Modal prop shapes are typed via `declare module` augmentation — there's
no string-typed `props: any` payload. The host registry maps each name to
a `next/dynamic` import, so every modal is lazy-loaded and kept off the
initial bundle. See
[CLAUDE.md §8](CLAUDE.md#8-modal-system--one-folder-per-modal) for how
to register one.

### Sheets & mobile chrome

Modals are the desktop overlay; **sheets** are the mobile bottom-sheet
counterpart (drag handle, snap points), under `src/components/sheets/`
with their own registry / store / host that mirror the modal system —
including the same `next/dynamic` lazy-loading of each sheet. Open one
with `openSheet("pledge", { … })`. Some flows ship both — the desktop
surface opens the modal, the mobile FAB opens the sheet.

Below `md` (768px) the Sidebar/TopBar give way to `MobileChrome`
(`components/layout/mobile/`): a bottom nav, a top bar, and a
page-action FAB driven by `useMobileActions`. Page composites follow a
single responsive recipe — `px-4 pb-36 md:px-8 md:pb-8` scroll
container, `DataTableShell` `mobileCard` for tables, `StatBand
mobileColumns` for KPI bands. See
[CLAUDE.md §9–§10](CLAUDE.md#9-sheets--mobile-bottom-sheets).

### PWA

The app is an installable PWA (and packaged as a TWA/APK) via **Serwist**.
The web manifest is [`app/manifest.ts`](src/app/manifest.ts) and the
service worker is [`app/sw.ts`](src/app/sw.ts), served at `/serwist/sw.js`
by a Route Handler. The SW deliberately **never caches `/api/`** (auth-gated)
and passes Firebase/Google auth requests straight through, and
`next.config.ts` rewrites `/__/auth/*` to the project's `firebaseapp.com`
so redirect-based login is first-party. See
[CLAUDE.md §11](CLAUDE.md#11-pwa--service-worker).

### Telemetry

`WebVitalsReporter` (mounted in the root layout) reports LCP / INP / CLS /
TTFB plus router-transition timing (`onRouterTransitionStart` in
`src/instrumentation-client.ts`). The sink is `console.debug` in dev, or a
`navigator.sendBeacon` to `NEXT_PUBLIC_VITALS_URL` when that env var is set.

## For agents

Full conventions and anti-patterns live in [CLAUDE.md](CLAUDE.md).
Please read it before non-trivial changes. Next 16 has breaking
differences from prior versions — see [AGENTS.md](AGENTS.md).
