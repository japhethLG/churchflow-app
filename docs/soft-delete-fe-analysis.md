# Soft-Delete — Frontend Display Analysis (v2)

> **Status:** Planning — decisions locked, ready to implement.
> **Date:** 2026-05-16
> **Scope:** church-app FE + the BE endpoint changes the FE work requires.
> **Companion doc:** [soft-delete-implementation-tasks.md](./soft-delete-implementation-tasks.md)
>
> Backend soft-delete plumbing is complete (repo → core service → feature
> service → helper, with `softDelete` / `restore` / `withDeleted` and
> `deletedByCascade` cascade flags). The original driver was **traceability**:
> `AuditEvent.entityId` must always resolve, member-merge must keep gifts
> attributable, and "who deleted this and when" must be answerable. The FE has
> to honor that. This v2 supersedes v1 — all open questions are decided.

---

## 1. Where we stand

| Layer | Status |
|---|---|
| BE soft-delete plumbing (repos, services, helpers) | ✅ Done |
| BE cascade-aware actor propagation | ✅ Done (verified in `soft-delete.helpers.ts` line 86) |
| BE `DELETE` endpoints | ✅ All 6 entities |
| BE `POST /restore` endpoints | ⚠️ Only Tenant + Campaign |
| BE `includeDeleted` query flag on list endpoints | ❌ None |
| BE detail-by-id including-deleted | ❌ None |
| BE `actorId` (internal User.id) alongside `actorUid` (firebase) | ❌ Schema only has firebase uid |
| BE cascade-restore preview endpoint | ❌ |
| FE deletion modals | ✅ All 6 entities |
| FE restore modals | ⚠️ Only Tenant |
| FE tombstone rendering (Mode B) | ❌ Almost none |
| FE attribution displays (`createdBy`, `deletedBy`) | ❌ None |
| FE archive views (Mode C) | ❌ None |

---

## 2. Mental model — three viewing modes

The single biggest decision: a deleted row can appear in the UI in **three
distinct modes**, and they need different visual treatment.

### Mode A — Live (default)
The query filtered tombstones out. Nothing special on screen.

### Mode B — Tombstone reference (incidental)
The user is looking at entity **X** that's alive, but X references entity
**Y** that was soft-deleted.

> Examples:
> - Transaction row shows member "Maria Santos" → Maria was soft-deleted.
> - Pledge detail shows campaign "Easter 2024" → campaign archived.
> - Audit event references `Transaction#abc123` → transaction was deleted.

**Display rule:** muted label + inline "deleted" pill. The label **remains
clickable** and lands on the archived detail page (banner + read-only
fields + restore button). Tooltip on hover shows "Deleted on Mar 3, 2026
by Anna". The point is **transparency** — users can always trace the
reference back to its source.

### Mode C — Archive view (explicit)
The user opted in via filter: "show me deleted X". The row IS the tombstone.

> Examples:
> - Members list with filter switched from "Active" to "Deleted".
> - "Removed items" sub-section on a campaign detail page.

**Display rule:** distinct row background tint, "Archived" badge in the
leading column, "Deleted on Mar 3 by Anna" column, row-action menu with
"Restore" (no edit/delete). Different background tint to make it
unambiguous you're not in the live list.

---

## 3. When to show deleted in parent / child relations

The cascade-aware helpers mean a parent delete can take children with it
(`deletedByCascade=true`). The display rules follow the cascade direction:

| Relation direction | Mode | What FE does |
|---|---|---|
| **Parent → child (live parent, deleted child)** | Hidden by default; Mode C if user toggles "All" / "Deleted" | Don't list deleted children in the parent's "current items" section. Surface them when filter is toggled. |
| **Child → parent (live child, deleted parent)** | Mode B | Render the parent label with muted/"deleted" treatment. **Clickable** → archived detail page (banner + read-only). |
| **Parent deleted, children cascaded** | Mode C | Cascade-flag distinguishes them visually (see §4.1). Restoring the parent will also restore them — see §4.7. |
| **Both deleted** | Mode B nested in Mode C | Muted label + "deleted" hint, even inside a Mode C archive row. |
| **Member-side surfaces** | Mode A by default; Mode B for navigation; **no Mode C operations** | Members can navigate to a deleted referenced entity (e.g. a campaign on their pledge) and see read-only details with the deleted banner. **No restore/edit/delete affordance.** Transparency without escalation. |

> **Why members see the banner-style archived view (revised from v1):**
> a member who pledged to a campaign that's later archived shouldn't get a
> 404 — that's confusing and breaks their record. They get the same banner
> as admins, minus the restore button. The page is read-only.

---

## 4. Display patterns by UI surface

### 4.1 DataTable rows

Three sub-cases:

1. **Row is live, references a deleted entity** (Mode B in a cell):
   - The cell renders the name in `text-muted-foreground` with an inline
     `<Pill tone="neutral" size="xs">deleted</Pill>`.
   - Avatar (if present) gets `opacity-60`.
   - **Cell stays clickable** — navigates to the archived detail page.
   - Tooltip on hover: "Deleted Mar 3, 2026 by Anna".

2. **Row IS a tombstone** (Mode C — filter set to "Deleted" or "All"):
   - Row background: `bg-muted/30`.
   - Leading column adds an `Archived` badge (`clay` tone, matching `TenantsPage`).
   - **Cascade-flagged children** (`deletedByCascade=true`) carry a subtle
     marker — small "(cascaded)" suffix on the deletion-actor line, or a
     muted `cascaded` chip. **Keep the copy gentle** — admins find it
     useful, regular users won't notice.
   - Row-action menu replaces Edit/Delete with **Restore**.
   - New columns: "Deleted on" + "Deleted by" (when filter exposes them).

3. **Mixed table — filter = "All"** (live + tombstones together):
   - Both treatments apply per-row. The row-IS-tombstone treatment wins
     for tombstone rows; live rows look unchanged.

### 4.2 Detail pages

- **Entity itself is deleted** (admin lands on `/admin/members/:id` where
  `deletedAt != null` — happens via Mode B click or direct URL):
  - Page header: `EntityRestoreBanner` — "This member was deleted on Mar 3, 2026 by Anna." + Restore button.
  - All form fields read-only. Primary action buttons hidden.
  - Sub-tables (e.g. member's pledges/giving) follow the same filter
    semantics — but operations on those rows are disabled while the parent
    is in the tombstone state.
- **Entity references a deleted entity** (Mode B inline label, clickable).
- **Member-side detail pages** (`member/*`): banner shows but **no restore
  button**. Copy adjusted: "This campaign has been archived." Read-only.

### 4.3 Pickers — `MemberPicker`, future `CampaignPicker` etc.

Pickers assign **live** entities, so the dropdown list is always Active-only.
The edge case is editing an existing record whose referenced entity was
deleted after the record was created (e.g. editing a Transaction whose
member is now archived):

- The picker's **current selection** renders with the deleted-label treatment
  (muted + "deleted" pill). The user sees what it currently points to.
- Opening the dropdown shows only live options — the deleted entry is NOT
  in the list.
- If the user picks someone else, the deleted reference is replaced.
- If they clear and the field is required, validation forces a live pick.

> **API requirement:** picker needs the entity detail endpoint to return
> deleted entities by ID. See §6.3.

### 4.4 Forms / attribution displays

Wherever "Recorded by [admin]" or "Last edited by [admin]" appears, the
admin may have been deleted too. Treat their name the same way (muted +
deleted hint). Resolution of `deletedBy` → display name is via the new
`User` lookup (see §6.6 and Q2 below).

### 4.5 Charts / aggregates

Aggregates (dashboard KPIs, report summaries, "giving by month") **stay
Active-only** via the Prisma extension. Don't expose `includeDeleted` to
chart endpoints. If a "what if deleted were included" view is ever needed,
that's a separate feature.

### 4.6 Audit log

The audit feed is where soft-delete pays off. Every audit row may link to
a now-deleted entity:

- Audit row renders `summary` directly (write-time denormalized — see Q9).
- The `entity` cell renders Mode B (muted + clickable) when applicable.
- `DELETE` / `RESTORE` audit rows get distinct action chips.
- Click through to the entity's detail page lands you on the archived view.

### 4.7 Restore flows + cascade preview

When restoring a parent (Campaign, Tenant) that had cascaded children:

- The restore modal calls the **preview endpoint** (§6.5) to show a count:
  "Restoring will also restore 12 pledges and 3 campaign items that were
  removed with it."
- User confirms → restore endpoint runs.
- For leaf entities (no cascade — Member without cascaded pledges, Pledge
  alone, Transaction, CampaignItem), the modal skips the preview and just
  confirms.
- Cancelled or in-flight: `dismissible={false}` while pending (per CLAUDE.md §8.5).

---

## 5. Per-surface decisions — exhaustive table

| Surface | Path | Filter exposed? | Default | Notes |
|---|---|---|---|---|
| Super-admin Tenants list | `(super-admin)/super-admin/tenants` | Yes (3-state) | Active | Currently shows everything; changing the default to Active is a behavior change. |
| Super-admin Tenant detail | `(super-admin)/super-admin/tenants/:id` | n/a (single entity) | — | Banner on deletedAt; restore button (already partly exists). |
| Super-admin Tenant admins | `(super-admin)/super-admin/tenants/:id/admins` | No | Active | Admin users aren't soft-deletable. |
| Super-admin Admins list | `(super-admin)/super-admin/admins` | No | Active | Same — User not yet soft-deletable. |
| Super-admin Audit log | `(super-admin)/super-admin/audit` | No (always all) | All | Mode B everywhere references appear. |
| Admin Members list | `[slug]/admin/members` | Yes (3-state) | Active | Combine with existing `status` filter; status applies only when "Active" selected. |
| Admin Member detail | `[slug]/admin/members/:id` | n/a | — | Banner on deletedAt. Sub-tables (pledges/giving) carry their own filter. |
| Admin Member pledges sub-table | (inside member detail) | Yes (inline 3-state) | Active | |
| Admin Member giving sub-table | (inside member detail) | Yes (inline 3-state) | Active | |
| Admin Campaigns list | `[slug]/admin/campaigns` | Yes (3-state) | Active | |
| Admin Campaign detail | `[slug]/admin/campaigns/:id` | n/a | — | Banner on deletedAt. Items section carries inline filter. |
| Admin Campaign items section | (inside campaign detail) | Yes (inline 3-state) | Active | "Removed items" collapsible when filter ≠ Active. |
| Admin Pledges list | `[slug]/admin/pledges` | Yes (3-state) | Active | Combines with existing status filter. |
| Admin Pledge detail | `[slug]/admin/pledges/:id` | n/a | — | Banner on deletedAt. |
| Admin Transactions list | `[slug]/admin/transactions` | Yes (3-state) | Active | |
| Admin Transaction detail | `[slug]/admin/transactions/:id` | n/a | — | Banner on deletedAt. |
| Admin Dashboard | `[slug]/admin/dashboard` | No | Active | KPIs over live data only. |
| Admin Reports | `[slug]/admin/reports` | No | Active | Reports over live data only. |
| Admin Invitations | `[slug]/admin/invitations` | No | n/a | Invitations aren't soft-deletable. |
| Admin Settings | `[slug]/admin/settings` | No | — | |
| Admin Profile | `[slug]/admin/profile` | No | — | |
| Member Dashboard | `[slug]/member/dashboard` | No | Active | |
| Member Campaigns list | `[slug]/member/campaigns` | No | Active | Members never see deleted campaigns in the list. |
| Member Campaign detail | `[slug]/member/campaigns/:id` | n/a | — | If campaign is deleted (member arrives via pledge), banner shows + read-only, **no restore button**. |
| Member My Pledges | `[slug]/member/my-pledges` | No | Active | Member's own pledges aren't soft-deleted directly by them; admin actions may produce tombstones. |
| Member Pledge detail | `[slug]/member/my-pledges/:id` | n/a | — | Banner if deleted. Member can navigate to the (deleted) campaign. |
| Member My Transactions | `[slug]/member/my-transactions` | No | Active | Same — admin may have deleted these; member sees only active in list, but can navigate to deleted ones if referenced. |
| Member Profile | `[slug]/member/profile` | No | — | |

> **Single rule:** the 3-state filter only appears on **tenant-side
> admin lists** and the **super-admin Tenants list**, plus inline filters
> on admin detail-page sub-tables. Member surfaces never get the filter.

---

## 6. Backend endpoint changes required

### 6.1 Missing restore endpoints
Add `POST /tenants/:tenantId/<entity>/:id/restore` for:
- **Member** — `member.tenant.controller.ts`
- **Pledge** — `pledge.tenant.controller.ts`
- **Transaction** — `transaction.tenant.controller.ts`
- **CampaignItem** — `campaign.tenant.controller.ts`
  (route: `POST /tenants/:tenantId/campaigns/:id/items/:itemId/restore`)

Each adds (per CLAUDE.md §8.3 three-layer flow):
1. Core repo `restore(tenantId, id)` calling `restore(tx, "<Model>", { where })`
   inside `$transaction`, returning the restored row via `withDeleted`.
2. Core service `restore(tenantId, id)` thin wrapper.
3. Feature service `restore(user, tenant, id)` writing an `AuditAction.RESTORE`
   event.
4. CASL: add `restore` action to `ability.factory.ts` for ADMIN role on
   the entity's subject.
5. No `@RefreshesClaims()` — restore doesn't touch claims.

### 6.2 `includeDeleted` query flag — query param, not header
Add `?includeDeleted=true` and **also** `?onlyDeleted=true` (for the
"Deleted only" leg of the 3-state filter) to:
- `GET /tenants/:tenantId/members`
- `GET /tenants/:tenantId/campaigns`
- `GET /tenants/:tenantId/pledges`
- `GET /tenants/:tenantId/transactions`
- `GET /platform/tenants`

The FE filter maps as:
- **Active** → neither flag (default)
- **Deleted** → `onlyDeleted=true`
- **All** → `includeDeleted=true`

> **Why query params over headers / body:** every other filter on these
> endpoints lives in query params. URL-encodable means the FE route can
> mirror it (bookmarkable, shareable). TanStack Query keys by `init.params`
> — distinct cache entries are free. Headers as filters are an OpenAPI /
> cache anti-pattern. Body on GET is a HTTP-spec no-go.

Implementation: pipe the flags through the feature service → core service
→ repo, where the repo uses `withDeleted(modelName, { where, ... })` when
either flag is set, and adds `deletedAt: { not: null }` when `onlyDeleted`.

Pagination + counts: when `onlyDeleted=true`, the count reflects tombstones
only. When `includeDeleted=true`, the count is across both. The FE pagination
state is per-filter (don't reuse the Active tab's page when switching).

Self/member surfaces don't get these flags — per the per-surface table in §5.

### 6.3 Detail endpoints — fetch-by-id-including-deleted
Add `?includeDeleted=true` to:
- `GET /tenants/:tenantId/members/:id`
- `GET /tenants/:tenantId/campaigns/:id`
- `GET /tenants/:tenantId/campaigns/:id/items/:itemId` (if exposed individually)
- `GET /tenants/:tenantId/pledges/:id`
- `GET /tenants/:tenantId/transactions/:id`
- `GET /platform/tenants/:id` (already done — verify)

**Member-side detail endpoints get the flag too** — for the
"navigate from pledge to deleted campaign" case:
- `GET /tenants/:tenantId/me/campaigns/:id` — `?includeDeleted=true`
- `GET /tenants/:tenantId/me/pledges/:id` — already returns the member's own pledge regardless of state? Verify.

Repo uses `findFirstOrThrow(withDeleted("<Model>", { where: { id, tenantId } }))`.

### 6.4 DTO updates — `deletedBy` / `deletedAt` exposure

Per Q1: `deletedAt`, `deletedBy`, `deletedByCascade` are returned by default
on **admin-side** DTOs for soft-deletable entities. Verify after
regenerating the schema that they appear in `src/lib/api/schema.d.ts`.

Action: audit each shared DTO in `church-app-backend/src/shared/dto/` for
the three fields. Add `@Expose() @ApiPropertyOptional({ nullable: true })`
declarations where missing. Self-side response DTOs **strip** these via
`OmitType` for hygiene — low priority per Q6, but doing it in the same pass
is cheap.

### 6.5 Restore cascade preview
`GET /tenants/:tenantId/campaigns/:id/restore-preview` returning:
```json
{
  "cascadeCount": { "campaignItems": 12 }
}
```

Implementation: walk the same cascade graph the restore helper walks, count
tombstones where `deletedByCascade=true` and the parent FK matches.

**Scope: Campaign only.** Verified via `grep "onDelete" prisma/schema/`:
the only `onDelete: Cascade` relation is `CampaignItem.campaign → Campaign`.
Tenant / Member / Pledge / Transaction have no cascaded descendants and
their restore modal is a plain confirm.

### 6.6 Internal actor ID — `deletedBy` semantic switch ✅ done

Per Q2: `deletedBy` columns now store the **internal `User.id`** (FK to
the `User` table), not the firebase UID. Stamping a stable internal
identifier means "who deleted this" survives a Firebase account deletion
and doesn't require a Firebase round-trip to resolve a display name.

**Implementation (Phase 1.1b — already landed):**
- No schema migration. The `deletedBy: String?` column already exists; only
  the value semantics changed.
- The soft-delete helper's `actorId` parameter is now interpreted as
  `User.id` (was firebase UID). The helper code is unchanged — only the
  callers' contract changed.
- Every feature service `.delete()` handler resolves the User row before
  delegating to the core service:
  ```ts
  const actor = await this.userService.findByFirebaseUid(user.firebaseUid);
  const row = await this.entityService.delete(tenantId, id, actor?.id ?? null);
  ```
- `MemberMergingService.MergeMembersInput` gained an `actorId: string | null`
  field alongside the existing `actorUid` (firebase). Audit keeps using
  `actorUid`; the cascaded soft-delete uses `actorId`.
- `AuditEvent.actorUid` is unchanged — still firebase UID for the audit
  trail.

Existing data: `deletedBy` values written by earlier code paths are
firebase UIDs. They aren't actively used by the FE today, so a backfill
is optional. If/when the FE renders actor display names, a one-time
migration could update old rows via `UPDATE "Member" SET "deletedBy" = u.id FROM "User" u WHERE "Member"."deletedBy" = u."firebaseUid"` (per soft-deletable table).

### 6.7 Search composes with `includeDeleted` / `onlyDeleted`
Per Q3 / new-Q3: search filters apply within the currently selected filter
state. The backend just needs to ensure its `where` clause composes
correctly: search term + `includeDeleted` + tenant scope all live in the
same `where`. No new contract — verify in tests.

### 6.8 Permissions
Per Q3 (your answer): admins can delete/restore items only in their tenant.
Already enforced via `TenantGuard` + CASL. No new gating needed for
restore beyond adding the `restore` action to `ability.factory.ts` for
ADMIN role.

Per new-Q5: all tenant admins can see deleted items — no further
gating. The 3-state filter is visible to every admin.

### 6.9 Member-side endpoint behavior with deleted references
Per new-Q6: members can navigate to deleted referenced entities. This
means:
- Member detail endpoints for campaigns / pledges must return the deleted
  entity when fetched by ID (with `?includeDeleted=true`).
- Member list endpoints stay Active-only — no `includeDeleted` flag exposed.
- Member-side response DTOs include `deletedAt`, `deletedBy`, and
  `deletedByCascade` (same shape as admin). The FE chooses what to render
  — the read-only banner can omit the actor identity in copy without
  redacting at the API layer.

---

## 7. FE API hook changes

### 7.1 List hooks — accept the filter
```ts
// tenant intent
useMembers({ status, includeDeleted, onlyDeleted })
useCampaigns({ includeDeleted, onlyDeleted })
usePledges({ status, includeDeleted, onlyDeleted })
useTransactions({ ...filters, includeDeleted, onlyDeleted })
// platform intent
usePlatformTenants({ includeDeleted, onlyDeleted })
```

FE encodes the 3-state filter:
- "Active": `{ includeDeleted: false, onlyDeleted: false }` (omit both)
- "Deleted": `{ onlyDeleted: true }`
- "All": `{ includeDeleted: true }`

### 7.2 Detail hooks — accept includeDeleted
```ts
useMember(id, { includeDeleted: true })   // for archived detail pages
useCampaign(id, { includeDeleted: true })
useMyCampaign(id, { includeDeleted: true })   // member-side navigation to deleted campaign
usePledge(id, { includeDeleted: true })
// etc.
```

### 7.3 New restore mutations
```ts
useRestoreMember()
useRestorePledge()
useRestoreTransaction()
useRestoreCampaignItem()
// existing
useRestoreTenant()
useRestoreCampaign()
```

Each `onSuccess` calls the entity's `invalidate<Entity>(qc, tenantId)`.
Verify `invalidateByPaths` predicate matches regardless of query-param
shape — if it inspects `init.params.query`, broaden the predicate.

### 7.4 New restore preview hook
```ts
useRestorePreview(entity, id)   // for Tenant + Campaign only
```
Used by the restore modal to render the cascade count before confirm.

### 7.5 Keys
Each entity's `<ENTITY>_PATHS` in `keys.ts` gains the new restore path and,
for Tenant/Campaign, the restore-preview path. Detail-by-id paths don't
need to be re-listed (same path, new query param).

---

## 8. New / changed FE surfaces

### 8.1 New modals
- `confirm-restore-member` — new
- `confirm-restore-pledge` — new
- `confirm-restore-transaction` — new
- `confirm-restore-campaign-item` — new
- `confirm-restore-campaign` — needs to consume the preview hook (cascade count)
- `confirm-restore-tenant` (existing) — extend with preview hook

Each lives at `src/components/modals/confirm-restore-<entity>/<Name>Modal.tsx`
and registers via `declare module` (CLAUDE.md §8.3).

### 8.2 New primitives
- `DeletedLabel` — wraps a string/avatar + the inline "deleted" pill +
  tooltip. **Clickable** — accepts an `href` prop to navigate to the
  archived detail page. Single source of truth for Mode B treatment.
  File: `src/components/primitives/DeletedLabel.tsx`.
- `EntityRestoreBanner` — detail-page Mode C banner with metadata
  (deleted by, deleted on) and Restore button. Read-only variant
  (no restore button) for member-side use.
  File: `src/components/primitives/EntityRestoreBanner.tsx`.
- `ArchivedRowBadge` — reuses existing `Badge` with `clay` tone; not a new
  primitive, but a documented usage pattern.

### 8.3 New filter component
- `StateFilter` — 3-state segmented control (Active / Deleted / All) used
  in every list page header and inline within detail-page sub-tables.
  File: `src/components/primitives/StateFilter.tsx` (or under
  `components/pages/<feature>/` if not generic enough — start in primitives).

### 8.4 Picker changes
- `MemberPicker` — accept a `selectedDeletedFallback` prop or always render
  the selected value with `DeletedLabel` when the resolved member has
  `deletedAt != null`. Pass the resolved member via
  `useMember(id, { includeDeleted: true })` from the form caller.

### 8.5 Table changes
Every existing table (`MembersTable`, `CampaignsTable`, `PledgesTable`,
`TransactionsTable`, `MemberPledgesTable`, `MemberTransactions`) gains:
- Mode B treatment in any cell that renders an entity reference (member
  name, campaign name).
- Mode C row treatment + "Restore" row action when the row itself is a
  tombstone.
- New "Deleted on" + "Deleted by" columns (conditional — only when filter
  is Deleted or All).

### 8.6 Filter integration
List pages with existing filters (Members has status, Pledges has status,
Transactions has type/date) gain the `StateFilter` adjacent to existing
filters. When `StateFilter` is "Deleted", existing status/type filters
remain functional and combine with the tombstone constraint.

---

## 9. All decisions (consolidated)

### Original 9 open questions
| # | Question | Decision |
|---|---|---|
| Q1 | Include `deletedBy` / `deletedAt` in DTOs? | **Yes, by default on every DTO — admin AND self-side.** Members need them to render the read-only "Archived" banner when they navigate to a referenced deleted entity (per N6). The earlier "strip on self-side" recommendation is reversed. |
| Q2 | Resolve actor uid → internal user identity? | **Yes — `deletedBy` stores internal `User.id`, not firebase UID.** Implemented at the feature-service layer: each `.delete()` handler resolves `User.id` via `userService.findByFirebaseUid(user.firebaseUid)` before calling `entityService.delete(tenantId, id, actorId)`. `AuditEvent.actorUid` continues to use firebase UID (separate field, separate purpose). |
| Q3 | Restore permission model? | **Tenant admin restores within their tenant.** Already enforced; add `restore` to ability factory. |
| Q4 | Pagination per filter? | **Yes.** Each filter state has its own page state. |
| Q5 | `includeDeleted` transport: header / body / param? | **Query param.** Plus `onlyDeleted` for 3-state semantics. |
| Q6 | Self-side `deletedAt` leakage? | **Reversed — keep the fields.** Members need `deletedAt` to render the read-only banner on a deleted referenced entity (per N6). `deletedBy` (now an internal User.id) is also retained for consistency; the FE can choose what to render. Transparency wins over defense-in-depth here. |
| Q7 | Auto-redirect on deleted detail page? | **No.** Render archived detail (banner + read-only). |
| Q8 | Hard-delete escape hatch? | **Out of scope.** |
| Q9 | Audit entity label resolution: write-time vs read-time? | **Write-time denormalization.** Embed entity label in audit `summary` (already partly done) — standard practice. |

### New 7 questions
| # | Question | Decision |
|---|---|---|
| N1 | Distinguish cascade-deleted in archive view? | **Subtle marker only.** Small "(cascaded)" tooltip / chip — useful for admins, not loud. |
| N2 | Show cascade preview in restore modal? | **Yes** — but only for Tenant + Campaign (others have no cascaded descendants). Backend preview endpoint required. |
| N3 | Search across filter? | **Current filter only.** Search composes with the active state filter. |
| N4 | Retention / expiration of tombstones? | **No expiration.** Tombstones persist forever; restore available indefinitely. |
| N5 | Permission to see Deleted filter? | **All tenant admins.** No sub-role restriction. |
| N6 | Member-side handling of deleted references? | **Members can navigate to deleted referenced entities.** Banner + read-only + no operations. Transparency without escalation. List endpoints stay Active-only. |
| N7 | `deletedBy` on cascade-deleted children? | **Same actor as parent delete.** Already implemented — verified in `soft-delete.helpers.ts` line 86. |

---

## 10. Implementation phases

**Phase 0 — Pre-work (verification, no code)**
- Verify `deletedAt` / `deletedBy` / `deletedByCascade` are on the shared
  BE DTOs. Note gaps.
- Verify cascade graph per entity (which entities actually have
  `deletedByCascade=true` descendants).
- Confirm `invalidateByPaths` predicate behavior with query params.

**Phase 1 — BE endpoints**
1. Restore endpoints for Member, Pledge, Transaction, CampaignItem.
2. `includeDeleted` / `onlyDeleted` flags on tenant + platform list endpoints.
3. `?includeDeleted=true` on detail endpoints (tenant + member-side
   campaign/pledge detail).
4. Restore preview endpoint for Tenant + Campaign.
5. AuditEvent `actorId` column + resolver. `deletedByUser` resolver on
   soft-deletable DTOs.
6. CASL: add `restore` action.
7. Integration tests: each new endpoint, each filter state.
8. Regenerate FE types (`npm run api:types`).

**Phase 2 — FE plumbing**
1. New hooks (list filters, detail-includes-deleted, restore mutations,
   restore preview).
2. New primitives: `DeletedLabel`, `EntityRestoreBanner`, `StateFilter`.
3. New restore modals (4) + extend the 2 existing restore modals with
   preview.
4. Wire `invalidate<Entity>` for restore mutations.

**Phase 3 — Mode B (label) treatment**
- Apply `DeletedLabel` to every place an entity name is rendered as a
  reference: tables (member/campaign cells), detail pages, audit log,
  pickers.

**Phase 4 — Mode C (archive view) treatment**
- Add `StateFilter` to list pages.
- Add inline `StateFilter` to detail-page sub-tables (member pledges,
  campaign items, member giving).
- Add new "Deleted on / Deleted by" columns (conditional).
- Detail pages handle `deletedAt != null` with `EntityRestoreBanner`.

**Phase 5 — Member-side polish**
- Member-side detail pages render the read-only banner variant.
- Member campaign detail handles deleted-campaign navigation.

**Phase 6 — Audit + final pass**
- Verify audit log entity references are Mode B everywhere.
- Verify all pickers handle selected-deleted fallback.
- Type checks, biome, integration tests, build.

---

## 11. Affected files — exhaustive inventory

### 11.1 FE files (church-app)

#### Pages / composites
- `src/components/pages/super-admin/tenants/TenantsPage.tsx`
- `src/components/pages/super-admin/tenants/TenantDetailPage.tsx`
- `src/components/pages/super-admin/audit/*` (audit list + filters)
- `src/components/pages/members/MembersListPage.tsx`
- `src/components/pages/members/MembersTable.tsx`
- `src/components/pages/members/MembersFilters.tsx`
- `src/components/pages/members/MemberDetailPage.tsx`
- `src/components/pages/members/MemberPledges.tsx`
- `src/components/pages/members/MemberRecentGiving.tsx`
- `src/components/pages/campaigns/CampaignsListPage.tsx`
- `src/components/pages/campaigns/CampaignsTable.tsx`
- `src/components/pages/campaigns/CampaignDetailPage.tsx`
- `src/components/pages/campaigns/CampaignEditPage.tsx`
- `src/components/pages/pledges/PledgesListPage.tsx`
- `src/components/pages/pledges/PledgesTable.tsx`
- `src/components/pages/pledges/PledgesFilters.tsx`
- `src/components/pages/pledges/PledgeDetailPage.tsx`
- `src/components/pages/transactions/TransactionsListPage.tsx`
- `src/components/pages/transactions/TransactionsTable.tsx`
- `src/components/pages/transactions/TransactionsFilters.tsx`
- `src/components/pages/transactions/TransactionDetailPage.tsx`
- `src/components/pages/member-campaigns/MemberCampaignDetailPage.tsx` (banner)
- `src/components/pages/member-pledges/MemberPledgeDetailPage.tsx` (banner; nav to deleted campaign)
- `src/components/pages/member-pledges/MemberMyPledgesPage.tsx` (Mode B in campaign cell)
- `src/components/pages/member-pledges/MemberPledgesTable.tsx` (Mode B)
- `src/components/pages/member-transactions/MemberTransactions.tsx` (Mode B)

#### Primitives (new + modified)
- **New:** `src/components/primitives/DeletedLabel.tsx`
- **New:** `src/components/primitives/EntityRestoreBanner.tsx`
- **New:** `src/components/primitives/StateFilter.tsx`
- **Modified:** `src/components/primitives/MemberPicker.tsx` (selected-deleted fallback)

#### Form elements
- `src/components/formElements/FormMemberPicker/index.tsx` (carry the fallback through)

#### Modals
- **New:** `src/components/modals/confirm-restore-member/`
- **New:** `src/components/modals/confirm-restore-pledge/`
- **New:** `src/components/modals/confirm-restore-transaction/`
- **New:** `src/components/modals/confirm-restore-campaign-item/`
- **Modified:** `src/components/modals/confirm-restore-tenant/ConfirmRestoreTenantModal.tsx` (cascade preview)
- **New:** `src/components/modals/confirm-restore-campaign/` (cascade preview)
- **Modified:** `src/components/modals/index.ts` (barrel)
- **Modified:** `src/lib/modals/host.tsx` (registry)

#### API hooks + keys
- `src/lib/api/members/tenant/hooks.ts` + `members/keys.ts`
- `src/lib/api/members/self/hooks.ts`
- `src/lib/api/campaigns/tenant/hooks.ts` + `campaigns/keys.ts`
- `src/lib/api/campaigns/self/hooks.ts`
- `src/lib/api/pledges/tenant/hooks.ts` + `pledges/keys.ts`
- `src/lib/api/pledges/self/hooks.ts`
- `src/lib/api/transactions/tenant/hooks.ts` + `transactions/keys.ts`
- `src/lib/api/transactions/self/hooks.ts`
- `src/lib/api/tenants/platform/hooks.ts` + `tenants/keys.ts`
- `src/lib/api/schema.d.ts` (regenerated)

### 11.2 BE files (church-app-backend)

#### Prisma / migrations
- `prisma/schema/audit.prisma` (add `actorId` column)
- New migration for the AuditEvent column

#### Soft-delete infrastructure
- `src/infrastructure/prisma-client/soft-delete/soft-delete.helpers.ts` (preview helper)
- **New** `src/infrastructure/prisma-client/soft-delete/restore-preview.helpers.ts`

#### Authorization
- `src/infrastructure/authorization/ability.factory.ts` (add `restore` action for ADMIN)
- `src/infrastructure/authorization/ability.types.ts` (if new action enum value)

#### Shared DTOs
- `src/shared/dto/member.dto.ts` (add `deletedAt`, `deletedBy`, `deletedByCascade`, optionally `deletedByUser`)
- `src/shared/dto/campaign.dto.ts`
- `src/shared/dto/campaign-item.dto.ts`
- `src/shared/dto/pledge.dto.ts`
- `src/shared/dto/transaction.dto.ts`
- `src/shared/dto/tenant.dto.ts`
- `src/shared/dto/user.dto.ts` (referenced by `deletedByUser` if used)

#### Member feature
- `src/modules/core/member/repository/member.repository.ts` (restore, listIncludingDeleted, getByIdIncludingDeleted)
- `src/modules/core/member/services/member.service.ts`
- `src/modules/features/member-feature/services/member-feature.service.ts`
- `src/modules/features/member-feature/controllers/tenant/member.tenant.controller.ts` (restore endpoint, includeDeleted on list/detail)
- `src/modules/features/member-feature/controllers/tenant/requests/` (filter DTO)

#### Campaign feature
- `src/modules/core/campaign/repository/campaign.repository.ts`
- `src/modules/core/campaign/services/campaign.service.ts`
- `src/modules/core/campaign-item/repository/campaign-item.repository.ts` (restore)
- `src/modules/core/campaign-item/services/campaign-item.service.ts`
- `src/modules/features/campaign-feature/services/campaign-feature.service.ts`
- `src/modules/features/campaign-feature/controllers/tenant/campaign.tenant.controller.ts` (restore for both, includeDeleted, preview)
- `src/modules/features/campaign-feature/controllers/self/campaign.self.controller.ts` (includeDeleted on member-side detail)

#### Pledge feature
- `src/modules/core/pledge/repository/pledge.repository.ts`
- `src/modules/core/pledge/services/pledge.service.ts`
- `src/modules/features/pledge-feature/services/pledge-feature.service.ts`
- `src/modules/features/pledge-feature/controllers/tenant/pledge.tenant.controller.ts`
- `src/modules/features/pledge-feature/controllers/self/pledge.self.controller.ts` (member detail nav)

#### Transaction feature
- `src/modules/core/transaction/repository/transaction.repository.ts`
- `src/modules/core/transaction/services/transaction.service.ts`
- `src/modules/features/transaction-feature/services/transaction-feature.service.ts`
- `src/modules/features/transaction-feature/controllers/tenant/transaction.tenant.controller.ts`

#### Tenant feature
- `src/modules/core/tenant/repository/tenant.repository.ts` (preview)
- `src/modules/core/tenant/services/tenant.service.ts`
- `src/modules/features/tenant-feature/services/tenant-feature.service.ts`
- `src/modules/features/tenant-feature/controllers/platform/tenant.platform.controller.ts` (preview endpoint, includeDeleted/onlyDeleted)

#### Audit feature
- `src/modules/core/audit/services/audit.service.ts` (resolve firebase uid → actorId)
- `src/modules/core/audit/repository/audit.repository.ts` (write actorId, include actor relation in reads)

#### Tests
- `test/integration/soft-delete-restore.integration.test.ts` (new — per entity)
- `test/integration/soft-delete-filter.integration.test.ts` (new — list flag combinations)
- `test/integration/soft-delete-preview.integration.test.ts` (new — cascade preview)
- `test/integration/audit-actor-resolution.integration.test.ts` (new)

---

## 12. Open / deferred

- **Hard-delete (GDPR purge)** — not in scope.
- **Self-side `deletedAt` leak** — included in the DTO pass as cleanup.
- **`deletedById` schema migration** — deferred in favor of response-time
  resolver. Revisit if join cost surfaces.
- **`User` soft-delete** — not in scope (User isn't soft-deletable today).
- **Retention policy** — explicitly none.
- **Search across all filter states** — not desired (per N3).

---

## 13. Copy / design

Defer pixel-level treatment to design. Working strings for the
implementation:

- "Archived" — Mode C row badge.
- "deleted" — Mode B inline pill (lowercase, neutral tone).
- "This [member/campaign/pledge/transaction] was deleted on [Mar 3, 2026] by [Anna]." — banner.
- "This [member/campaign/...] has been archived." — member-side banner (no actor name).
- "Restore" — primary action.
- "Restoring will also restore N items that were removed with it." — cascade preview line.
- "(cascaded)" — subtle marker on cascade-flagged rows.
