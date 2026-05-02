"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, PageHeader } from "@/components/primitives";
import { useCampaigns } from "@/lib/api/campaigns";
import { openModal } from "@/lib/modals/store";
import {
	CampaignsFilters,
	type CampaignsFiltersValue,
} from "./CampaignsFilters";
import { CampaignsStatsBar } from "./CampaignsStatsBar";
import { type CampaignRow, CampaignsTable } from "./CampaignsTable";

const PAGE_SIZE = 20;

export const CampaignsListPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const [filters, setFilters] = useState<CampaignsFiltersValue>({
		search: "",
		status: "all",
	});
	const [offset, setOffset] = useState(0);

	// Backend filter for status; search is client-side (small lists).
	const { data, isLoading } = useCampaigns(tenantSlug);
	const allItems = data?.items ?? [];

	const filtered = useMemo<CampaignRow[]>(() => {
		let out = allItems;
		if (filters.status !== "all")
			out = out.filter((c) => c.status === filters.status);
		const q = filters.search.trim().toLowerCase();
		if (q) out = out.filter((c) => c.title.toLowerCase().includes(q));
		return out;
	}, [allItems, filters]);

	const visible = filtered.slice(offset, offset + PAGE_SIZE);

	const counts = {
		total: allItems.length,
		active: allItems.filter((c) => c.status === "ACTIVE").length,
		draft: allItems.filter((c) => c.status === "DRAFT").length,
		completed: allItems.filter((c) => c.status === "COMPLETED").length,
	};

	const goNew = () => router.push(`/${tenantSlug}/admin/campaigns/new`);
	const goView = (c: CampaignRow) =>
		router.push(`/${tenantSlug}/admin/campaigns/${c.id}`);
	const goEdit = (c: CampaignRow) =>
		router.push(`/${tenantSlug}/admin/campaigns/${c.id}/edit`);
	const askCancel = (c: CampaignRow) =>
		openModal("confirm-cancel-campaign", {
			tenantSlug,
			campaignId: c.id,
			campaignTitle: c.title,
		});
	const askDelete = (c: CampaignRow) =>
		openModal("confirm-delete-campaign", {
			tenantSlug,
			campaignId: c.id,
			campaignTitle: c.title,
		});

	return (
		<div className="h-full overflow-auto">
			<PageHeader
				overline="Fundraising"
				title="Campaigns"
				subtitle="Goal-driven drives broken into items, with pledge tracking."
				action={
					<Button variant="primary" icon="plus" onClick={goNew}>
						New campaign
					</Button>
				}
			/>

			<CampaignsFilters
				value={filters}
				onChange={(v) => {
					setFilters(v);
					setOffset(0);
				}}
			/>

			<CampaignsStatsBar
				total={counts.total}
				active={counts.active}
				draft={counts.draft}
				completed={counts.completed}
			/>

			<CampaignsTable
				rows={visible}
				loading={isLoading}
				pagination={{
					total: filtered.length,
					offset,
					limit: PAGE_SIZE,
					onChange: setOffset,
				}}
				handlers={{
					onView: goView,
					onEdit: goEdit,
					onCancel: askCancel,
					onDelete: askDelete,
				}}
				onCreate={goNew}
			/>
		</div>
	);
};
