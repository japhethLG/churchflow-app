"use client";

import { useState } from "react";
import {
	Avatar,
	Badge,
	Button,
	Chip,
	DataTable,
	type DataTableColumn,
	PageHeader,
	RowActionsMenu,
	Select,
	StatPill,
} from "@/components/primitives";
import { Input } from "@/components/ui/input";
import { useAdminStats, useAdminUsers } from "@/lib/api/admin";
import type { components } from "@/lib/api/schema";
import { useTenants } from "@/lib/api/tenants";
import dayjs from "@/lib/dayjs";
import { openModal } from "@/lib/modals/store";

type AdminUser = components["schemas"]["AdminUserDto"];

export const AdminsPage = () => {
	const [search, setSearch] = useState("");
	const [tenantFilter, setTenantFilter] = useState("");
	const [superAdminOnly, setSuperAdminOnly] = useState(false);

	const { data: stats } = useAdminStats();
	const { data: tenantsData } = useTenants();
	const tenants = tenantsData?.items ?? [];

	const { data: usersData, isLoading } = useAdminUsers({
		search: search || undefined,
		tenantId: tenantFilter || undefined,
		superAdminOnly: superAdminOnly || undefined,
	});

	const users = usersData?.items ?? [];

	const columns: DataTableColumn<AdminUser>[] = [
		{
			key: "user",
			label: "User",
			render: (u) => (
				<span className="inline-flex items-center gap-2.5">
					<Avatar
						name={u.displayName}
						src={(u.photoUrl as string | undefined) ?? undefined}
						size={32}
					/>
					<div>
						<div className="text-sm font-medium">{u.displayName}</div>
						<div className="text-xs text-muted-foreground">{u.email}</div>
					</div>
				</span>
			),
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

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Platform"
				title="Admins"
				subtitle="Everyone with admin access across all churches."
				action={
					<Button
						variant="primary"
						onClick={() => openModal("invite-admin-global", {})}
					>
						+ Invite admin
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				{/* KPI pills */}
				<div className="mb-6 flex flex-wrap gap-2.5">
					<StatPill label="Super admins" value={stats?.superAdmins ?? "—"} />
					<StatPill label="Tenant admins" value={stats?.totalAdmins ?? "—"} />
					{!isLoading && (
						<StatPill label="Showing" value={usersData?.total ?? 0} />
					)}
				</div>

				{/* Filter row */}
				<div className="mb-5 flex flex-wrap items-center gap-2.5">
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by name or email…"
						className="h-9 w-full min-w-[200px] max-w-[320px] rounded-xl border-border bg-muted flex-1"
					/>

					<Select
						value={tenantFilter}
						onChange={setTenantFilter}
						size="sm"
						placeholder="All churches"
						showEmptyOption
						options={tenants
							// .filter((t) => !(t as { deletedAt?: Date | null }).deletedAt)
							.map((t) => ({ value: t.id, label: t.name }))}
						className="w-auto"
					/>

					<Chip
						active={superAdminOnly}
						onClick={() => setSuperAdminOnly((v) => !v)}
						className="h-8"
					>
						Super admins only
					</Chip>
				</div>

				<DataTable<AdminUser>
					columns={columns}
					rows={users}
					rowKey={(u) => u.id}
					loading={isLoading}
					emptyTitle="No admin users yet"
					emptySubtitle={
						search || tenantFilter || superAdminOnly
							? "No users match the current filters."
							: "Invite your first admin to get started."
					}
				/>
			</div>
		</div>
	);
};
