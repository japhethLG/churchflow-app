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
- **Zustand 5** — minimal client state (modals only)
- **react-hook-form 7** + **zod 4** — forms, wrapped in
  `components/formElements/*`
- **Firebase** (client SDK) + **firebase-admin** (server) — Google SSO;
  ID tokens for REST, session cookies for SSR
- **Tailwind 4** + CSS variables — tokens in `globals.css`
- **dayjs** — sole date library
- **recharts**, **lucide-react**, **react-day-picker**, **@base-ui/react**
  — vendored through primitives, never imported directly from a page
- **Biome 2** — lint + format
- **husky** — git hooks

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
│   ├── layout.tsx                      # AuthProvider → QueryProvider → ModalHost
│   ├── page.tsx                        # landing redirect
│   ├── (auth)/                         # /login, /select-church, /invite/[token]
│   ├── (super-admin)/super-admin/      # platform-ops; not tenant-scoped
│   │   └── { tenants, admins, audit, profile }
│   ├── [tenantSlug]/                   # ALL tenant-scoped pages
│   │   ├── (admin)/admin/{ dashboard, members, campaigns, pledges, transactions, … }
│   │   ├── (member)/member/{ dashboard, campaigns, my-pledges, my-transactions, … }
│   │   └── welcome/
│   ├── api/auth/session/               # POST mints / DELETE clears the session cookie
│   └── logout/
│
├── proxy.ts                            # middleware: cookie gate + per-request CSP nonce
│
├── components/
│   ├── primitives/                     # OUR design system (Button, Input, Card, DataTable, …)
│   ├── ui/                             # raw shadcn-style wrappers — used BY primitives only
│   ├── formElements/                   # react-hook-form bindings (FormInput, FormSelect, FormSubmit, …)
│   ├── layout/                         # AppShell + Sidebar + TopBar
│   ├── pages/                          # page-level composites (DashboardKpiStrip, CampaignForm, …)
│   ├── modals/                         # BaseModal + 25+ registered modals
│   ├── illustrations/                  # SVG components
│   └── auth/                           # client pieces of the auth flow
│
└── lib/
    ├── api/                            # one folder per backend entity, intent-split
    │   ├── client.ts                   # browser openapi-fetch + Bearer ID token + 401/claims-refresh middleware
    │   ├── server.ts                   # RSC openapi-fetch + "SessionCookie" scheme middleware
    │   ├── hooks.ts                    # useApiQuery, useApiMutation, invalidateByPaths, invalidateAllApiQueries
    │   ├── errors.ts / coerce.ts       # typed errors + nullable-field helpers
    │   ├── schema.d.ts                 # GENERATED — never edit
    │   ├── auth/   health/             # flat (not intent-split — per-user / global)
    │   └── tenants/ members/ pledges/ transactions/ campaigns/ invitations/ admin/
    │       ├── keys.ts                 # <ENTITY>_PATHS + invalidate<Entity>(qc, tenantId?)
    │       ├── tenant/   self/         # /tenants/:tenantId/<entity>     /tenants/:tenantId/me/<entity>
    │       └── platform/   public/     # /platform/<entity>              /<token-route>
    ├── modals/                         # registry, Zustand store, ModalHost
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
`PaginationRequestDto` base classes.

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
no string-typed `props: any` payload. See
[CLAUDE.md §8](CLAUDE.md#8-modal-system--one-folder-per-modal) for how
to register one.

## For agents

Full conventions and anti-patterns live in [CLAUDE.md](CLAUDE.md).
Please read it before non-trivial changes. Next 16 has breaking
differences from prior versions — see [AGENTS.md](AGENTS.md).
