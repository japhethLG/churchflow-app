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
import type { components } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { usePledges } from "@/lib/api/pledges";
import dayjs from "@/lib/dayjs";
import { openModal } from "@/lib/modals/store";
import { type PledgeRow, pledgeColumns } from "./PledgesTable";

type Member = components["schemas"]["MemberResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

type StatusFilter = "all" | "ACTIVE" | "FULFILLED" | "CANCELLED";

const STATUS_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "FULFILLED", label: "Fulfilled" },
	{ value: "CANCELLED", label: "Cancelled" },
];

export const PledgesListPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<StatusFilter>("all");
	const [campaignId, setCampaignId] = useState<string>("all");
	const [range, setRange] = useState<DateRangeValue>({});
	const [state, setState] = useState<StateFilterValue>("active");
	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(20);

	// Lookup tables include tombstones for Mode-B rendering.
	const { data: campaignsData } = useCampaigns(tenantSlug, {
		includeDeleted: true,
	});
	const { data: membersData } = useMembers(tenantSlug, {
		limit: 200,
		includeDeleted: true,
	});

	const { data: pledgesData, isLoading } = usePledges(tenantSlug, {
		campaignId: campaignId === "all" ? undefined : campaignId,
		status: status === "all" ? undefined : status,
		dateFrom: range.from
			? dayjs.utc(range.from).startOf("day").toISOString()
			: undefined,
		dateTo: range.to
			? dayjs.utc(range.to).endOf("day").toISOString()
			: undefined,
		offset,
		limit,
		...toStateFilterFlags(state),
	});

	const campaigns: Campaign[] = campaignsData?.items ?? [];
	const members: Member[] = membersData?.items ?? [];
	const campaignsById: Record<string, Campaign> = Object.fromEntries(
		campaigns.map((c) => [c.id, c]),
	);
	const membersById: Record<string, Member> = Object.fromEntries(
		members.map((m) => [m.id, m]),
	);

	const allItems: PledgeRow[] = pledgesData?.items ?? [];
	const total = pledgesData?.meta.total ?? 0;
	const totalAmount = pledgesData?.meta.sum ?? 0;

	// Notes aren't indexed server-side, so search lives client-side over the
	// current page. Other filters (status, campaignId) ship to the backend.
	const visible = useMemo<PledgeRow[]>(() => {
		const q = search.trim().toLowerCase();
		if (!q) {
			return allItems;
		}
		return allItems.filter((p) => (p.note ?? "").toLowerCase().includes(q));
	}, [allItems, search]);

	const counts = {
		active: allItems.filter((p) => p.status === "ACTIVE").length,
		fulfilled: allItems.filter((p) => p.status === "FULFILLED").length,
	};

	const askEdit = (p: PledgeRow) => {
		openModal("edit-pledge", { tenantSlug, pledge: p });
	};
	const askDelete = (p: PledgeRow) =>
		openModal("confirm-delete-pledge", { tenantSlug, pledgeId: p.id });
	const askRestore = (p: PledgeRow) => {
		const m = membersById[p.memberId];
		const memberName = m
			? `${m.firstName} ${m.lastName}`.trim()
			: "this member";
		openModal("confirm-restore-pledge", {
			tenantId: tenantSlug,
			pledgeId: p.id,
			memberName,
		});
	};

	const openCreate = () => {
		if (campaigns.length === 0) {
			return;
		}
		const c = campaigns.find((x) => x.status === "ACTIVE") ?? campaigns[0];
		openModal("create-pledge", {
			tenantSlug,
			campaignId: c.id,
			campaignTitle: c.title,
			items: [],
		});
	};

	const columns = pledgeColumns({
		handlers: {
			onEdit: askEdit,
			onDelete: askDelete,
			onRestore: askRestore,
			onOpenCampaign: (id) =>
				router.push(`/${tenantSlug}/admin/campaigns/${id}`),
			onOpenPledge: (id) => router.push(`/${tenantSlug}/admin/pledges/${id}`),
		},
		membersById,
		campaignsById,
	});

	const resetOffset = () => setOffset(0);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Fundraising"
				title="Pledges"
				subtitle="Every commitment, across every active campaign."
				action={
					<Button
						variant="primary"
						icon="plus"
						onClick={openCreate}
						disabled={campaigns.length === 0}
					>
						New pledge
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<DataTableShell<PledgeRow>
					search={{
						value: search,
						onChange: (v) => {
							setSearch(v);
							resetOffset();
						},
						placeholder: "Search by note…",
					}}
					filters={[
						{
							key: "campaign",
							label: "Campaign",
							value: campaignId,
							onChange: (v) => {
								setCampaignId(v);
								resetOffset();
							},
							options: [
								{ value: "all", label: "All campaigns" },
								...campaigns.map((c) => ({ value: c.id, label: c.title })),
							],
						},
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
						setCampaignId("all");
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
						{ label: "total", value: total },
						{ label: "active", value: counts.active, tone: "success" },
						{ label: "fulfilled", value: counts.fulfilled },
						{ label: "pledged", value: `$${totalAmount.toLocaleString()}` },
					]}
					columns={columns}
					rows={visible}
					rowKey={(p) => p.id}
					loading={isLoading}
					onRowClick={(p) =>
						router.push(`/${tenantSlug}/admin/pledges/${p.id}`)
					}
					rowClassName={(p) => (p.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No pledges yet"
					emptySubtitle="When members commit to a campaign, those pledges show up here."
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
