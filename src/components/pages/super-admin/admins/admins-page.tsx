"use client";

import { useMemo } from "react";
import {
	Avatar,
	Badge,
	Button,
	type DataTableColumn,
	DataTableShell,
	DeletedLabel,
	ExpandableCard,
	PageHeader,
	RowActionsMenu,
	useTableFilters,
} from "@/components/primitives";
import { useAdminStats, useAdminUsers } from "@/lib/api/admin";
import type { components } from "@/lib/api/schema";
import { useTenants } from "@/lib/api/tenants";
import dayjs from "@/lib/dayjs";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { openModal } from "@/lib/modals/store";

type AdminUser = components["schemas"]["AdminUserDto"];

const ROLE_OPTIONS = [
	{ value: "all", label: "All admins" },
	{ value: "super-admin", label: "Super admins only" },
];

export const AdminsPage = () => {
	const t = useTableFilters({
		search: "",
		tenant: "all",
		role: "all",
		state: "active",
	});

	const { data: stats } = useAdminStats();
	const { data: tenantsData } = useTenants();
	const tenants = tenantsData?.items ?? [];

	const { data: usersData, isLoading } = useAdminUsers({
		search: t.values.search || undefined,
		tenantId: t.values.tenant === "all" ? undefined : t.values.tenant,
		superAdminOnly: t.values.role === "super-admin" ? true : undefined,
		skip: t.offset,
		take: t.limit,
		...t.stateFlags(),
	});

	const users: AdminUser[] = usersData?.items ?? [];
	const total = usersData?.total ?? 0;

	const columns: DataTableColumn<AdminUser>[] = [
		{
			key: "user",
			label: "User",
			render: (u) => {
				const archived = Boolean(
					(u as { deletedAt?: string | null }).deletedAt,
				);
				const archivedAt = (u as { deletedAt?: string | null }).deletedAt;
				return (
					<span className="inline-flex items-center gap-2.5">
						<Avatar
							name={u.displayName}
							src={(u.photoUrl as string | undefined) ?? undefined}
							size={32}
						/>
						<div>
							<div className="flex items-center gap-2 text-sm font-medium">
								{archived ? (
									<DeletedLabel deletedAt={archivedAt}>
										{u.displayName}
									</DeletedLabel>
								) : (
									u.displayName
								)}
							</div>
							<div className="text-xs text-muted-foreground">{u.email}</div>
						</div>
					</span>
				);
			},
		},
		{
			key: "churches",
			label: "Churches",
			render: (u) => {
				const adminMemberships = u.memberships.filter(
					(m) => m.role === "ADMIN",
				);
				return (
					<span className="flex flex-wrap gap-1">
						{adminMemberships.length === 0 ? (
							<span className="text-xs text-muted-foreground">No churches</span>
						) : (
							adminMemberships.map((m) => (
								<Badge key={m.tenantId} color="indigo">
									{m.tenantName}
								</Badge>
							))
						)}
					</span>
				);
			},
		},
		{
			key: "superAdmin",
			label: "Super admin",
			width: "120px",
			align: "center",
			render: (u) =>
				u.isSuperAdmin ? (
					<Badge color="indigo">Super admin</Badge>
				) : (
					<span className="text-sm text-muted-foreground">—</span>
				),
		},
		{
			key: "joined",
			label: "Joined",
			width: "130px",
			render: (u) => (
				<span className="text-sm text-muted-foreground">
					{dayjs(u.createdAt).format("MMM D, YYYY")}
				</span>
			),
		},
		{
			key: "actions",
			label: "",
			width: "48px",
			align: "right",
			overflow: "visible",
			render: (u) => (
				<RowActionsMenu
					actions={[
						{
							label: u.isSuperAdmin
								? "Demote from super admin"
								: "Promote to super admin",
							onClick: () =>
								openModal("confirm-toggle-super-admin", {
									userId: u.id,
									userName: u.displayName,
									currentIsSuperAdmin: u.isSuperAdmin,
								}),
							destructive: u.isSuperAdmin,
						},
					]}
				/>
			),
		},
	];

	// Sub-`md` row → expandable card. Collapsed: avatar + identity + super-admin
	// pill. Expanded: churches, super-admin, joined.
	const renderAdminCard = (u: AdminUser) => {
		const archived = Boolean((u as { deletedAt?: string | null }).deletedAt);
		const archivedAt = (u as { deletedAt?: string | null }).deletedAt;
		const adminMemberships = u.memberships.filter((m) => m.role === "ADMIN");
		return (
			<ExpandableCard
				deleted={archived}
				details={[
					{
						label: "Churches",
						value:
							adminMemberships.length === 0 ? (
								<span className="text-sm text-muted-foreground">
									No churches
								</span>
							) : (
								<span className="flex flex-wrap justify-end gap-1">
									{adminMemberships.map((m) => (
										<Badge key={m.tenantId} color="indigo">
											{m.tenantName}
										</Badge>
									))}
								</span>
							),
					},
					{
						label: "Super admin",
						value: u.isSuperAdmin ? (
							<Badge color="indigo">Yes</Badge>
						) : (
							<span className="text-sm text-muted-foreground">No</span>
						),
					},
					{
						label: "Joined",
						value: (
							<span className="text-sm font-medium text-foreground">
								{dayjs(u.createdAt).format("MMM D, YYYY")}
							</span>
						),
					},
				]}
			>
				<div className="flex items-center gap-3">
					<Avatar
						name={u.displayName}
						src={(u.photoUrl as string | undefined) ?? undefined}
						size={40}
					/>
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold tracking-tight">
							{archived ? (
								<DeletedLabel deletedAt={archivedAt}>
									{u.displayName}
								</DeletedLabel>
							) : (
								u.displayName
							)}
						</div>
						<div className="truncate text-xs text-muted-foreground">
							{u.email}
						</div>
					</div>
					{u.isSuperAdmin && (
						<Badge color="indigo" className="shrink-0">
							Super
						</Badge>
					)}
				</div>
			</ExpandableCard>
		);
	};

	useMobileActions(
		useMemo(
			() => [
				{
					label: "Invite admin",
					icon: "plus" as const,
					onClick: () => openModal("invite-admin-global", {}),
				},
			],
			[],
		),
	);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="Platform"
				title="Admins"
				subtitle="Everyone with admin access across all churches."
				action={
					<Button
						icon="plus"
						role="primary"
						className="hidden md:inline-flex"
						onClick={() => openModal("invite-admin-global", {})}
					>
						Invite admin
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-4 pb-28 md:px-8 md:pb-8">
				<DataTableShell<AdminUser>
					stats={[
						{ label: "Super admins", value: stats?.superAdmins ?? "—" },
						{ label: "Tenant admins", value: stats?.totalAdmins ?? "—" },
					]}
					search={t.search("Search by name or email…")}
					filters={[
						t.select("tenant", "Church", [
							{ value: "all", label: "All churches" },
							...tenants.map((tenant) => ({
								value: tenant.id,
								label: tenant.name,
							})),
						]),
						t.select("role", "Role scope", ROLE_OPTIONS),
						t.state(),
					]}
					onClearFilters={t.clear}
					columns={columns}
					mobileCard={renderAdminCard}
					rows={users}
					rowKey={(u) => u.id}
					loading={isLoading}
					emptyTitle="No admin users yet"
					emptySubtitle={
						t.values.search ||
						t.values.tenant !== "all" ||
						t.values.role !== "all"
							? "No users match the current filters."
							: "Invite your first admin to get started."
					}
					pagination={t.pagination(total)}
				/>
			</div>
		</div>
	);
};
