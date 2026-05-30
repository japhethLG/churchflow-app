"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
	AvatarStack,
	Badge,
	Button,
	type DataTableColumn,
	DataTableShell,
	DeletedLabel,
	ExpandableCard,
	PageHeader,
	RowActionsMenu,
	StatCard,
	useTableFilters,
} from "@/components/primitives";
import { useAdminStats } from "@/lib/api/admin";
import type { components } from "@/lib/api/schema";
import { useTenants } from "@/lib/api/tenants";
import dayjs from "@/lib/dayjs";
import { tenantInitials, tenantLogoGradient } from "@/lib/design/logo-gradient";
import { formatCompact } from "@/lib/format-currency";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { openModal } from "@/lib/modals/store";

type Tenant = components["schemas"]["TenantListItemDto"];

const formatMonthYear = (d: Date | string): string => {
	return dayjs(d).format("MMM YYYY");
};

const TenantLogoTile = ({ name, slug }: { name: string; slug: string }) => {
	const { from, to } = tenantLogoGradient(slug);
	return (
		<div
			className="grid size-9 shrink-0 place-items-center rounded-xl text-sm font-semibold text-white"
			style={{
				background: `linear-gradient(135deg, ${from}, ${to})`,
			}}
		>
			{tenantInitials(name)}
		</div>
	);
};

export const TenantsPage = () => {
	const router = useRouter();

	const t = useTableFilters({ search: "", state: "active" });

	const { data: tenantsData, isLoading } = useTenants(t.stateFlags());
	const { data: stats } = useAdminStats();

	const tenants = (tenantsData?.items ?? []) as Tenant[];

	const filtered = useMemo<Tenant[]>(() => {
		const q = t.values.search.trim().toLowerCase();
		if (!q) {
			return tenants;
		}
		return tenants.filter(
			(row) =>
				row.name.toLowerCase().includes(q) ||
				row.slug.toLowerCase().includes(q),
		);
	}, [tenants, t.values.search]);

	const visible = filtered.slice(t.offset, t.offset + t.limit);

	const columns: DataTableColumn<Tenant>[] = [
		{
			key: "church",
			label: "Church",
			render: (t) => (
				<span className="inline-flex items-center gap-3">
					<TenantLogoTile name={t.name} slug={t.slug} />
					<div>
						<div className="flex items-center gap-2 font-medium">
							{t.deletedAt ? (
								<DeletedLabel deletedAt={t.deletedAt} hidePill>
									{t.name}
								</DeletedLabel>
							) : (
								t.name
							)}
							{t.deletedAt && <Badge color="clay">Archived</Badge>}
						</div>
						<div className="text-xs text-muted-foreground">{t.slug}</div>
					</div>
				</span>
			),
		},
		{
			key: "admins",
			label: "Admins",
			width: "220px",
			render: (t) => (
				<AvatarStack
					members={
						t.adminsPreview?.map((a) => ({
							...a,
							photoUrl: (a.photoUrl as unknown as string) ?? null,
						})) ?? []
					}
					count={t.adminCount ?? 0}
				/>
			),
		},
		{
			key: "members",
			label: "Members",
			width: "100px",
			align: "right",
			render: (t) => <span className="tabular-nums">{t.memberCount ?? 0}</span>,
		},
		{
			key: "gifts",
			label: "Gifts (MTD)",
			width: "180px",
			align: "right",
			render: (t) =>
				t.giftsMtdCount ? (
					<span>
						<span className="mr-2 text-xs text-muted-foreground">
							{t.giftsMtdCount} gifts
						</span>
						{formatCompact(t.giftsMtdTotal ?? 0)}
					</span>
				) : (
					<span className="text-muted-foreground">—</span>
				),
		},
		{
			key: "created",
			label: "Created",
			width: "110px",
			render: (t) => (
				<span className="text-sm text-muted-foreground">
					{formatMonthYear(t.createdAt)}
				</span>
			),
		},
		{
			key: "actions",
			label: "",
			width: "48px",
			align: "right",
			overflow: "visible",
			render: (t) => {
				const isDeleted = Boolean(t.deletedAt);
				return (
					<RowActionsMenu
						actions={
							isDeleted
								? [
										{
											label: "Restore church",
											onClick: () =>
												openModal("confirm-restore-tenant", {
													tenantId: t.id,
													tenantName: t.name,
												}),
										},
									]
								: [
										{
											label: "Edit details",
											onClick: () =>
												openModal("edit-tenant", {
													tenantId: t.id,
													currentName: t.name,
												}),
										},
										{
											label: "Rename slug",
											onClick: () =>
												openModal("rename-tenant-slug", {
													tenantId: t.id,
													currentSlug: t.slug,
												}),
										},
										{
											label: "Delete church",
											onClick: () =>
												openModal("confirm-delete-tenant", {
													tenantId: t.id,
													tenantName: t.name,
												}),
											destructive: true,
											separatorBefore: true,
										},
									]
						}
					/>
				);
			},
		},
	];

	// Sub-`md` row → expandable card. Collapsed: logo + identity + members.
	// Expanded: admins, gifts MTD, created.
	const renderTenantCard = (row: Tenant) => (
		<ExpandableCard
			href={`/super-admin/tenants/${row.slug}`}
			deleted={Boolean(row.deletedAt)}
			details={[
				{
					label: "Admins",
					value: (
						<AvatarStack
							members={
								row.adminsPreview?.map((a) => ({
									...a,
									photoUrl: (a.photoUrl as unknown as string) ?? null,
								})) ?? []
							}
							count={row.adminCount ?? 0}
						/>
					),
				},
				{
					label: "Gifts (MTD)",
					value: row.giftsMtdCount ? (
						<span className="text-sm font-medium text-foreground">
							{row.giftsMtdCount} · {formatCompact(row.giftsMtdTotal ?? 0)}
						</span>
					) : (
						<span className="text-sm text-muted-foreground">—</span>
					),
				},
				{
					label: "Created",
					value: (
						<span className="text-sm font-medium text-foreground">
							{formatMonthYear(row.createdAt)}
						</span>
					),
				},
			]}
		>
			<div className="flex items-center gap-3">
				<TenantLogoTile name={row.name} slug={row.slug} />
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="truncate text-sm font-semibold tracking-tight">
							{row.name}
						</span>
						{row.deletedAt && <Badge color="clay">Archived</Badge>}
					</div>
					<div className="truncate text-xs text-muted-foreground">
						{row.slug}
					</div>
				</div>
				<div className="flex shrink-0 flex-col items-end">
					<span className="text-sm font-bold tabular-nums">
						{row.memberCount ?? 0}
					</span>
					<span className="text-[11px] text-muted-foreground">members</span>
				</div>
			</div>
		</ExpandableCard>
	);

	useMobileActions(
		useMemo(
			() => [
				{
					label: "Create church",
					icon: "plus" as const,
					onClick: () => router.push("/super-admin/tenants/new"),
				},
			],
			[router],
		),
	);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="Platform"
				title="Churches"
				subtitle="All churches on ChurchFlow. Create new ones and manage their admins."
				action={
					<Button
						icon="plus"
						role="primary"
						className="hidden md:inline-flex"
						onClick={() => router.push("/super-admin/tenants/new")}
					>
						Create church
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-4 pb-28 space-y-4 md:px-8 md:pb-8">
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
					<StatCard
						label="Churches"
						value={stats?.totalTenants ?? "—"}
						caption={
							stats ? `${stats.createdThisMonth} created this month` : undefined
						}
					/>
					<StatCard
						label="Total admins"
						value={stats?.totalAdmins ?? "—"}
						caption="Across all churches"
					/>
					<StatCard
						label="Total members"
						value={
							stats?.totalMembers != null
								? stats.totalMembers.toLocaleString()
								: "—"
						}
						caption={
							stats ? `${stats.newMembersThisMonth} new this month` : undefined
						}
					/>
					<StatCard
						label="Gifts (30d)"
						value={
							stats?.giftsLast30dTotal != null
								? formatCompact(stats.giftsLast30dTotal)
								: "—"
						}
						caption={
							stats?.giftsLast30dCount != null
								? `${stats.giftsLast30dCount.toLocaleString()} gifts`
								: undefined
						}
						accent
					/>
				</div>

				<DataTableShell<Tenant>
					search={t.search("Search by name or slug…")}
					filters={[t.state()]}
					stats={[{ label: "churches", value: filtered.length }]}
					columns={columns}
					mobileCard={renderTenantCard}
					rows={visible}
					rowKey={(row) => row.id}
					loading={isLoading}
					onRowClick={(row) => router.push(`/super-admin/tenants/${row.slug}`)}
					rowClassName={(row) => (row.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No churches yet"
					emptySubtitle="Create your first church to get started."
					pagination={t.pagination(filtered.length)}
				/>
			</div>
		</div>
	);
};
