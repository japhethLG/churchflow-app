# Church App — Full Technical Specification

> **Version:** 2.1.0
> **Created:** 2026-03-24
> **Last updated:** 2026-04-25
> **Status:** Living document — reflects the app as actually built, plus
> what is still outstanding.

---

## Table of Contents

1. [Overview](#1-overview)
2. [What changed vs. v1](#2-what-changed-vs-v1)
3. [Tech Stack](#3-tech-stack)
4. [Repository Layout](#4-repository-layout)
5. [Multi-Tenancy Model](#5-multi-tenancy-model)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Roles & Permissions](#7-roles--permissions)
8. [Data Models](#8-data-models)
9. [User Flows](#9-user-flows)
10. [API Layer](#10-api-layer)
11. [Frontend Routing & Role-Scoped Layouts](#11-frontend-routing--role-scoped-layouts)
12. [Screens & Pages](#12-screens--pages)
13. [Email Service](#13-email-service)
14. [Security](#14-security)
15. [Error Handling & Validation](#15-error-handling--validation)
16. [Deployment & Environment](#16-deployment--environment)
17. [Implementation Status](#17-implementation-status)
18. [Out of Scope](#18-out-of-scope)

---

## 1. Overview

A multi-tenant church management application focused on **recording
incoming financial transactions** (tithes, offerings, fundraising
campaign contributions). Each church (tenant) operates independently
with its own admins and members. The app does **not** track outgoing
spending or expenses.

### Core Principles

- **Income-only tracking** — no expense management
- **Multi-tenant isolation** — each church's data is fully isolated
- **Split frontend/backend** — a NestJS API server owns domain logic,
  persistence, and auth verification; a Next.js app owns UI and SSR
- **Privacy-first** — members only see their own transactions; admins
  see all of their tenant's data
- **Typed end-to-end** — the frontend consumes the backend's OpenAPI
  spec via generated TypeScript types

---

## 2. What changed vs. v1

The v1 spec described a single Next.js app with Firestore as the database
and Next.js API routes as the backend. During implementation we diverged
for reasons that are now baked in; this section is a changelog of those
decisions.

| Area | v1 spec | What we built | Why |
|---|---|---|---|
| Backend shape | Next.js API routes in the same repo | Separate **NestJS** API in `church-app-backend/` | Clean separation, reusable across future clients (mobile), testable controllers/services, and a single OpenAPI spec we can type-generate from |
| Database | **Cloud Firestore** | **PostgreSQL via Prisma 7** | Relational domain (Pledges link Campaigns ↔ Members ↔ Transactions); aggregations/reports; no document-model awkwardness |
| Repository pattern | Hand-rolled `ITransactionRepository` interfaces + Firestore impls | Griffin 5-tier (Main → Feature → Process → Core → Infrastructure); Prisma is the only data access, wrapped by Core services | Prisma already abstracts SQL; hand-rolling a second layer was ceremony without benefit. See backend CLAUDE.md for the architecture rules |
| Client state | Redux Toolkit + RTK Query | **TanStack Query v5 + openapi-fetch** (server state) + **Zustand** (modals only) | Lighter OpenAPI integration, no Redux boilerplate, ergonomics for generated types |
| Auth surface | Firebase Auth + Firestore security rules | **Firebase Auth (client SDK + Admin SDK)** + NestJS guards — no Firestore rules exist | Backend owns authorization end-to-end; Firestore isn't used |
| Event model | `ChurchEvent` (services, conferences, fundraisers) | **`Campaign` + `CampaignItem` + `Pledge`** | The product is about *money*, not calendars; campaigns break down into items, members pledge, transactions attribute against pledges |
| `Transaction.eventId` | Single FK to event | `campaignId` / `campaignItemId` / `pledgeId` triple, enforced consistent by backend | Pledge-first attribution with fallback to unpledged campaign giving |
| `Transaction.type` | Big enum including `commitment` | Kept enum (see §8.4) | `commitment` now effectively maps to "transaction that has a `pledgeId`" |
| Transaction types | Hardcoded + per-tenant custom list in `TenantSettings` | Hardcoded enum only (for now) | Custom transaction types deferred — see §17 |
| Routing | Ad-hoc `(auth)`, `(dashboard)`, `(super-admin)` groups | **Path-based tenancy + role groups** — `/[tenantSlug]/admin/*`, `/[tenantSlug]/member/*`, `/super-admin/*` (see §11) | The URL is the authoritative tenant context (not a session flag). Multiple tenants open in separate tabs just work; tenant switching is navigation, not a mutation |

**v1 concepts that are gone:**
- `ChurchEvent`, `/events/*` routes, event types enum, event indexes.
- Firestore security rules (we don't use Firestore).
- `types/models.ts`, `lib/repositories/interfaces/*`,
  `lib/repositories/firestore/*`, `store/api/*.api.ts` — not in the built
  app.
- "Tenant-scoped collections" tree — replaced by Postgres relational
  schema with `tenantId` on every tenant-owned table.

---

## 3. Tech Stack

### 3.1 Backend (`church-app-backend/`)

| Layer | Technology | Notes |
|---|---|---|
| Framework | **NestJS 10** | Monolithic, layered (Griffin 5-tier) |
| Language | TypeScript (strict) | |
| ORM | **Prisma 7** | Multi-file `prisma/schema/*.prisma` |
| Database | **PostgreSQL** | `@prisma/adapter-pg` |
| Auth verification | `firebase-admin` | Verifies Firebase ID tokens and session cookies |
| API contract | OpenAPI via `@nestjs/swagger` | Frontend generates types from `/api-docs-json` |
| Email | Gmail SMTP (dev) / Resend (prod) | Provider abstraction behind `IEmailProvider`; Gmail configured via Nodemailer in dev |

### 3.2 Frontend (`church-app/`)

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router) | RSC by default; Next 16 has breaking differences — see `AGENTS.md` |
| React | **19** | |
| Language | **TypeScript 6** (strict) | |
| Server state | **TanStack Query v5** | |
| HTTP client | **openapi-fetch** + **openapi-typescript** | Types generated from backend's OpenAPI spec |
| Client state | **Zustand** | Modal store only |
| Auth | Firebase client SDK + Firebase Admin (for session cookie minting in Next route) | |
| Styling | **Tailwind 4** + inline styles using `SANCTUARY` design tokens | |

---

## 4. Repository Layout

Two sibling repos:

```
workspace/projects/
├── church-app/              # Next.js frontend
└── church-app-backend/      # NestJS backend
```

### 4.1 Backend (`church-app-backend/`)

```
src/
├── main.ts
├── main.module.ts                  # Registers every feature + core module
├── modules/
│   ├── features/                   # HTTP boundary — controllers + DTOs
│   │   ├── auth-feature/
│   │   ├── tenant-feature/
│   │   ├── invitation-feature/
│   │   ├── campaign-feature/       # Campaigns + CampaignItems (nested routes)
│   │   ├── pledge-feature/
│   │   └── transaction-feature/    # Owns attribution validation (pledge ↔ campaign ↔ item)
│   ├── core/                       # Domain services — no cross-core imports
│   │   ├── user/
│   │   ├── tenant/
│   │   ├── member/
│   │   ├── invitation/
│   │   ├── campaign/
│   │   ├── campaign-item/
│   │   ├── pledge/
│   │   └── transaction/
│   └── infrastructure/
│       ├── database/               # PrismaService
│       └── firebase/               # Firebase Admin initialisation
├── shared/
│   ├── dto/                        # Base DTOs shared across modules
│   ├── dto-examples.ts
│   └── guards/                     # FirebaseAuthGuard, RoleGuard, TenantGuard
prisma/
├── schema/
│   ├── tenant.prisma
│   ├── user.prisma
│   ├── member.prisma
│   ├── invitation.prisma
│   ├── campaign.prisma             # Campaign + CampaignItem
│   ├── pledge.prisma
│   └── transaction.prisma
└── migrations/
```

### 4.2 Frontend (`church-app/`)

```
src/
├── app/                             # Next 16 App Router (RSC-first)
│   ├── layout.tsx                   # AuthProvider → QueryProvider → ModalHost
│   ├── (auth)/                      # Public — login, invite, select-church
│   ├── (member)/                    # Member-only routes (proposed §11)
│   ├── (admin)/                     # Admin-only routes (proposed §11)
│   ├── (super-admin)/               # Super-admin routes (proposed §11)
│   └── api/auth/session/            # Next route that mints/clears session cookie
│
├── proxy.ts                         # Next middleware — session cookie gate
│
├── components/
│   ├── primitives/                  # Button, Input, Card, Table, …
│   ├── layout/                      # AppShell, nav
│   ├── pages/                       # Page-level composites
│   └── modals/                      # BaseModal + one folder per modal
│
└── lib/
    ├── api/                         # openapi-fetch client + one folder per entity
    │   ├── client.ts, hooks.ts, schema.d.ts, providers.tsx
    │   ├── auth/, tenants/, invitations/
    │   ├── campaigns/, pledges/, transactions/
    │   └── health/
    ├── modals/                      # registry + Zustand store + ModalHost
    ├── auth/                        # AuthProvider, actions, server.ts (getSessionUser)
    ├── firebase/                    # client + admin SDK factories
    └── design/tokens.ts             # SANCTUARY tokens
```

See `church-app/CLAUDE.md` and `church-app-backend/CLAUDE.md` for the
full conventions.

---

## 5. Multi-Tenancy Model

### 5.1 Approach: Single Database, Tenant-Scoped Rows

Every tenant-owned table carries a `tenantId` column. Every query in
Core services is scoped by `tenantId`. Feature-layer controllers accept
`tenantId` in the URL (`/api/v1/tenants/:tenantId/...`) and the
`TenantGuard` verifies the caller is a member of that tenant before the
controller body runs.

```
postgres
├── User                    (global — one row per Firebase UID)
├── Tenant                  (one row per church)
├── Member                  (tenantId-scoped, links to User when "linked")
├── Invitation              (tenantId-scoped)
├── Campaign                (tenantId-scoped)
├── CampaignItem            (tenantId + campaignId)
├── Pledge                  (tenantId + campaignId + optional campaignItemId + memberId)
└── Transaction             (tenantId + optional memberId + optional pledgeId/campaignId/campaignItemId)
```

### 5.2 Rationale

- Relational — pledges, items, and transactions need FK-level integrity.
- Aggregations for reports are straightforward SQL.
- One database is enough until we see tenant counts that justify
  horizontal sharding.

### 5.3 Tenant Isolation Rules

- `tenantId` is **never** trusted from the body; it's taken from the
  URL and verified against `request.user.tenantMemberships` by
  `TenantGuard`.
- Every Core repository query includes `where: { tenantId }` — there is
  no unscoped list method.
- A user can belong to multiple tenants via `Member` rows, each linking
  back to the same `User.firebaseUid`.

---

## 6. Authentication & Authorization

### 6.1 Dual-token flow

```
Google SSO (Firebase client SDK)
        │
        ▼
    ID token ──┬──► POST /api/v1/auth/session     (backend upserts User, sets custom claims)
               └──► POST /api/auth/session (Next) (mints HTTP-only session cookie)

Subsequent requests:
    Navigations ─► session cookie  ─► proxy.ts + getSessionUser()   (SSR gate)
    API calls   ─► Bearer ID token ─► FirebaseAuthGuard              (REST auth)
```

### 6.2 Where each piece lives

- **Client sign-in:** `signInWithGoogle()` in
  `src/lib/auth/actions.ts` — runs the Firebase popup, calls backend
  `/auth/session`, then Next `/api/auth/session` to set the cookie.
- **Backend session exchange:** `AuthFeatureController.createSession()`
  verifies the ID token with Firebase Admin, upserts the `User` row,
  and sets custom claims.
- **Next session cookie:** `app/api/auth/session/route.ts` (POST/DELETE)
  creates/clears a Firebase session cookie — the cookie Next uses for
  SSR auth.
- **RSC reads:** `getSessionUser()` in `src/lib/auth/server.ts` verifies
  the cookie with Admin SDK and returns `{ uid, role, tenantMemberships,
  ... }`.
- **Tenant switch:** `switchTenant()` in `auth/actions.ts` calls
  `POST /api/v1/auth/switch-tenant`, then **must** call
  `refreshSession()` so the new custom claims are minted into a fresh
  cookie.

### 6.3 Custom claims

```ts
interface CustomClaims {
  role: "super_admin" | "user";              // Platform-level role only
  tenantMemberships: Record<string, "admin" | "user">; // keyed by tenant SLUG
}
```

Two things to notice:

1. **No `activeTenantId`.** Active tenant lives in the URL
   (`/[tenantSlug]/...`), not in a session flag. Switching tenants is
   navigation; it does not mutate the session.
2. **`role` is platform-level.** `super_admin` gates `/super-admin/*`.
   Everyone else has `user` (this is the signed-in default). The
   admin-vs-member distinction for a specific church is looked up in
   `tenantMemberships[tenantSlug]`, not in this top-level `role`.

Claims are set by the backend when a user signs in and when their
tenant memberships change (invite accepted, role updated, tenant
removed). Never write claims from the frontend.

---

## 7. Roles & Permissions

### 7.1 Roles

| Role | Scope | Description |
|---|---|---|
| **Super Admin** | Global | Platform owner. Creates tenants, invites the first admin of each. |
| **Admin** | Per-tenant | Church administrator. Full CRUD on members, campaigns, pledges, transactions within their tenant. |
| **User (Member)** | Per-tenant | Church member. Reads their own transactions, their own pledges, and the church's campaigns. |

### 7.2 Permissions Matrix

| Action | Super Admin | Admin | User |
|---|---|---|---|
| Create tenant | ✅ | ❌ | ❌ |
| Invite first admin of tenant | ✅ | ❌ | ❌ |
| List all tenants | ✅ | ❌ | ❌ |
| Create temp member | ❌ | ✅ | ❌ |
| Invite member to link account | ❌ | ✅ | ❌ |
| Manage members | ❌ | ✅ | ❌ |
| Create/update/delete campaign | ❌ | ✅ | ❌ |
| Create/update/delete campaign item | ❌ | ✅ | ❌ |
| List campaigns | ❌ | ✅ | ✅ |
| Create pledge (on own behalf) | ❌ | ✅ | ✅ |
| Create pledge on behalf of member | ❌ | ✅ | ❌ |
| View all pledges in tenant | ❌ | ✅ | ❌ |
| View own pledges | ❌ | ✅ | ✅ |
| Record transaction | ❌ | ✅ | ❌ |
| Edit/delete transaction | ❌ | ✅ | ❌ |
| View all transactions | ❌ | ✅ | ❌ |
| View own transactions | ❌ | ❌ | ✅ |
| View tenant dashboard | ❌ | ✅ | ❌ |
| Manage tenant settings | ❌ | ✅ | ❌ |

---

## 8. Data Models

Canonical shapes live in `church-app-backend/prisma/schema/*.prisma`
and their generated DTOs in `church-app-backend/src/shared/dto/*.dto.ts`.
The TypeScript shapes below are a summary, not the source of truth.

### 8.1 Global

#### `User`
One row per Firebase UID — cross-tenant identity.

```ts
interface User {
  firebaseUid: string;      // PK
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

Super-admin status is a **custom claim**, not a column.

### 8.2 Tenant-scoped

#### `Tenant`
```ts
interface Tenant {
  id: string;              // UUID PK (used internally + in Prisma relations)
  slug: string;            // UNIQUE, URL-safe, lowercase-kebab (e.g. "bbbc", "first-baptist")
                           // Used in URLs: /[slug]/admin/*, /[slug]/member/*
                           // Used in claims: tenantMemberships keyed by slug
  name: string;            // Display name
  currency: string;        // ISO currency code; inherited by campaigns + transactions
  timezone: string;        // IANA zone
  address: string | null;
  phone: string | null;
  email: string | null;
  logoURL: string | null;
  fiscalYearStart: number; // 1–12
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string;       // super-admin firebaseUid
}
```

**Slug rules**
- Immutable by default; renames should be rare and require super-admin.
- If a slug is changed, retain the old one as a redirect alias for at
  least 30 days so existing bookmarks/emails don't 404.
- Slugs are assigned at tenant creation; super-admin can suggest one
  from the name (`"First Baptist Church" → "first-baptist"`).

#### `Member`
```ts
interface Member {
  id: string;
  tenantId: string;
  linkedUserId: string | null;   // firebaseUid, null = temp member
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt, updatedAt, deletedAt, createdBy
}
```

#### `Invitation`
```ts
interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: "admin" | "user";
  memberId: string | null;       // when inviting a specific temp member to link
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  token: string;                 // UUID v4, unique
  invitedBy: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
}
```

#### `Campaign`
```ts
enum CampaignStatus { DRAFT, ACTIVE, COMPLETED, CANCELLED }

interface Campaign {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  currency: string;              // immutable after creation (see §10.4)
  deadline: Date | null;         // null = open-ended
  status: CampaignStatus;
  createdAt, updatedAt, deletedAt, createdBy
  items: CampaignItem[];
}
```

The campaign **goal is the sum of its items' `targetAmount`** — there
is no `goalAmount` column.

#### `CampaignItem`
```ts
interface CampaignItem {
  id: string;
  tenantId: string;
  campaignId: string;
  title: string;                 // e.g. "Roofing"
  description: string | null;
  targetAmount: Decimal(14, 2);
  deadline: Date | null;         // null = inherit campaign.deadline
  sortOrder: number;
  createdAt, updatedAt, deletedAt
}
```

#### `Pledge`
```ts
enum PledgeStatus { ACTIVE, FULFILLED, CANCELLED }

interface Pledge {
  id: string;
  tenantId: string;
  campaignId: string;
  campaignItemId: string | null; // null = pledge against campaign generally
  memberId: string;              // pledger
  pledgedAmount: Decimal(14, 2);
  status: PledgeStatus;
  note: string | null;
  createdAt, updatedAt, deletedAt, createdBy
}
```

Immutable fields on update: `campaignId`, `campaignItemId`, `memberId`.
Change those? Delete and recreate.

#### `Transaction`
```ts
interface Transaction {
  id: string;
  tenantId: string;
  memberId: string | null;           // null = anonymous giving
  type: TransactionType;
  customType: string | null;
  amount: Decimal(14, 2);            // always positive
  currency: string;                  // inherited from tenant; stored for integrity
  date: Date;
  note: string | null;
  paymentMethod: "CASH" | "CHECK" | "BANK_TRANSFER" | "ONLINE" | "MOBILE_MONEY" | "OTHER";
  referenceNumber: string | null;

  // Attribution — resolved + validated by TransactionFeatureService:
  pledgeId: string | null;
  campaignId: string | null;
  campaignItemId: string | null;

  createdAt, updatedAt, deletedAt, createdBy
}
```

### 8.3 Attribution rules (enforced by `TransactionFeatureService.resolveAttribution`)

1. If **`pledgeId`** is set, `campaignId` and `campaignItemId` are
   **inherited** from the pledge. If the caller also sent them, they
   must match the pledge or the request is rejected.
2. If **`campaignItemId`** is set without a pledge, **`campaignId` is
   required** and the item must belong to the referenced campaign.
3. If only **`campaignId`** is set, it's validated to exist; this is
   an unpledged gift to the campaign as a whole.
4. All three may be null → a plain tithe / offering / other.

### 8.4 Transaction types

```ts
type TransactionType =
  | "TITHE"
  | "OFFERING"
  | "MISSION_GIVING"
  | "FIRST_FRUIT"
  | "COMMITMENT"        // historical label — prefer attributing via pledgeId
  | "DONATION"
  | "OTHER";
```

Custom per-tenant types (`TenantSettings.transactionTypes` in v1) are
**not implemented yet** — tracked in §17.

---

## 9. User Flows

### 9.1 Super admin creates a tenant + first admin

```
1. Super admin signs in (Google SSO)
2. /super-admin/tenants → "New tenant"
3. POST /api/v1/tenants  → Tenant created
4. Super admin invites the first admin → POST /api/v1/invitations
5. Backend sends email (Resend) with invite link + token
6. Admin accepts → signs in with Google → backend links User
   to tenant with role=admin, sets custom claims
7. Admin calls refreshSession() → new session cookie with updated claims
```

### 9.2 Admin records a transaction against a pledge

```
1. Admin → /admin/transactions/new
2. Picks member → pledge dropdown filters to that member's ACTIVE pledges
3. Enters amount / date / payment method
4. POST /api/v1/tenants/:tenantId/transactions
   with { memberId, pledgeId, amount, ... }
5. Backend resolveAttribution() fills campaignId + campaignItemId from the pledge
6. Transaction row created; member-scoped queries reflect it immediately (invalidatePledges + invalidateTransactions)
```

### 9.3 Member pledges to a campaign item

```
1. Member → /member/campaigns → picks "Building fund"
2. Sees items: Roofing (₦100k), Gates (₦50k), Pews (₦300k)
3. Clicks "Pledge to Roofing" → enters ₦50k
4. POST /api/v1/tenants/:tenantId/pledges
   with { campaignId, campaignItemId, memberId: self, pledgedAmount: 50000 }
5. Later, member pays: admin records a transaction with that pledgeId
```

### 9.4 Admin invites a temp member to link their account

Unchanged from v1 §8.3.

### 9.5 Member with multiple churches

```
1. Sign-in completes → backend returns tenantMemberships { slug: role }
2. If 0 memberships → /select-church shows "no memberships yet" (waiting on an invite)
3. If 1 membership  → redirect to /[slug]/admin/dashboard or /[slug]/member/dashboard
4. If >1            → /select-church lists them; user picks → navigate to /[slug]/...
```

No `switch-tenant` API call is needed — navigating to a different
`/[slug]/...` URL *is* the switch. Each tab carries its own tenant
context.

---

## 10. API Layer

### 10.1 Backend base URL

`http://localhost:8000` in dev. All paths carry the prefix
`/api/v1/…` and are defined by the NestJS controllers. The OpenAPI
document is served at `/api-docs-json`.

### 10.2 Frontend consumption

The frontend generates TypeScript types with
`openapi-typescript` (`npm run api:types`) and wraps every endpoint in a
typed hook under `src/lib/api/<entity>/hooks.ts`.

- `useApiQuery` / `useApiMutation` are generic helpers keyed off
  `[path, init]`.
- Each entity exports `invalidate<Entity>(qc, scope?)`.
- See [church-app/CLAUDE.md §5](CLAUDE.md#5-api-layer--one-folder-per-entity).

### 10.3 Endpoints (current)

| Method | Path | Role |
|---|---|---|
| **Auth** | | |
| `POST` | `/api/v1/auth/session` | public |
| `GET` | `/api/v1/auth/me` | any signed-in |
| ~~`POST`~~ | ~~`/api/v1/auth/switch-tenant`~~ | **removed** — navigation is the switch |
| **Platform admin** | | |
| `GET` | `/api/v1/admin/stats` | super_admin |
| `GET` | `/api/v1/admin/users` | super_admin |
| `PATCH` | `/api/v1/admin/users/:id` | super_admin |
| **Tenants** | | |
| `GET` | `/api/v1/tenants` | super_admin — response includes `adminCount`, `memberCount`, `adminsPreview`, `giftsMtd` aggregates |
| `POST` | `/api/v1/tenants` | super_admin |
| `GET` | `/api/v1/tenants/:id` | super_admin / member-of-tenant |
| `PATCH` | `/api/v1/tenants/:id` | super_admin / admin-of-tenant |
| `DELETE` | `/api/v1/tenants/:id` | super_admin |
| `PATCH` | `/api/v1/tenants/:id/restore` | super_admin |
| **Members** | | |
| `GET` | `/api/v1/tenants/:tenantId/members` | admin |
| `POST` | `/api/v1/tenants/:tenantId/members` | admin |
| `GET` | `/api/v1/tenants/:tenantId/members/me` | any member |
| `GET` | `/api/v1/tenants/:tenantId/members/:id` | admin |
| `PATCH` | `/api/v1/tenants/:tenantId/members/:id` | admin |
| `DELETE` | `/api/v1/tenants/:tenantId/members/:id` | admin |
| **Invitations** | | |
| `POST` | `/api/v1/tenants/:tenantId/invitations` | admin / super_admin |
| `GET` | `/api/v1/tenants/:tenantId/invitations` | admin |
| `GET` | `/api/v1/invitations/lookup?token=` | public — returns `tenantName`, `tenantSlug`, `inviterDisplayName` |
| `POST` | `/api/v1/invitations/accept` | any signed-in |
| **Campaigns** | | |
| `GET` | `/api/v1/tenants/:tenantId/campaigns` | tenant member |
| `POST` | `/api/v1/tenants/:tenantId/campaigns` | admin |
| `GET` | `/api/v1/tenants/:tenantId/campaigns/:id` | tenant member |
| `PATCH` | `/api/v1/tenants/:tenantId/campaigns/:id` | admin |
| `DELETE` | `/api/v1/tenants/:tenantId/campaigns/:id` | admin |
| `GET` | `/api/v1/tenants/:tenantId/campaigns/:id/progress` | tenant member |
| `POST` | `/api/v1/tenants/:tenantId/campaigns/:id/items` | admin |
| `PATCH` | `/api/v1/tenants/:tenantId/campaigns/:id/items/:itemId` | admin |
| `DELETE` | `/api/v1/tenants/:tenantId/campaigns/:id/items/:itemId` | admin |
| **Pledges** | | |
| `GET` | `/api/v1/tenants/:tenantId/pledges` | admin (all) / user (own) |
| `POST` | `/api/v1/tenants/:tenantId/pledges` | admin / user (for self) |
| `GET` | `/api/v1/tenants/:tenantId/pledges/:id` | admin / pledge owner |
| `PATCH` | `/api/v1/tenants/:tenantId/pledges/:id` | admin / pledge owner |
| `DELETE` | `/api/v1/tenants/:tenantId/pledges/:id` | admin |
| **Transactions** | | |
| `GET` | `/api/v1/tenants/:tenantId/transactions` | admin |
| `POST` | `/api/v1/tenants/:tenantId/transactions` | admin |
| `GET` | `/api/v1/tenants/:tenantId/transactions/:id` | admin / transaction owner |
| `PATCH` | `/api/v1/tenants/:tenantId/transactions/:id` | admin |
| `DELETE` | `/api/v1/tenants/:tenantId/transactions/:id` | admin |
| `GET` | `/api/v1/tenants/:tenantId/transactions/summary` | admin |

### 10.4 Invariants on mutations

- `Tenant.currency` is **immutable** once set (transactions and
  campaigns depend on it).
- `Tenant.slug` is **immutable by default**; super-admin can rename
  with a 30-day redirect alias (see §8.2).
- `Campaign.currency` is **immutable** after creation (inherits tenant).
- `Pledge.campaignId / campaignItemId / memberId` are **immutable**.
- `Transaction.tenantId` is **immutable**; attribution fields are
  revalidated on PATCH.

### 10.5 `:tenantId` resolution

Every tenant-scoped path looks like `/api/v1/tenants/:tenantId/...`. The
backend accepts either the UUID or the slug in this segment:

```ts
// TenantGuard
const tenant = await prisma.tenant.findFirst({
  where: { OR: [{ id: param }, { slug: param }], deletedAt: null },
});
```

The frontend uses the slug (read from the URL), so user-facing paths
and API calls stay readable end-to-end. Internal Prisma relations
continue to use the UUID PK.

---

## 11. Frontend Routing & Role-Scoped Layouts

> **Status: implemented.** The path-based, role-scoped layout structure
> described below is live. All three layout gates (`[tenantSlug]`,
> `(admin)`, `(super-admin)`) are wired. Super-admin UI is fully built.
> Admin and member feature pages are scaffolded and pending real UI.

### 11.1 URL shape

Three URL shapes exist. The tenant slug is in the path for every
tenant-scoped page; super-admin is platform-wide and has no slug.

| Shape | Who | Examples |
|---|---|---|
| `/login`, `/invite/[token]`, `/select-church` | public or signed-in pre-tenant | — |
| `/[tenantSlug]/admin/*` | admin of that tenant | `/bbbc/admin/dashboard`, `/bbbc/admin/campaigns/new` |
| `/[tenantSlug]/member/*` | any member (admin OR user) of that tenant | `/bbbc/member/dashboard`, `/bbbc/member/campaigns` |
| `/super-admin/*` | platform `role === "super_admin"` | `/super-admin/tenants`, `/super-admin/tenants/[id]` |

**Why no slug on `/super-admin/*`:** these routes manage *all* tenants
(the platform itself). They are not scoped to any one church, so a
tenant slug would be a lie. A super-admin who is also a member/admin
of a specific church uses `/[slug]/admin/*` or `/[slug]/member/*` for
that work — the same URL any other admin/member would use.

### 11.2 Folder layout

```
src/app/
├── layout.tsx                             # AuthProvider → QueryProvider → ModalHost
├── page.tsx                               # / — landing redirect (see 11.5)
├── proxy.ts (middleware)                  # cookie presence → /login
│
├── (auth)/                                # Public / pre-tenant
│   ├── login/
│   ├── invite/[token]/
│   └── select-church/
│
├── [tenantSlug]/
│   ├── layout.tsx                         # RSC: assert membership of tenantSlug
│   ├── (member)/
│   │   ├── layout.tsx                     # RSC: any membership passes (admin + user)
│   │   └── member/
│   │       ├── dashboard/
│   │       ├── campaigns/                 # browse + pledge flow
│   │       ├── my-pledges/
│   │       ├── my-transactions/
│   │       └── profile/
│   └── (admin)/
│       ├── layout.tsx                     # RSC: require tenantMemberships[tenantSlug] === "admin"
│       └── admin/
│           ├── dashboard/
│           ├── members/                   # + new, [id]
│           ├── campaigns/                 # + new, [id], [id]/items
│           ├── pledges/
│           ├── transactions/              # + new, [id]
│           ├── invitations/
│           ├── reports/
│           └── settings/
│
└── (super-admin)/
    ├── layout.tsx                         # RSC: require role === "super_admin"
    └── super-admin/
        ├── tenants/                       # + new, [id], [id]/admins
        └── admins/
```

Route groups starting with a folder name (no parens) would surface in
the URL. We use named groups (with parens) wrapping explicit segments
(`member/`, `admin/`, `super-admin/`) inside, so URLs stay readable
and the group layer only carries auth gates.

### 11.3 Layout-level gating pattern

Three nested gates, each doing exactly one check:

```tsx
// src/app/[tenantSlug]/layout.tsx — membership-any gate
export default async function TenantLayout({ params, children }) {
  const { tenantSlug } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.tenantMemberships[tenantSlug]) {
    // Signed in but not a member of this tenant — send to their own home.
    redirect("/");
  }
  return children;
}

// src/app/[tenantSlug]/(admin)/layout.tsx — admin role gate
export default async function AdminLayout({ params, children }) {
  const { tenantSlug } = await params;
  const user = await getSessionUser();
  if (user!.tenantMemberships[tenantSlug] !== "admin") {
    redirect(`/${tenantSlug}/member/dashboard`);
  }
  return <AppShell tenantSlug={tenantSlug} perspective="admin">{children}</AppShell>;
}

// src/app/(super-admin)/layout.tsx — platform-role gate
export default async function SuperAdminLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/");
  return <AppShell perspective="super-admin">{children}</AppShell>;
}
```

The middleware stays lean (cookie check + `/login`); role enforcement
is layout-level so page components can trust `getSessionUser()` to
return a valid shape for their URL.

### 11.4 Tenant switching

There is **no `switch-tenant` API call**. Switching is navigation:

- The tenant switcher in the top bar is a menu of `<Link>`s.
- Clicking one navigates to `/[otherSlug]/admin/dashboard` or
  `/[otherSlug]/member/dashboard` (the switcher knows the role for
  each slug from `tenantMemberships`).
- Each browser tab carries its own tenant context via its URL.
- A super-admin who also has memberships sees the same menu with an
  extra "Platform ops" entry that links to `/super-admin/tenants`.

No refresh, no claim mutation, no second round-trip.

### 11.5 Landing route (`/`)

```
/ →
  if no session                     → /login
  else if role === "super_admin"    → /super-admin/tenants
  else switch on memberships:
    0 memberships                   → /select-church  (waiting-for-invite state)
    1 membership {slug, role}       → /[slug]/(admin|member)/dashboard based on role
    >1 memberships                  → /select-church  (list to pick from)
```

### 11.6 Admin acting as member

An admin who wants to pledge on their own behalf navigates to
`/[slug]/member/campaigns` — the `(member)` gate admits them. No mode
toggle, no rewriting. A subtle "View as member" link in the user menu
on admin pages is the discovery affordance; otherwise the URL space
*is* the context.

---

## 12. Screens & Pages

Anything marked **⏳** is scaffolded but not yet fully implemented — see §17.2 for the full outstanding list.

### 12.1 Auth

| Page | Route | Status |
|---|---|---|
| Login | `/login` | ✅ |
| Accept invitation | `/invite/[token]` | ✅ fully implemented |
| Select church | `/select-church` | ⏳ scaffold only |
| Logout | `/logout` | ✅ |

### 12.2 Member

| Page | Route | Status |
|---|---|---|
| Dashboard | `/[slug]/member/dashboard` | ⏳ |
| Browse campaigns | `/[slug]/member/campaigns` | ⏳ |
| Campaign detail + pledge | `/[slug]/member/campaigns/[id]` | ⏳ |
| My pledges | `/[slug]/member/my-pledges` | ⏳ |
| My transactions | `/[slug]/member/my-transactions` | ⏳ |
| Profile | `/[slug]/member/profile` | ⏳ scaffold |

### 12.3 Admin

| Page | Route | Status |
|---|---|---|
| Admin dashboard | `/[slug]/admin/dashboard` | ⏳ scaffold |
| Members list | `/[slug]/admin/members` | ⏳ scaffold |
| Member detail | `/[slug]/admin/members/[id]` | ⏳ |
| Add member | `/[slug]/admin/members/new` | ⏳ scaffold |
| Campaigns list | `/[slug]/admin/campaigns` | ⏳ |
| Campaign create / edit | `/[slug]/admin/campaigns/new`, `/[slug]/admin/campaigns/[id]` | ⏳ |
| Campaign items editor | `/[slug]/admin/campaigns/[id]/items` | ⏳ |
| Pledges | `/[slug]/admin/pledges` | ⏳ |
| Transactions list | `/[slug]/admin/transactions` | ⏳ scaffold |
| Record transaction | `/[slug]/admin/transactions/new` | ⏳ scaffold |
| Transaction detail | `/[slug]/admin/transactions/[id]` | ⏳ |
| Invitations | `/[slug]/admin/invitations` | ⏳ scaffold |
| Settings | `/[slug]/admin/settings` | ⏳ scaffold |
| Reports | `/[slug]/admin/reports` | ⏳ scaffold |

### 12.4 Super Admin

| Page | Route | Status |
|---|---|---|
| Tenants list | `/super-admin/tenants` | ✅ stat cards + table with aggregates, row menu (edit, rename slug, delete/restore) |
| Create tenant | `/super-admin/tenants/new` | ✅ 3-step wizard: details → invites → success |
| Tenant detail | `/super-admin/tenants/[id]` | ✅ about card, stat cards, admins preview, action menu |
| Per-tenant admins | `/super-admin/tenants/[id]/admins` | ✅ table with promote/demote/remove actions |
| Unified admins | `/super-admin/admins` | ✅ search/filter, super-admin toggle |

> Super-admin URLs use the tenant **slug** (same as all other routes). The `TenantGuard` accepts slug or UUID interchangeably.

### 12.5 Admin dashboard widgets (unchanged from v1)

1. Total income this month (+Δ vs last month)
2. Income breakdown by transaction type (donut)
3. Monthly trend (12-month bar/line)
4. Recent transactions (5–10)
5. Active campaigns + progress
6. Member stats (active, new this month)

(v1's "upcoming events" widget is replaced by "active campaigns".)

---

## 13. Email Service

Unchanged from v1: **Resend** with a `IEmailProvider` interface.
Templates:

| Email | Trigger | Recipient |
|---|---|---|
| Admin invitation | super-admin invites | invitee |
| Member invitation | admin invites | invitee |
| Welcome | user accepts invite | new user |
| Transaction receipt _(future)_ | transaction recorded | member if linked + opted in |

Status: **not yet implemented** — see §17.

---

## 14. Security

### 14.1 Backend guards

- `FirebaseAuthGuard` — verifies Firebase ID token; attaches
  `request.user` with `uid`, `email`, `claims.role`, and
  `claims.tenantMemberships`.
- `TenantGuard` — asserts `request.params.tenantId` is a key in
  `request.user.tenantMemberships`. Applied on every nested tenant
  route.
- `RoleGuard('admin' | 'super_admin' | 'user')` — decorator-driven role
  assertion.
- Input validation: class-validator + DTOs. Invariant rules
  (attribution, immutable fields) are enforced in Feature services.

### 14.2 Frontend safety net

- `proxy.ts` middleware — cookie-present or redirect to `/login`.
- Role-group layouts — RSC-level role checks via `getSessionUser()` (§11.2).
- Never pass `tenantId` from React state; always read it from the
  session claims after the `/select-church` step.

### 14.3 Data privacy

- Members only see their own transactions (Feature-level filter on
  `memberId === request.user.member.id`).
- Admins see everything within their tenant.
- Invitation tokens are UUID v4, expire after 7 days.

**Not used:** Firestore security rules (v1 appendix) — we don't use
Firestore.

---

## 15. Error Handling & Validation

- Backend: class-validator DTOs, `HttpExceptionFilter` normalizes
  responses.
- Frontend: `openapi-fetch` propagates typed error bodies; TanStack
  Query surfaces them via `query.error` / `mutation.error`.
- Error code taxonomy (unchanged from v1): `AUTH_REQUIRED`,
  `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `DUPLICATE_ENTRY`,
  `EXPIRED_INVITATION`, `RATE_LIMITED`, `INTERNAL_ERROR`.

---

## 16. Deployment & Environment

### 16.1 Environment variables

**Backend (`church-app-backend/.env`):**
```env
DATABASE_URL=postgresql://...
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
RESEND_API_KEY=
APP_URL=http://localhost:3000      # for invitation links
```

**Frontend (`church-app/.env.local`):**
```env
# Firebase client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (for Next session-cookie route)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 16.2 Dev

```bash
# Backend
cd church-app-backend
npm install
npx prisma migrate dev
npm run start:dev              # nest on :8000

# Frontend
cd church-app
npm install
npm run api:types              # needs backend running
npm run dev                    # next on :3000
```

### 16.3 Deployment targets (TBD)

- **Backend** — Fly.io or Render (Node + Postgres), or containerize
  and deploy to any IaaS.
- **Frontend** — Vercel.

---

## 17. Implementation Status

### 17.1 Done

**Backend** (50+ endpoints live)
- [x] NestJS scaffolding + Griffin 5-tier layout
- [x] Prisma 7 multi-file schema + Postgres migration
      (tenant slug + audit log added in 2nd migration)
- [x] Core modules: user, tenant, member, invitation, campaign,
      campaign-item, pledge, transaction, **audit**
- [x] Feature modules: auth, tenant, **member**, invitation, campaign,
      pledge, transaction, **admin**
- [x] Firebase Admin integration + `FirebaseAuthGuard`
- [x] `Tenant.slug` column (URL-safe identifier)
- [x] `TenantGuard` accepts slug OR UUID in `:tenantId` (§10.5)
- [x] `@TenantRoles('ADMIN' | 'USER')` decorator for per-tenant role gating
- [x] `AuthUser.tenantMemberships: Record<slug, {memberId, role}>`
      custom claim — replaces the per-session `activeTenantId`
- [x] `UserClaimsService` in infra — rebuilds claims on sign-in,
      invite-accept, role change, super-admin toggle
- [x] `POST /auth/switch-tenant` **removed** — navigation replaces it
- [x] Transaction attribution validation
      (`resolveAttribution(pledgeId, campaignId, campaignItemId)`)
- [x] `GET /tenants/:id/transactions/summary` (admin dashboard aggregates)
- [x] `GET /tenants/:id/campaigns/:id/progress` (per-item totals)
- [x] `GET /tenants/:id/members/me` (current user's member row)
- [x] Soft-delete restore on tenants + campaigns
- [x] Email provider abstraction (`IEmailProvider`) with Gmail SMTP
      (dev, Nodemailer) + console fallback; invitations send on issue
- [x] Invitation rate-limit (20/hour per tenant) + duplicate-pending
      dedup + public `GET /invitations/lookup` enriched with
      `tenantName`, `tenantSlug`, `inviterDisplayName`
- [x] Audit log — `AuditEvent` table + `AuditService` writes on
      tenant/member/campaign/pledge/transaction/invitation mutations
- [x] Seed script (`npm run prisma:seed`) — super-admin, tenant,
      admin + member users, campaign with items, pledges, transactions
- [x] Swagger / OpenAPI document served at `/api-docs-json`
- [x] **AdminFeatureModule** — `GET /admin/stats` (platform KPIs),
      `GET /admin/users` (cross-tenant listing with filters),
      `PATCH /admin/users/:id` (isSuperAdmin toggle + claims refresh
      + audit log)
- [x] `GET /tenants` enriched with per-row aggregates: `adminCount`,
      `memberCount`, `adminsPreview` (top 3 avatars), `giftsMtd`
      (`count` + `total`)
- [x] `User.isSuperAdmin` column (boolean, default false)

**Frontend** (full super-admin surface + auth flows)
- [x] Next 16 app scaffolded, TanStack Query + openapi-fetch wired
- [x] Firebase client + Admin SDK; dual-path auth in
      `lib/auth/actions.ts`
- [x] Entity-folder API layer with invalidation helpers
- [x] `unwrapMiddleware` in `lib/api/client.ts` — strips the backend's
      `{ success: true, data }` envelope before TanStack Query sees the
      response, fixing silent empty states across all hooks
- [x] **`BaseModal` refactored** — structured header (overline + title
      + round close button) + optional footer (primary / secondary
      action buttons + hint text); sizes sm / md / lg / xl; all modals
      inherit the shell
- [x] **7 new modals**: `rename-tenant-slug`, `confirm-delete-tenant`,
      `confirm-restore-tenant`, `edit-tenant`, `invite-tenant-admin`,
      `invite-admin-global`, `confirm-toggle-super-admin`
- [x] `src/lib/api/admin/` hook folder — `useAdminStats`,
      `useAdminUsers`, `useToggleSuperAdmin`
- [x] `src/lib/api/members/` hook folder — `useMembers`,
      `useUpdateMember`, `useDeleteMember`
- [x] `src/lib/design/logo-gradient.ts` — deterministic gradient pair
      from tenant slug hash + `tenantInitials()` helper
- [x] `proxy.ts` cookie gate — `/logout` added to `PUBLIC_PATHS`
- [x] **Path-based routes per §11**:
      `/[tenantSlug]/(admin)/admin/*`,
      `/[tenantSlug]/(member)/member/*`,
      `/(super-admin)/super-admin/*`
- [x] Three nested layout gates: `[tenantSlug]/layout.tsx` (membership),
      `(admin)/layout.tsx` (admin role), `(super-admin)/layout.tsx`
      (platform role)
- [x] `/` landing redirect implements §11.5 rules
- [x] `/select-church` uses real session claims
- [x] `AppShell` + `Sidebar` with `perspective` + `tenantSlug`; tenant
      switcher is a plain `<Link>` menu; logout button in user card
- [x] "View as member" affordance in admin sidebar
- [x] `/logout` route — calls `signOut()` + redirects to `/login`
- [x] **`/invite/[token]`** fully implemented: lookup call (shows real
      church name + inviter), four states (loading skeleton, invalid
      token, already accepted, valid), Google sign-in branch and
      already-signed-in branch, `refreshSession()` after accept,
      redirect to `/{slug}/admin|member/dashboard` based on role
- [x] **Super-admin pages** — all four fully implemented:
      - `/super-admin/tenants` — stat cards + table with per-tenant
        aggregates, avatar stacks, row actions
      - `/super-admin/tenants/new` — 3-step wizard (details → invites
        → success) with slug suggestion + availability check
      - `/super-admin/tenants/[id]` — tenant detail with about card,
        stat cards, admins preview, edit / rename / delete / restore
        actions
      - `/super-admin/tenants/[id]/admins` — member table with
        promote / demote / remove actions
      - `/super-admin/admins` — unified admin list with search,
        tenant filter, super-admin-only toggle, KPI pills, toggle-
        super-admin action
- [x] `npm run typecheck` + `npm run build` green

### 17.2 Outstanding

**Frontend feature implementations (scaffolds exist — real UIs still to build)**
- [ ] `/select-church` — currently renders session claims as raw JSON;
      needs a proper card-list UI
- [ ] Admin: members CRUD UI + "invite to link account" flow
- [ ] Admin: campaigns CRUD UI + items editor
- [ ] Admin: pledges list / detail UI
- [ ] Admin: transactions CRUD UI (incl. pledge picker when member
      selected) — backend `/transactions/summary` + attribution
      validation are live
- [ ] Admin: reports page (income breakdown, monthly trend)
- [ ] Admin: settings page (tenant profile, `fiscalYearStart`)
- [ ] Member: dashboard, browse campaigns + pledge flow, my-pledges,
      my-transactions, profile editor — backend endpoints all live

**Backend gaps still outstanding**
- [ ] Audit-log read API (`GET /audit`) — table + writes exist; no
      read endpoint yet; `/super-admin/audit` page is a scaffold
- [ ] Per-tenant custom transaction types — deferred, confirm before
      implementing
- [ ] Transaction receipt emails (post-record → member, opt-in)

**Dev ergonomics**
- [x] Seed script — `npm run prisma:seed`
- [ ] E2E happy-path test (Playwright): sign-in → create campaign →
      pledge → record transaction
- [ ] CI: typecheck + build on both repos

---

## 18. Out of Scope

- ❌ Outgoing financial transactions (expenses, payments, salaries)
- ❌ Accounting (balance sheets, P&L)
- ❌ Member communication (SMS, push, newsletters)
- ❌ Attendance / sermon / media management
- ❌ Members submitting payments through the app (not a giving portal)
- ❌ Multiple auth providers (Google SSO only)
- ❌ Mobile app (planned — see §17 if/when)
- ❌ Outgoing currency conversion / multi-currency per transaction
