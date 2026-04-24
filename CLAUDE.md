@AGENTS.md

# CLAUDE.md — Church App Frontend Agent Guide

> **Audience:** AI coding agents working in this repo.
> **Goal:** add features without breaking the established data / modal / auth
> patterns. Read this before non-trivial edits.
>
> Backend conventions live in
> [../church-app-backend/CLAUDE.md](../church-app-backend/CLAUDE.md) — when
> backend behavior is unclear, check there rather than guessing.

---

## 1. Tech stack (exact versions)

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Next.js **16** (App Router) | See [AGENTS.md](AGENTS.md) — conventions differ from prior versions. Check `node_modules/next/dist/docs/` before writing router code. |
| React | **19** | |
| Language | TypeScript **6** (strict) | |
| Server state | **TanStack Query v5** | |
| HTTP client | **openapi-fetch** | typed from generated schema |
| Type generation | **openapi-typescript** | runs against backend's `/api-docs-json` |
| Client state | **Zustand** | minimal — modals only |
| Auth | `firebase` (client) + `firebase-admin` (server) | |
| Styling | Tailwind 4 + inline styles via `SANCTUARY` tokens | |

**Commands:**

```bash
npm run dev               # Next dev server
npm run build             # production build
npm run typecheck         # tsc --noEmit
npm run api:types         # regenerate src/lib/api/schema.d.ts from running backend
```

`api:types` needs the backend running on port 8000. Regenerate after any
backend schema change.

---

## 2. Directory layout (source of truth)

```
src/
├── app/                          # Next App Router (RSC by default)
│   ├── layout.tsx                # Wraps AuthProvider → QueryProvider → ModalHost
│   ├── (auth)/                   # Route group (no URL prefix)
│   │   ├── login/
│   │   ├── invite/[token]/
│   │   └── select-church/
│   ├── (dashboard)/              # Dashboard route group
│   │   └── { dashboard, members, transactions, events, … }/
│   ├── admin/                    # Super-admin routes
│   └── api/auth/session/route.ts # Next route — mints/clears Firebase session cookie
│
├── proxy.ts                      # Next middleware — session cookie gate
│
├── components/
│   ├── primitives/               # Button, Input, Card, Table, …
│   ├── layout/                   # AppShell, nav
│   ├── pages/                    # page-level composites
│   └── modals/
│       ├── BaseModal.tsx         # shared overlay/ESC/title/footer shell
│       ├── index.ts              # barrel — loads every modal's `declare module`
│       └── <modal-name>/
│           ├── <ModalName>.tsx
│           └── index.ts
│
└── lib/
    ├── api/                      # every backend endpoint wrapped here
    │   ├── client.ts             # openapi-fetch client + ID-token middleware
    │   ├── schema.d.ts           # GENERATED — do not edit
    │   ├── providers.tsx         # QueryClientProvider
    │   ├── hooks.ts              # generic useApiQuery / useApiMutation
    │   ├── index.ts              # barrel
    │   └── <entity>/             # one folder per backend resource
    │       ├── hooks.ts
    │       ├── keys.ts
    │       └── index.ts
    ├── modals/
    │   ├── registry.ts           # ModalPropsMap interface (augmented per modal)
    │   ├── store.ts              # Zustand + openModal / closeModal helpers
    │   └── host.tsx              # Renders the active modal from the registry
    ├── auth/
    │   ├── AuthProvider.tsx      # Exposes currentUser + loading via React context
    │   ├── actions.ts            # signInWithGoogle, signOut, refreshSession
    │   ├── server.ts             # getSessionUser() for RSCs
    │   └── constants.ts          # SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS
    ├── firebase/
    │   ├── client.ts             # client SDK factory
    │   └── admin.ts              # Admin SDK factory (server-only)
    └── design/tokens.ts          # SANCTUARY design tokens
```

---

## 3. App Router boundaries

- Layouts and pages are **Server Components by default**.
- `"use client"` marks a client boundary — every module imported from a
  client file becomes client-side.
- Providers (`QueryProvider`, `ModalHost`, `AuthProvider`) are client
  components but can be rendered directly from the RSC root layout — Next
  handles the boundary.
- Never import Firebase *client* SDK into a Server Component. Never import
  Firebase *Admin* SDK into a Client Component.

The API hooks (`useApiQuery` / `useApiMutation` and every entity hook)
are client-only. For data fetching in RSCs, call the backend directly with
`fetch` using the session cookie (not yet wired — flag if you need it).

---

## 4. Auth — the dual path

Two auth tokens travel with each request, and they serve different purposes:

```
Google SSO (Firebase client SDK)
        │
        ▼
    ID token ──┬──► POST /api/v1/auth/session        (backend upserts User)
               └──► POST /api/auth/session (Next)    (mints HTTP-only session cookie)

Subsequent requests:
    Navigations ─► session cookie  ─► proxy.ts + getSessionUser()  (SSR gate)
    API calls   ─► Bearer ID token ─► backend FirebaseAuthGuard    (REST auth)
```

### Rules

1. **Sign-in flow lives in [auth/actions.ts](src/lib/auth/actions.ts)**
   (`signInWithGoogle`). It does Firebase popup → backend session exchange →
   Next session cookie in that order. Don't reinvent this in individual
   components — call `signInWithGoogle` and react to the result.
2. **ID token is never stored manually.** `auth.currentUser.getIdToken()`
   returns a fresh token and handles refresh. [client.ts](src/lib/api/client.ts)
   calls it per-request via middleware.
3. **After mutating Firebase custom claims** (tenant switch, role change,
   invite accept) you MUST call `refreshSession()` from
   [auth/actions.ts](src/lib/auth/actions.ts) — otherwise RSCs read stale
   claims until the token happens to refresh (~1h).
4. **`proxy.ts` gates by session cookie only.** Public paths (`/login`,
   `/invite`) bypass. Don't add public paths inline — update
   `PUBLIC_PATHS`.
5. **Server Components read auth via `getSessionUser()`** — it verifies the
   session cookie with Admin SDK and returns the decoded claims. It throws
   if missing / invalid.

---

## 5. API layer — one folder per entity

The single most important frontend convention. **Every backend endpoint is
wrapped in a typed hook in an entity folder.** Consumers never call
`openapi-fetch` directly; they import hooks from `@/lib/api/<entity>`.

### 5.1 Folder shape

```
src/lib/api/<entity>/
├── hooks.ts    # useEntity*, useCreateEntity, useUpdateEntity, useDeleteEntity
├── keys.ts    (+ invalidate<Entity>(qc, scope?))
└── index.ts    # export * from "./hooks"; export * from "./keys";
```

Keys live in `keys.ts`. Hooks live in `hooks.ts`. Both are re-exported
through `index.ts` so consumers do `import { useTenants, invalidateTenants }
from "@/lib/api/tenants"`.

### 5.2 Query keys

Every query uses `[path, init]` as its key where `path` is the literal
OpenAPI template string (e.g. `"/api/v1/tenants/{id}"`) and `init` is the
request params/body. You never hand-write a query key — the generic
`useApiQuery` sets it for you.

### 5.3 Invalidation

Each entity's `keys.ts` exports:

- A `<ENTITY>_PATHS` array — every path that returns data of this entity.
- An `invalidate<Entity>(qc, scope?)` helper that invalidates those paths.

For nested resources (transactions, pledges, campaigns — all scoped under a
tenant), the helper accepts a `tenantId` and narrows the predicate to
queries whose `init.params.path.tenantId` matches. This keeps one tenant's
mutations from invalidating another tenant's cache.

```ts
// Inside a mutation hook:
return useApiMutation("/api/v1/tenants/{tenantId}/pledges", "post", {
  onSuccess: () => invalidatePledges(qc, tenantId),
});
```

Predicate > prefix matching because some paths overlap literally
(`/api/v1/tenants` vs `/api/v1/tenants/{tenantId}/transactions` both start
with `/api/v1/tenants`) — see [tenants/keys.ts](src/lib/api/tenants/keys.ts)
for the exact-path set.

**Cross-entity invalidation:** only for identity changes. After `switch
Tenant`, call `invalidateAllApiQueries(qc)` — every user-scoped cache is
suspect. Never use the nuclear option just because you don't know which
scope to clear.

### 5.4 Cadence for adding a new endpoint

1. Backend ships the endpoint.
2. Run `npm run api:types`.
3. Add a hook to the relevant entity's `hooks.ts`. If it's a new entity,
   create the folder following the pattern in
   [src/lib/api/tenants/](src/lib/api/tenants/) (no list GET yet? look at
   [invitations/](src/lib/api/invitations/) instead).
4. Mutations get `onSuccess: () => invalidate<Entity>(qc, …)`.
5. Add a line to [src/lib/api/index.ts](src/lib/api/index.ts) if it's a new
   folder.

### 5.5 Auth endpoints are special

`POST /auth/session` and `POST /auth/switch-tenant` have imperative wrappers
in [auth/actions.ts](src/lib/auth/actions.ts) because they're multi-step
flows (Firebase + backend + cookie minting + token refresh). **Do not
expose them as raw `useApiMutation` hooks.** Call the helpers. Only
`GET /auth/me` is exposed as `useAuthMe()`.

---

## 6. Modal system — one folder per modal

Consistent modal UX comes from one shared shell:
[BaseModal.tsx](src/components/modals/BaseModal.tsx). Every modal renders
inside it; never render a standalone overlay/portal.

### 6.1 Folder shape

```
src/components/modals/
├── BaseModal.tsx                 # shared shell (overlay, ESC, title/footer)
├── index.ts                      # barrel — every modal folder re-exports here
└── <modal-name>/
    ├── <ModalName>.tsx           # component + `declare module` augmentation
    └── index.ts                  # re-export
```

### 6.2 Props are typed globally

The modal props map is augmented by each modal file:

```ts
// src/components/modals/confirm-delete/ConfirmDeleteModal.tsx
declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-delete": { title: string; message: string; onConfirm: () => Promise<void> };
  }
}
```

So `openModal("confirm-delete", { title, message, onConfirm })` is
type-checked — TS enforces the prop shape matches the declaration.

### 6.3 Registering a modal — three edits

1. Create `src/components/modals/<name>/<Name>Modal.tsx` with the `declare
   module` augmentation at the top and `<BaseModal>` wrapping the body.
2. Create `src/components/modals/<name>/index.ts` that re-exports the
   component.
3. Add `export * from "./<name>";` to
   [src/components/modals/index.ts](src/components/modals/index.ts) AND add
   one line to the `registry` object in
   [src/lib/modals/host.tsx](src/lib/modals/host.tsx).

### 6.4 Opening modals

```ts
import { openModal } from "@/lib/modals/store";

openModal("confirm-delete", {
  title: "Delete tenant?",
  message: "This is soft-deleted; an admin can restore it.",
  onConfirm: async () => { /* mutateAsync(...) */ },
});
```

`openModal` and `closeModal` work outside React (useful in event handlers
that don't have access to hooks). Inside a component, `useModalStore` also
works if you need reactivity.

### 6.5 In-flight states

A modal performing a mutation should pass `dismissible={false}` to
BaseModal while the mutation is pending, so ESC and backdrop-click don't
close mid-operation.

---

## 7. Common workflows

### 7.1 Add a new backend-backed feature

1. Backend: ship the endpoint (see backend CLAUDE.md).
2. `npm run api:types`.
3. Add hook(s) to `src/lib/api/<entity>/hooks.ts`.
4. Use the hook from a Client Component. Handle `isPending` / `error` /
   empty states explicitly.
5. If the UX needs a confirmation, create/reuse a modal instead of inline
   confirm dialogs.

### 7.2 Add a new modal

See §6.3.

### 7.3 Add a new Next route

- Route groups: `app/(group)/…` — group folders in parens don't appear in
  the URL. Use `(auth)` and `(dashboard)` as a model.
- `layout.tsx` in a group wraps every page inside.
- For auth gating, rely on `proxy.ts` — don't reimplement redirects per
  page.
- Server Components are the default. Drop `"use client"` only at the leaf
  that needs it.

### 7.4 Add an imperative auth flow

Put it in [auth/actions.ts](src/lib/auth/actions.ts). If it mutates custom
claims server-side, follow with `refreshSession()` so the cookie updates.

---

## 8. Anti-patterns — do NOT do these

| Anti-pattern | Fix |
|---|---|
| Hand-written query keys in `useQuery` | Use `useApiQuery` — it sets `[path, init]` automatically |
| Calling `fetch` to the backend directly from a component | Go through `useApiQuery` / `useApiMutation` so the ID token is attached |
| Importing `firebase-admin` from a client file | Server-only; use it from route handlers or `getSessionUser()` |
| Storing the ID token in state or localStorage | `auth.currentUser.getIdToken()` refreshes for you — fetch it per request |
| Raw `useMutation("/api/v1/auth/session")` | Use `signInWithGoogle` / `refreshSession` — the flow is multi-step |
| Forgetting `refreshSession()` after `switch-tenant` | Claims in RSCs stay stale for up to an hour |
| Invalidating by path prefix (`startsWith`) | Use the entity's `invalidate<X>` helper — path overlaps would clobber unrelated caches |
| Rendering a modal overlay inline instead of through `BaseModal` + registry | Opens a second modal on top of BaseModal, breaks ESC/backdrop handling |
| Editing `src/lib/api/schema.d.ts` by hand | It's regenerated; your edits vanish on `npm run api:types` |
| Calling `queryClient.invalidateQueries({ queryKey: ["/api/v1/tenants"] })` | Matches only the exact-prefix list queries; use `invalidateTenants(qc)` for the full scope |

---

## 9. Pre-commit checklist

1. Did you run `npm run api:types` after the backend changed?
2. Does every new mutation hook call an `invalidate<Entity>` helper in
   `onSuccess`?
3. Does every new modal use `BaseModal` and register its props via `declare
   module`?
4. Does every identity-changing action (sign-out, tenant switch) call
   `invalidateAllApiQueries` or `refreshSession` as appropriate?
5. Client/server boundary: any Firebase Admin import in a client bundle?
   Any Firebase client import in an RSC?
6. Is `npm run typecheck` green?
7. Is `npm run build` green?
