"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, PageHeader } from "@/components/primitives";
import { useMembers } from "@/lib/api/members";
import { openModal } from "@/lib/modals/store";
import { MembersFilters, type MembersFiltersValue } from "./MembersFilters";
import { MembersStatsBar } from "./MembersStatsBar";
import { type MemberRow, MembersTable } from "./MembersTable";

const PAGE_SIZE = 20;

export const MembersListPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const [filters, setFilters] = useState<MembersFiltersValue>({
		search: "",
		status: "all",
		linked: "all",
	});
	const [offset, setOffset] = useState(0);

	const { data, isLoading } = useMembers(tenantSlug, {
		status:
			filters.status === "all"
				? undefined
				: filters.status === "active"
					? "ACTIVE"
					: "INACTIVE",
		search: filters.search.trim() || undefined,
		offset,
		limit: PAGE_SIZE,
	});

	const allItems = data?.items ?? [];
	const total = data?.meta.total ?? 0;

	// `linked` filter is applied client-side because the backend doesn't expose it.
	const visible = useMemo(() => {
		if (filters.linked === "all") {
			return allItems;
		}
		if (filters.linked === "linked") {
			return allItems.filter((m) => Boolean(m.userId));
		}
		return allItems.filter((m) => !m.userId);
	}, [allItems, filters.linked]);

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

	return (
		<div className="h-full overflow-auto">
			<PageHeader
				overline="Directory"
				title="Members"
				subtitle="Everyone giving at this church."
				action={
					<>
						<Button variant="secondary" icon="mail" onClick={openInvite}>
							Invite member
						</Button>
						<Button variant="primary" icon="plus" onClick={openAdd}>
							Add member
						</Button>
					</>
				}
			/>

			<MembersFilters
				value={filters}
				onChange={(v) => {
					setFilters(v);
					setOffset(0);
				}}
			/>

			<MembersStatsBar
				total={total}
				active={activeCount}
				unregistered={tempCount}
			/>

			<MembersTable
				rows={visible}
				loading={isLoading}
				pagination={{
					total,
					offset,
					limit: PAGE_SIZE,
					onChange: setOffset,
				}}
				handlers={{
					onView: (m) => router.push(`/${tenantSlug}/admin/members/${m.id}`),
					onEdit: openEdit,
					onDelete: openDelete,
					onClaimInvite: openClaimInvite,
					onMerge: openMerge,
				}}
				onAdd={openAdd}
			/>
		</div>
	);
};
