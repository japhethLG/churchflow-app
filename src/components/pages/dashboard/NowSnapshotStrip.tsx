"use client";

import type { ReactNode } from "react";
import { type IconName, StatCard } from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCompact } from "@/lib/format-currency";
import { computeDelta } from "../admin-shared";

type Summary = components["schemas"]["TransactionSummaryResponseDto"];

type StatDef = {
	key: string;
	label: string;
	icon: IconName;
	value: ReactNode;
	caption?: ReactNode;
	delta?: string;
	deltaDirection?: "up" | "down" | "flat";
	accent?: boolean;
};

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

	const hero: StatDef = {
		key: "received",
		label: "Received this week",
		icon: "receipt",
		value: loading ? "—" : formatCompact(totalNow),
		caption:
			countNow > 0
				? `${countNow.toLocaleString()} gifts · avg ${formatCompact(avg)}`
				: "No gifts recorded yet",
		delta: loading ? undefined : totalDelta.value,
		deltaDirection: totalDelta.dir,
		accent: true,
	};

	const small: StatDef[] = [
		{
			key: "members",
			label: "Members",
			icon: "users",
			value: loading ? "—" : (memberCount ?? 0).toLocaleString(),
			caption: newMembersThisWeek
				? `+${newMembersThisWeek} this week`
				: "No new members this week",
		},
		{
			key: "campaigns",
			label: "Active campaigns",
			icon: "calendar",
			value: loading ? "—" : (activeCampaigns ?? 0).toLocaleString(),
			caption: deadlineSoonCount
				? `${deadlineSoonCount} ≤ 14 days to deadline`
				: "No campaigns near deadline",
		},
		{
			key: "vsLast",
			label: "vs. last week",
			icon: "chart",
			value: loading ? "—" : totalDelta.value,
			caption: `Last week: ${formatCompact(totalPrev)}`,
			deltaDirection: totalDelta.dir,
		},
	];

	const renderStat = (
		{ key, ...props }: StatDef,
		mobileVariant?: "hero" | "compact",
		className?: string,
	) => (
		<StatCard
			key={key}
			mobileVariant={mobileVariant}
			className={className}
			{...props}
		/>
	);

	return (
		<>
			{/* Mobile: full-width hero + a horizontally-scrollable KPI carousel. */}
			<div className="mb-6 md:hidden">
				{renderStat(hero, "hero", "mb-3")}
				<div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
					{small.map((c) =>
						renderStat(c, "compact", "w-[44%] shrink-0 snap-start"),
					)}
				</div>
			</div>

			{/* Desktop: 2×2 at md, single 4-up strip at xl. */}
			<div className="mb-6 hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
				{[hero, ...small].map((c) => renderStat(c))}
			</div>
		</>
	);
};
