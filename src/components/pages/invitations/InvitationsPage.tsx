"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Button,
	DataTableShell,
	DateRangePicker,
	type DateRangeValue,
	PageHeader,
} from "@/components/primitives";
import { useInvitations } from "@/lib/api/invitations";
import dayjs from "@/lib/dayjs";
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
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<StatusFilter>("all");
	const [role, setRole] = useState<RoleFilter>("all");
	const [range, setRange] = useState<DateRangeValue>({});
	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(20);

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

	const visible = filtered.slice(offset, offset + limit);

	const pendingCount = invitations.filter((i) => i.status === "PENDING").length;
	const acceptedCount = invitations.filter(
		(i) => i.status === "ACCEPTED",
	).length;
	const cancelledCount = invitations.filter(
		(i) => i.status === "CANCELLED" || i.status === "EXPIRED",
	).length;

	const handleInvite = () =>
		openModal("invite-member", { tenantId: tenantSlug });

	const handleCancel = (inv: Invitation) =>
		openModal("cancel-invitation", {
			tenantId: tenantSlug,
			invitationId: inv.id,
			email: inv.email,
		});

	const columns = invitationColumns({ onCancel: handleCancel });

	const resetOffset = () => setOffset(0);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Directory"
				title="Invitations"
				subtitle="Manage member and admin access to your church account."
				action={
					<Button variant="primary" icon="plus" onClick={handleInvite}>
						Invite member
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<DataTableShell<Invitation>
					search={{
						value: search,
						onChange: (v) => {
							setSearch(v);
							resetOffset();
						},
						placeholder: "Search by email…",
					}}
					filters={[
						{
							key: "status",
							label: "Status",
							value: status,
							onChange: (v) => {
								setStatus(v as StatusFilter);
								resetOffset();
							},
							options: STATUS_OPTIONS,
						},
						{
							key: "role",
							label: "Role",
							value: role,
							onChange: (v) => {
								setRole(v as RoleFilter);
								resetOffset();
							},
							options: ROLE_OPTIONS,
						},
					]}
					toolbar={
						<DateRangePicker
							value={range}
							onChange={(v) => {
								setRange(v);
								resetOffset();
							}}
							placeholder="Date range"
							size="sm"
							autoWidth
							clearable
						/>
					}
					onClearFilters={() => {
						setStatus("all");
						setRole("all");
						setRange({});
						resetOffset();
					}}
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
					pagination={{
						total: filtered.length,
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
