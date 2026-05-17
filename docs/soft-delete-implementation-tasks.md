# Soft-Delete Alignment — Implementation Task Tracker

> Companion to [soft-delete-fe-analysis.md](./soft-delete-fe-analysis.md).
> Tasks ordered by phase. Check off as work lands.
>
> Convention: `[BE]` = backend repo work; `[FE]` = frontend repo work;
> `[ALL]` = touches both.

---

## Phase 0 — Pre-flight verification ✅

- [x] **Cascade graph:** only one `onDelete: Cascade` edge in the schema —
      `CampaignItem.campaign → Campaign`. Tenant / Member / Pledge /
      Transaction have **no cascaded descendants**. **Restore preview is
      Campaign-only.** All other restore modals are plain confirms.
- [x] **Soft-deletable models** confirmed: Tenant, Member, Campaign,
      CampaignItem, Pledge, Transaction, User, Invitation. (User +
      Invitation are out-of-scope for the FE pass — no admin UI today.)
- [x] **Shared DTOs expose `deletedAt` only.** None expose `deletedBy` or
      `deletedByCascade`. Uniform gap.
- [x] **`invalidateByPaths`** matches on `q.queryKey[0]` (path) only,
      ignoring `init` / query params. Restore mutation invalidation is
      safe across `?includeDeleted=true` cache entries.

---

## Phase 1 — Backend endpoints

### 1.1 Schema + DTO updates — ✅ done
- [x] `[BE]` Add `deletedBy` + `deletedByCascade` (`@Expose()` +
      `@ApiPropertyOptional` / `@ApiProperty`) to every shared DTO:
  - [x] `tenant.dto.ts`
  - [x] `member.dto.ts`
  - [x] `campaign.dto.ts`
  - [x] `campaign-item.dto.ts`
  - [x] `pledge.dto.ts`
  - [x] `transaction.dto.ts`
- [x] `[BE]` `deletedBy` description / example updated to reflect internal
      User.id semantics (was firebase UID).
- [ ] **Dropped** `[BE]` ~~`OmitType deletedAt/deletedBy/...` from
      self-side response DTOs~~ — reversed. Members navigate to deleted
      referenced entities and need `deletedAt` to render the banner.
      Self-side DTOs keep the full soft-delete fields.
- [ ] **Deferred** `[BE]` `deletedByUser: UserSnapshotDto` resolver — the
      FE can render the raw `User.id` for v1, or look up a display name
      via a separate User endpoint. Revisit when display-name attribution
      becomes a real UX requirement.
- [ ] **Deferred** `[BE]` `AuditEvent.actorId` column + audit DTO `actor`
      snapshot — depends on building an audit UI, which is just a
      `ScaffoldPage` today. Defer to a separate audit-feature effort.

### 1.1b Switch deletedBy actor semantics to internal User.id — ✅ done
> Schema unchanged (column was already `String?`). Only call-site
> contracts changed: `actorId` now means `User.id`, not firebase UID.

- [x] `[BE]` `tenant-feature` — import `UserCoreModule`, inject
      `UserService`, resolve `User.id` before
      `tenantService.delete(...)`.
- [x] `[BE]` `pledge-feature` — same.
- [x] `[BE]` `campaign-feature` — same; covers both `campaign.delete` and
      `campaignItem.delete`.
- [x] `[BE]` `transaction-feature` — same.
- [x] `[BE]` `member-feature` — already injected `UserService`; resolve
      `actor.id` and pass to both `member.delete` and (via
      `MergeMembersInput.actorId`) the merge flow's drop-side soft-delete.
- [x] `[BE]` `MemberMergingService.MergeMembersInput`: added `actorId`
      alongside `actorUid`. `preview()` Omit type updated. The merge
      call's audit keeps using `actorUid`; the drop's soft-delete uses
      `actorId`.
- [x] `[BE]` Updated CLAUDE.md §8.3 to document the new semantics and
      added a corresponding anti-pattern entry.
- [x] `[BE]` Typecheck + Biome clean.

### 1.2 Soft-delete helpers — cascade preview
- [ ] `[BE]` Implement `previewRestoreCascade(client, modelName, where)` in
      a new file `soft-delete/restore-preview.helpers.ts`. Walks the same
      cascade graph as `restore`, counts tombstones grouped by child model.
- [ ] `[BE]` Add a `restorePreview` repo method to `campaign.repository.ts`.
      **Campaign only** — Tenant has no cascaded descendants per Phase 0.

### 1.3 Authorization — ✅ done
- [x] `[BE]` Added `restore` to the `Actions` union in `ability.types.ts`.
- [x] `[BE]` ADMIN inherits `restore` over Member / Campaign / CampaignItem /
      Pledge / Transaction via the existing `manage` rule. Tenant `restore`
      is explicitly denied for ADMIN (`cannot([..., "restore"], "Tenant")`),
      keeping tenant restore super-admin-only. Super-admin gets it via
      `manage all`.

### 1.4 Member feature — ✅ done
- [x] `[BE]` `member.repository.ts`: added `restore(tenantId, id)`,
      `findByIdIncludingDeleted(tenantId, id)`, and updated `findAll` to
      honor `includeDeleted` / `onlyDeleted` via `withDeleted`.
- [x] `[BE]` `member.service.ts`: `restore(tenantId, id)`,
      `getByIdIncludingDeleted`.
- [x] `[BE]` `member-feature.service.ts`: `restore` writes
      `AuditAction.RESTORE` and refreshes the linked user's claims when
      applicable. `getById` accepts `{ includeDeleted }`.
- [x] `[BE]` `member.tenant.controller.ts`: `POST :id/restore`,
      `?includeDeleted=true` on detail. `MemberFiltersRequestDto` gained
      the two flag fields.

### 1.5 Campaign feature — ✅ done (admin side)
- [x] `[BE]` `campaign.repository.ts`: list with flags, `restorePreview`
      (Campaign-only — the one cascaded relation in the schema).
- [x] `[BE]` `campaign-item.repository.ts`: `restore(tenantId, id)`,
      `findByIdIncludingDeleted`, list with flags.
- [x] `[BE]` `campaign.service.ts` / `campaign-item.service.ts`:
      `restore`, `getByIdIncludingDeleted`, `getRestorePreview`.
- [x] `[BE]` `campaign-feature.service.ts`: `restoreItem`, list flag
      pass-through, preview pass-through, `getById` accepts
      `{ includeDeleted, onlyDeleted }` and propagates to the items
      sub-query.
- [x] `[BE]` `campaign.tenant.controller.ts`: `POST :id/items/:itemId/restore`,
      `GET :id/restore-preview`, list/detail flags. Switched
      restore-endpoint authorization from `update` to the new `restore`
      action.
- [x] `[BE]` `RestorePreviewResponseDto` added under tenant responses.
- [ ] **Deferred** `[BE]` `campaign.self.controller.ts`:
      `?includeDeleted=true` on member-side campaign detail — schedule
      with Phase 5 (member-side polish).

### 1.6 Pledge feature — ✅ done (admin side)
- [x] `[BE]` `pledge.repository.ts`: `restore`, `findByIdIncludingDeleted`,
      list with flags. (List query includes `aggregate` over `_sum`
      `pledgedAmount` — wrapped in `withDeleted` when filter requested.)
- [x] `[BE]` `pledge.service.ts`: `restore`, `getByIdIncludingDeleted`.
- [x] `[BE]` `pledge-feature.service.ts`: `restore` with audit, `getById`
      accepts `{ includeDeleted }`.
- [x] `[BE]` `pledge.tenant.controller.ts`: `POST :id/restore`,
      `?includeDeleted=true` on detail. `PledgeFiltersRequestDto` gained
      the two flag fields.
- [ ] **Deferred** `[BE]` `pledge.self.controller.ts`:
      `?includeDeleted=true` on member-side pledge detail — Phase 5.

### 1.7 Transaction feature — ✅ done
- [x] `[BE]` `transaction.repository.ts`: `restore`,
      `findByIdIncludingDeleted`, list with flags.
- [x] `[BE]` `transaction.service.ts`: `restore`,
      `getByIdIncludingDeleted`.
- [x] `[BE]` `transaction-feature.service.ts`: `restore` with audit,
      `getById` accepts `{ includeDeleted }`.
- [x] `[BE]` `transaction.tenant.controller.ts`: `POST :id/restore`,
      `?includeDeleted=true` on detail. Filter DTO gained the two flag
      fields.
- [x] **Aggregates stay live-only** — `summary()` doesn't accept the
      flag; dashboard reflects active transactions only.

### 1.8 Tenant feature — ✅ done
- [x] `[BE]` `tenant.repository.ts`: `findAll(filters)` now accepts
      `{ includeDeleted, onlyDeleted }` and applies `withDeleted` when
      set. (Existing `findAllIncludingDeleted` left untouched for
      backwards-compat with internal callers; new code uses the filter.)
- [x] `[BE]` `tenant.service.ts`: `getAll(filters)` pass-through.
- [x] `[BE]` `tenant-feature.service.ts`: `list(filters)` — default is
      active-only (behavior change from previous "include all").
- [x] `[BE]` `tenant.platform.controller.ts`: list accepts query DTO;
      tenant restore endpoint uses the new `restore` CASL action.
- [x] `[BE]` New `TenantFiltersRequestDto` under platform requests.
- [ ] **Out of scope** `[BE]` Tenant restore-preview endpoint — Tenant
      has no cascaded descendants, so no preview is needed.

### 1.9 Audit feature — DEFERRED (out of scope)
> The FE audit page (`(super-admin)/super-admin/audit/page.tsx`) is a
> scaffold — no implementation exists. Audit actor-resolution work has
> no consumer until the audit UI is built. Defer to a separate effort.
> Restore/delete endpoints still write audit records via existing infra.

For the `deletedBy` display ("Deleted by Anna"), the v1 approach is to
expose the raw firebase UID on the row (done in §1.1). A per-entity
`deletedByUser` snapshot resolver is the long-term answer but isn't on
the critical path — defer.

### 1.10 Tests — ✅ done
- [x] `[BE]` All 46 prior integration tests still green.
- [x] `[BE]` Added 5 new tests for `previewRestoreCascade` in
      `test/integration/soft-delete.integration.test.ts`:
      - empty result when parent has no cascade descendants
      - counts cascaded children
      - excludes independently-deleted descendants from the count
      - empty result when parent is still active
      - throws on a non-soft-deletable model name (typo protection)
- [x] `[BE]` Tuned helper to omit zero-count entries from the response
      (cleaner FE rendering — "Restoring will also restore 0 items"
      noise eliminated).
- [x] **Total: 51/51 passing.**

### 1.11 Regenerate FE types — ✅ done
- [x] `[FE]` `npm run api:types` ran successfully against the live
      backend. `schema.d.ts` confirmed to carry the new paths
      (restore + restore-preview), `includeDeleted` / `onlyDeleted`
      query params, and `deletedBy` / `deletedByCascade` fields on each
      soft-deletable entity.

---

## Phase 2 — Frontend plumbing — ✅ done

> All sub-tasks below landed in a single FE pass. BE controllers also got
> `@ApiQuery({ required: false })` annotations on `includeDeleted` /
> `onlyDeleted` query params so the generated FE schema marks them
> optional — without that, openapi-fetch types treat them as required
> and break every caller.

### 2.1 Hooks + keys — ✅ done
- [x] `[FE]` `members/tenant/hooks.ts`: list accepts
      `{ includeDeleted, onlyDeleted }`; detail accepts
      `{ includeDeleted, enabled }`; new `useRestoreMember()`.
- [x] `[FE]` `members/keys.ts`: added restore path.
- [x] `[FE]` Same for `campaigns`, `pledges`, `transactions`, `tenants`.
- [x] `[FE]` `useRestoreCampaignItem()` and `useCampaignRestorePreview()`
      added in `campaigns/tenant/hooks.ts`.
- [x] `[FE]` `useTenants()` accepts an optional 3-state filter query.
- [ ] **Deferred** `[FE]` Self-side detail hooks (`campaigns/self`,
      `pledges/self`) accepting `{ includeDeleted }` — depends on the
      deferred BE self-side endpoints; lands in Phase 5.

### 2.2 Primitives — ✅ done
- [x] `[FE]` **New** `primitives/DeletedLabel.tsx` — muted +
      strike-through text + inline "deleted" pill + tooltip with
      deletion date. Renders a `next/link` when `href` is provided so
      the label clicks through to the archived detail view.
- [x] `[FE]` **New** `primitives/EntityRestoreBanner.tsx` — admin
      variant (Archive icon + dated message + Restore button) and
      `memberVariant` (no actor name, no restore button).
- [x] `[FE]` **New** `primitives/StateFilter.tsx` — wraps
      `SegmentedControl` with `Active / Deleted / All` options and
      exports a `toStateFilterFlags(value)` helper that maps to
      `{ includeDeleted?, onlyDeleted? }` for the API.
- [ ] **Deferred** `[FE]` `MemberPicker` / `FormMemberPicker` selected-
      deleted fallback — lands in Phase 3 alongside the table cells
      that consume `DeletedLabel`.

### 2.3 Modals — ✅ done
- [x] `[FE]` **New** `confirm-restore-member`.
- [x] `[FE]` **New** `confirm-restore-pledge`.
- [x] `[FE]` **New** `confirm-restore-transaction`.
- [x] `[FE]` **New** `confirm-restore-campaign-item`.
- [x] `[FE]` **New** `confirm-restore-campaign` — calls
      `useCampaignRestorePreview` and renders a pluralised cascade-count
      line ("Restoring will also bring back N items…").
- [ ] **Deferred** `[FE]` Extend `confirm-restore-tenant` with a
      cascade preview — Tenant has no cascaded descendants so there's
      no preview endpoint to consume. Existing modal stays as-is.
- [x] `[FE]` Barrel (`components/modals/index.ts`) + registry
      (`lib/modals/host.tsx`) updated for all 5 new modals.

---

## Phase 3 — Mode B (label) treatment — ✅ done (admin side)

> Primitives `DeletedLabel`, `EntityRestoreBanner`, `StateFilter` were
> exported from the primitives barrel as part of this phase so they can
> be consumed alongside the existing primitives. `DeletedLabel.deletedAt`
> + `EntityRestoreBanner.deletedAt` widened to `unknown` — the generated
> openapi-fetch schema types `deletedAt` as `Record<string, never> | null`,
> so a `Date | string | null` typing would have forced every call site to
> coerce.

- [x] `[FE]` `MembersTable` — member name cell shows Mode-B when the row
      itself is a tombstone (preview of Phase 4 archived-row treatment).
- [x] `[FE]` `CampaignsTable` — title cell shows Mode-B for archived
      campaigns.
- [x] `[FE]` `PledgesTable` — member cell + campaign cell.
- [x] `[FE]` `TransactionsTable` — member cell + campaign cell.
- [x] `[FE]` `MemberPledges` — campaign cell (now resolves titles via
      `useCampaigns({ includeDeleted })`).
- [ ] **Deferred to Phase 5** `[FE]` `MemberTransactions` — member-side
      polish; depends on `useMyCampaigns({ includeDeleted })` which lands
      with the deferred BE self-side endpoints.
- [x] `[FE]` `MemberRecentGiving` — no campaign cell, nothing to do.
- [x] `[FE]` Audit log table — built as part of the audit-feature effort
      ([AuditLogPage.tsx](../src/components/pages/super-admin/audit/AuditLogPage.tsx)).
      Each row shows the actor, action badge, entity + truncated id,
      tenant name (resolved via `useTenants({ includeDeleted: true })`),
      and a relative timestamp with absolute tooltip. Soft-delete
      Mode-B doesn't apply here — audit rows ARE the deletion record,
      not a downstream consumer of one.
- [x] `[FE]` `PledgeDetailPage` — header member + campaign references
      use Mode-B, with `useMembers` / `useCampaigns` look-ups now
      `includeDeleted: true`.
- [x] `[FE]` `TransactionDetailPage` — attribution member, campaign,
      pledge cells all use Mode-B; detail hooks now request
      `includeDeleted: true`.
- [ ] **Deferred to Phase 4** `[FE]` `MemberDetailPage` — sub-table
      cells; coupled with Phase 4 banner + read-only treatment for the
      same page.
- [x] `[FE]` `CampaignDetailPage` — `CampaignItemsList` rows wrap title
      in `DeletedLabel` when the item is archived;
      `CampaignPledgesList` member + linked-item cells use Mode-B.
- [x] `[FE]` `MemberPicker` — chosen-display wraps the name in
      `DeletedLabel` when the selected member is archived. `MemberOption`
      gained `deletedAt`.
- [x] `[FE]` `TransactionsListPage` + `PledgesListPage` lookup queries
      now request `includeDeleted: true` so the table renderers can
      resolve archived references.

---

## Phase 4 — Mode C (archive view) treatment — ✅ done (admin side)

> `DataTable` primitive gained a `rowClassName?: (row) => string | undefined`
> prop so consumers can tint tombstone rows. All list tables now pass
> `rowClassName={(r) => r.deletedAt ? "bg-muted/30" : undefined}` and a
> `RowActionsMenu` with a single Restore entry when the row is archived.

### 4.1 List-page filters — ✅ done
- [x] `[FE]` `MembersListPage` — `StateFilter` composes with status + linked
      filters; default is Active.
- [x] `[FE]` `CampaignsListPage` — `StateFilter`; backend-side state filter,
      status + search stay client-side.
- [x] `[FE]` `PledgesListPage` — `StateFilter`; composes with status filter.
- [x] `[FE]` `TransactionsListPage` — `StateFilter`; composes with
      type/date/campaign filters.
- [x] `[FE]` `super-admin/tenants/TenantsPage` — `StateFilter`; default is
      Active (behavior change — `useTenants` now requires explicit flags
      to include archived tenants).

### 4.2 Conditional row treatment — ✅ done
- [x] `[FE]` Every list table tints `deletedAt != null` rows with
      `bg-muted/30` via the new `rowClassName` prop and swaps the
      `RowActionsMenu` to a single Restore entry. CampaignsTable +
      TenantsPage also show an inline Archived badge.
- [ ] **Deferred (low value)** `[FE]` Conditional "Deleted on" / "Deleted by"
      columns. The DeletedLabel tooltip already exposes the deletion date,
      and `deletedBy` carries an internal User.id (not a display name) — a
      dedicated column would surface a UUID. Revisit when the
      `deletedByUser` snapshot resolver lands.
- [ ] **Deferred** `[FE]` "(cascaded)" marker driven by `deletedByCascade`.
      The flag is already on the wire; renderer is the only missing piece.
      Will land alongside the cascade-preview-on-restore UX for
      non-Campaign entities (which has no BE endpoint today).

### 4.3 Inline filters in detail pages — ✅ done (scoped to what BE supports)
- [x] `[FE]` `CampaignDetailPage`: items sub-section uses an inline
      `StateFilter` (rendered in `CampaignItemsList` header via new
      `stateFilter` slot prop). Switches flow through to
      `useCampaign({ includeDeleted | onlyDeleted })` so the items
      embedded in the campaign payload reflect the filter.
- [ ] **Deferred** `[FE]` `MemberDetailPage` pledges / giving inline
      `StateFilter` — requires `usePledges({ memberId, includeDeleted })`
      / `useTransactions({ memberId, includeDeleted })`, which already
      work, but the small inline tables (`MemberPledges`,
      `MemberRecentGiving`) currently aren't built to swap their query
      key. Land alongside Phase 5 cleanup if needed; low ROI for v1.

### 4.4 Detail-page banner + read-only — ✅ done
- [x] `[FE]` `MemberDetailPage` — `useMember({ includeDeleted: true })`,
      banner above content, action buttons (Edit / Merge / Remove /
      Send invite) hidden when archived.
- [x] `[FE]` `CampaignDetailPage` — banner; Edit / Cancel / Delete
      hidden when archived; restore button via banner.
- [x] `[FE]` `PledgeDetailPage` — `usePledge({ includeDeleted: true })`,
      banner above hero card.
- [x] `[FE]` `TransactionDetailPage` —
      `useTransaction({ includeDeleted: true })`, banner above details,
      Delete hidden when archived.
- [x] `[FE]` `TenantDetailPage` — banner uses the new
      `EntityRestoreBanner` primitive in addition to the existing inline
      Archived badge + Restore button.

### 4.5 Row-level operations on deleted parents — ✅ done
- [x] `[FE]` Detail pages hide Edit / Delete / Cancel / Merge / Send-invite
      buttons in the header when the parent is archived (only Back +
      banner-driven Restore remain). `CampaignItemsList` row menus drop
      to Restore-only on archived items; `CampaignPledgesList` disables
      Add pledge + drops row actions entirely when the parent campaign
      is archived (or when a pledge row itself is archived).

---

## Phase 5 — Member-side polish — ✅ done

> Member surfaces never get a 3-state archive switcher; the
> `includeDeleted=true` opt-in on self-side endpoints is used internally
> so deleted references can render Mode-B (`DeletedLabel`) labels and
> the member-variant banner.

- [x] `[BE]` `campaign.self` `GET :id` accepts `?includeDeleted=true`.
- [x] `[BE]` `pledge.self` `GET :id` accepts `?includeDeleted=true`.
- [x] `[BE]` `campaign.self` / `pledge.self` filter DTOs extend
      `StateFilterRequestDto` (used internally by the FE for lookup
      tables — no member-facing 3-state UI).
- [x] `[BE]` Member-facing response DTOs strip `deletedBy` (defense in
      depth — the internal `User.id` of an actor must not be exposed to
      members): `MyCampaignResponseDto`, `MyCampaignItemResponseDto`,
      `MyCampaignWithItemsResponseDto`, `MyPledgeResponseDto`,
      `MyTransactionResponseDto`, `MyProfileResponseDto`. `deletedAt`
      and `deletedByCascade` remain so banners and downstream
      components keep working.
- [x] `[FE]` `useMyCampaign` and `useMyPledge` accept
      `{ includeDeleted }`; `useMyCampaigns` accepts an options bag with
      `{ includeDeleted }` (default empty — existing call sites
      unaffected by the signature change).
- [x] `[FE]` `MemberPledgeDetailPage` — fetches with
      `includeDeleted: true`, renders `EntityRestoreBanner`
      (member-variant) when either the pledge or its parent campaign is
      archived; subtitle uses `DeletedLabel` for the campaign title.
- [x] `[FE]` `MemberMyPledgesPage` — campaigns lookup fetches with
      `includeDeleted: true`; `MemberPledgesTable` renders the campaign
      cell through `DeletedLabel` when the campaign is archived.
- [x] `[FE]` `MemberTransactions` — campaigns lookup fetches with
      `includeDeleted: true`; the Campaign column renders archived
      references via `DeletedLabel`. **No filter** exposed (per spec).
- [x] `[FE]` `MemberCampaignDetailPage` — built out the page (no longer
      a `ScaffoldPage`). Read-only member view of the campaign with
      goal/progress, items, and a "Your pledges" sub-table. Fetches with
      `includeDeleted: true`, renders member-variant
      `EntityRestoreBanner` + `DeletedLabel` title when archived,
      suppresses the live progress bar for archived campaigns, hides
      the Make-a-pledge CTA when archived or past. Archived items show
      a `DeletedLabel` and no progress bar.

---

## Phase 6 — Final pass

- [x] `[ALL]` `npm run typecheck` (FE) + `npx tsc --noEmit` (BE) clean.
- [x] `[ALL]` `npm run check` (FE) — UI primitive linter + Biome.
      (16 pre-existing warnings unchanged.)
- [x] `[BE]` `npx biome check .` clean.
- [x] `[BE]` `npm run test:integration` — 57/57 green.
- [x] `[FE]` `npm run build` clean.
- [ ] `[FE]` Manual smoke: delete a member → see Mode B in transactions →
      navigate to archived member detail → restore → verify everywhere.
- [ ] `[FE]` Manual smoke: delete a campaign with items + pledges → verify
      preview count → restore → verify cascade restoration.
- [ ] `[FE]` Manual smoke: as a member, pledge to a campaign → admin deletes
      campaign → member views pledge → click campaign → banner-only view.
- [x] `[FE]` Audit log: built — see [AuditLogPage.tsx](../src/components/pages/super-admin/audit/AuditLogPage.tsx)
      and the new BE `audit-feature` module
      ([audit.platform.controller.ts](../../church-app-backend/src/modules/features/audit-feature/controllers/platform/audit.platform.controller.ts)).
      Mode-B is intentionally NOT applied to audit rows: an audit event
      IS the deletion record, not a downstream reference to one.

---

## Phase 7 — Member-side pages + audit UI — ✅ done

> Added 2026-05-17 as a follow-up to Phase 5. Two pages that had been
> deferred ship together.

### 7.1 MemberCampaignDetailPage — ✅ done
- [x] `[FE]` Replaced the `ScaffoldPage` placeholder with a real read-
      only member view ([MemberCampaignDetailPage.tsx](../src/components/pages/member-campaigns/MemberCampaignDetailPage.tsx)).
- [x] `[FE]` `useMyCampaign({ includeDeleted: true })` so the page
      resolves for archived campaigns; member-variant
      `EntityRestoreBanner` + `DeletedLabel` title when archived.
- [x] `[FE]` Live progress query skipped when archived; per-item
      progress bars suppressed for archived items; archived item titles
      wrapped in `DeletedLabel`.
- [x] `[FE]` "Your pledges" sub-table backed by
      `useMyPledges(tenantSlug, { campaignId })`; rows link to the
      member pledge detail page.
- [x] `[FE]` Make-a-pledge CTA reuses the existing `member-pledge`
      modal; hidden when the campaign is archived or past
      (`COMPLETED` / `CANCELLED`).

### 7.2 Audit feature (backend) — ✅ done
- [x] `[BE]` New shared DTO at
      [audit-event.dto.ts](../../church-app-backend/src/shared/dto/audit-event.dto.ts)
      mirroring every column on `AuditEvent`.
- [x] `[BE]` New `audit-feature` module ([audit-feature.module.ts](../../church-app-backend/src/modules/features/audit-feature/audit-feature.module.ts))
      with a `platform/` intent only:
      `GET /api/v1/platform/audit` returning a paginated list filtered
      by `tenantId`, `entity`, `entityId`, `actorUid`, `action`, with
      `offset` + `limit` (capped at 200).
- [x] `[BE]` `@Roles("SUPER_ADMIN")` + `assertCan(ability, "read",
      "PlatformAdmin")` — same shape as the existing admin-feature
      controller; no new CASL subject needed (super-admin already has
      `manage all`).
- [x] `[BE]` `AuditEventFilters` + `AuditRepository.findAll` extended
      to filter by `action`. No DB migration — the action column
      already exists.
- [x] `[BE]` Wired into `main.module.ts:featureModules`.

### 7.3 Audit feature (frontend) — ✅ done
- [x] `[FE]` Hooks + keys at [audit/](../src/lib/api/audit/) under
      `audit/platform/`. Exported through the top-level `@/lib/api`
      barrel.
- [x] `[FE]` Page at [AuditLogPage.tsx](../src/components/pages/super-admin/audit/AuditLogPage.tsx).
      Filter bar: action chips (CREATE / UPDATE / DELETE / RESTORE /
      ROLE_CHANGE / MEMBERSHIP_CHANGE), entity select, tenant select
      (resolved via `useTenants({ includeDeleted: true })`), free-text
      actor email/UID search (client-side over the fetched page).
      Columns: relative time (with absolute tooltip via `Tooltip`
      primitive), action `Badge`, entity + truncated id, summary,
      tenant name (or "Platform" italic when `tenantId` is null), actor
      (email + truncated UID with full UID in tooltip). 50-row
      pagination via Prev/Next buttons.

---

## Notes / decisions log

- **2026-05-16** — All open questions decided (see analysis doc §9).
- **2026-05-16** — Cascade actor propagation verified in helper. No code
  change needed; documented in pre-flight.
- **2026-05-16** — Chose response-time `deletedByUser` resolver over a
  `deletedById` schema migration (revisit if join cost surfaces).
- **2026-05-16** — Phase 0 verification: only one `onDelete: Cascade` edge
  in the schema (`CampaignItem → Campaign`). Restore-preview scope reduced
  to Campaign only; Tenant/Member/Pledge/Transaction get plain confirms.
- **2026-05-16** — Audit feature deferred entirely (FE audit page is just
  a `ScaffoldPage`). `AuditEvent.actorId` column + actor snapshot resolver
  move to a separate audit-feature effort.
- **2026-05-16** — Further deferred `deletedByUser` resolver itself for
  v1 (use raw firebase UID on the wire). Keeps Phase 1.1 to a 6-DTO patch
  with no schema migrations.
- **2026-05-16** — Phase 1.1 (DTO field exposure) and Phase 1.3 (CASL
  `restore` action) shipped. BE typecheck clean.
- **2026-05-16** — Q2 revised: `deletedBy` stores internal `User.id`, not
  firebase UID. Resolution happens at the feature-service layer (no
  schema migration, no AuthUser change). Q6 reversed: self-side DTOs
  keep the full soft-delete fields so members can render the read-only
  banner when navigating to a deleted referenced entity. Phase 1.1b
  shipped: 4 feature modules now inject `UserService`; member-merging
  input split into `actorUid` (audit) and `actorId` (soft-delete);
  CLAUDE.md updated.
- **2026-05-16** — Next chunk: Phase 1.2 (Campaign restore-preview
  helper) + Phase 1.4–1.8 (per-entity restore endpoints + `includeDeleted`
  / `onlyDeleted` flags).
- **2026-05-16** — **Phase 2 shipped.** FE hooks expose 3-state filters
  on every entity list, `useRestore*` mutations for all 5 entities,
  `useCampaignRestorePreview`. New primitives: `DeletedLabel`,
  `EntityRestoreBanner` (admin + member variants), `StateFilter` +
  `toStateFilterFlags`. New restore modals (5) wired into the
  registry. BE controllers updated with `@ApiQuery({ required: false })`
  on all `includeDeleted` / `onlyDeleted` params — without this, the
  generated FE types treat them as required and every caller breaks.
  FE typecheck + `npm run check` clean (16 pre-existing warnings
  unrelated to soft-delete). MemberPicker fallback + tenant-side
  cascade-preview-on-restore-modal both deferred to Phase 3/4 alongside
  the consumers.
- **2026-05-16** — Phase 1.10 + 1.11 closed. 5 new
  `previewRestoreCascade` integration tests added (51/51 passing);
  helper updated to drop zero-count cascade entries; FE schema
  regenerated and verified. Phase 2 (FE plumbing) ready to start.
- **2026-05-16** — **Walker bug fix + filter centralization.** `mergeDeletedAt`
  in [soft-delete.walker.ts](../../church-app-backend/src/infrastructure/prisma-client/soft-delete/soft-delete.walker.ts)
  now respects an explicit `deletedAt` filter in BOTH filter mode AND
  bypass mode — previously bypass mode unconditionally overwrote it,
  which silently widened `where: { deletedAt: { not: null } }` (the
  "Deleted" slice) back to "all rows", so every list endpoint's
  Deleted/All buckets returned identical results. Added a shared
  `applyStateFilter(modelName, baseWhere, flags)` helper +
  `StateFilterRequestDto` base class to centralize the 3-state encoding;
  refactored all 6 list repositories (Member, Campaign, CampaignItem,
  Pledge, Transaction, Tenant) and 5 filter DTOs onto the helper.
  Added 6 integration tests covering Active / Deleted / All /
  precedence / no-op wrap / count+aggregate paths. 57/57 tests pass.
  BE typecheck + biome clean; FE typecheck clean.
- **2026-05-17** — **Phase 7 shipped.** Two pages that had been deferred
  out of earlier phases are now live:
  * `MemberCampaignDetailPage` replaced its `ScaffoldPage` placeholder
    with a real read-only member view (goal/progress, items, "Your
    pledges" sub-table, archived-state handling, banner + DeletedLabel).
  * `audit-feature` shipped end-to-end. New shared
    `AuditEventDto` + `AuditPlatformController` exposing
    `GET /api/v1/platform/audit` with action / entity / tenant / actor
    filters and 200-row max pagination. FE hooks under
    `@/lib/api/audit`; super-admin page replaces the audit
    `ScaffoldPage` with chips + selects + actor search + paginated
    table. `AuditEventFilters` + repo gained an `action` filter (no DB
    change — column already existed).

  No new CASL subject was added — super-admins already carry
  `manage all`. Audit rows are intentionally NOT given Mode-B treatment
  because an audit event IS the deletion record, not a downstream
  consumer of one. Mode-B and the StateFilter never apply to the audit
  log.

  Gates: BE typecheck + biome clean, integration tests 57/57; FE
  typecheck + `npm run check` + `npm run build` clean.
- **2026-05-17** — **Phase 5 shipped + Phase 6 automated checks green.**
  Self-side detail endpoints (`campaign.self`, `pledge.self`) accept
  `?includeDeleted=true`; their filter DTOs extend `StateFilterRequestDto`
  for completeness (no member-facing 3-state UI). Self-side response
  DTOs (`MyCampaign*`, `MyPledge*`, `MyTransaction*`, `MyProfile*`)
  strip `deletedBy` so an internal `User.id` is never exposed to a
  member; `deletedAt` and `deletedByCascade` remain to keep banners and
  downstream typing intact. FE: `useMyCampaign`/`useMyPledge` accept
  `{ includeDeleted }`; `useMyCampaigns` takes an options bag with the
  same flag (backwards-compatible). `MemberPledgeDetailPage` renders
  `EntityRestoreBanner` (member-variant) when the pledge or its parent
  campaign is archived; `MemberMyPledgesPage` + `MemberTransactions`
  render archived campaign references via `DeletedLabel`. FE
  typecheck + `npm run check` + `npm run build` clean; BE typecheck +
  biome clean; integration tests 57/57. `MemberCampaignDetailPage`
  banner deferred — the page is still a `ScaffoldPage` placeholder.
  Manual smokes still TODO.
  > Side cleanup: removed a stray 0-byte non-UTF-8 file
  > (`./4�@W@8`) at the FE repo root that was blocking biome from
  > walking the tree.
- **2026-05-16** — **Phase 4 shipped (admin side).** `DataTable` primitive
  gained a `rowClassName` prop. Admin list pages — Members, Campaigns,
  Pledges, Transactions, super-admin Tenants — all expose `StateFilter`
  and thread `toStateFilterFlags(state)` through their list hooks. List
  tables tint archived rows + collapse the row actions to a single
  Restore entry; restore modals open via the existing registry. Detail
  pages — Member, Campaign, Pledge, Transaction, Tenant — fetch with
  `includeDeleted: true`, render `EntityRestoreBanner` when archived,
  and hide all mutation buttons. CampaignDetailPage gained an inline
  items `StateFilter` via a new `stateFilter` slot on
  `CampaignItemsList`; CampaignPledgesList accepts a `parentDeleted`
  flag to disable Add + row actions when the parent is archived.
  Typecheck + `npm run check` clean (16 pre-existing warnings
  unchanged). Deferred: per-table "Deleted on"/"Deleted by" columns
  (low value while `deletedBy` is just a User.id), "(cascaded)" marker,
  MemberDetailPage inline StateFilter on pledges/giving sub-tables
  (low ROI for v1).
- **2026-05-16** — **Phase 3 shipped.** Mode-B (`DeletedLabel`) treatment
  applied across admin tables + detail pages — Members, Campaigns,
  Pledges, Transactions list tables; PledgeDetailPage header;
  TransactionDetailPage attribution; CampaignItemsList + CampaignPledgesList
  sub-tables; MemberPicker chosen-display fallback. List-page lookup
  queries (TransactionsListPage, PledgesListPage, PledgeDetailPage,
  TransactionDetailPage attribution, CampaignPledgesList members,
  MemberPledges campaigns) now fetch `includeDeleted: true` so the
  renderers can resolve archived references. Primitives barrel exports
  `DeletedLabel`, `EntityRestoreBanner`, `StateFilter` + `toStateFilterFlags`.
  Widened `deletedAt` typing on the two banner/label primitives to
  `unknown` to absorb the `Record<string, never> | null` shape from the
  generated schema. Typecheck + `npm run check` clean (16 pre-existing
  warnings unchanged). Deferred:  MemberTransactions (member-side polish
  → Phase 5), MemberDetailPage sub-tables (coupled with Phase 4 banner),
  Audit log Mode-B (depends on audit UI which is still scaffold).
- **2026-05-16** — **Phase 1 BE complete.** Restore + filter endpoints for
  Member, Campaign, CampaignItem, Pledge, Transaction, Tenant. Cascade
  preview helper + endpoint for Campaign (only entity with cascaded
  children). All filter DTOs accept `includeDeleted` / `onlyDeleted`.
  Detail endpoints accept `?includeDeleted=true`. Tenant restore + per-
  entity restores assert the new `restore` CASL action. Typecheck +
  Biome clean. 46 integration tests pass.
  Member-side detail endpoints (`campaign.self`, `pledge.self`) for
  `?includeDeleted=true` deferred to Phase 5 alongside the FE banner
  work. Targeted soft-delete integration test suites deferred alongside
  FE rollout.

---

## Appendix — Deferred / not implemented (as of 2026-05-17)

A consolidated list of everything still open after Phases 0–7. Items
are grouped by reason so we can decide which to revisit and which to
close out permanently.

### A. Pending follow-up (will likely land)

- **Manual smoke tests (Phase 6).** Three flows still need a human pass:
  - Delete a member → see Mode B in transactions → navigate to
    archived member detail → restore → verify everywhere.
  - Delete a campaign with items + pledges → verify restore-preview
    count → restore → verify cascade restoration.
  - As a member, pledge to a campaign → admin deletes campaign →
    member opens pledge → click campaign → banner-only view.
  *Why open:* automated gates are green but no human has walked the
  flows end-to-end yet. No code work required.

### B. Deferred — low value for v1

- **"Deleted on" / "Deleted by" table columns.** `DeletedLabel` already
  exposes the deletion date via tooltip, and `deletedBy` is a raw
  internal `User.id` (UUID) rather than a display name — adding a
  dedicated column would surface a UUID. Revisit when a
  `deletedByUser: UserSnapshotDto` resolver lands so the column can
  show a person, not a UUID.
- **`deletedByCascade` "(cascaded)" marker.** The flag is on the wire;
  only the renderer is missing. Will land naturally if/when restore
  previews ship for non-Campaign entities (which has no BE endpoint
  today either — Phase 0 confirmed only `CampaignItem → Campaign`
  cascades).
- **Inline StateFilter on MemberDetailPage sub-tables** (`MemberPledges`,
  `MemberRecentGiving`). The hooks already support `includeDeleted`,
  but those small inline tables don't have UI to swap their query key.
  Low ROI for v1 — admins can use the dedicated Pledges /
  Transactions list pages with state filtering instead.

### C. Deferred — needs a separate effort

- **`deletedByUser: UserSnapshotDto` resolver.** A response-time
  resolver that turns `deletedBy: User.id` into a display name + email
  snapshot. Decided 2026-05-16 to ship v1 with raw `User.id` on the
  wire (avoids a 6-DTO schema migration). Unblocks the deferred
  "Deleted on / Deleted by" columns above.
- **`AuditEvent.actorId` column + audit DTO `actor` snapshot.** Audit
  log currently stores only `actorUid` (Firebase) + `actorEmail`
  snapshot. Adding `actorId` (internal User.id) is a column-level
  change that parallels the `deletedBy` v1 → v2 path. Not blocking the
  audit UI we shipped today; revisit when account-deletion edge cases
  bite.
- **`MemberPicker` / `FormMemberPicker` selected-deleted fallback.**
  The dropdown choices already filter out tombstones; the *selected*
  display already wraps an archived name in `DeletedLabel`. The
  remaining bit is restoring an archived selection from a saved form
  draft, which doesn't have a real user flow today.

### D. Out of scope — won't be implemented

- **`?includeDeleted` on the transactions self-side detail endpoint.**
  Transactions are leaves with no soft-deletable parents to navigate
  through. Members already can't reach a deleted transaction by id —
  there's no UI link source. Adding the flag would be dead code.
- **Restore-preview endpoint for Tenant / Member / Pledge / Transaction.**
  Per Phase 0 (`prisma/schema/*`), only `CampaignItem → Campaign`
  carries `onDelete: Cascade`. The other four entities have zero
  cascaded descendants, so the preview would always return an empty
  `{}`. Plain confirm modals are the correct UX.
- **Mode-B treatment on audit-log rows.** Audit rows ARE the deletion
  record. Treating an audit row as a downstream reference to a deleted
  entity would be a category error. Filter chips + entity selector
  cover the "show me only deletes" intent without overlaying
  `DeletedLabel`.
- **`StateFilter` on member-facing surfaces.** Per the analysis doc
  §5, members never get an admin-style 3-state archive switcher; the
  self-side `includeDeleted` flag is used internally only to resolve
  Mode-B labels.
- **`deletedBy` on member-facing wire format.** Stripped from
  `MyCampaign*` / `MyPledge* / MyTransaction* / MyProfile*` (Phase 5).
  Exposing an internal `User.id` to a member would leak the actor's
  identity even though the FE has nothing to do with it.
