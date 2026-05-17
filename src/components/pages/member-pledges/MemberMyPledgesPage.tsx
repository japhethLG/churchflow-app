"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	DataTableShell,
	DateRangePicker,
	type DateRangeValue,
	PageHeader,
} from "@/components/primitives";
import { useMyCampaigns } from "@/lib/api/campaigns";
import { useMyProfile } from "@/lib/api/members";
import { useMyPledges } from "@/lib/api/pledges";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import {
	type MemberPledgeRow,
	memberPledgeColumns,
} from "./MemberPledgesTable";

type StatusFilter = "all" | "ACTIVE" | "FULFILLED" | "CANCELLED";

const STATUS_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "FULFILLED", label: "Fulfilled" },
	{ value: "CANCELLED", label: "Cancelled" },
];

export const MemberMyPledgesPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<StatusFilter>("all");
	const [campaignId, setCampaignId] = useState<string>("all");
	const [range, setRange] = useState<DateRangeValue>({});
	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(20);

	const memberQ = useMyProfile(tenantSlug);

	// Self-scoped automatically by URL prefix.
	const pledgesQ = useMyPledges(tenantSlug, {
		dateFrom: range.from
			? dayjs.utc(range.from).startOf("day").toISOString()
			: undefined,
		dateTo: range.to
			? dayjs.utc(range.to).endOf("day").toISOString()
			: undefined,
	});
	const pledges: MemberPledgeRow[] = pledgesQ.data?.items ?? [];

	// Include archived campaigns so deleted-campaign cells can render
	// Mode-B (DeletedLabel) with the original title.
	const campaignsQ = useMyCampaigns(tenantSlug, { includeDeleted: true });
	const campaigns = campaignsQ.data?.items ?? [];
	const campaignMap = Object.fromEntries(campaigns.map((c) => [c.id, c]));

	const filtered = useMemo<MemberPledgeRow[]>(() => {
		let out = pledges;
		if (status !== "all") {
			out = out.filter((p) => p.status === status);
		}
		if (campaignId !== "all") {
			out = out.filter((p) => p.campaignId === campaignId);
		}
		const q = search.trim().toLowerCase();
		if (q) {
			out = out.filter((p) => {
				const title = campaignMap[p.campaignId]?.title?.toLowerCase() ?? "";
				return title.includes(q);
			});
		}
		return out;
	}, [pledges, status, campaignId, search, campaignMap]);

	const visible = filtered.slice(offset, offset + limit);

	const activePledges = pledges.filter((p) => p.status === "ACTIVE");
	const totalActive = activePledges.reduce(
		(s, p) => s + Number(p.pledgedAmount),
		0,
	);

	const loading =
		pledgesQ.isLoading || memberQ.isLoading || campaignsQ.isLoading;

	const columns = memberPledgeColumns({ campaignMap });

	const resetOffset = () => setOffset(0);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="My pledges"
				title="Your pledges"
				subtitle="Track your commitments to church campaigns."
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<DataTableShell<MemberPledgeRow>
					search={{
						value: search,
						onChange: (v) => {
							setSearch(v);
							resetOffset();
						},
						placeholder: "Search by campaign…",
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
					stats={[
						{ label: "pledges", value: pledges.length },
						{
							label: "active",
							value: activePledges.length,
							tone: "success",
						},
						{ label: "total active", value: formatCurrency(totalActive) },
					]}
					columns={columns}
					rows={visible}
					rowKey={(r) => r.id}
					loading={loading}
					onRowClick={(r) =>
						router.push(`/${tenantSlug}/member/my-pledges/${r.id}`)
					}
					emptyTitle="No pledges yet"
					emptySubtitle="When you pledge to a campaign, it'll appear here."
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
