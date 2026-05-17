"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Button,
	DataTableShell,
	DateRangePicker,
	type DateRangeValue,
	PageHeader,
	type StateFilterValue,
	toStateFilterFlags,
} from "@/components/primitives";
import { useCampaigns } from "@/lib/api/campaigns";
import dayjs from "@/lib/dayjs";
import { openModal } from "@/lib/modals/store";
import { type CampaignRow, campaignColumns } from "./CampaignsTable";

type StatusFilter = "all" | "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

const STATUS_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "DRAFT", label: "Draft" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "COMPLETED", label: "Completed" },
	{ value: "CANCELLED", label: "Cancelled" },
];

export const CampaignsListPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<StatusFilter>("all");
	const [range, setRange] = useState<DateRangeValue>({});
	const [state, setState] = useState<StateFilterValue>("active");
	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(20);

	// Backend filters: archive state + date range. Status + search stay
	// client-side — the campaign list is small per tenant.
	const { data, isLoading } = useCampaigns(tenantSlug, {
		dateFrom: range.from
			? dayjs.utc(range.from).startOf("day").toISOString()
			: undefined,
		dateTo: range.to
			? dayjs.utc(range.to).endOf("day").toISOString()
			: undefined,
		...toStateFilterFlags(state),
	});
	const allItems = data?.items ?? [];

	const filtered = useMemo<CampaignRow[]>(() => {
		let out = allItems;
		if (status !== "all") {
			out = out.filter((c) => c.status === status);
		}
		const q = search.trim().toLowerCase();
		if (q) {
			out = out.filter((c) => c.title.toLowerCase().includes(q));
		}
		return out;
	}, [allItems, status, search]);

	const visible = filtered.slice(offset, offset + limit);

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
	const askRestore = (c: CampaignRow) =>
		openModal("confirm-restore-campaign", {
			tenantId: tenantSlug,
			campaignId: c.id,
			campaignTitle: c.title,
		});

	const columns = campaignColumns({
		onView: goView,
		onEdit: goEdit,
		onCancel: askCancel,
		onDelete: askDelete,
		onRestore: askRestore,
	});

	const resetOffset = () => setOffset(0);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Fundraising"
				title="Campaigns"
				subtitle="Goal-driven drives broken into items, with pledge tracking."
				action={
					<Button variant="primary" icon="plus" onClick={goNew}>
						New campaign
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<DataTableShell<CampaignRow>
					search={{
						value: search,
						onChange: (v) => {
							setSearch(v);
							resetOffset();
						},
						placeholder: "Search campaigns…",
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
						setRange({});
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
						{ label: "total", value: counts.total },
						{ label: "active", value: counts.active, tone: "success" },
						{ label: "draft", value: counts.draft },
						{ label: "completed", value: counts.completed },
					]}
					columns={columns}
					rows={visible}
					rowKey={(c) => c.id}
					loading={isLoading}
					onRowClick={goView}
					rowClassName={(c) => (c.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No campaigns yet"
					emptySubtitle="Start a fundraising campaign to track pledges and gifts."
					emptyAction={
						<Button icon="plus" onClick={goNew}>
							New campaign
						</Button>
					}
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
