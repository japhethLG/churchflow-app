# Church App Frontend

Next.js 16 frontend for the multi-tenant church app. Admins record tithes,
offerings, and fundraising campaigns; members pledge and pay against them.

Backend lives in [../church-app-backend](../church-app-backend).

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript 6** (strict)
- **TanStack Query v5** — server state
- **openapi-fetch** + **openapi-typescript** — typed HTTP client generated
  from the backend's OpenAPI spec
- **Zustand** — tiny client state (modals)
- **Firebase** (client SDK) — Google SSO; ID tokens sent to the backend,
  session cookies minted for Next SSR
- **Tailwind 4** + CSS variables (`globals.css` / `@theme inline`)

## Setup

```bash
# 1. Install
npm install

# 2. Configure env — copy .env.example to .env.local and fill in:
#    - NEXT_PUBLIC_FIREBASE_* (client SDK config)
#    - FIREBASE_ADMIN_* (server-side Admin SDK for session cookie minting)
#    - NEXT_PUBLIC_API_BASE_URL (defaults to http://localhost:8000)

# 3. Start the backend first (sibling repo), then:
npm run api:types        # pulls types from http://localhost:8000/api-docs-json
npm run dev              # Next dev server on :3000
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next dev server |
| `npm run build` | production build |
| `npm run start` | serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run api:types` | regenerate `src/lib/api/schema.d.ts` from the running backend |
| `npm run dev:test` / `build:test` | same but loading `.env.test.local` |

## Architecture overview

```
src/
├── app/                  # Next App Router (server + client components)
│   ├── layout.tsx        # AuthProvider → QueryProvider → ModalHost
│   ├── (auth)/           # /login, /select-church, /invite
│   ├── (dashboard)/      # /dashboard, /members, /transactions, …
│   ├── admin/            # /admin/tenants (super admin)
│   └── api/auth/session  # Next route that mints/clears the session cookie
│
├── proxy.ts              # Next middleware — session cookie gate
│
├── components/
│   ├── primitives/       # Button, Input, Card, Table, …
│   ├── modals/           # BaseModal + one folder per modal (see below)
│   └── pages/            # page composites
│
└── lib/
    ├── api/              # typed hooks — one folder per entity
    │   ├── client.ts     # openapi-fetch + Bearer token middleware
    │   ├── hooks.ts      # generic useApiQuery / useApiMutation
    │   ├── tenants/      # { hooks.ts, keys.ts, index.ts }
    │   ├── campaigns/
    │   ├── pledges/
    │   ├── transactions/
    │   └── …
    ├── modals/           # registry + Zustand store + ModalHost
    ├── auth/             # AuthProvider, signInWithGoogle, refreshSession
    ├── firebase/         # client + admin SDK factories
    └── design/           # Shared design helpers (e.g. logo gradient)
```

### Data layer

Every backend endpoint is wrapped in a typed hook:

```tsx
const { data, isPending } = useTenants();
const createTx = useCreateTransaction(tenantId);
createTx.mutate({
  params: { path: { tenantId } },
  body: { type: "COMMITMENT", amount: 100, pledgeId, … },
});
```

Paths, params, bodies, and responses are inferred from the backend's OpenAPI
spec — regenerate with `npm run api:types` whenever the backend changes.
Each entity owns its invalidation helpers (`invalidateTenants`,
`invalidateTransactions(qc, tenantId)`, etc.). See
[CLAUDE.md §5](CLAUDE.md#5-api-layer--one-folder-per-entity) for the full
pattern.

### Auth (dual-path)

1. **Client** signs in with Google → Firebase ID token.
2. **Backend** verifies the token via `POST /api/v1/auth/session` (upserts
   the user in Postgres).
3. **Next** mints a session cookie via `POST /api/auth/session` (for SSR
   gating).

Subsequent API calls carry the ID token (via openapi-fetch middleware);
subsequent Next navigations carry the session cookie (via the browser).
After any operation that mutates Firebase custom claims (tenant selection,
role change), call `refreshSession()` from
[lib/auth/actions.ts](src/lib/auth/actions.ts) so Server Components see the
new claims.

### Modals

Every modal lives in its own folder and renders inside the shared
[BaseModal](src/components/modals/BaseModal.tsx) shell. Open any registered
modal from anywhere with:

```ts
openModal("confirm-delete", { title, message, onConfirm });
```

See [CLAUDE.md §6](CLAUDE.md#6-modal-system--one-folder-per-modal) for how
to add one.

## For agents

Full conventions and anti-patterns live in [CLAUDE.md](CLAUDE.md). Please
read it before making non-trivial changes. Next 16 has breaking differences
from prior versions — see [AGENTS.md](AGENTS.md).
