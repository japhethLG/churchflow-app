"use client";

import { StatCard } from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCompact } from "@/lib/format-currency";
import { computeDelta } from "../admin-shared";

type Summary = components["schemas"]["TransactionSummaryResponseDto"];

export const NowSnapshotStrip = ({
	weekSummary,
	priorWeekSummary,
	memberCount,
	newMembersThisWeek,
	activeCampaigns,
	deadlineSoonCount,
	loading,
}: {
	weekSummary?: Summary;
	priorWeekSummary?: Summary;
	memberCount?: number;
	newMembersThisWeek?: number;
	activeCampaigns?: number;
	deadlineSoonCount?: number;
	loading?: boolean;
}) => {
	const totalNow = weekSummary?.total ?? 0;
	const totalPrev = priorWeekSummary?.total ?? 0;
	const countNow = weekSummary?.count ?? 0;
	const avg = countNow > 0 ? totalNow / countNow : 0;

	const totalDelta = computeDelta(totalNow, totalPrev);

	return (
		// Mobile: a full-width hero + 3-up snapshot row (grid-cols-3). md: 2×2.
		// xl: the original single 4-up strip.
		<div className="mb-6 grid grid-cols-3 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
			<StatCard
				className="col-span-3 md:col-span-1"
				mobileVariant="hero"
				label="Received this week"
				icon="receipt"
				value={loading ? "—" : formatCompact(totalNow)}
				caption={
					countNow > 0
						? `${countNow.toLocaleString()} gifts · avg ${formatCompact(avg)}`
						: "No gifts recorded yet"
				}
				delta={loading ? undefined : totalDelta.value}
				deltaDirection={totalDelta.dir}
				accent
			/>
			<StatCard
				mobileVariant="compact"
				label="Members"
				icon="users"
				value={loading ? "—" : (memberCount ?? 0).toLocaleString()}
				caption={
					newMembersThisWeek
						? `+${newMembersThisWeek} this week`
						: "No new members this week"
				}
			/>
			<StatCard
				mobileVariant="compact"
				label="Active campaigns"
				icon="calendar"
				value={loading ? "—" : (activeCampaigns ?? 0).toLocaleString()}
				caption={
					deadlineSoonCount
						? `${deadlineSoonCount} ≤ 14 days to deadline`
						: "No campaigns near deadline"
				}
			/>
			<StatCard
				mobileVariant="compact"
				label="vs. last week"
				icon="chart"
				value={loading ? "—" : totalDelta.value}
				caption={`Last week: ${formatCompact(totalPrev)}`}
				deltaDirection={totalDelta.dir}
			/>
		</div>
	);
};
