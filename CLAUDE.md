@AGENTS.md

# CLAUDE.md — Church App Frontend Agent Guide

> **Audience:** AI coding agents working in this repo.
> **Goal:** add features without breaking the established routing / data /
> modal / auth patterns. Read this before non-trivial edits.
>
> Backend conventions live in
> [../church-app-backend/CLAUDE.md](../church-app-backend/CLAUDE.md) — check
> there rather than guessing about backend behavior.

---

## 1. Tech stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | **Next.js 16** (App Router) | See [AGENTS.md](AGENTS.md). Check `node_modules/next/dist/docs/` before writing router code. |
| React | **19** | |
| Language | **TypeScript 6** (strict) | |
| Server state | **TanStack Query v5** | |
| HTTP client | **openapi-fetch 0.17** | one browser ([client.ts](src/lib/api/client.ts)), one RSC ([server.ts](src/lib/api/server.ts)) |
| Type generation | **openapi-typescript 7** | against backend's `/api-docs-json` |
| Client state | **Zustand 5** | UI-only stores: modals (§8), sheets (§9), mobile-actions FAB (§10.2) |
| Forms | **react-hook-form 7** + **zod 4** | via `components/formElements/*` |
| Auth | `firebase` (client) + `firebase-admin` (server) | |
| Charts | `recharts` | never imported synchronously — only behind a `next/dynamic` boundary (`primitives/charts/DonutChart`, `Sparkline`, or a colocated `*Chart.tsx`). See §7.3 |
| Date pickers | **custom** [Calendar.tsx](src/components/primitives/Calendar.tsx) (dayjs) | DatePicker/DateRangePicker wrap it. `react-day-picker` is dormant. |
| Date math | **dayjs** | sole date library — no `Date.parse`, no `date-fns`, no `Intl.DateTimeFormat` ad-hoc. Import only from [lib/dayjs.ts](src/lib/dayjs.ts). |
| Icons | `lucide-react` | consumed only via [Icon.tsx](src/components/primitives/Icon.tsx) |
| Styling | Tailwind 4 + CSS variables | tokens in `globals.css`; `cn()` in [utils.ts](src/lib/utils.ts) |
| Linting | **Biome 2** | |
| Headless UI | `@base-ui/react` + `components/ui/` shadcn-style set | base for our primitives only |
| PWA | **Serwist** (`@serwist/turbopack`) | installable PWA / TWA; service worker `app/sw.ts`, manifest `app/manifest.ts` (§11) |

Backend dev server: **`:8000`** (set via `NEXT_PUBLIC_API_BASE_URL`).
OpenAPI doc URL for type generation: `http://localhost:8000/api-docs-json`. `npm run dev` blocks on `scripts/wait-for-api.sh`.

[next.config.ts](next.config.ts) enables `reactCompiler: true`
(`babel-plugin-react-compiler` auto-memoizes — don't hand-add
`useMemo`/`useCallback` for perf), `experimental.staleTimes`
(`dynamic: 30`, `static: 180` — re-navigating a just-visited segment
reuses its RSC payload), and `images.remotePatterns` for
`*.googleusercontent.com` (Google avatars via `next/image` — the `Avatar`
primitive renders remote photos through it; hosts mirror `img-src` in
[proxy.ts](src/proxy.ts)). `/icons` + `/logo.png` get immutable
`Cache-Control`.

## 2. Commands

```bash
npm run dev          # waits for backend, starts Next on :3000
npm run dev:test     # same, loading .env.development.local
npm run build        # production build (.env.production)
npm run start        # serve production build on :3002
npm run typecheck    # tsc --noEmit
npm run lint         # biome lint
npm run check        # enforce-ui-primitives.mjs + biome check --write
npm run api:types    # regenerate src/lib/api/schema.d.ts (needs backend on :8000)
```

`schema.d.ts` is generated — never edit by hand. `npm run check` enforces
UI primitives (§7) and fails the build on native HTML elements.

---

## 3. Directory layout

```
src/
├── app/                     # Next App Router (RSC by default)
│   ├── (auth)/              # public routes: login, select-church, invite/[token]
│   ├── (super-admin)/       # platform ops, NOT tenant-scoped; gated by isSuperAdmin
│   ├── [tenantSlug]/        # ALL tenant-scoped pages
│   │   ├── (admin)/admin/   # admin perspective (role=ADMIN)
│   │   └── (member)/member/ # member perspective (any role)
│   ├── api/auth/session/    # POST mints / DELETE clears Next session cookie
│   └── logout/              # client sign-out
├── proxy.ts                 # Next middleware — cookie gate + per-request CSP nonce
├── components/
│   ├── primitives/          # OUR design system — page code uses these
│   ├── ui/                  # raw shadcn-style wrappers — consumed BY primitives only
│   ├── formElements/        # RHF-bound primitive wrappers
│   ├── layout/              # AppShell, Sidebar, TopBar
│   │   └── mobile/          # MobileChrome, MobileBottomNav, MobileTopBar, MobilePageFab (§10.1)
│   ├── pages/               # page-level composites (the real page UI)
│   ├── modals/
│   │   ├── BaseModal.tsx    # shared shell — every modal renders inside this
│   │   ├── index.ts         # barrel — loads every modal's `declare module`
│   │   └── <name>/<Name>Modal.tsx
│   └── sheets/              # mobile bottom sheets (§9), mirrors modals/
│       ├── BaseSheet.tsx    # shared shell — every sheet renders inside this
│       ├── index.ts         # barrel — loads every sheet's `declare module`
│       └── <name>/<Name>Sheet.tsx
└── lib/
    ├── api/
    │   ├── client.ts        # browser openapi-fetch + Bearer middleware
    │   ├── server.ts        # RSC openapi-fetch + SessionCookie middleware
    │   ├── hooks.ts         # useApiQuery / useApiMutation / invalidate helpers
    │   ├── coerce.ts        # nnum / nstr — nullable→undefined helpers
    │   ├── query-client.server.ts  # getServerQueryClient — cache()'d per-request RSC client (§4.5)
    │   ├── prefetch.tsx     # prefetchApiQuery + <HydrateClient> for RSC prefetch (§4.5)
    │   ├── schema.d.ts      # GENERATED
    │   └── <entity>/        # one folder per entity, split by intent (§6)
    ├── modals/{registry,store,host}.tsx
    ├── sheets/{registry,store,host,useSheetDrill}.tsx   # bottom-sheet system (§9)
    ├── mobile-actions/store.ts                          # page-action FAB bridge (§10.2)
    ├── auth/{AuthProvider,AuthNavigationBridge,actions,server,rate-limit}.ts
    ├── firebase/{client,admin}.ts
    └── dayjs.ts             # sole dayjs entrypoint with plugins
```

The PWA entrypoints (`app/manifest.ts`, `app/sw.ts`,
`app/serwist/[path]/route.ts`) are covered in §11.

There is **no** `app/(dashboard)/`, **no** `app/admin/`, and **no**
generic `lib/api/<entity>/hooks.ts` — every entity is split by intent.
Stale docs/comments referencing those are wrong.

---

## 4. App Router boundaries

- Layouts and pages are **Server Components by default**.
- `"use client"` marks a client boundary — everything imported from a
  client file becomes client-side.
- Providers (`QueryProvider`, `ModalHost`, `AuthProvider`,
  `TooltipProvider`) are client components rendered directly from the RSC
  root layout. `AuthProvider` is a **pure auth-state provider** — it does
  NOT redirect on a null user; the 401 handler + invite "switch account"
  do a soft `router.replace`/`refresh` via `AuthNavigationBridge` (§5.2).
- Never import Firebase **client** SDK from an RSC. Never import Firebase
  **Admin** SDK from a Client Component (build fails — [admin.ts](src/lib/firebase/admin.ts) is `import "server-only"`).

### 4.1 Two HTTP clients

| Where | Client | Auth header | Use for |
|---|---|---|---|
| Client Components | `api` ([client.ts](src/lib/api/client.ts)) | `Bearer <ID token>` | every interactive read/write via `useApiQuery` / `useApiMutation` |
| Server Components | `serverApi` ([server.ts](src/lib/api/server.ts)) | `SessionCookie <cookie>` | RSC pre-rendering (e.g. `[tenantSlug]/layout.tsx` slug validation) |

`serverApi` forwards the HTTP-only session cookie under a custom
`SessionCookie` scheme; backend's `FirebaseAuthGuard` verifies it via
`verifySessionCookie`. Both clients unwrap the `{ success, data }`
envelope and convert non-2xx JSON to `ApiError`.

### 4.2 Routing model — URL is the source of truth

Tenant scope is **encoded in the URL** (`/[tenantSlug]/…`). There is no
"active tenant" stored anywhere — to switch tenants, you navigate. No
`switchTenant` API call, no `/auth/switch-tenant` endpoint.

Three layout layers gate access (outermost first):

1. [proxy.ts](src/proxy.ts) — redirects unauthenticated visitors to
   `/login` (`PUBLIC_PATHS = ["/login", "/invite", "/logout"]`); bounces
   signed-in users away from `/login`; sets the per-request CSP nonce.
2. `[tenantSlug]/layout.tsx` — verifies caller is a member of the slug
   OR a super-admin; super-admins get slug pre-validation via `serverApi`.
3. `(admin)/layout.tsx` / `(member)/layout.tsx` — narrow to ADMIN role
   / any role; render `AppShell` with the matching `perspective`. A
   super-admin without a Member row only sees the admin perspective.

`(super-admin)/super-admin/*` is gated at the top level (not under
`[tenantSlug]`) because those routes manage **all** tenants.

### 4.3 `page.tsx` is a thin wrapper (or a thin RSC prefetcher)

Every `app/**/page.tsx` imports a Page composite from
`components/pages/<feature>/` and renders it. **No business logic, no
JSX, no `useParams` in `page.tsx`** — that's the composite's job. The
composite stays `"use client"` and reads route params with `useParams()`
itself; **don't pass params from `page.tsx` to the composite as props**
(keeps it usable from any matching route shape).

```tsx
// the simple case — most pages
import { MembersPage } from "@/components/pages/members";
export default () => <MembersPage />;
```

A `page.tsx` **may** instead be an **async RSC** that pre-fetches the
composite's deterministic-key queries and wraps it in `<HydrateClient>`
(§4.5) so they hydrate from cache instead of waterfalling on mount — this
is the one sanctioned exception to "no data fetching in `page.tsx`":

```tsx
// app/[tenantSlug]/(admin)/admin/dashboard/page.tsx
import { AdminDashboardPage } from "@/components/pages/dashboard";
import { HydrateClient, prefetchApiQuery } from "@/lib/api/prefetch";
export default async ({ params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  await prefetchApiQuery("/api/v1/tenants/{tenantId}/campaigns", {
    params: { path: { tenantId: tenantSlug }, query: {} },
  });
  return <HydrateClient><AdminDashboardPage /></HydrateClient>;
};
```

### 4.4 CSP carve-outs (set in [proxy.ts](src/proxy.ts))

- `script-src`: `'strict-dynamic'` for nonced Next loader + explicit
  Google hosts (`apis.google.com`, `www.gstatic.com`, `www.googleapis.com`)
  for older browsers. `'unsafe-eval'` is **dev-only** for React's error
  overlay.
- `style-src`: includes `'unsafe-inline'` because Radix/base-ui inject
  inline `style` attrs for floating-UI positioning. Removing this breaks
  every popover/dropdown.
- `frame-src`: `accounts.google.com` + `*.firebaseapp.com` for SSO popup.

Static headers (HSTS, X-Frame-Options, …) live in [next.config.ts](next.config.ts).

(PPR / static rendering is **not** enabled — pages still render
dynamically via `await connection()` + the nonce CSP.)

### 4.5 RSC prefetch + hydration, streaming

[`getServerQueryClient`](src/lib/api/query-client.server.ts) is a React
`cache()`'d `QueryClient`, one per request — a layout and the page
beneath it accumulate prefetches into the **same** client.
[`prefetchApiQuery(path, init)`](src/lib/api/prefetch.tsx) fetches via
`serverApi` (session-cookie auth) and seeds the cache under the **exact
`[path, init]` key** the browser `useApiQuery(path, init)` builds;
`<HydrateClient>` dehydrates everything seeded so far into a
`HydrationBoundary`. The client composite then resolves from cache on
first render instead of blank → spinner → data.

Rules:

- **Only prefetch deterministic-key queries** — the `init` must be
  byte-for-byte what the client hook builds (TanStack hashes the key).
  Queries keyed on a client-computed dayjs window or a viewport-dependent
  page size are intentionally **left client-fetched** (the key wouldn't
  match); they're smoothed by `loading.tsx` + `keepPreviousData` (§6.6).
- The `[tenantSlug]` layout **seeds** the tenant it already fetched for
  super-admin slug-validation under the `useTenant(slug)` key (rather
  than discarding it), then wraps `children` in `<HydrateClient>`.
- `prefetchApiQuery` never throws — a failed prefetch just leaves the
  cache cold and the client refetches.

**Streaming/skeletons.** Each route group has a `loading.tsx` +
`error.tsx`: `(admin)/loading.tsx` + `(member)/loading.tsx` render
[`PageContentSkeleton`](src/components/layout/PageContentSkeleton.tsx)
inside the already-rendered `AppShell`; `error.tsx` renders
[`RouteError`](src/components/layout/RouteError.tsx). These also make
`<Link>` prefetch worthwhile and feed `experimental.staleTimes`.

---

## 5. Auth — the dual path

```
Google SSO (Firebase client SDK)
        │
        ▼
    ID token ──┬──► POST /api/v1/auth/session    (backend upserts User + writes custom claims)
               └──► POST /api/auth/session       (Next route mints HTTP-only session cookie)

Subsequent requests:
    Navigations       ─► session cookie  ─► proxy.ts + getSessionUser()
    Client API calls  ─► Bearer ID token ─► backend FirebaseAuthGuard
    RSC API calls     ─► session cookie  ─► backend via SessionCookie scheme
```

### 5.1 Custom claims shape

```ts
type TenantMembership = { memberId: string; role: "ADMIN" | "USER"; name: string };
type Claims = {
  isSuperAdmin?: boolean;
  tenantMemberships?: Record<string /* slug */, TenantMembership>;
};
```

[`getSessionUser()`](src/lib/auth/server.ts) normalises this into
`SessionUser` and distinguishes "no cookie" (visitor — expected) from
"verification failed" (logged with reason). It is wrapped in React
`cache()` (one verify per request, shared by layout + page) and verifies
the cookie **locally** — `verifySessionCookie(cookie, false)` (signature
only, no network round-trip to check revocation; the backend guard still
enforces revocation on the API call).

### 5.2 Rules

1. **Sign-in lives in [auth/actions.ts](src/lib/auth/actions.ts)**
   (`signInWithGoogle`). Multi-step: Firebase popup → backend session
   exchange → force-refresh ID token → mint Next cookie. Don't reinvent.
2. **Never store the ID token manually.** `auth.currentUser.getIdToken()`
   returns a fresh one; the request middleware fetches it per-request.
3. **Claims auto-refresh.** Backend handlers marked with
   `@RefreshesClaims()` emit `X-Claims-Refreshed: 1`. The response
   middleware in [client.ts](src/lib/api/client.ts) sees that header and
   force-refreshes the ID token + re-mints the cookie automatically. Only
   call `refreshSession()` manually for flows that bypass the typed
   client (raw `fetch`).
4. **`/api/auth/session` is rate-limited** (20 req/min/IP via
   [auth/rate-limit.ts](src/lib/auth/rate-limit.ts)) — `verifyIdToken` is
   RSA-bound CPU work. In-memory only; replace with Vercel KV/Upstash
   before horizontal scaling.
5. **`proxy.ts` gates by session cookie only.** Public paths are in
   `PUBLIC_PATHS`; don't add bypasses inline.
6. **RSCs read auth via `getSessionUser()`**, check for `null`,
   `redirect("/login")`. Never trust query params or cookies directly.
7. **401 → global sign-out.** The response middleware signs out, deletes
   the cookie, and ejects to `/login?next=…` — except for
   `UNAUTHENTICATED_PATHS` (`/login`, `/invite`, `/logout`). The eject is
   a **soft** `router.replace` + `queryClient.clear()` via
   `AuthNavigationBridge` (registered through `setLoginRedirector`), not a
   `window.location` reload — only the early-boot path (no bridge yet)
   falls back to a hard redirect. The claims-refresh (rule 3) has an
   in-flight guard so a burst of `X-Claims-Refreshed` responses re-mints
   the cookie once, not N times.

### 5.3 Sign-out

- `signOut()` — local (Firebase + Next cookie).
- `signOutEverywhere()` — calls backend `/auth/sign-out-everywhere` to
  revoke **all** refresh tokens, then signs out locally. Other tabs/
  devices keep working until their next API call 401s.

Imperative auth flows go in [auth/actions.ts](src/lib/auth/actions.ts).
Mark claim-mutating backend handlers with `@RefreshesClaims()` so the
response middleware can auto-refresh.

---

## 6. API layer — one folder per entity, split by intent

The single most important frontend convention. **Every backend endpoint
is wrapped in a typed hook in an entity folder.** Components never call
`openapi-fetch` directly.

The hook layer mirrors the backend's intent split. Each entity has
subfolders named after the URL scope, not the caller's role:

| Subfolder | Backend URL | Hook prefix | Examples |
|---|---|---|---|
| `tenant/` | `/tenants/:tenantId/<entity>` | none | `usePledges`, `useCreateMember` |
| `self/` | `/tenants/:tenantId/me/<entity>` | `My` | `useMyPledges`, `useMyProfile` |
| `platform/` | `/platform/<entity>` | `Platform` (mostly) | `usePlatformTenants`. Exception: `admin/platform/` uses bare `useAdminStats`, `useAdminUsers` (entity is itself "admin") |
| `public/` | `/<resource>/...` (token-based) | bare today (legacy); prefer `Public` for new hooks | `useLookupInvitation`, `useAcceptInvitation` |

A surface picks the intent matching its URL. Member dashboards call
`self/*`; admin dashboards call `tenant/*`. The backend enforces
authorization; the frontend's job is to choose the right intent.

### 6.1 Folder shape

```
src/lib/api/<entity>/
├── keys.ts          # <ENTITY>_PATHS (covers every intent) + invalidate<Entity>(qc, tenantId?)
├── index.ts         # re-exports keys + each intent subfolder
├── tenant/{hooks.ts, index.ts}
├── self/{hooks.ts, index.ts}
├── platform/        # only if entity has /platform/* endpoints
└── public/          # only if entity has token/unauthenticated endpoints
```

`keys.ts` is at the entity root because invalidation is intent-agnostic
— a tenant-side mutation should refresh self-side caches and vice versa.
`<ENTITY>_PATHS` lists literal OpenAPI paths across **all** intents.

`auth/` and `health/` are flat (no intent split) — per-user/global.

Hooks are re-exported through each entity's root `index.ts`. Consumers
do `import { useMyPledges } from "@/lib/api/pledges"`. The prefix is the
disambiguator.

### 6.2 Query keys & invalidation

Every query key is `[path, init]` where `path` is the literal OpenAPI
template (`"/api/v1/tenants/{tenantId}"`) and `init` is `{ params, body }`.
**Never hand-write keys** — `useApiQuery` sets them.

Each `keys.ts` exports:
- `<ENTITY>_PATHS` — every path returning data of this entity, across
  all intents.
- `invalidate<Entity>(qc, tenantId?)` — for tenant-scoped entities,
  narrows by `init.params.path.tenantId`; pass `undefined` to invalidate
  across all tenants (rare). For non-tenant entities, uses
  [`invalidateByPaths`](src/lib/api/hooks.ts) — exact-path matching.

```ts
return useApiMutation("/api/v1/tenants/{tenantId}/pledges", "post", {
  onSuccess: () => invalidatePledges(qc, tenantId),
});
```

**Predicate > prefix matching** because paths overlap literally
(`/api/v1/platform/tenants` vs `/api/v1/platform/tenants/{tenantId}/…`).
See [tenants/keys.ts](src/lib/api/tenants/keys.ts).

**Cross-entity invalidation** — only for identity changes (sign-out,
super-admin toggle): `invalidateAllApiQueries(qc)`. Never reach for the
nuclear option just because you don't know the scope.

### 6.3 Cadence for adding a new endpoint

1. Backend ships the endpoint.
2. `npm run api:types`.
3. Pick the intent subfolder matching the URL. Add a hook to
   `<intent>/hooks.ts` using the naming convention in §6. If the intent
   folder doesn't exist, create `hooks.ts` + `index.ts` and add an
   `export * from "./<intent>";` to the entity's root `index.ts`.
4. Add the new path to `<ENTITY>_PATHS` in `keys.ts`.
5. Mutations: `onSuccess: () => invalidate<Entity>(qc, tenantId)`.
6. New entity? Follow [src/lib/api/pledges/](src/lib/api/pledges/)
   (tenant + self) or [src/lib/api/tenants/](src/lib/api/tenants/)
   (platform + tenant + self). Register in [src/lib/api/index.ts](src/lib/api/index.ts).

### 6.4 Auth endpoints are special

`POST /auth/session`, `POST /auth/sign-out-everywhere`, and the Next
session-cookie route are multi-step flows (Firebase + backend + cookie
+ token refresh). They live in [auth/actions.ts](src/lib/auth/actions.ts)
and must NOT be exposed as raw `useApiMutation`. Only `GET /auth/me` is
exposed as `useAuthMe()`.

### 6.5 Schema coercion

[`coerce.ts`](src/lib/api/coerce.ts) exports `nnum` / `nstr` for the
"backend returns `null` but UI wants `string | undefined`" pattern.

### 6.6 Consume embedded + batch data — don't fan out

List/dashboard responses now embed what surfaces used to fetch per-row:
the campaign/member rows carry `member` / `campaign` /
`resolvedDeadline` / `daysUntil` / `lifecycle`. **Read those off the list
row instead of issuing a per-row request.** Two batch endpoints cover the
aggregate cases: `useMyCampaignsProgressBatch` (campaigns/self) and
`useMembersGivingTrend` (members/tenant).

The per-campaign fan-out hooks (`useCampaignProgressMany`,
`useMyCampaignProgressMany`, `useCampaignsManyWithItems`,
`useMyCampaignsManyWithItems`) and the `limit: 500` member prefetch they
relied on **have been deleted** — don't reintroduce that pattern (§12).

The browser `QueryClient` ([providers.tsx](src/lib/api/providers.tsx))
sets `placeholderData: keepPreviousData`, so paginating/filtering a list
keeps the prior rows on screen instead of flashing a skeleton.

---

## 7. UI primitives — strict enforcement

Every interactive element must come from [`components/primitives/`](src/components/primitives/)
(Button, Input, Select, Textarea, DatePicker, DateRangePicker,
MemberPicker, AmountInput, DataTable, Table, Badge, Pill, Chip, Card,
Avatar, Pressable, …). [`components/ui/`](src/components/ui/) is consumed
**only by primitives** — page code never imports from it.

[`scripts/enforce-ui-primitives.mjs`](scripts/enforce-ui-primitives.mjs)
(part of `npm run check`) fails the build on these native elements
outside `components/primitives/` and `components/ui/`:

```
<button>  <input>  <select>  <textarea>  <img>  <label>  <table>  <hr>  <a>
```

Don't silence the linter — wrap in the matching primitive: `Button`,
`Input`, `Select`, `Textarea`, `Avatar` (`<img>`), `ListRow`/`OptionRow`
(`<label>`), `Table`/`DataTable`, `Pressable` (buttonish `<a>`). For
navigation use `next/link` — the linter only flags raw `<a>`.

### 7.1 Forms

Compose RHF + zod via `components/formElements/*`:

```tsx
const methods = useForm<Values>({ resolver: zodResolver(schema) });

<Form methods={methods} onSubmit={handleSubmit}>
  <FormInput name="email" label="Email" />
  <FormSelect name="role" options={ROLE_OPTIONS} />
  <FormSubmit label="Save" />
</Form>
```

Don't reach for `<input>` + `register()` directly — add a `Form*` wrapper
under [components/formElements/](src/components/formElements/) if one is
missing.

### 7.2 Date primitives

```
DatePicker / DateRangePicker
        └── Calendar (custom, dayjs-based, NOT react-day-picker)
```

[`Calendar`](src/components/primitives/Calendar.tsx) has three views
(day/month/year) — click the header to zoom out. Supports
`mode="single"` and `mode="range"`.

**Value contract:** ISO `YYYY-MM-DD` strings (date-only wire format).
For full UTC instants in list filters:
`dayjs.utc(value).startOf("day").toISOString()` /
`dayjs.utc(value).endOf("day").toISOString()`.

**DateRangePicker presets** (via `presets` prop): `"default"` (Today /
This week / Last week / This month / Last month / This year), `false`
(calendar only), or a custom `DateRangePreset[]` with
`{ label, resolve() => { from, to } }`.

**Compact form for list toolbars** — when in `DataTableShell` toolbar
next to the search input, use `size="sm" autoWidth clearable`:

```tsx
<DataTableShell
  toolbar={
    <DateRangePicker
      value={range}
      onChange={setRange}
      placeholder="Date range"
      size="sm" autoWidth clearable
    />
  }
/>
```

Forward `dateFrom`/`dateTo` to the list hook (every list hook accepts
the pair). `size="md"` (default) is for forms.

### 7.3 Charts — always behind a `next/dynamic` boundary

There is no `Charts.tsx` barrel anymore. recharts (~168 KB gzip) must
**never** be imported synchronously into a page composite — it goes
behind a lazy boundary so it stays off the route's first-load JS:

- [`primitives/charts/DonutChart`](src/components/primitives/charts/DonutChart.tsx)
  and [`Sparkline`](src/components/primitives/Sparkline.tsx) are
  `next/dynamic` wrappers; the recharts-backed body lives in their
  sibling `*Impl.tsx`.
- A bespoke chart lives in a **colocated `*Chart.tsx` / `*Charts.tsx`**
  next to its composite (the only files allowed to `import "recharts"`),
  and the composite pulls it in via `next/dynamic` (e.g.
  [`CampaignTimelineChart`](src/components/pages/campaigns/CampaignTimelineChart.tsx),
  [`MonthTrendChart`](src/components/pages/reports/MonthTrendChart.tsx)).

Reserve the container's height so the lazy load shows empty space rather
than shifting layout.

---

## 8. Modal system

Every modal renders inside [BaseModal.tsx](src/components/modals/BaseModal.tsx).
Never render a standalone overlay/portal.

```
src/components/modals/
├── BaseModal.tsx
├── index.ts                 # barrel — loads every modal's `declare module`
└── <name>/
    ├── <Name>Modal.tsx      # component + `declare module` augmentation
    └── index.ts             # re-export
```

### 8.1 Props are typed globally

```ts
// src/components/modals/confirm-delete/ConfirmDeleteModal.tsx
declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-delete": ConfirmDeleteProps;
  }
}
```

`openModal("confirm-delete", { title, message, onConfirm })` is then
type-checked against this declaration.

### 8.2 Registering a modal — three edits

1. Create `src/components/modals/<name>/<Name>Modal.tsx` with the
   `declare module` augmentation and `<BaseModal>` wrapping the body.
2. Create `src/components/modals/<name>/index.ts` that re-exports it.
3. Add `export * from "./<name>";` to
   [src/components/modals/index.ts](src/components/modals/index.ts) AND
   add a line to the `registry` object in
   [src/lib/modals/host.tsx](src/lib/modals/host.tsx).

The host **lazy-loads** each modal via `next/dynamic` (registry maps name
→ `lazyModal(() => import(…), "Name")`), so a navigation that opens no
modal pulls none of their zod/RHF deps. The `declare module`
augmentations are picked up by the compiler from tsconfig `include`, so
the registry line is `ssr: false` `next/dynamic` — match the existing
entries.

### 8.3 Opening / in-flight

```ts
import { openModal } from "@/lib/modals/store";

openModal("confirm-delete", {
  title: "Delete tenant?",
  message: "This is soft-deleted; an admin can restore it.",
  onConfirm: async () => { /* mutateAsync(...) */ },
});
```

`openModal` / `closeModal` work outside React. Inside components,
`useModalStore` is also available if you need reactivity.

While a modal's mutation is pending, pass `dismissible={false}` to
`BaseModal` so ESC and backdrop-click don't close mid-operation. See
[ConfirmDeleteModal](src/components/modals/confirm-delete/ConfirmDeleteModal.tsx).

---

## 9. Sheets — mobile bottom sheets

Modals (§8) are the desktop-centred overlay; **sheets** are the mobile
bottom-sheet counterpart, with a drag handle, snap points, and a sticky
safe-area footer. They live in `src/components/sheets/` and are driven by
a **separate registry / host / store that mirrors the modal system
one-for-one** — don't conflate the two.

```
src/components/sheets/
├── BaseSheet.tsx            # shared shell (drag, snapPoints, footer, onBack)
├── index.ts                 # barrel — loads every sheet's `declare module`
└── <name>/
    ├── <Name>Sheet.tsx      # component + `declare module` augmentation
    └── index.ts
src/lib/sheets/
├── registry.ts              # SheetPropsMap (augmented per sheet) + SheetBaseProps
├── store.ts                 # openSheet / closeSheet (work outside React)
├── host.tsx                 # SheetHost — registry object + exit-animation mount
└── useSheetDrill.ts         # in-sheet drill-down (directional slide)
```

`SheetHost` is mounted in the **root** [app/layout.tsx](src/app/layout.tsx)
beside `ModalHost`, so sheets work on public pages too (e.g. the landing
navbar's account sheet).

### 9.1 Modal vs sheet

Use a **sheet** for a mobile-first flow (record gift, make a pledge,
account menu, nav overflow); use a **modal** for confirmations and
desktop-centred forms. Several flows ship both — the desktop surface
opens the modal, the mobile FAB opens the sheet (e.g. the `create-pledge`
modal + the `pledge` sheet). Either way, never render a standalone
overlay/portal — go through `BaseSheet`.

### 9.2 Registering a sheet — three edits (mirrors §8.2)

1. Create `src/components/sheets/<name>/<Name>Sheet.tsx`: a component
   taking `SheetBaseProps & <YourProps>`, wrapping its body in
   `<BaseSheet>`, with a `declare module "@/lib/sheets/registry"`
   augmentation of `SheetPropsMap`.
2. Create `<name>/index.ts` re-exporting it.
3. Add `export * from "./<name>";` to
   [components/sheets/index.ts](src/components/sheets/index.ts) AND add the
   component to the `registry` object in
   [lib/sheets/host.tsx](src/lib/sheets/host.tsx) — as a `lazySheet`
   `next/dynamic` entry (the host lazy-loads sheets just like `ModalHost`,
   §8.2).

### 9.3 Opening / props

```ts
import { openSheet } from "@/lib/sheets/store";
openSheet("pledge", { intent: "tenant", tenantSlug, campaignId, … });
```

Type-checked against `SheetPropsMap`; works outside React. The host
injects `open` / `onOpenChange` / `onOpenChangeComplete` — sheet authors
thread those into `<BaseSheet>`; callers never pass them. While a mutation
is pending, keep the footer button in its `loading` state rather than
letting the sheet close mid-flight.

### 9.4 In-sheet drill-down & local filter sheets

- Multi-step sheets (account → switch context → tenant picker) use
  [`useSheetDrill(initial, open)`](src/lib/sheets/useSheetDrill.ts) for
  the directional slide + auto-reset on close, plus `BaseSheet`'s `onBack`.
- A sheet whose controls must read **live page state** (the list-filter
  sheet) is built **locally with `BaseSheet`, NOT registered globally** —
  the global store snapshots props at `openSheet` time and would go
  stale. See `DataTableShellMobile`.

---

## 10. Layout, chrome & mobile

[`AppShell`](src/components/layout/app-shell/AppShell.tsx) is the
top-level chrome for every authenticated surface. It takes a
`perspective` (`"admin" | "member" | "super"`) and renders the Sidebar
(with `AccountMenu` for tenant switching + Platform entry for super-
admins) and TopBar.

Layouts instantiate `AppShell` — **pages don't import it themselves**.
To add a navigation item, edit
[`components/layout/sidebar/buildNav.ts`](src/components/layout/sidebar/buildNav.ts).

### 10.1 Mobile chrome

Below `md` (768px) the desktop Sidebar/TopBar are `hidden md:flex` and
[`MobileChrome`](src/components/layout/mobile/) swaps in:

- `MobileTopBar` — church identity (tap → account sheet) + cosmetic
  search/bell.
- `MobileBottomNav` — up to 5 primary nav tabs + a trailing **"More"**
  tab (opens `MoreSheet`) when there's overflow. A `NavItem` flagged
  `mobileOverflow: true` in `buildNav.ts` drops to More on mobile only
  (desktop sidebar ignores the flag).
- `MobilePageFab` — bottom-right FAB for the page's primary action(s).

### 10.2 Page-action FAB

A page publishes its primary action(s) with the mobile-actions store:

```ts
useMobileActions(useMemo(() => [{ label, icon, onClick }], deps));
```

One action → a one-tap FAB; 2+ → a speed dial. Keep the desktop
`PageHeader` button(s) as `className="hidden md:inline-flex"` so the
action exists on both. Call the hook **before any early return**
(rules-of-hooks) and return `[]` while data is loading. On tabbed detail
pages, compute the FAB set from the active tab **in the parent** — don't
call `useMobileActions` from each tab, sibling calls clobber each other.

### 10.3 The mobile page recipe

Every full-page composite follows the same responsive shape:

- Scroll container: `px-4 pb-36 md:px-8 md:pb-8` — `pb-36` clears the
  bottom nav **and** the FAB (never `pb-28`; the FAB overlaps it).
- `PageHeader className="px-4 pt-5 md:px-8 md:pt-0"`.
- Tables → `DataTableShell` with `mobileCard={(row) => <ExpandableCard …>}`
  (collapsed headline + tap-reveal detail rows). Pass `href` for rows that
  navigate to a detail page; pass `actions` for rows managed in place (no
  detail route). The desktop table is hidden below `md` automatically.
- Multi-KPI `StatBand` → `mobileColumns={2 | 3}` so it grids instead of
  squishing into an overflowing divided row.
- Tab strips (`SegmentedControl`) → wrap in
  `-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0` so long label sets scroll.
- `useTableFilters` already drops the default page size to 10 on mobile.

---

## 11. PWA / service worker

The app is an installable PWA (also packaged as a TWA/APK). Three pieces,
all under `src/app/`:

- [`manifest.ts`](src/app/manifest.ts) — Next metadata-route manifest
  (name, icons, `display: standalone`).
- [`sw.ts`](src/app/sw.ts) — Serwist service worker. **Never caches
  `/api/`** (Bearer/cookie-gated; a stale response would trip the
  401 → global sign-out in [client.ts](src/lib/api/client.ts)), and passes
  Firebase/Google auth hosts + `/__/auth`,`/__/firebase` straight through
  (`NetworkOnly`) — caching them breaks `signInWithRedirect`.
- [`serwist/[path]/route.ts`](src/app/serwist/[path]/route.ts) — serves
  the compiled SW at `/serwist/sw.js` (precache revisioned by git SHA).

[`next.config.ts`](next.config.ts) wraps the config in `withSerwist`, sets
the SW's own CSP + no-store headers, and rewrites `/__/auth/*` &
`/__/firebase/*` to the project's `firebaseapp.com` so Firebase Auth is
first-party (required for redirect login inside the APK). When touching
the SW: don't add `/api/` to runtime caching and keep the auth hosts in
the passthrough.

### 11.1 Telemetry

[`src/instrumentation-client.ts`](src/instrumentation-client.ts) exports
`onRouterTransitionStart` (Next picks it up automatically) to timestamp
every client route transition.
[`WebVitalsReporter`](src/components/telemetry/WebVitalsReporter.tsx),
mounted in the root [app/layout.tsx](src/app/layout.tsx), reports Core
Web Vitals (LCP / INP / CLS / TTFB / FCP) + route-transition latency.
Sink: `console.debug` in dev, or a beacon to `NEXT_PUBLIC_VITALS_URL`
when set. Keep it side-effect-only — instrumentation must never break
navigation.

---

## 12. Anti-patterns — non-obvious traps

These are the traps the positive sections above don't already make
load-bearing. (Don't `<button>`/`<input>` outside primitives — that's
just §7.)

| Anti-pattern | Fix |
|---|---|
| Member surface calling `tenant/*` hooks (e.g. `usePledges` from a member dashboard) | Use `self/*` hooks (`useMyPledges`). Backend rejects mismatches |
| Admin surface calling `self/*` hooks to "view as the admin" | Use `tenant/*`. `self/*` always scopes to the caller's `memberId`; a super-admin without a Member row gets 404 |
| Adding a new path under an entity without updating `<ENTITY>_PATHS` | `invalidate<Entity>` silently misses it |
| Invalidating by path prefix (`startsWith`) or `qc.invalidateQueries({ queryKey: ["/api/v1/tenants"] })` | Use the entity's `invalidate<X>` helper — overlapping paths would clobber unrelated caches |
| Adding a `switchTenant` API or storing "active tenant" | URL is the source of truth — navigate to `/[slug]/...` |
| Storing the ID token in state/localStorage | `auth.currentUser.getIdToken()` refreshes for you |
| Raw `useMutation("/api/v1/auth/session")` | Use `signInWithGoogle` / `refreshSession` / `signOutEverywhere` |
| Calling `refreshSession()` after every claim change | Response middleware auto-refreshes on `X-Claims-Refreshed: 1` |
| Editing `src/lib/api/schema.d.ts` by hand | Regenerated; your edits vanish |
| Importing lucide-react/react-day-picker/@base-ui/react directly from a page | Vendor through `Icon.tsx`, `DatePicker.tsx`, etc. |
| Importing recharts **synchronously** in a page composite (or reviving `Charts.tsx`) | Go behind a `next/dynamic` boundary — `charts/DonutChart`, `Sparkline`, or a colocated `*Chart.tsx` (§7.3) |
| Fanning out per-campaign progress/deadline/with-items requests (or a `limit: 500` member prefetch) | Read embedded `member`/`campaign`/`resolvedDeadline`/`daysUntil` off the list row; use `useMyCampaignsProgressBatch` / `useMembersGivingTrend` (§6.6). The old fan-out hooks were deleted |
| `new Date(...)` / `Date.parse(...)` / `Intl.DateTimeFormat` ad-hoc | Use dayjs from [lib/dayjs.ts](src/lib/dayjs.ts) |
| Sending `dateFrom`/`dateTo` as raw `YYYY-MM-DD` to the backend | Wire format is ISO UTC instants; widen with `dayjs.utc(v).startOf/endOf("day").toISOString()` |
| Hand-rolling a date-range chip filter on a list page | Use `<DateRangePicker size="sm" autoWidth clearable />` in `DataTableShell` `toolbar` (§7.2) |
| Importing from `components/ui/` in page code | `ui/` is for primitives only |
| Inlining JSX, business logic, or `useParams()` in `page.tsx` | Build the UI as a Page composite under `components/pages/<feature>/` (§4.3). The only data `page.tsx` may touch is an async-RSC `prefetchApiQuery` + `<HydrateClient>` for deterministic-key queries (§4.5) |
| `prefetchApiQuery` for a query keyed on a client-computed dayjs window or viewport page size | The dehydrated key won't match the client hook's key — leave it client-fetched (§4.5) |
| Importing `firebase-admin` from a client file | Server-only; build will fail |
| Rendering a modal overlay inline instead of through `BaseModal` + registry | Breaks ESC/backdrop handling |
| Rendering a bottom sheet inline, or registering the list-filter sheet in the global store | Use `BaseSheet` + the sheet registry (§9); keep the live-state filter sheet **local** — the global store snapshots props and goes stale |
| `pb-28` (or no bottom padding) on a mobile scroll container | Use `pb-36` — the page FAB is taller than the bottom-nav clearance and will cover the last row (§10.3) |
| Calling `useMobileActions` from each tab of a tabbed detail page | Compute the FAB set from the active tab in the **parent** — sibling calls clobber each other (§10.2) |
| Squishing a wide table on mobile with `overflow-x-auto`/`min-w-[…]` | Give `DataTableShell` a `mobileCard` (`ExpandableCard`) — scroll hacks are a last resort (§10.3) |

---

## 13. Soft delete — frontend UX patterns

The backend stamps `deletedAt` / `deletedBy` / `deletedByCascade` and a
Prisma extension keeps tombstones out of normal reads (see
[backend CLAUDE.md §8.3](../church-app-backend/CLAUDE.md#83-soft-delete--managed-by-the-prisma-extension-at-srcinfrastructureprisma-clientsoft-delete)).
The frontend's job is to make that lifecycle legible.

### 13.1 The 3-state archive filter (admin lists)

Every admin list page has an "Active / Deleted / All" switcher in
[`DataTableShell`](src/components/primitives/DataTableShell.tsx) via the
`state` prop. Mapping lives in
[`StateFilter.tsx`](src/components/primitives/StateFilter.tsx):

| UI value | `toStateFilterFlags` output | Backend behavior |
|---|---|---|
| `"active"` (default) | `{}` | Active rows only |
| `"deleted"` | `{ onlyDeleted: true }` | Tombstones only |
| `"all"` | `{ includeDeleted: true }` | Active + tombstones |

```tsx
const [state, setState] = useState<StateFilterValue>("active");
const list = usePledges(tenantSlug, { ...toStateFilterFlags(state) });

<DataTableShell state={{ value: state, onChange: setState }} … />
```

Every list hook accepts `includeDeleted` / `onlyDeleted` — backend
filter DTOs all extend `StateFilterRequestDto`. **Member surfaces do
NOT expose this switcher** — they only opt into tombstones to resolve
Mode-B labels (below).

### 13.2 Tombstone rendering — three modes

| Mode | When | Primitive | Visual |
|---|---|---|---|
| **A** — tombstone row in a list | Admin "All"/"Deleted" view; row's own `deletedAt` is set | `rowClassName={(r) => r.deletedAt ? "bg-muted/30" : undefined}` on `DataTableShell` | Muted row; Restore replaces Delete in row actions |
| **B** — reference to a tombstone | Row is active but a FK points at an archived entity (e.g. pledge whose campaign is deleted) | [`DeletedLabel`](src/components/primitives/DeletedLabel.tsx) | Muted text + inline `deleted` pill + tooltip `Deleted MMM D, YYYY` |
| **C** — tombstone detail page | Admin/member loaded a detail page for an archived entity | [`EntityRestoreBanner`](src/components/primitives/EntityRestoreBanner.tsx) | Amber banner; admin variant has Restore button, member variant omits actor identity |

`DeletedLabel` has a `hidePill` prop for Mode-A rows that also reference
another tombstone — avoids double-pill noise.

### 13.3 Lookup-table opt-in

A list page rendering Mode-B labels must fetch its lookup tables with
`includeDeleted: true`. Otherwise the map omits the tombstone and the
cell silently falls back to the em-dash placeholder.

```tsx
const { data: campaignsData } = useCampaigns(tenantSlug, { includeDeleted: true });
const { data: membersData } = useMembers(tenantSlug, { limit: 200, includeDeleted: true });
```

This is **only** for lookup-style fetches building a name/id map. The
page's main list query is still driven by `StateFilter`.

### 13.4 Restore flow

Restoring is destructive of current state (the row reappears, indexes
rebuild, partial-unique slots get reclaimed) — every restore goes
through a confirmation modal:

`confirm-restore-{campaign, campaign-item, member, pledge, tenant, transaction}`

The modal owns its `useApiMutation` and invalidates on success. Open it
from the row-action menu or `EntityRestoreBanner`. See
[`components/modals/confirm-restore-campaign/`](src/components/modals/confirm-restore-campaign/)
for the canonical shape.

### 13.5 Row actions on tombstones

[`RowActionsMenu`](src/components/primitives/RowActionsMenu.tsx)
returns `null` when `actions` is empty. Pages compose conditionally:
`row.deletedAt ? [restoreAction] : [editAction, deleteAction]`. **Don't
render `RowActionsMenu` unconditionally with `actions={[]}`** — let it
short-circuit.

---

## 14. Pre-commit checklist

1. Ran `npm run api:types` after the backend changed?
2. Every new mutation hook calls `invalidate<Entity>` in `onSuccess`?
3. Every new modal: uses `BaseModal`, `declare module` augmentation, and
   appears in both `components/modals/index.ts` and
   `lib/modals/host.tsx`'s registry?
4. Every new sheet: uses `BaseSheet`, `declare module` augmentation, and
   appears in both `components/sheets/index.ts` and
   `lib/sheets/host.tsx`'s registry? (§9)
5. New full-page composite follows the mobile recipe — `pb-36` scroll
   container, `mobileCard` on tables, primary action in a
   `useMobileActions` FAB? (§10.3)
6. Identity-changing actions call `invalidateAllApiQueries` and the
   backend handler is marked `@RefreshesClaims()`?
7. No Firebase Admin import in client bundle? No Firebase client import
   in RSC?
8. `npm run check` green? (UI-primitive enforcement + Biome)
9. `npm run typecheck` green?
10. `npm run build` green?
