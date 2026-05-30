"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import {
	Button,
	DateRangePicker,
	type DateRangeValue,
	PageHeader,
	SegmentedControl,
} from "@/components/primitives";
import { usePledgesDynamicsReport } from "@/lib/api/pledges";
import { useGiversReport, useTransactionSummary } from "@/lib/api/transactions";
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

	// Single roundtrip — BE does GROUP BY memberId, returns per-type +
	// per-campaign + monthly buckets aligned to the date range.
	const giversReportQ = useGiversReport(
		tenantSlug,
		{
			dateFrom: currentRange.dateFrom,
			dateTo: currentRange.dateTo,
			limit: 50,
		},
		tab === "givers",
	);

	// Cohort-style: pledges whose createdAt falls in the range.
	const pledgesReportQ = usePledgesDynamicsReport(
		tenantSlug,
		{
			dateFrom: currentRange.dateFrom,
			dateTo: currentRange.dateTo,
		},
		tab === "pledges",
	);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="Decide"
				title="Reports"
				subtitle="Trends, giver behavior, and pledge dynamics — across the selected period."
			/>

			<div className="overflow-auto flex-1 px-4 pb-36 md:px-8 md:pb-8">
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
						<Button role="secondary" icon="download" size="sm" disabled>
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
						report={giversReportQ.data}
						loading={giversReportQ.isLoading}
					/>
				)}

				{tab === "pledges" && (
					<PledgeDynamicsTab
						report={pledgesReportQ.data}
						loading={pledgesReportQ.isLoading}
					/>
				)}
			</div>
		</div>
	);
};
