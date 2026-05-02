"use client";

import { StatCard } from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCurrency } from "@/lib/format-currency";

type Summary = components["schemas"]["TransactionSummaryResponseDto"];

export const DashboardKpiStrip = ({
	summary,
	previousSummary,
	memberCount,
	newMembersThisMonth,
	activeCampaignCount,
	loading,
}: {
	summary: Summary | undefined;
	previousSummary: Summary | undefined;
	memberCount: number;
	newMembersThisMonth?: number;
	activeCampaignCount: number;
	loading?: boolean;
}) => {
	if (loading || !summary) {
		return (
			<div className="mb-6 grid grid-cols-4 gap-4">
				{[0, 1, 2, 3].map((i) => (
					<div key={i} className="min-h-[120px] rounded-2xl bg-card p-6">
						<div className="mb-4 h-3 w-20 animate-pulse rounded bg-secondary" />
						<div className="h-8 w-[120px] animate-pulse rounded-md bg-secondary" />
					</div>
				))}
			</div>
		);
	}

	const total = summary.total;
	const count = summary.count;

	const prevTotal = previousSummary?.total ?? 0;
	const delta =
		prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : undefined;
	const deltaStr =
		delta !== undefined ? `${Math.abs(delta).toFixed(0)}%` : undefined;
	const deltaDir =
		delta !== undefined
			? delta > 0
				? "up"
				: delta < 0
					? "down"
					: "flat"
			: undefined;

	const prevCount = previousSummary?.count ?? 0;
	const countDelta =
		prevCount > 0 ? ((count - prevCount) / prevCount) * 100 : undefined;
	const countDeltaStr =
		countDelta !== undefined
			? `${Math.abs(countDelta).toFixed(0)}%`
			: undefined;
	const countDeltaDir =
		countDelta !== undefined
			? countDelta > 0
				? "up"
				: countDelta < 0
					? "down"
					: "flat"
			: undefined;

	return (
		<div className="mb-6 grid grid-cols-4 gap-4">
			<StatCard
				label="Total this month"
				value={
					<span className="bg-[linear-gradient(135deg,var(--ring),var(--primary))] bg-clip-text text-[32px] font-semibold tabular-nums tracking-tighter">
						{formatCurrency(total)}
					</span>
				}
				delta={deltaStr}
				deltaDirection={deltaDir as "up" | "down" | "flat" | undefined}
				caption={
					prevTotal > 0
						? `vs. ${formatCurrency(prevTotal)} last month`
						: undefined
				}
			/>
			<StatCard
				label="Gifts this month"
				value={count.toString()}
				delta={countDeltaStr}
				deltaDirection={countDeltaDir as "up" | "down" | "flat" | undefined}
				caption={`${count} ${count === 1 ? "transaction" : "transactions"}`}
			/>
			<StatCard
				label="Active members"
				value={memberCount.toString()}
				caption={
					newMembersThisMonth !== undefined
						? `${newMembersThisMonth} new this month`
						: undefined
				}
			/>
			<StatCard
				label="Active campaigns"
				value={activeCampaignCount.toString()}
				caption={
					activeCampaignCount === 0
						? "No active campaigns"
						: `${activeCampaignCount} in progress`
				}
			/>
		</div>
	);
};
