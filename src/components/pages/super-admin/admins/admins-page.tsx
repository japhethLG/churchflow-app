"use client";

import { useState } from "react";
import {
	Avatar,
	Badge,
	Button,
	type DataTableColumn,
	DataTableShell,
	DeletedLabel,
	PageHeader,
	RowActionsMenu,
	type StateFilterValue,
	StatPill,
	toStateFilterFlags,
} from "@/components/primitives";
import { useAdminStats, useAdminUsers } from "@/lib/api/admin";
import type { components } from "@/lib/api/schema";
import { useTenants } from "@/lib/api/tenants";
import dayjs from "@/lib/dayjs";
import { openModal } from "@/lib/modals/store";

type AdminUser = components["schemas"]["AdminUserDto"];

type RoleScope = "all" | "super-admin";

const ROLE_OPTIONS = [
	{ value: "all", label: "All admins" },
	{ value: "super-admin", label: "Super admins only" },
];

export const AdminsPage = () => {
	const [search, setSearch] = useState("");
	const [tenantFilter, setTenantFilter] = useState<string>("all");
	const [roleScope, setRoleScope] = useState<RoleScope>("all");
	const [state, setState] = useState<StateFilterValue>("active");
	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(20);

	const { data: stats } = useAdminStats();
	const { data: tenantsData } = useTenants();
	const tenants = tenantsData?.items ?? [];

	const { data: usersData, isLoading } = useAdminUsers({
		search: search || undefined,
		tenantId: tenantFilter === "all" ? undefined : tenantFilter,
		superAdminOnly: roleScope === "super-admin" ? true : undefined,
		skip: offset,
		take: limit,
		...toStateFilterFlags(state),
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

	const resetOffset = () => setOffset(0);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Platform"
				title="Admins"
				subtitle="Everyone with admin access across all churches."
				action={
					<Button
						icon="plus"
						variant="primary"
						onClick={() => openModal("invite-admin-global", {})}
					>
						Invite admin
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8 space-y-4">
				<div className="flex flex-wrap gap-2.5">
					<StatPill label="Super admins" value={stats?.superAdmins ?? "—"} />
					<StatPill label="Tenant admins" value={stats?.totalAdmins ?? "—"} />
					{!isLoading && <StatPill label="Showing" value={total} />}
				</div>

				<DataTableShell<AdminUser>
					search={{
						value: search,
						onChange: (v) => {
							setSearch(v);
							resetOffset();
						},
						placeholder: "Search by name or email…",
					}}
					filters={[
						{
							key: "tenant",
							label: "Church",
							value: tenantFilter,
							onChange: (v) => {
								setTenantFilter(v);
								resetOffset();
							},
							options: [
								{ value: "all", label: "All churches" },
								...tenants.map((t) => ({ value: t.id, label: t.name })),
							],
						},
						{
							key: "role",
							label: "Role scope",
							value: roleScope,
							onChange: (v) => {
								setRoleScope(v as RoleScope);
								resetOffset();
							},
							options: ROLE_OPTIONS,
						},
					]}
					onClearFilters={() => {
						setTenantFilter("all");
						setRoleScope("all");
						resetOffset();
					}}
					state={{
						value: state,
						onChange: (v) => {
							setState(v);
							resetOffset();
						},
					}}
					columns={columns}
					rows={users}
					rowKey={(u) => u.id}
					loading={isLoading}
					emptyTitle="No admin users yet"
					emptySubtitle={
						search || tenantFilter !== "all" || roleScope !== "all"
							? "No users match the current filters."
							: "Invite your first admin to get started."
					}
					pagination={{
						total,
						offset,
						limit,
						onOffsetChange: setOffset,
						onLimitChange: setLimit,
					}}
				/>
			</div>
		</div>
	);
};
