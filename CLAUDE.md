@AGENTS.md

# CLAUDE.md — Church App Frontend Agent Guide

> **Audience:** AI coding agents working in this repo.
> **Goal:** add features without breaking the established routing / data /
> modal / auth patterns. Read this before non-trivial edits.
>
> Backend conventions live in
> [../church-app-backend/CLAUDE.md](../church-app-backend/CLAUDE.md) — when
> backend behavior is unclear, check there rather than guessing.

---

## 1. Tech stack (exact versions)

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | **Next.js 16** (App Router) | See [AGENTS.md](AGENTS.md) — conventions differ from prior versions. Check `node_modules/next/dist/docs/` before writing router code. |
| React | **19** | |
| Language | **TypeScript 6** (strict) | |
| Server state | **TanStack Query v5** (`@tanstack/react-query` + devtools) | |
| HTTP client | **openapi-fetch 0.17** | one client for the browser ([client.ts](src/lib/api/client.ts)), one for RSCs ([server.ts](src/lib/api/server.ts)) |
| Type generation | **openapi-typescript 7** | runs against backend's `/api-docs-json` |
| Client state | **Zustand 5** | minimal — modals only |
| Forms | **react-hook-form 7** + **zod 4** + **@hookform/resolvers** | wrapped in `components/formElements/*` |
| Auth | `firebase` (client) + `firebase-admin` (server) | |
| Charts | `recharts` | only consumed via [Charts.tsx](src/components/primitives/Charts.tsx) |
| Date pickers | **custom** ([Calendar.tsx](src/components/primitives/Calendar.tsx) — dayjs-based) | DatePicker / DateRangePicker primitives wrap it. `react-day-picker` is no longer used (its shadcn wrapper at `components/ui/calendar.tsx` is dormant) |
| Date math | **dayjs** | sole date library — no `Date.parse`, no `date-fns`, no `Intl.DateTimeFormat` ad-hoc |
| Icons | `lucide-react` | only consumed via [Icon.tsx](src/components/primitives/Icon.tsx) |
| Styling | Tailwind 4 + CSS variables | tokens in `globals.css`; `cn()` helper from `class-variance-authority` + `clsx` + `tailwind-merge` |
| Linting | **Biome 2** | `biome check`, `biome lint`, `biome format` |
| Hooks | **husky** | `prepare` script wires git hooks |
| Headless UI | `@base-ui/react` + a small `components/ui/` shadcn-style set | base for our own primitives |

**The backend dev server runs on port `8001`** (see
`NEXT_PUBLIC_API_BASE_URL` default in [client.ts](src/lib/api/client.ts) and
[server.ts](src/lib/api/server.ts)). The OpenAPI doc URL it exposes for
type generation is `http://localhost:8000/api-docs-json` — note the
different port; `npm run dev` will block on
`scripts/wait-for-api.sh` until both are reachable.

## 2. Commands

```bash
npm run dev                   # waits for backend, then starts Next on :3000
npm run dev:test              # same, loading .env.development.local
npm run build                 # production build (loads .env.production)
npm run build:test            # production build with .env.development.local
npm run start                 # serve production build on :3002
npm run typecheck             # tsc --noEmit
npm run lint                  # biome lint
npm run format                # biome format --write
npm run check                 # enforce-ui-primitives.mjs + biome check --write
npm run api:types             # regenerate src/lib/api/schema.d.ts
```

`api:types` needs the backend running on `:8000`. Regenerate after any
backend schema change. Never edit `src/lib/api/schema.d.ts` by hand —
your edits will be wiped.

`npm run check` runs [scripts/enforce-ui-primitives.mjs](scripts/enforce-ui-primitives.mjs)
**before** Biome. That script greps for native HTML elements
(`<button>`, `<input>`, `<select>`, `<textarea>`, `<img>`, `<label>`,
`<table>`, `<hr>`, `<a>`) outside `components/primitives/` and
`components/ui/` and exits non-zero on any hit. **Don't try to silence
it** — wrap the native element in a primitive instead.

---

## 3. Directory layout (source of truth)

```
src/
├── app/                                   # Next App Router (RSC by default)
│   ├── layout.tsx                         # AuthProvider → QueryProvider → ModalHost (+ TooltipProvider)
│   ├── page.tsx                           # landing redirect (/login | /super-admin/tenants | /[slug]/...)
│   ├── not-found.tsx                      # global 404
│   ├── globals.css                        # Tailwind tokens
│   ├── (auth)/                            # public routes
│   │   ├── layout.tsx                     # split-screen marketing chrome
│   │   ├── login/
│   │   ├── select-church/                 # post-login fanout for multi-tenant users
│   │   └── invite/[token]/                # invitation acceptance
│   ├── (super-admin)/                     # platform-ops, NOT scoped to a tenant
│   │   ├── layout.tsx                     # gates: signed-in + isSuperAdmin
│   │   └── super-admin/
│   │       ├── tenants/                   # list, new, [id]/, [id]/admins/
│   │       ├── admins/
│   │       ├── audit/
│   │       └── profile/
│   ├── [tenantSlug]/                      # ALL tenant-scoped pages live here
│   │   ├── layout.tsx                     # gates: membership of `tenantSlug` OR super-admin
│   │   ├── not-found.tsx
│   │   ├── welcome/                       # post-onboarding splash
│   │   ├── (admin)/                       # admin perspective (role=ADMIN)
│   │   │   ├── layout.tsx                 # gates ADMIN role; renders AppShell perspective="admin"
│   │   │   └── admin/{ dashboard, members, campaigns, pledges, transactions, reports, invitations, settings, profile }
│   │   └── (member)/                      # member perspective (any role; admins can flip in)
│   │       ├── layout.tsx                 # gates membership; renders AppShell perspective="member"
│   │       └── member/{ dashboard, campaigns, my-pledges, my-transactions, profile }
│   ├── api/auth/session/route.ts          # POST mints + DELETE clears the Next session cookie
│   └── logout/page.tsx                    # client-side sign-out + cookie wipe
│
├── proxy.ts                               # Next middleware — cookie gate + per-request CSP nonce
│
├── components/
│   ├── primitives/                        # OUR design system (Button, Input, Card, DataTable, …)
│   ├── ui/                                # raw shadcn-style wrappers used BY primitives only
│   ├── formElements/                      # RHF-bound wrappers around primitives (FormInput, FormSubmit, …)
│   ├── layout/                            # AppShell, Sidebar (with AccountMenu), TopBar
│   ├── illustrations/                     # SVG components
│   ├── auth/                              # client pieces of the auth flow
│   ├── pages/                             # page-level composites (DashboardKpiStrip, CampaignForm, …)
│   └── modals/
│       ├── BaseModal.tsx                  # shared overlay, ESC, header, footer
│       ├── index.ts                       # barrel — loads every modal's `declare module`
│       └── <modal-name>/
│           ├── <ModalName>.tsx            # `declare module` augmentation + BaseModal usage
│           └── index.ts
│
└── lib/
    ├── api/
    │   ├── client.ts                      # browser openapi-fetch + Bearer token middleware
    │   ├── server.ts                      # RSC openapi-fetch + "SessionCookie" scheme middleware
    │   ├── hooks.ts                       # useApiQuery / useApiMutation / invalidateByPaths / invalidateAllApiQueries
    │   ├── errors.ts                      # toApiError → ApiError class
    │   ├── coerce.ts                      # nnum / nstr — nullable-field helpers
    │   ├── providers.tsx                  # QueryClientProvider (client component)
    │   ├── schema.d.ts                    # GENERATED — never edit
    │   ├── index.ts                       # barrel re-exporting every entity
    │   ├── auth/                          # auth-feature hooks (useAuthMe) — flat, not intent-split
    │   ├── health/                        # health probe — flat
    │   ├── admin/                         # super-admin platform ops (platform/ intent only)
    │   ├── tenants/                       # platform/ + tenant/ + self/ intents
    │   ├── members/                       # tenant/ + self/ intents
    │   ├── pledges/                       # tenant/ + self/ intents
    │   ├── transactions/                  # tenant/ + self/ intents
    │   ├── campaigns/                     # tenant/ + self/ intents
    │   └── invitations/                   # tenant/ + public/ intents
    ├── modals/
    │   ├── registry.ts                    # ModalPropsMap interface (augmented per modal)
    │   ├── store.ts                       # Zustand + openModal / closeModal helpers
    │   └── host.tsx                       # ModalHost — renders the active modal
    ├── auth/
    │   ├── AuthProvider.tsx               # exposes `currentUser` + `loading` via context
    │   ├── actions.ts                     # signInWithGoogle / signOut / signOutEverywhere / refreshSession
    │   ├── server.ts                      # getSessionUser() for RSCs (verifies session cookie)
    │   ├── constants.ts                   # SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS
    │   └── rate-limit.ts                  # in-memory token-bucket for /api/auth/session
    ├── firebase/
    │   ├── client.ts                      # client SDK factory
    │   └── admin.ts                       # Admin SDK factory (server-only)
    ├── design/                            # design helpers (logo gradient, etc.)
    ├── dayjs.ts                           # the only allowed dayjs entrypoint (with plugins)
    ├── format-currency.ts                 # currency formatter
    └── utils.ts                           # cn() helper
```

There is **no** `app/(dashboard)/` group, **no** `app/admin/` route, and
**no** generic `lib/api/<entity>/hooks.ts` — every entity is split by
intent. If you find a doc or comment that references those, the doc is
stale.

---

## 4. App Router boundaries

- Layouts and pages are **Server Components by default**.
- `"use client"` marks a client boundary — every module imported from a
  client file becomes client-side.
- Providers (`QueryProvider`, `ModalHost`, `AuthProvider`,
  `TooltipProvider`) are client components but are rendered directly from
  the RSC root layout — Next handles the boundary.
- Never import Firebase **client** SDK from a Server Component. Never
  import Firebase **Admin** SDK from a Client Component (the build will
  fail anyway because [admin.ts](src/lib/firebase/admin.ts) starts with
  `import "server-only"`).

### 4.1 Two HTTP clients

| Where | Client | Auth | Use for |
|---|---|---|---|
| Client Components | [api/client.ts](src/lib/api/client.ts) (`api`) | `Authorization: Bearer <ID token>` | every interactive read/write — wrapped by `useApiQuery` / `useApiMutation` |
| Server Components | [api/server.ts](src/lib/api/server.ts) (`serverApi`) | `Authorization: SessionCookie <cookie>` | RSC pre-rendering (currently used by `[tenantSlug]/layout.tsx` to validate slug for super-admins) |

`serverApi` cannot read a Firebase ID token (those live client-side
only). It forwards the user's HTTP-only session cookie under a custom
`SessionCookie` auth scheme; the backend's `FirebaseAuthGuard` recognises
this and verifies it via Admin SDK's `verifySessionCookie`. Both clients
unwrap the backend's `{ success, data }` envelope and convert non-2xx
JSON to `ApiError`.

### 4.2 Routing model — URL is the source of truth

Tenant scope is **encoded in the URL** (`/[tenantSlug]/…`). There is no
"active tenant" stored anywhere. To switch tenants, you navigate.
Consequently, there is no `switchTenant` API call and no
`/auth/switch-tenant` endpoint.

Three layout layers gate access (in order, outermost first):

1. [proxy.ts](src/proxy.ts) — middleware. Redirects unauthenticated
   visitors to `/login` (except for `PUBLIC_PATHS = ["/login", "/invite",
   "/logout"]`) and bounces signed-in users away from `/login`. Also sets
   a per-request CSP nonce.
2. `[tenantSlug]/layout.tsx` — verifies caller is a member of that slug
   OR a super-admin; for super-admins it pre-validates the slug exists
   via `serverApi`.
3. `[tenantSlug]/(admin)/layout.tsx` and `[tenantSlug]/(member)/layout.tsx` —
   narrow further to ADMIN role / any role respectively, and render the
   `AppShell` with the matching `perspective`. A super-admin without a
   Member row in this tenant only sees the admin perspective.

Everything under `(super-admin)/super-admin/*` is gated by
`(super-admin)/layout.tsx` — top-level (not under `[tenantSlug]`) because
those routes manage **all** tenants.

### 4.3 `page.tsx` is a thin wrapper

Every `app/**/page.tsx` file is a one-liner that imports a Page
composite from `components/pages/<feature>/` and renders it. **No data
fetching, no `useParams`, no business logic, no layout — none of it
lives in `page.tsx`.** That's all in the composite.

```tsx
// app/(super-admin)/super-admin/admins/page.tsx
"use client";
import { AdminsPage } from "@/components/pages/super-admin/admins";
export default () => <AdminsPage />;
```

```tsx
// app/[tenantSlug]/(admin)/admin/dashboard/page.tsx
import { AdminDashboardPage } from "@/components/pages/dashboard";
export default () => <AdminDashboardPage />;
```

The composite reads route params with `useParams()` and reads/writes
data via the typed API hooks. **Don't pass route params from `page.tsx`
to the composite as props** — the composite owns its own param
coupling, which keeps it usable from any matching route shape (e.g.
admin and super-admin variants of the same page).

When a Server Component is genuinely needed at the route level (rare —
e.g. metadata, redirects that must happen before render), keep `page.tsx`
to that one job and still delegate the visible UI to a composite.

---

## 5. Auth — the dual path

```
Google SSO (Firebase client SDK)
        │
        ▼
    ID token ──┬──► POST /api/v1/auth/session        (backend upserts User + writes custom claims)
               └──► POST /api/auth/session (Next)    (Admin SDK mints HTTP-only session cookie)

Subsequent requests:
    Navigations         ─► session cookie  ─► proxy.ts gate + getSessionUser()
    Client API calls    ─► Bearer ID token ─► backend FirebaseAuthGuard
    RSC API calls       ─► session cookie  ─► backend FirebaseAuthGuard via "SessionCookie" scheme
```

### 5.1 Custom claims shape

The backend writes `tenantMemberships` as an object keyed by tenant
**slug**:

```ts
type TenantMembership = { memberId: string; role: "ADMIN" | "USER"; name: string };
type Claims = {
  isSuperAdmin?: boolean;
  tenantMemberships?: Record<string /* slug */, TenantMembership>;
  // …standard Firebase decoded fields
};
```

[`getSessionUser()`](src/lib/auth/server.ts) normalises this into
`SessionUser` (mirrors the backend's `AuthUser`). It also distinguishes
between "no cookie" (visitor not signed in — expected) and
"verification failed" (logged with the reason, e.g. revocation, JWKS
outage).

### 5.2 Rules

1. **Sign-in lives in [auth/actions.ts](src/lib/auth/actions.ts)**
   (`signInWithGoogle`). It does Firebase popup → backend session
   exchange → force-refresh the ID token → mint Next session cookie.
   Don't reinvent in components.
2. **ID token is never stored manually.** `auth.currentUser.getIdToken()`
   returns a fresh token; the request middleware in
   [client.ts](src/lib/api/client.ts) calls it per-request.
3. **After mutating Firebase custom claims** (admin grants a role,
   invite accepted, sign-out-everywhere, super-admin toggle) RSCs would
   read stale claims for up to ~1h.
   **You usually don't need to call `refreshSession()` manually.** The
   backend marks claim-mutating handlers with `@RefreshesClaims()` and
   emits the `X-Claims-Refreshed: 1` response header. The browser
   response middleware in [client.ts](src/lib/api/client.ts) sees that
   header and automatically force-refreshes the ID token + re-mints the
   Next cookie. Reach for `refreshSession()` only for flows that bypass
   the typed API client (e.g. raw `fetch` calls).
4. **The Next route `/api/auth/session` is rate-limited.** 20 req/min
   per IP via the in-memory bucket in
   [auth/rate-limit.ts](src/lib/auth/rate-limit.ts). `verifyIdToken` is
   RSA-bound CPU work; without this an attacker can pin a worker. The
   limiter is in-memory — replace with Vercel KV / Upstash before
   horizontally scaling.
5. **`proxy.ts` gates by session cookie only.** Public paths are
   centralised in `PUBLIC_PATHS`; don't add bypasses inline.
6. **Server Components read auth via `getSessionUser()`** and must check
   for `null` and `redirect("/login")`. Never trust query params or
   cookies directly.
7. **401 response → global sign-out.** The browser response middleware
   in [client.ts](src/lib/api/client.ts) catches 401, signs the user out
   of Firebase, deletes the session cookie, and redirects to
   `/login?next=…` — except for paths in `UNAUTHENTICATED_PATHS`
   (`/login`, `/invite`, `/logout`) where 401s are expected.

### 5.3 Sign-out

- `signOut()` — local sign-out (Firebase + Next cookie).
- `signOutEverywhere()` — calls backend `/auth/sign-out-everywhere` to
  revoke **all** refresh tokens for the user, then signs out locally.
  Other tabs/devices keep working until their next API call (which 401s
  and triggers the global redirect handler).

---

## 6. API layer — one folder per entity, split by intent

The single most important frontend convention. **Every backend endpoint
is wrapped in a typed hook in an entity folder.** Components never call
`openapi-fetch` directly; they import hooks from `@/lib/api/<entity>`.

The hook layer mirrors the backend's intent split (see backend
CLAUDE.md §6.3). Each entity has subfolders named after the URL scope,
not the caller's role:

| Subfolder | Backend URL | Hook prefix |
|---|---|---|
| `tenant/` | `/tenants/:tenantId/<entity>` | none — `usePledges` |
| `self/` | `/tenants/:tenantId/me/<entity>` | `My` — `useMyPledges` |
| `platform/` | `/platform/<entity>` | mixed — `usePlatformTenants`, but the standalone `admin/` entity uses bare `useAdminStats` / `useAdminUsers` |
| `public/` | `/<resource>/...` (token-based) | mixed — current code uses bare names (`useLookupInvitation`, `useAcceptInvitation`); new public hooks should adopt a `Public` prefix |

A surface picks the intent that matches the URL it should hit. Member
dashboards call `self/*` hooks; admin dashboards call `tenant/*` hooks.
Authorization is enforced by the backend; the frontend's job is to
choose the right intent.

### 6.1 Folder shape

```
src/lib/api/<entity>/
├── keys.ts          # <ENTITY>_PATHS (covers every intent) + invalidate<Entity>(qc, tenantId?)
├── index.ts         # re-exports keys + each intent subfolder
├── tenant/
│   ├── hooks.ts     # usePledges, useCreatePledge, useUpdatePledge, useDeletePledge, …
│   └── index.ts
├── self/
│   ├── hooks.ts     # useMyPledges, useCreateMyPledge, useUpdateMyPledge, …
│   └── index.ts
├── platform/        # only if the entity has /platform/* endpoints
└── public/          # only if the entity has token / unauthenticated endpoints
```

`keys.ts` lives at the entity root because invalidation is intent-
agnostic — a tenant-side mutation should refresh self-side caches for
the same tenant and vice versa. `<ENTITY>_PATHS` lists the literal
OpenAPI paths across **all** intent folders.

`auth/` and `health/` don't follow this pattern — they're flat (single
`hooks.ts` + `keys.ts` if needed). They're per-user / global, not
tenant-scoped.

### 6.2 Hook naming convention

| Intent | Prefix | Examples |
|---|---|---|
| `tenant/` | none | `usePledges`, `useCreateMember`, `useTransactionSummary` |
| `self/` | `My` | `useMyPledges`, `useMyProfile`, `useMyChurch`, `useMyTransactions` |
| `platform/` | `Platform` (mostly) | `usePlatformTenants`, `useRenameTenantSlug`. Exception: `admin/platform/` uses `useAdminStats`, `useAdminUsers`, `useToggleSuperAdmin` since the entity is itself "admin". |
| `public/` | bare today (legacy) | `useLookupInvitation`, `useAcceptInvitation`. Prefer `Public` prefix for new hooks. |

Hooks are re-exported through each entity's root `index.ts` so consumers
do `import { useMyPledges } from "@/lib/api/pledges"` without caring
about the subfolder. The prefix is the disambiguator.

### 6.3 Query keys

Every query uses `[path, init]` as its key where `path` is the literal
OpenAPI template string (e.g. `"/api/v1/tenants/{tenantId}"`) and `init`
is the request `{ params, body }`. **You never hand-write a query key**
— `useApiQuery` sets it for you.

### 6.4 Invalidation

Each entity's `keys.ts` exports:

- A `<ENTITY>_PATHS` array — every path that returns data of this
  entity, across all intents.
- An `invalidate<Entity>(qc, tenantId?)` helper.

For tenant-scoped entities (members, pledges, campaigns, transactions),
the helper accepts `tenantId` and narrows the predicate to queries
whose `init.params.path.tenantId` matches. Pass `undefined` to invalidate
across all tenants (rare — sign-out etc.).

For non-tenant entities (admin, auth, invitations, tenants) the helper
uses [`invalidateByPaths`](src/lib/api/hooks.ts) under the hood — exact-
path matching, no per-tenant scoping.

```ts
// Inside a mutation hook:
return useApiMutation("/api/v1/tenants/{tenantId}/pledges", "post", {
  onSuccess: () => invalidatePledges(qc, tenantId),
});
```

**Predicate > prefix matching** because some paths overlap literally
(`/api/v1/platform/tenants` vs. `/api/v1/platform/tenants/{tenantId}/…`
both share a prefix) — see [tenants/keys.ts](src/lib/api/tenants/keys.ts)
for the exact-path set.

**Cross-entity invalidation** — only for identity changes. After a
sign-out or super-admin toggle, call `invalidateAllApiQueries(qc)` —
every user-scoped cache is suspect. Never reach for the nuclear option
just because you don't know which scope to clear.

### 6.5 Cadence for adding a new endpoint

1. Backend ships the endpoint.
2. Run `npm run api:types`.
3. Pick the intent subfolder that matches the URL (`tenant/`, `self/`,
   `platform/`, `public/`). Add a hook to that subfolder's `hooks.ts`,
   using the naming convention in §6.2. If the intent folder doesn't
   exist yet, create it with a `hooks.ts` + `index.ts` and add an
   `export * from "./<intent>";` line to the entity's root `index.ts`.
4. Add the new path to `<ENTITY>_PATHS` in the entity's `keys.ts` so
   `invalidate<Entity>` covers it.
5. Mutations get
   `onSuccess: () => invalidate<Entity>(qc, tenantId)`.
6. If it's a new entity, follow the pattern in
   [src/lib/api/pledges/](src/lib/api/pledges/) (tenant + self) or
   [src/lib/api/tenants/](src/lib/api/tenants/) (platform + tenant +
   self). Add the entity to
   [src/lib/api/index.ts](src/lib/api/index.ts).

### 6.6 Auth endpoints are special

`POST /auth/session`, `POST /auth/sign-out-everywhere`, and the Next
session-cookie route are **multi-step flows** (Firebase + backend +
cookie minting + token refresh). They have imperative wrappers in
[auth/actions.ts](src/lib/auth/actions.ts) and must NOT be exposed as
raw `useApiMutation` hooks. Only `GET /auth/me` is exposed as
`useAuthMe()`.

### 6.7 Schema coercion helpers

[`coerce.ts`](src/lib/api/coerce.ts) exports `nnum` / `nstr` for the
"backend returns `null` but my UI wants `string | undefined`"
pattern. Reach for these instead of `value ?? undefined` repeatedly.

---

## 7. UI primitives — strict enforcement

Every interactive element on the page must come from
[`components/primitives/`](src/components/primitives/) (Button, Input,
Select, Textarea, DatePicker, DateRangePicker, MemberPicker, AmountInput,
DataTable, Table, Badge, Pill, Chip, Card, Avatar, Pressable, …).
[`components/ui/`](src/components/ui/) contains shadcn-style raw wrappers
that are consumed **only** by primitives — page code never imports from
`components/ui/`.

[`scripts/enforce-ui-primitives.mjs`](scripts/enforce-ui-primitives.mjs)
runs as part of `npm run check` and **fails the build** if any of these
native elements appear outside `components/primitives/` or
`components/ui/`:

```
<button>  <input>  <select>  <textarea>  <img>  <label>  <table>  <hr>  <a>
```

Use the matching primitive instead — `Button`, `Input`, `Select`,
`Textarea`, `Avatar` (for `<img>`), `ListRow`/`OptionRow` (for `<label>`
patterns), `Table`/`DataTable`, `Pressable` (for buttonish `<a>`). For a
real navigation link use `next/link` (it renders `<a>` internally — the
linter only flags raw `<a>` you write yourself).

### 7.1 Forms

Forms compose RHF + zod via the `components/formElements/*` wrappers.
Each `Form*` element binds a primitive to a RHF `Controller`:

```tsx
const methods = useForm<Values>({ resolver: zodResolver(schema) });

<Form methods={methods} onSubmit={handleSubmit}>
  <FormInput name="email" label="Email" />
  <FormSelect name="role" options={ROLE_OPTIONS} />
  <FormSubmit label="Save" />
</Form>
```

Don't reach for `<input>` + `register()` directly — wrap a primitive in
a new `Form*` element under
[components/formElements/](src/components/formElements/) if a wrapper is
missing.

### 7.2 Date primitives — Calendar, DatePicker, DateRangePicker

The three date primitives are a self-contained stack:

```
DatePicker / DateRangePicker
        └── Calendar (custom, dayjs-based)
```

[`Calendar`](src/components/primitives/Calendar.tsx) is **not**
react-day-picker — it's a small custom component with three views
(`day` / `month` / `year`) wired to dayjs. Click the header label to
zoom out from day → month → year; prev/next pages the active view.
It supports both `mode="single"` and `mode="range"`.
[`DatePicker`](src/components/primitives/DatePicker.tsx) and
[`DateRangePicker`](src/components/primitives/DateRangePicker.tsx) wrap
it inside a Popover trigger.

**Value contract:** ISO `YYYY-MM-DD` strings — the date-only wire format
the backend's DTOs accept. Convert at the boundary if you need a full
UTC instant (the common pattern for list filters is
`dayjs.utc(value).startOf("day").toISOString()` /
`dayjs.utc(value).endOf("day").toISOString()` to widen the inclusive
range to full days).

**DateRangePicker presets.** A left-rail preset list is opt-in via the
`presets` prop:

| Value | Effect |
|---|---|
| `"default"` (default) | Renders `DEFAULT_DATE_RANGE_PRESETS` — Today / This week / Last week / This month / Last month / This year |
| `false` | No sidebar — calendar only |
| `DateRangePreset[]` | Custom preset list. Each preset has a `label` and a `resolve()` returning `{ from, to }` |

**Compact form for list-page toolbars.** When the picker sits in the
`DataTableShell` toolbar slot next to the search input, set
`size="sm" autoWidth clearable`. The h-9 trigger matches the search
input height, the trigger shrinks to its label, and a sibling clear
button (positioned absolutely so we don't nest `<button>` inside the
popover trigger) appears when a range is set.

```tsx
<DataTableShell
  toolbar={
    <DateRangePicker
      value={range}
      onChange={setRange}
      placeholder="Date range"
      size="sm"
      autoWidth
      clearable
    />
  }
/>
```

Pass the resolved `dateFrom` / `dateTo` to the matching list hook
(`usePledges`, `useTransactions`, `useAuditEvents`, etc. — every list
hook accepts the pair now; see §6.5). The form-row sibling (`size="md"`,
the default) is what you reach for inside `react-hook-form` forms.

---

## 8. Modal system — one folder per modal

Consistent modal UX comes from one shared shell:
[BaseModal.tsx](src/components/modals/BaseModal.tsx). Every modal renders
inside it; never render a standalone overlay/portal.

### 8.1 Folder shape

```
src/components/modals/
├── BaseModal.tsx                 # shared shell (overlay, ESC, header, footer)
├── index.ts                      # barrel — every modal folder re-exports here
└── <modal-name>/
    ├── <ModalName>.tsx           # component + `declare module` augmentation
    └── index.ts                  # re-export
```

### 8.2 Props are typed globally

The modal props map is augmented by each modal file:

```ts
// src/components/modals/confirm-delete/ConfirmDeleteModal.tsx
declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-delete": ConfirmDeleteProps;
  }
}
```

So `openModal("confirm-delete", { title, message, onConfirm })` is
type-checked — TS enforces the prop shape matches the declaration.

### 8.3 Registering a modal — three edits

1. Create `src/components/modals/<name>/<Name>Modal.tsx` with the
   `declare module` augmentation at the top and `<BaseModal>` wrapping
   the body.
2. Create `src/components/modals/<name>/index.ts` that re-exports the
   component.
3. Add `export * from "./<name>";` to
   [src/components/modals/index.ts](src/components/modals/index.ts) AND
   add a line to the `registry` object in
   [src/lib/modals/host.tsx](src/lib/modals/host.tsx) that imports the
   modal component and maps its name.

### 8.4 Opening modals

```ts
import { openModal } from "@/lib/modals/store";

openModal("confirm-delete", {
  title: "Delete tenant?",
  message: "This is soft-deleted; an admin can restore it.",
  onConfirm: async () => { /* mutateAsync(...) */ },
});
```

`openModal` and `closeModal` work outside React (useful in event
handlers that don't have access to hooks). Inside a component,
`useModalStore` also works if you need reactivity.

### 8.5 In-flight states

A modal performing a mutation should pass `dismissible={false}` to
`BaseModal` while the mutation is pending so ESC and backdrop-click
don't close mid-operation. See
[ConfirmDeleteModal](src/components/modals/confirm-delete/ConfirmDeleteModal.tsx)
for the canonical pattern.

---

## 9. Layout / chrome

[`AppShell`](src/components/layout/app-shell/AppShell.tsx) is the
top-level chrome for every authenticated surface. It takes a
`perspective` (`"admin" | "member" | "super"`) and renders:

- the [`Sidebar`](src/components/layout/sidebar/) with nav items derived
  from the perspective and tenant
- an [`AccountMenu`](src/components/layout/sidebar/account-menu/) that
  surfaces tenant switching (memberships) and a "Platform" entry for
  super-admins
- the [`TopBar`](src/components/layout/top-bar/TopBar.tsx)

Layouts (`(admin)/layout.tsx`, `(member)/layout.tsx`,
`(super-admin)/layout.tsx`) are responsible for instantiating
`AppShell` with the right perspective and the user's memberships list.
**Pages don't import `AppShell` themselves.**

To add a navigation item, edit
[`components/layout/sidebar/buildNav.ts`](src/components/layout/sidebar/buildNav.ts) —
not the layout, not the page.

---

## 10. Security headers + CSP

[`proxy.ts`](src/proxy.ts) sets a per-request CSP with a fresh nonce.
Static-shape headers (HSTS, X-Frame-Options, Permissions-Policy, …) are
in [`next.config.ts`](next.config.ts).

CSP carve-outs you should know about:

- `script-src` includes `'strict-dynamic'` so the nonced Next loader can
  spawn additional scripts. Older browsers ignore `'strict-dynamic'`,
  so explicit Google hosts are kept (`apis.google.com`,
  `www.gstatic.com`, `www.googleapis.com`). `'unsafe-eval'` is
  **dev-only** for React's error overlay.
- `style-src` includes `'unsafe-inline'` because Radix / base-ui inject
  inline `style` attributes for floating-UI positioning. CSP can't
  distinguish those from `<style>` tag injection. Removing this breaks
  every popover / dropdown.
- `frame-src` allows `accounts.google.com` and `*.firebaseapp.com` for
  the SSO popup + `__/auth/handler` redirects.

The `x-nonce` header is forwarded to the rendering server so any
`<Script nonce>` we emit picks it up.

---

## 11. Common workflows

### 11.1 Add a new backend-backed feature

1. Backend ships the endpoint (see backend CLAUDE.md).
2. `npm run api:types`.
3. Add hook(s) under the right intent subfolder
   (`src/lib/api/<entity>/<intent>/hooks.ts`) and update
   `<ENTITY>_PATHS` in `keys.ts`. Wire `invalidate<Entity>` into the
   mutation's `onSuccess`.
4. Use the hook from a Client Component. Handle `isPending` / `error` /
   empty states explicitly.
5. If the UX needs a confirmation, create/reuse a modal instead of an
   inline confirm dialog.

### 11.2 Add a new modal

See §8.3.

### 11.3 Add a new Next route

- Route groups: `app/(group)/…` — group folders in parens don't appear
  in the URL. Use `(auth)`, `(super-admin)`, and the `[tenantSlug]`
  groups as a model.
- `layout.tsx` in a group wraps every page inside.
- For auth gating, rely on `proxy.ts` + the existing layout cascade —
  don't reimplement redirects per page.
- Server Components are the default. Drop `"use client"` only at the
  leaf that needs it (an interactive form, a modal trigger).
- `page.tsx` stays a thin wrapper (§4.3): create the visible UI as a
  Page composite under `components/pages/<feature>/` and have
  `page.tsx` do nothing but import + render it.

### 11.4 Add an imperative auth flow

Put it in [auth/actions.ts](src/lib/auth/actions.ts). If the backend
will mutate Firebase claims, mark the backend handler with
`@RefreshesClaims()` and let the response middleware in
[client.ts](src/lib/api/client.ts) auto-refresh. Only call
`refreshSession()` manually for flows that bypass the typed API client.

---

## 12. Anti-patterns — do NOT do these

| Anti-pattern | Fix |
|---|---|
| Hand-written query keys in `useQuery` | Use `useApiQuery` — it sets `[path, init]` automatically |
| Calling `fetch` to the backend directly from a component | Go through `useApiQuery` / `useApiMutation` so the ID token is attached and the response envelope is unwrapped |
| Importing `firebase-admin` from a client file | Server-only; use it from `auth/server.ts` or route handlers |
| Storing the ID token in state or localStorage | `auth.currentUser.getIdToken()` refreshes for you — fetch it per request |
| Raw `useMutation("/api/v1/auth/session")` | Use `signInWithGoogle` / `refreshSession` / `signOutEverywhere` — the flows are multi-step |
| Calling `refreshSession()` after every claim change | Backend handlers send `X-Claims-Refreshed: 1`; the response middleware auto-refreshes. Only call manually for flows that bypass the typed client |
| Adding a `switchTenant` API call or storing an "active tenant" | The URL is the source of truth — navigate to `/[slug]/...` instead |
| Invalidating by path prefix (`startsWith`) | Use the entity's `invalidate<X>` helper — path overlaps would clobber unrelated caches |
| Rendering a modal overlay inline instead of through `BaseModal` + registry | Opens a second modal on top of BaseModal, breaks ESC/backdrop handling |
| Using `<button>` / `<input>` / `<select>` / `<a>` / `<img>` outside primitives | `npm run check` fails. Use the matching primitive (or `next/link` for navigation) |
| Importing from `components/ui/` from a page or page-composite | `components/ui/` is for primitives only. Page code uses `components/primitives/` |
| Editing `src/lib/api/schema.d.ts` by hand | It's regenerated; your edits vanish on `npm run api:types` |
| Calling `qc.invalidateQueries({ queryKey: ["/api/v1/tenants"] })` | Matches only the exact-prefix list queries; use `invalidateTenants(qc)` for the full scope |
| Member surface calling `tenant/*` hooks (e.g. `usePledges` from a member dashboard) | Member surfaces use `self/*` hooks (`useMyPledges`); the URL prefix declares scope, the backend rejects mismatches |
| Admin surface calling `self/*` hooks to "view as the admin" | Admin surfaces use `tenant/*` hooks; `self/*` always scopes to the caller's `memberId` and a super-admin without a Member row gets a 404 |
| Adding a new path under an existing entity without updating `<ENTITY>_PATHS` | `invalidate<Entity>` will silently miss the new path; add it to `keys.ts` |
| Using `new Date(...)` / `Date.parse(...)` / `Intl.DateTimeFormat` directly | Use `dayjs` (with our preconfigured plugins from [lib/dayjs.ts](src/lib/dayjs.ts)) |
| Importing recharts / lucide-react / react-day-picker / @base-ui/react directly from a page | Wrap them in a primitive first — those packages are vendored through `Charts.tsx`, `Icon.tsx`, `DatePicker.tsx`, etc. |
| Hand-rolling a date-range chip filter on a list page | Use `<DateRangePicker size="sm" autoWidth clearable />` in the `DataTableShell` `toolbar` slot and forward `dateFrom`/`dateTo` to the list hook (§7.2) |
| Sending `dateFrom`/`dateTo` as raw `YYYY-MM-DD` strings to the backend | The wire format is ISO 8601 UTC instants; widen the inclusive range with `dayjs.utc(v).startOf("day").toISOString()` / `.endOf("day").toISOString()` at the boundary |
| Inlining JSX, data fetching, or `useParams()` inside `app/**/page.tsx` | `page.tsx` is a thin wrapper (§4.3). Build the UI as a Page composite under `components/pages/<feature>/` and have `page.tsx` only `import` + render it |

---

## 13. Soft delete — frontend UX patterns

The backend stamps `deletedAt` / `deletedBy` / `deletedByCascade` on
every soft-deletable entity and a Prisma extension keeps tombstones out
of normal reads (see
[backend CLAUDE.md §8.3](../church-app-backend/CLAUDE.md#83-soft-delete--managed-by-the-prisma-extension-at-srcinfrastructureprisma-clientsoft-delete)).
The frontend's job is to make that lifecycle legible to humans. Three
patterns cover every surface.

### 13.1 The 3-state archive filter (admin lists)

Every admin list page has an "Active / Deleted / All" switcher in the
[`DataTableShell`](src/components/primitives/DataTableShell.tsx) toolbar
via the `state` prop. The mapping from UI state to backend query flags
lives in
[`StateFilter.tsx`](src/components/primitives/StateFilter.tsx):

| UI value | `toStateFilterFlags` output | Backend behavior |
|---|---|---|
| `"active"` (default) | `{}` (both flags omitted) | Active rows only |
| `"deleted"` | `{ onlyDeleted: true }` | Tombstones only |
| `"all"` | `{ includeDeleted: true }` | Active + tombstones |

```tsx
const [state, setState] = useState<StateFilterValue>("active");

const list = usePledges(tenantSlug, {
  // …other filters…
  ...toStateFilterFlags(state),
});

<DataTableShell state={{ value: state, onChange: setState }} … />
```

Every list hook accepts the same `includeDeleted` / `onlyDeleted` pair
because the backend filter DTOs all extend the shared
`StateFilterRequestDto` (see backend CLAUDE.md §7.7). Member surfaces
do **not** expose this switcher — they only opt into tombstones to
resolve Mode-B labels (§13.2 below); they never offer a "deleted only"
view.

### 13.2 Tombstone rendering — three modes

A row can be a tombstone *itself* or merely *reference* a tombstone of
another entity. Three rendering modes cover both cases:

| Mode | When | Primitive | Visual |
|---|---|---|---|
| **A** — tombstone row in a list | Admin viewing an "All" or "Deleted" view; the row's own `deletedAt` is set | `rowClassName={(r) => r.deletedAt ? "bg-muted/30" : undefined}` on `DataTableShell` | Muted row background; row-action menu still functional (Restore replaces Delete) |
| **B** — reference to a tombstone | Any caller; the row is active but one of its foreign keys points at an archived entity (e.g. a pledge whose campaign is deleted) | [`DeletedLabel`](src/components/primitives/DeletedLabel.tsx) | Muted text + inline `deleted` pill + tooltip showing `Deleted MMM D, YYYY` |
| **C** — tombstone detail page | Admin (or member) lands on a detail page for an archived entity | [`EntityRestoreBanner`](src/components/primitives/EntityRestoreBanner.tsx) | Amber banner at top of page; admin variant carries a Restore button, member variant omits actor identity |

`DeletedLabel` has a `hidePill` prop for nested contexts where the
surrounding row already conveys the deleted state — use it inside an
already-Mode-A row that *also* references another tombstone (avoid
double-pill noise).

### 13.3 Lookup-table opt-in to tombstones

A list page that needs to render Mode-B labels must fetch its lookup
tables with `includeDeleted: true`. Without that the lookup map will
omit the tombstone and the cell would fall back to the em-dash
placeholder — silently hiding the deletion.

```tsx
// Include archived campaigns so deleted references can render Mode-B.
const { data: campaignsData } = useCampaigns(tenantSlug, {
  includeDeleted: true,
});
const { data: membersData } = useMembers(tenantSlug, {
  limit: 200,
  includeDeleted: true,
});
```

This is **only** for lookup-style fetches that build a name/id map. The
list query for the page itself is still driven by the `StateFilter`
switcher (§13.1) — those two flows are independent.

### 13.4 Restore flow — confirmation modals

Restoring is destructive-of-a-current-state (the row reappears in
active views, indexes get rebuilt, partial-unique slots get reclaimed),
so every restore goes through a confirmation modal rather than a one-
click row action. There is one modal per entity:

- `confirm-restore-campaign`
- `confirm-restore-campaign-item`
- `confirm-restore-member`
- `confirm-restore-pledge`
- `confirm-restore-tenant` (super-admin)
- `confirm-restore-transaction`

Open the matching modal from the row-action menu or the
`EntityRestoreBanner`'s Restore button. The modal owns its own
`useApiMutation` call and invalidates the entity's queries on success.
See [`components/modals/confirm-restore-campaign/`](src/components/modals/confirm-restore-campaign/)
for the canonical shape.

### 13.5 Row-actions on tombstones

[`RowActionsMenu`](src/components/primitives/RowActionsMenu.tsx)
returns `null` when its `actions` array is empty — pages compose the
menu items conditionally (`row.deletedAt ? [restoreAction] : [editAction, deleteAction]`),
and a deleted row whose page chose to expose no actions renders nothing
at all rather than an empty dropdown. **Don't render `RowActionsMenu`
unconditionally with a manually-emptied `actions={[]}`** — let the menu
short-circuit.

### 13.6 Cheat sheet

| Surface | What to do |
|---|---|
| Admin list page | `<DataTableShell state={{ … }} />`; spread `toStateFilterFlags(state)` into the list query |
| Admin list row | `rowClassName={(r) => r.deletedAt ? "bg-muted/30" : undefined}`; swap the action menu on tombstones |
| Member list page | No state filter; only fetch with `includeDeleted: true` if you need Mode-B labels |
| Cross-entity cell rendering a possibly-archived reference | Wrap the title/name in `<DeletedLabel deletedAt={…}>{title}</DeletedLabel>` |
| Detail page that loaded a tombstone | Render `<EntityRestoreBanner>` at the top; disable mutating actions further down |
| Restore button (row menu or banner) | `openModal("confirm-restore-<entity>", { … })` |

---

## 14. Pre-commit checklist

1. Did you run `npm run api:types` after the backend changed?
2. Does every new mutation hook call an `invalidate<Entity>` helper in
   `onSuccess`?
3. Does every new modal use `BaseModal`, register its props via
   `declare module`, and appear in both `components/modals/index.ts` and
   `lib/modals/host.tsx`'s registry?
4. Does every identity-changing action (sign-out, super-admin toggle)
   call `invalidateAllApiQueries` where appropriate? Are claim mutations
   on the backend marked `@RefreshesClaims()`?
5. Client/server boundary: any Firebase Admin import in a client bundle?
   Any Firebase client import in an RSC?
6. Is `npm run check` green? (UI-primitive enforcement + Biome)
7. Is `npm run typecheck` green?
8. Is `npm run build` green?
