# `src/app` UI refactor tracker

**Last scanned:** 2026-04-28 · **admin** + **`(member)`** routes are thin **`page.tsx`** shells → **`components/pages/*`** (member dashboard/pledges/campaign list + campaign **`[id]`** scaffold **`MemberCampaignDetailPage`**).

---

## Rules (aligned with [`refactor-plan.md`](../refactor-plan.md))

1. **No `style={{}}`** in JSX — use Tailwind (`className`) or theme CSS. **Exception:** one **dynamic** tenant logo gradient in **`src/components/pages/invite/InviteTokenPage.tsx`** (`style={{ background: linear-gradient(135deg, ...) }}` from **`tenantLogoGradient`**); all other markup is Tailwind.
2. **No `SANCTUARY` / `tokens.ts`** in app code.
3. **`page.tsx` ≤ ~20 lines** — compose from `src/components/pages/…`.
4. **`cn()`** for branching / merged **`className`**.
5. **Buttons:** **`@/components/primitives`**. **Page chrome / shells:** **`@/components/pages/*`** (e.g. **`AuthMarketingShell`**). **Do not** import **`@/components/ui/*`** from **`src/app/**`** — **Exception:** **`layout.tsx`** (**`TooltipProvider`** from **`@/components/ui/tooltip`**).
6. **Hooks** — extract when **> ~3** state variables (manual).
7. **Barrel exports** for each domain under **`src/components/pages/{domain}/index.ts`**.
8. **~150 LOC** — split large components / pages.
9. **Behavior-preserving** refactors only.
10. Prefer **shadcn-style** controls via **primitives**, not raw **`<button>`** / **`<input>`** where swapping is trivial.
11. **Cross-route reuse** — dedupe shells (skeleton, empty states) into shared primitives / page sections.

---

## How to reproduce the scan

```bash
cd projects/church-app  # workspace path

find src/app -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) \
  ! -path '*/api/*' ! -name '*.workspace' | sort

# Rule 1 — inline JSX style= (app routes — expect none)
rg -n 'style=\{\{|style=\{' src/app --glob '*.tsx'

# Optional: invite flow (one allowed dynamic gradient)
rg -n 'style=\{\{' src/components/pages/invite --glob '*.tsx'

# Rule 5 — direct ui imports in app router (allowed: layout tooltip only)
rg -n '@/components/ui/' src/app --glob '*.tsx'

# Imports from primitives barrel
rg -n '@/components/primitives' src/app --glob '*.tsx'
```

Then **`wc -l`** per file if needed:

```bash
find src/app -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) \
  ! -path '*/api/*' ! -name '*.workspace' -print0 | xargs -0 wc -l
```

---

## Master scan (`src/app`, excluding `api/`)

Abbreviations:

- **Sty** — contains **`style={{`** (Rule 1 not met if **yes**).
- **UIΩ** — imports **`@/components/ui/`** (**yes** only for **`layout.tsx`** tooltip = allowed).
- **Prim** — imports **`@/components/primitives`** (**—** often fine for shells that only delegate).

| Path | LOC | Sty | UIΩ | Prim | Notes |
|------|-----|:---:|:---:| :---:|-------|
| `globals.css` | ~147 | — | — | — | Theme — not JSX |
| `layout.tsx` | 43 | no | yes | no | **`TooltipProvider`** from `ui/tooltip`; **`cn`** on `<html>` |
| `page.tsx` | 30 | no | no | no | Redirect logic only — **rule 3** still >20 lines |
| `logout/page.tsx` | 15 | no | no | no | Thin shell |
| `(auth)/layout.tsx` | 9 | no | no | no | Wrapper |
| `(auth)/login/LoginButton.tsx` | 51 | no | no | yes | **`Button`** primitive; error **`text-destructive`** |
| `(auth)/login/page.tsx` | 53 | no | no | yes | **Rule 3** >20 |
| `(auth)/invite/[token]/page.tsx` | **3** | no | no | no | Thin shell → **`InviteTokenPage`** in **`components/pages/invite`** |
| `(auth)/select-church/page.tsx` | **73** | no | **no**² | no | **`AuthMarketingShell`** **`plain-wide`**; **`Badge`**, **`Link`** Tailwind |
| `(super-admin)/layout.tsx` | 36 | no | no | no | Shell |
| `super-admin/.../admins/page.tsx` | 7 | no | no | no | Delegates to **`AdminsPage`** |
| `super-admin/.../audit/profile/tenants/...` (pages) | 5–13 | no | no | no | Thin shells ≤20 LOC |
| `[tenantSlug]/layout.tsx` | 33 | no | no | no | |
| `[tenantSlug]/welcome/page.tsx` | 7 | no | no | no | Thin |
| `(admin)/layout.tsx` | 53 | no | no | no | Admin shell |
| `(admin)/admin/dashboard/page.tsx` | **5** | no | no | no | Shell → **`AdminDashboardPage`** |
| `(admin)/admin/reports/page.tsx` | **5** | no | no | no | Shell → **`AdminReportsPage`** |
| `(admin)/admin/invitations/page.tsx` | **5** | no | no | no | Shell → **`InvitationsPage`** |
| `(admin)/admin/settings/profile` pages | 5–9 | no | no | mixed | Thin **`page.tsx`** |
| `(admin)/admin/campaigns/page.tsx` | **5** | no | no | no | Shell → **`CampaignsListPage`** |
| `(admin)/admin/campaigns/new/page.tsx` | **5** | no | no | no | Shell → **`CampaignNewPage`** |
| `(admin)/admin/campaigns/[id]/page.tsx` | **5** | no | no | no | Shell → **`CampaignDetailPage`** |
| `(admin)/admin/campaigns/[id]/edit/page.tsx` | **5** | no | no | no | Shell → **`CampaignEditPage`** |
| `(admin)/admin/members/page.tsx` | **5** | no | no | no | Shell → **`MembersListPage`** |
| `(admin)/admin/members/new/page.tsx` | 5 | no | no | no | Thin |
| `(admin)/admin/members/[id]/page.tsx` | **5** | no | no | no | Shell → **`MemberDetailPage`** |
| `(admin)/admin/transactions/page.tsx` | **5** | no | no | no | Shell → **`TransactionsListPage`** |
| `(admin)/admin/transactions/new/page.tsx` | 20 | no | no | no | Thin |
| `(admin)/admin/transactions/[id]/page.tsx` | **5** | no | no | no | Shell → **`TransactionDetailPage`** |
| `(admin)/admin/pledges/page.tsx` | **5** | no | no | no | Shell → **`PledgesListPage`** |
| `(member)/layout.tsx` | 45 | no | no | no | |
| `(member)/member/dashboard/page.tsx` | **4** | no | no | no | Shell → **`MemberDashboardPage`** |
| `(member)/member/my-pledges/page.tsx` | **4** | no | no | no | Shell → **`MemberMyPledgesPage`** |
| `(member)/member/campaigns/page.tsx` | **4** | no | no | no | Shell → **`MemberCampaignsPage`** |
| `(member)/member/campaigns/[id]/page.tsx` | **3** | no | no | no | **RSC** shell → **`MemberCampaignDetailPage`** (scaffold) |
| `(member)/member/my-transactions/profile` | **4** | no | no | no | Shell → **`MemberTransactions`** \| **`MemberProfile`** |

² **`select-church`** imports **`@/components/pages/auth`** (**`AuthMarketingShell`**), not **`primitives`** — OK per rule 5.

### Shared auth UI (`src/components/pages/`)

| Module | Notes |
|--------|-------|
| **`auth/AuthMarketingShell.tsx`** | Wordmark header + centered panel (**`card-narrow`** \| **`plain-wide`**). |
| **`invite/InviteTokenPage.tsx`** (~234 LOC) | Invite flow; **rule 8** candidate to split. One **inline** gradient for **tenant palette** (see rule 1 exception). |

**Summary**

| Check | Result |
|--------|--------|
| **`style={{}}`** in `src/app/**/*.tsx` | **none** |
| **`style={{}}`** in `components/pages/invite/InviteTokenPage.tsx` | **one** (dynamic tenant **gradient** swatch; see rule 1) |
| **`@/components/ui/`** in `src/app/**/*.tsx` | **1** file: **`layout.tsx`** (**TooltipProvider** only) |
| **`<button>`** (native) in `src/app` | **none** (use **primitives** **`Button`**) |

---

## Progress (Rule 1 — `src/app` only)

| Metric | Count |
|--------|------:|
| **`src/app/**/*.tsx` with no JSX `style=`** | **all** |
| **Remaining `style=` in `src/components/pages/invite/`** | dynamic gradient only |

Full **rules 1–11** per file remains **manual** (**`page.tsx` line budgets**, **`InviteTokenPage` split**, **`rule 11`** dedupe).

---

## API route (reference)

| Path | Notes |
|------|--------|
| `src/app/api/auth/session/route.ts` | No UI |
