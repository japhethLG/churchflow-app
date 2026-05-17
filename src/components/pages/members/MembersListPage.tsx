"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Button,
	DataTableShell,
	PageHeader,
	type StateFilterValue,
	toStateFilterFlags,
} from "@/components/primitives";
import { useMembers } from "@/lib/api/members";
import { openModal } from "@/lib/modals/store";
import { type MemberRow, memberColumns } from "./MembersTable";

type StatusFilter = "all" | "active" | "inactive";
type LinkedFilter = "all" | "linked" | "unlinked";

const STATUS_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "active", label: "Active" },
	{ value: "inactive", label: "Inactive" },
];

const LINKED_OPTIONS = [
	{ value: "all", label: "All members" },
	{ value: "linked", label: "Registered only" },
	{ value: "unlinked", label: "Unregistered only" },
];

export const MembersListPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<StatusFilter>("all");
	const [linked, setLinked] = useState<LinkedFilter>("all");
	const [state, setState] = useState<StateFilterValue>("active");
	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(20);

	const { data, isLoading } = useMembers(tenantSlug, {
		status:
			status === "all"
				? undefined
				: status === "active"
					? "ACTIVE"
					: "INACTIVE",
		search: search.trim() || undefined,
		offset,
		limit,
		...toStateFilterFlags(state),
	});

	const allItems = data?.items ?? [];
	const total = data?.meta.total ?? 0;

	// `linked` is applied client-side because the backend doesn't expose it.
	const visible = useMemo(() => {
		if (linked === "all") {
			return allItems;
		}
		if (linked === "linked") {
			return allItems.filter((m) => Boolean(m.userId));
		}
		return allItems.filter((m) => !m.userId);
	}, [allItems, linked]);

	const activeCount = visible.filter((m) => m.status === "ACTIVE").length;
	const tempCount = visible.filter((m) => !m.userId).length;

	const openAdd = () => openModal("add-member", { tenantSlug });
	const openInvite = () => openModal("invite-member", { tenantId: tenantSlug });
	const openEdit = (m: MemberRow) =>
		openModal("edit-member", { tenantSlug, member: m });
	const openDelete = (m: MemberRow) =>
		openModal("confirm-delete-member", {
			tenantSlug,
			memberId: m.id,
			memberName: `${m.firstName} ${m.lastName}`.trim(),
		});
	const openClaimInvite = (m: MemberRow) =>
		openModal("invite-member", {
			tenantId: tenantSlug,
			claimMemberId: m.id,
			claimMemberName: `${m.firstName} ${m.lastName}`.trim(),
			defaultEmail: typeof m.email === "string" ? m.email : undefined,
		});
	const openMerge = (m: MemberRow) =>
		openModal("merge-member", { tenantSlug, keep: m });
	const openRestore = (m: MemberRow) =>
		openModal("confirm-restore-member", {
			tenantId: tenantSlug,
			memberId: m.id,
			memberName: `${m.firstName} ${m.lastName}`.trim(),
		});

	const columns = memberColumns({
		onView: (m) => router.push(`/${tenantSlug}/admin/members/${m.id}`),
		onEdit: openEdit,
		onDelete: openDelete,
		onClaimInvite: openClaimInvite,
		onMerge: openMerge,
		onRestore: openRestore,
	});

	const resetOffset = () => setOffset(0);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Directory"
				title="Members"
				subtitle="Everyone giving at this church."
				action={
					<>
						<Button
							variant="secondary"
							recipe="outline"
							icon="mail"
							onClick={openInvite}
						>
							Invite member
						</Button>
						<Button variant="primary" icon="plus" onClick={openAdd}>
							Add member
						</Button>
					</>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<DataTableShell<MemberRow>
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
							key: "linked",
							label: "Registration",
							value: linked,
							onChange: (v) => {
								setLinked(v as LinkedFilter);
								resetOffset();
							},
							options: LINKED_OPTIONS,
						},
					]}
					onClearFilters={() => {
						setStatus("all");
						setLinked("all");
						resetOffset();
					}}
					state={{
						value: state,
						onChange: (v) => {
							setState(v);
							resetOffset();
						},
					}}
					stats={[
						{ label: "total", value: total },
						{ label: "active", value: activeCount, tone: "success" },
						{ label: "unregistered", value: tempCount },
					]}
					columns={columns}
					rows={visible}
					rowKey={(m) => m.id}
					loading={isLoading}
					onRowClick={(m) =>
						router.push(`/${tenantSlug}/admin/members/${m.id}`)
					}
					rowClassName={(m) => (m.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No members yet"
					emptySubtitle="Add or invite your first member to get started."
					emptyAction={
						<Button icon="plus" onClick={openAdd}>
							Add member
						</Button>
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
