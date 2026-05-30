"use client";

import { useMemo } from "react";
import {
	Avatar,
	Badge,
	Button,
	type DataTableColumn,
	DataTableShell,
	ExpandableCard,
	PageHeader,
	type RowAction,
	RowActionsMenu,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import {
	useDeleteMember,
	useMembers,
	useUpdateMember,
} from "@/lib/api/members";
import { useTenant } from "@/lib/api/tenants";
import dayjs from "@/lib/dayjs";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { openModal } from "@/lib/modals/store";

type Member = components["schemas"]["MemberResponseDto"];

export const TenantAdminsPage = ({ tenantId }: { tenantId: string }) => {
	const { data: tenant } = useTenant(tenantId);
	const { data: membersData, isLoading } = useMembers(tenantId);

	const { mutateAsync: update } = useUpdateMember(tenantId);
	const { mutateAsync: remove } = useDeleteMember(tenantId);

	const members = membersData?.items ?? [];

	// Mobile FAB — invite an admin (the page's primary create action).
	useMobileActions(
		useMemo(
			() =>
				tenant
					? [
							{
								label: "Invite admin",
								icon: "plus" as const,
								onClick: () =>
									openModal("invite-tenant-admin", {
										tenantId: tenant.id,
										tenantName: tenant.name,
									}),
							},
						]
					: [],
			[tenant],
		),
	);

	// Shared by the desktop row menu and the mobile card.
	const memberActions = (m: Member): RowAction[] => {
		const name = `${m.firstName} ${m.lastName}`;
		return [
			{
				label: m.role === "USER" ? "Promote to admin" : "Demote to member",
				onClick: () =>
					update({
						params: { path: { tenantId, id: m.id } },
						body: { role: m.role === "USER" ? "ADMIN" : "USER" },
					}),
			},
			{
				label: "Remove from church",
				destructive: true,
				separatorBefore: true,
				onClick: () =>
					openModal("confirm-delete", {
						title: `Remove ${name}?`,
						message:
							"This will remove them from this church. Their data is preserved.",
						confirmLabel: "Remove",
						onConfirm: async () => {
							await remove({ params: { path: { tenantId, id: m.id } } });
						},
					}),
			},
		];
	};

	// Sub-`md` row → card. Identity up top, role badge + join date in the
	// drawer, management actions in the kebab.
	const renderAdminCard = (m: Member) => {
		const name = `${m.firstName} ${m.lastName}`;
		const email = m.email as unknown as string | null;
		return (
			<ExpandableCard
				actions={memberActions(m)}
				details={[
					{
						label: "Joined",
						value: (
							<span className="text-sm font-medium text-foreground">
								{dayjs(m.createdAt).format("MMM D, YYYY")}
							</span>
						),
					},
				]}
			>
				<div className="flex items-center gap-3">
					<Avatar name={name} size={36} />
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold text-foreground">
							{name}
						</div>
						{email && (
							<div className="truncate text-xs text-muted-foreground">
								{email}
							</div>
						)}
					</div>
					<Badge color={m.role === "ADMIN" ? "indigo" : "neutral"}>
						{m.role}
					</Badge>
				</div>
			</ExpandableCard>
		);
	};

	const columns: DataTableColumn<Member>[] = [
		{
			key: "user",
			label: "Member",
			render: (m) => {
				const name = `${m.firstName} ${m.lastName}`;
				return (
					<span className="inline-flex items-center gap-2.5">
						<Avatar name={name} size={30} />
						<div>
							<div className="text-sm font-medium">{name}</div>
							{m.email && (
								<div className="text-xs text-muted-foreground">
									{m.email as unknown as string}
								</div>
							)}
						</div>
					</span>
				);
			},
		},
		{
			key: "role",
			label: "Role",
			width: "120px",
			render: (m) => (
				<Badge color={m.role === "ADMIN" ? "indigo" : "neutral"}>
					{m.role}
				</Badge>
			),
		},
		{
			key: "joined",
			label: "Joined",
			width: "140px",
			render: (m) => (
				<span className="text-sm text-muted-foreground">
					{dayjs(m.createdAt).format("MMM D, YYYY")}
				</span>
			),
		},
		{
			key: "actions",
			label: "",
			width: "48px",
			align: "right",
			overflow: "visible",
			render: (m) => <RowActionsMenu actions={memberActions(m)} />,
		},
	];

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				back={{
					href: `/super-admin/tenants/${tenantId}`,
					label: tenant ? tenant.name : "Church",
				}}
				title="Admins"
				subtitle={
					tenant ? `Manage admins and members of ${tenant.name}.` : undefined
				}
				action={
					tenant ? (
						<Button
							icon="plus"
							role="primary"
							className="hidden md:inline-flex"
							onClick={() =>
								openModal("invite-tenant-admin", {
									tenantId: tenant.id,
									tenantName: tenant.name,
								})
							}
						>
							Invite admin
						</Button>
					) : undefined
				}
			/>

			<div className="overflow-auto flex-1 px-4 pb-36 md:px-8 md:pb-8">
				<DataTableShell<Member>
					columns={columns}
					mobileCard={renderAdminCard}
					rows={members}
					rowKey={(m) => m.id}
					loading={isLoading}
					emptyTitle="No members yet"
				/>
			</div>
		</div>
	);
};
