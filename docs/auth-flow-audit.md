# Auth & Routing Flow Audit

> Snapshot taken 2026-05-02. Pairs with [CLAUDE.md §4](../CLAUDE.md) (the dual-token model) and [SPECS §11](../SPECS.md) where applicable.

## TL;DR

- **One bug confirmed and fixed**: client API requests racing Firebase auth restoration on hard reload — `client.ts` now awaits `authStateReady()` before reading `currentUser`.
- **Three smaller risks remain** worth tracking — see [§5 Findings](#5-findings).
- The dual-path design (Next session cookie for SSR, Firebase ID token for REST) is sound. The failure modes below are all variations on "the two tokens disagree."

---

## 1. The two tokens, in one picture

```
                 ┌──────────────── Firebase client SDK (browser) ────────────────┐
                 │   currentUser  ──► getIdToken()  ──► Bearer <ID token>        │
sign-in flow ───►│                                                               │──► REST API
                 │   persisted in IndexedDB; restored async on each page load    │     (NestJS)
                 └───────────────────────────────────────────────────────────────┘

                 ┌──────────────── Next session cookie (HTTP-only) ──────────────┐
                 │   minted by /api/auth/session from a fresh ID token            │
sign-in flow ───►│   verified by Admin SDK in getSessionUser() / proxy.ts        │──► RSC pages
                 │   lifetime: SESSION_MAX_AGE_SECONDS (independent of ID token) │     & Next routes
                 └───────────────────────────────────────────────────────────────┘
```

Two tokens, two consumers, two refresh cycles. Most bugs in this layer come from one being live while the other is stale or absent.

---

## 2. Sign-in flow — `signInWithGoogle`

[src/lib/auth/actions.ts:28](../src/lib/auth/actions.ts#L28)

1. `signInWithPopup` → Firebase issues an ID token (no custom claims yet).
2. `POST /api/v1/auth/session` (backend, `@Public`) → upserts the User row, writes `tenantMemberships` + `isSuperAdmin` custom claims via Admin SDK, returns `SignInResult`.
3. `getIdToken(true)` → force-refresh so the new claims show up in the JWT.
4. `POST /api/auth/session` (Next route handler) → verifies the *refreshed* token with Admin SDK and mints the session cookie. Cookie is `HttpOnly`, `SameSite=Lax`, `Secure` in prod, `path=/`.
5. `LoginButton` calls `router.push("/")` then `router.refresh()` so the RSC at [app/page.tsx](../src/app/page.tsx) re-runs with the new cookie and picks the destination.

**Verdict:** correct. The order matters — minting the cookie *before* the force-refresh would lock stale claims into the cookie until it expires.

---

## 3. Request-time authentication

### 3.1 Navigations / RSC requests

- [proxy.ts](../src/proxy.ts) gates by **cookie presence only** — `PUBLIC_PATHS = ["/login", "/invite", "/logout"]` bypass; everything else without the cookie redirects to `/login`. Signed-in users hitting `/login` bounce to `/`.
- Server Components call [getSessionUser()](../src/lib/auth/server.ts) which **verifies the cookie via `adminAuth.verifySessionCookie(cookie, true)`** (the `true` enables revocation checks). Returns `null` on any failure, never throws to the page.
- Per-route role enforcement happens in `layout.tsx` files:
  - [(super-admin)/layout.tsx](../src/app/(super-admin)/layout.tsx) — `isSuperAdmin` only.
  - [[tenantSlug]/layout.tsx](../src/app/[tenantSlug]/layout.tsx) — membership in `tenantSlug` *or* super-admin; non-members redirect to `/` to avoid leaking tenant existence.
  - The inner `(admin)` / `(member)` group layouts (not read here) enforce the perspective.

### 3.2 REST API calls

- [src/lib/api/client.ts](../src/lib/api/client.ts): `openapi-fetch` client with two middlewares.
  - `authMiddleware`: `await auth.authStateReady()`, then attach `Bearer <idToken>` if `currentUser` exists. **The `authStateReady()` await is what fixes the reload race** described in §5.1.
  - `unwrapMiddleware`: peels the backend's `{ success, data }` envelope before `openapi-fetch` parses against the OpenAPI schema.
- All entity hooks go through [useApiQuery / useApiMutation](../src/lib/api/hooks.ts), which set `queryKey: [path, init]` automatically and surface `error` from `openapi-fetch`.

### 3.3 The two-token boundary

`getSessionUser()` and the REST middleware **do not share state** — they read different tokens and verify them independently. That's deliberate (the cookie is HTTP-only and unreadable from JS), but it's also why the failure modes in §5.2 / §5.3 exist.

---

## 4. Routing map

```
/                              RSC — landing redirect (super-admin / 0 / 1 / >1 memberships)
/login                         public; LoginButton calls signInWithGoogle
/invite/[token]                public; accept-invite flow
/logout                        public; clears Firebase + session cookie
/select-church                 signed-in but no tenant chosen yet
/super-admin/*                 isSuperAdmin only
/[tenantSlug]/welcome          tenant member; first-run experience
/[tenantSlug]/(admin)/*        tenant ADMIN
/[tenantSlug]/(member)/*       tenant USER or ADMIN
/api/auth/session              POST mints cookie / DELETE clears it
```

`proxy.ts` matcher: `/((?!api|_next/static|_next/image|favicon.ico).*)` — i.e. it skips `/api/*` and Next internals. That means **`/api/auth/session` is NOT cookie-gated**, which is correct (the POST is what *creates* the cookie).

---

## 5. Findings

### 5.1 [FIXED] Bearer-token race on hard reload

**Symptom (user-reported):** on every page reload, the first wave of API requests returns `401 "Missing bearer token"`. A second later the same requests retry and succeed.

**Root cause:** [client.ts authMiddleware](../src/lib/api/client.ts) read `getClientAuth().currentUser` synchronously. Firebase restores its persisted session asynchronously from IndexedDB; until that resolves, `currentUser === null`. So:

1. Page mounts → `useApiQuery` hooks fire on the first render.
2. `openapi-fetch` calls the middleware → `currentUser` is still `null` → no `Authorization` header.
3. Backend's `FirebaseAuthGuard` rejects with 401.
4. TanStack Query's `retry: 1` ([providers.tsx:16](../src/lib/api/providers.tsx#L16)) fires the second attempt ~1s later — by then `onAuthStateChanged` has populated `currentUser` and the request succeeds.

The retry was masking the bug, but burning one round-trip per query, every reload — and would surface as a real failure if the retry budget ever dropped to 0 or the backend got stricter (rate-limit, audit log, alert).

**Fix:** `await auth.authStateReady()` inside the middleware before reading `currentUser`. Firebase v9+ exposes this Promise specifically for the post-reload restoration moment; it resolves once persistence has loaded (and resolves immediately on subsequent calls).

```ts
// src/lib/api/client.ts
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const auth = getClientAuth();
    await auth.authStateReady();
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      request.headers.set("Authorization", `Bearer ${idToken}`);
    }
    return request;
  },
};
```

**Why this layer (not the hook):** the alternative — gating every `useApiQuery` on `useAuth().loading` — would require a refactor across every entity hook and is easy to forget on the next one written. Fixing it once at the middleware boundary makes it impossible to bypass.

**Side effects:** none. `authStateReady()` is a no-op once resolved, and unauthenticated requests still proceed without an `Authorization` header (correct for `@Public` endpoints like `POST /auth/session`).

---

### 5.2 [FIXED] Cookie present, Firebase signed out

**Scenario:** user clears site data in another tab, or the Firebase IndexedDB entry gets evicted, but the session cookie (HTTP-only, separate storage) is still valid. `proxy.ts` lets the navigation through, RSCs render fine via `getSessionUser()`, then every client API call goes out without a Bearer token → 401s for the rest of the page lifetime.

**Fix:** the response middleware in [client.ts](../src/lib/api/client.ts) now treats any backend 401 as a signal that both halves of the session are stale: signs out of Firebase, deletes the Next session cookie, and redirects to `/login?next=<path>`. A `signOutInFlight` flag + skip on `UNAUTHENTICATED_PATHS` keeps it from stacking redirects when many concurrent queries 401 at once or when the visitor is already on `/login`.

---

### 5.3 [FIXED] Stale custom claims after self-initiated changes

The auto-refresh footgun (forgetting `refreshSession()` after a claim mutation) is now closed at the protocol level:

- **Backend** sets `X-Claims-Refreshed: 1` on the response of any handler decorated with `@RefreshesClaims()`. A new global [ClaimsRefreshInterceptor](../../church-app-backend/src/infrastructure/config/interceptors/claims-refresh.interceptor.ts) reads the metadata and writes the header. Currently applied to:
  - `POST /api/v1/invitations/accept` — caller accepts their own invite.
  - `PATCH /api/v1/admin/users/:id` — super-admin self-toggle.
- **CORS** exposes the header (`exposedHeaders: ["X-Claims-Refreshed"]`) so the browser is allowed to read it.
- **Frontend** response middleware sees the header and force-refreshes the ID token + re-mints the Next session cookie. Fully transparent to call sites — `useApiMutation` consumers don't need to call `refreshSession()` themselves.

Don't mark a handler that only mutates *other users'* claims (admin removing a different member, role grants to others). The affected user isn't making the request; their device picks up the change on its next token refresh. Real-time push to other devices is out of scope.

---

### 5.4 [PARTIALLY ADDRESSED] Session-cookie revocation lag for "log me out everywhere"

`signOut()` in [auth/actions.ts](../src/lib/auth/actions.ts) clears Firebase + this device's cookie but doesn't revoke server-side. New `signOutEverywhere()` action calls `POST /api/v1/auth/sign-out-everywhere`, which `adminAuth.revokeRefreshTokens(uid)` — invalidating session cookies on every other tab/device. Other devices stay "live" until their next API call fails revocation check; the global 401 handler (§5.2) then bounces them to `/login`.

Action is exported but **not yet wired into a UI affordance** (e.g. a "sign out everywhere" item in the account menu). That's the only remaining work for this finding.

---

### 5.5 [FIXED] No rate limiting on `POST /api/auth/session`

`verifyIdToken` is RSA-bound and CPU-expensive. Without a limit, an attacker can pin a Node worker by spamming garbage tokens. New [lib/auth/rate-limit.ts](../src/lib/auth/rate-limit.ts) — token-bucket, 20 req/min/IP, in-memory. Applied to the route before body parsing.

**Caveat:** in-memory means each Node instance has its own bucket. Behind multiple replicas the effective rate is `RATE × replicas`. Replace with a shared store (Vercel KV / Upstash / Cloudflare) before scaling auth traffic horizontally.

---

### 5.6 [FIXED] No server-side data fetching path

RSCs previously had no way to call the backend, forcing every dashboard to waterfall on the client (mount → auth restore → fetch → render). Two-part fix:

- **Backend** — [FirebaseAuthGuard](../../church-app-backend/src/infrastructure/firebase-auth/guards/firebase-auth.guard.ts) now accepts `Authorization: SessionCookie <cookie>` in addition to `Bearer <ID token>`, verified via `adminAuth.verifySessionCookie`. Same `req.user` shape — no downstream changes.
- **Frontend** — [lib/api/server.ts](../src/lib/api/server.ts) exports `serverApi`, an `openapi-fetch` client with a server-only middleware that reads the session cookie and forwards it. Use from RSCs and route handlers; the existing client-side `api` continues to be the right choice for interactive components.

Already used to move the tenant-existence check from a client `<TenantGuard>` to the [tenantSlug] server layout — flicker-free 404s for super-admins hitting bad slugs.

---

### 5.7 [FIXED] Security headers

[next.config.ts](../next.config.ts) now sets a CSP that allows Firebase Google SSO, plus HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a minimal `Permissions-Policy`. CSP currently uses `'unsafe-inline'` for script-src because Next 16's RSC payloads are inline; a follow-up should swap that for per-request nonces threaded through `proxy.ts`.

---

### 5.8 [FIXED] Error shape contract

New [ApiError](../src/lib/api/errors.ts) class with `{ status, code, message, details }`, thrown from the response middleware on any non-2xx JSON response. Replaces the `.statusCode ?? .status` guesswork that had been creeping into call sites (e.g. the old `TenantGuard`). Use `isApiError(e)` to narrow.

---

### 5.9 [FIXED] `getSessionUser()` swallowed all errors

[lib/auth/server.ts](../src/lib/auth/server.ts) now logs verification failures distinctly from "no cookie" (still returns `null` either way — callers shouldn't have to branch). Spikes in verification failures (revocation lag, JWKS outage, tampered cookie) are now visible in server logs. Doc/code mismatch in CLAUDE.md §4 reconciled.

---

## 6. Open follow-ups

1. ~~Wire `signOutEverywhere()` into a UI affordance.~~ **Done.** [AccountMenu.tsx](../src/components/layout/sidebar/account-menu/AccountMenu.tsx) now has a "Sign out of all devices" item that opens a confirmation modal before calling the action.
2. ~~Replace `'unsafe-inline'` in CSP with nonces.~~ **Done for script-src.** [proxy.ts](../src/proxy.ts) now generates a per-request nonce and emits a `script-src 'self' 'nonce-…' 'strict-dynamic' …` policy. Static headers (HSTS, X-Frame-Options, etc.) stayed in [next.config.ts](../next.config.ts). Style-src kept `'unsafe-inline'` deliberately — UI libraries (Radix/base-ui dropdowns and popovers) inject inline `style` *attributes* for positioning, which CSP can't distinguish from `<style>` tag injection. Removing it breaks every floating component; the trade-off is well-known.
3. **Move the in-memory rate limiter to a shared store** before horizontally scaling. Currently in-memory because no shared cache infra is available. Same interface in [lib/auth/rate-limit.ts](../src/lib/auth/rate-limit.ts); swap the `Map` for Vercel KV / Upstash / Cloudflare KV when one is adopted.
4. **Real-time claim invalidation for *other* users.** When an admin removes a member or changes their role, the affected user keeps their old claims until next token refresh (~1h) or they re-login. Backend's `FirebaseAuthGuard` re-checks DB membership on every call, so they can't *act* on stale claims, but the UX shows ghost permissions. A push channel (FCM, WS, SSE) on claim change → frontend force-refresh would close it.
5. **Regenerate OpenAPI types** (`npm run api:types`) once the backend is reachable. The new `POST /auth/sign-out-everywhere` is currently called via raw `fetch` in [auth/actions.ts](../src/lib/auth/actions.ts); after regen it can move to the typed client.

---

## 7. Pre-merge checks for future auth changes

Borrowing the spirit of [CLAUDE.md §9](../CLAUDE.md):

1. New client-side data access? Confirm it goes through `useApiQuery` / `useApiMutation` — never `fetch` directly to the backend.
2. New endpoint that mutates the *caller's* own custom claims? Mark the handler with `@RefreshesClaims()` — the response middleware will auto-refresh the cookie. Still call `refreshSession()` manually only for multi-step imperative flows like `signInWithGoogle`.
3. New public route? Add it to `PUBLIC_PATHS` in `proxy.ts` *and* confirm no inner layout assumes `getSessionUser()` is non-null. If the page makes API calls, also add it to `UNAUTHENTICATED_PATHS` in [client.ts](../src/lib/api/client.ts).
4. New RSC fetching backend data? Use `serverApi` from [lib/api/server.ts](../src/lib/api/server.ts) — never the client `api` (it has no session cookie access from the server).
5. Touched the API client middleware? Re-test (a) page reload race, (b) 401 → /login bounce, (c) `X-Claims-Refreshed` triggers `getIdToken(true)`.
