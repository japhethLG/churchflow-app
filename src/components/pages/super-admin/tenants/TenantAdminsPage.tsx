"use client";

import { useRouter } from "next/navigation";
import {
	Avatar,
	Badge,
	Button,
	DataTable,
	type DataTableColumn,
	PageHeader,
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
import { openModal } from "@/lib/modals/store";

type Member = components["schemas"]["MemberResponseDto"];

export const TenantAdminsPage = ({ tenantId }: { tenantId: string }) => {
	const router = useRouter();
	const { data: tenant } = useTenant(tenantId);
	const { data: membersData, isLoading } = useMembers(tenantId);

	const { mutateAsync: update } = useUpdateMember(tenantId);
	const { mutateAsync: remove } = useDeleteMember(tenantId);

	const members = membersData?.items ?? [];

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
			render: (m) => {
				const name = `${m.firstName} ${m.lastName}`;
				return (
					<RowActionsMenu
						actions={[
							{
								label:
									m.role === "USER" ? "Promote to admin" : "Demote to member",
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
											await remove({
												params: { path: { tenantId, id: m.id } },
											});
										},
									}),
							},
						]}
					/>
				);
			},
		},
	];

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline={tenant ? `Churches / ${tenant.name}` : "Churches"}
				title="Admins"
				subtitle={
					tenant ? `Manage admins and members of ${tenant.name}.` : undefined
				}
				action={
					<div className="flex gap-2">
						<Button
							role="secondary"
							onClick={() => router.push(`/super-admin/tenants/${tenantId}`)}
						>
							← Back to church
						</Button>
						{tenant && (
							<Button
								icon="plus"
								role="primary"
								onClick={() =>
									openModal("invite-tenant-admin", {
										tenantId: tenant.id,
										tenantName: tenant.name,
									})
								}
							>
								Invite admin
							</Button>
						)}
					</div>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<DataTable<Member>
					columns={columns}
					rows={members}
					rowKey={(m) => m.id}
					loading={isLoading}
					emptyTitle="No members yet"
				/>
			</div>
		</div>
	);
};
