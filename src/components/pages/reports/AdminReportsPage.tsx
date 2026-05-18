"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Button,
	DateRangePicker,
	type DateRangeValue,
	PageHeader,
	SegmentedControl,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { usePledges } from "@/lib/api/pledges";
import { useTransactionSummary, useTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { GiversTab } from "./GiversTab";
import { PledgeDynamicsTab } from "./PledgeDynamicsTab";
import { TrendTab } from "./TrendTab";

type Tab = "trend" | "givers" | "pledges";

const TABS: { value: Tab; label: string }[] = [
	{ value: "trend", label: "Trend" },
	{ value: "givers", label: "Givers" },
	{ value: "pledges", label: "Pledge dynamics" },
];

type Member = components["schemas"]["MemberResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

const DEFAULT_RANGE: DateRangeValue = {
	from: dayjs().subtract(11, "month").startOf("month").format("YYYY-MM-DD"),
	to: dayjs().format("YYYY-MM-DD"),
};

const RANGE_PRESETS = [
	{
		label: "This week",
		resolve: () => ({
			from: dayjs().startOf("week").format("YYYY-MM-DD"),
			to: dayjs().endOf("week").format("YYYY-MM-DD"),
		}),
	},
	{
		label: "Last week",
		resolve: () => {
			const w = dayjs().subtract(1, "week");
			return {
				from: w.startOf("week").format("YYYY-MM-DD"),
				to: w.endOf("week").format("YYYY-MM-DD"),
			};
		},
	},
	{
		label: "This month",
		resolve: () => ({
			from: dayjs().startOf("month").format("YYYY-MM-DD"),
			to: dayjs().endOf("month").format("YYYY-MM-DD"),
		}),
	},
	{
		label: "Last month",
		resolve: () => ({
			from: dayjs().subtract(1, "month").startOf("month").format("YYYY-MM-DD"),
			to: dayjs().subtract(1, "month").endOf("month").format("YYYY-MM-DD"),
		}),
	},
	{
		label: "YTD",
		resolve: () => ({
			from: dayjs().startOf("year").format("YYYY-MM-DD"),
			to: dayjs().format("YYYY-MM-DD"),
		}),
	},
	{
		label: "Last 12 months",
		resolve: () => ({
			from: dayjs().subtract(11, "month").startOf("month").format("YYYY-MM-DD"),
			to: dayjs().format("YYYY-MM-DD"),
		}),
	},
	{
		label: "This year",
		resolve: () => ({
			from: dayjs().startOf("year").format("YYYY-MM-DD"),
			to: dayjs().endOf("year").format("YYYY-MM-DD"),
		}),
	},
];

const toIso = (range: DateRangeValue) => ({
	dateFrom: range.from
		? dayjs.utc(range.from).startOf("day").toISOString()
		: undefined,
	dateTo: range.to ? dayjs.utc(range.to).endOf("day").toISOString() : undefined,
});

// Build the prior-year range (offset by 12 months) for YoY overlay.
const priorYearRange = (range: DateRangeValue): DateRangeValue => ({
	from: range.from
		? dayjs(range.from).subtract(1, "year").format("YYYY-MM-DD")
		: undefined,
	to: range.to
		? dayjs(range.to).subtract(1, "year").format("YYYY-MM-DD")
		: undefined,
});

export const AdminReportsPage = () => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();
	const [tab, setTab] = useState<Tab>("trend");
	const [range, setRange] = useState<DateRangeValue>(DEFAULT_RANGE);

	const currentRange = toIso(range);
	const priorRange = toIso(priorYearRange(range));

	const currentSummary = useTransactionSummary(tenantSlug, {
		dateFrom: currentRange.dateFrom,
		dateTo: currentRange.dateTo,
	});
	const priorSummary = useTransactionSummary(
		tenantSlug,
		{
			dateFrom: priorRange.dateFrom,
			dateTo: priorRange.dateTo,
		},
		tab === "trend",
	);

	const giversTxQ = useTransactions(
		tenantSlug,
		{
			dateFrom: currentRange.dateFrom,
			dateTo: currentRange.dateTo,
			limit: 500,
		},
		tab === "givers",
	);

	const membersQ = useMembers(
		tenantSlug,
		{ limit: 500, includeDeleted: true },
		tab === "givers",
	);
	const campaignsQ = useCampaigns(
		tenantSlug,
		{ includeDeleted: true },
		tab === "givers" || tab === "pledges",
	);

	const pledgesQ = usePledges(
		tenantSlug,
		{ limit: 500, includeDeleted: true },
		tab === "pledges",
	);

	const members: Member[] = membersQ.data?.items ?? [];
	const campaigns: Campaign[] = campaignsQ.data?.items ?? [];

	const membersById = useMemo(
		() => Object.fromEntries(members.map((m) => [m.id, m])),
		[members],
	);
	const campaignsById = useMemo(
		() => Object.fromEntries(campaigns.map((c) => [c.id, c])),
		[campaigns],
	);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Decide"
				title="Reports"
				subtitle="Trends, giver behavior, and pledge dynamics — across the selected period."
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<div className="mb-5 flex flex-wrap items-center gap-3">
					<SegmentedControl
						options={TABS.map((t) => ({ value: t.value, label: t.label }))}
						value={tab}
						onChange={(v) => setTab(v as Tab)}
					/>
					<div className="ml-auto flex items-center gap-2">
						<DateRangePicker
							value={range}
							onChange={setRange}
							placeholder="Date range"
							size="sm"
							autoWidth
							clearable
							presets={RANGE_PRESETS}
						/>
						<Button variant="secondary" icon="download" size="sm" disabled>
							Export
						</Button>
					</div>
				</div>

				{tab === "trend" && (
					<TrendTab
						currentSummary={currentSummary.data}
						priorYearSummary={priorSummary.data}
						loading={currentSummary.isLoading}
					/>
				)}

				{tab === "givers" && (
					<GiversTab
						transactions={giversTxQ.data?.items ?? []}
						membersById={membersById}
						campaignsById={campaignsById}
						loading={
							giversTxQ.isLoading || membersQ.isLoading || campaignsQ.isLoading
						}
					/>
				)}

				{tab === "pledges" && (
					<PledgeDynamicsTab
						pledges={pledgesQ.data?.items ?? []}
						campaignsById={campaignsById}
						loading={pledgesQ.isLoading || campaignsQ.isLoading}
					/>
				)}
			</div>
		</div>
	);
};
