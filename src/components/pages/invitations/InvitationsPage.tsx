"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
	Button,
	DataTableShell,
	type DateRangeValue,
	PageHeader,
	useTableFilters,
} from "@/components/primitives";
import { useInvitations } from "@/lib/api/invitations";
import dayjs from "@/lib/dayjs";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { openModal } from "@/lib/modals/store";
import { type Invitation, invitationColumns } from "./InvitationsTable";

type StatusFilter = "all" | "PENDING" | "ACCEPTED" | "CANCELLED" | "EXPIRED";
type RoleFilter = "all" | "ADMIN" | "USER";

const STATUS_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "PENDING", label: "Pending" },
	{ value: "ACCEPTED", label: "Accepted" },
	{ value: "CANCELLED", label: "Cancelled" },
	{ value: "EXPIRED", label: "Expired" },
];

const ROLE_OPTIONS = [
	{ value: "all", label: "All roles" },
	{ value: "ADMIN", label: "Admin" },
	{ value: "USER", label: "Member" },
];

export const InvitationsPage = () => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();
	const t = useTableFilters({
		search: "",
		status: "all",
		role: "all",
		dateFrom: "",
		dateTo: "",
	});
	const status = t.values.status as StatusFilter;
	const role = t.values.role as RoleFilter;
	const search = t.values.search;
	const range: DateRangeValue = {
		from: t.values.dateFrom || undefined,
		to: t.values.dateTo || undefined,
	};

	const invitationsQ = useInvitations(tenantSlug, {
		dateFrom: range.from
			? dayjs.utc(range.from).startOf("day").toISOString()
			: undefined,
		dateTo: range.to
			? dayjs.utc(range.to).endOf("day").toISOString()
			: undefined,
	});
	const invitations: Invitation[] = invitationsQ.data?.items ?? [];

	const filtered = useMemo<Invitation[]>(() => {
		let out = invitations;
		if (status !== "all") {
			out = out.filter((i) => i.status === status);
		}
		if (role !== "all") {
			out = out.filter((i) => i.role === role);
		}
		const q = search.trim().toLowerCase();
		if (q) {
			out = out.filter((i) => i.email.toLowerCase().includes(q));
		}
		return out;
	}, [invitations, status, role, search]);

	const visible = filtered.slice(t.offset, t.offset + t.limit);

	const pendingCount = invitations.filter((i) => i.status === "PENDING").length;
	const acceptedCount = invitations.filter(
		(i) => i.status === "ACCEPTED",
	).length;
	const cancelledCount = invitations.filter(
		(i) => i.status === "CANCELLED" || i.status === "EXPIRED",
	).length;

	const handleInvite = () =>
		openModal("invite-member", { tenantId: tenantSlug });

	useMobileActions(
		useMemo(
			() => [
				{
					label: "Invite member",
					icon: "plus" as const,
					onClick: () => openModal("invite-member", { tenantId: tenantSlug }),
				},
			],
			[tenantSlug],
		),
	);

	const handleCancel = (inv: Invitation) =>
		openModal("cancel-invitation", {
			tenantId: tenantSlug,
			invitationId: inv.id,
			email: inv.email,
		});

	const columns = invitationColumns({ onCancel: handleCancel });

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Directory"
				title="Invitations"
				subtitle="Manage member and admin access to your church account."
				action={
					<Button
						role="primary"
						icon="plus"
						className="hidden md:inline-flex"
						onClick={handleInvite}
					>
						Invite member
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<DataTableShell<Invitation>
					search={t.search("Search by email…")}
					filters={[
						t.select("status", "Status", STATUS_OPTIONS),
						t.select("role", "Role", ROLE_OPTIONS),
						t.date("Date range"),
					]}
					onClearFilters={t.clear}
					stats={[
						{ label: "total", value: invitations.length },
						{ label: "pending", value: pendingCount, tone: "warning" },
						{ label: "accepted", value: acceptedCount, tone: "success" },
						{ label: "cancelled", value: cancelledCount },
					]}
					columns={columns}
					rows={visible}
					rowKey={(r) => r.id}
					loading={invitationsQ.isLoading}
					emptyTitle="No invitations"
					emptySubtitle="Invite members or admins to join your church."
					pagination={t.pagination(filtered.length)}
				/>
			</div>
		</div>
	);
};
