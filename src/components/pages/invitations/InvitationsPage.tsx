"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
	Badge,
	Button,
	DataTableShell,
	type DateRangeValue,
	ExpandableCard,
	PageHeader,
	StatusBadge,
	useTableFilters,
} from "@/components/primitives";
import { useInvitations } from "@/lib/api/invitations";
import dayjs from "@/lib/dayjs";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { openModal } from "@/lib/modals/store";
import {
	INVITATION_STATUS_MAP,
	type Invitation,
	invitationColumns,
} from "./InvitationsTable";

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

	// Sub-`md` row → expandable card. Collapsed: email + status. Expanded:
	// role, sent date, expiry.
	const renderInvitationCard = (inv: Invitation) => {
		const isPending = inv.status === "PENDING";
		const diff = dayjs(inv.expiresAt).diff(dayjs());
		const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
		return (
			<ExpandableCard
				details={[
					{
						label: "Role",
						value: (
							<Badge color={inv.role === "ADMIN" ? "indigo" : "neutral"}>
								{inv.role === "ADMIN" ? "Admin" : "Member"}
							</Badge>
						),
					},
					{
						label: "Sent",
						value: (
							<span className="text-sm font-medium text-foreground">
								{dayjs(inv.createdAt).format("MMM D, YYYY")}
							</span>
						),
					},
					{
						label: "Expires",
						value: (
							<span className="text-sm font-medium text-foreground">
								{isPending ? (days <= 0 ? "Expired" : `${days}d left`) : "—"}
							</span>
						),
					},
				]}
			>
				<div className="flex items-center gap-3">
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold tracking-tight">
							{inv.email}
						</div>
						<div className="truncate text-xs text-muted-foreground">
							Sent {dayjs(inv.createdAt).format("ll")}
						</div>
					</div>
					<StatusBadge status={INVITATION_STATUS_MAP[inv.status]} />
				</div>
			</ExpandableCard>
		);
	};

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
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

			<div className="overflow-auto flex-1 px-4 pb-36 md:px-8 md:pb-8">
				<DataTableShell<Invitation>
					search={t.search("Search by email…")}
					filters={[
						t.select("status", "Status", STATUS_OPTIONS),
						t.select("role", "Role", ROLE_OPTIONS),
						t.date("Date range"),
					]}
					onClearFilters={t.clear}
					mobileCard={renderInvitationCard}
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
