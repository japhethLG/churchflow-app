"use client";

import type { ReactNode } from "react";
import { type IconName, StatCard } from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCompact } from "@/lib/format-currency";
import { computeDelta, num } from "../admin-shared";

type Summary = components["schemas"]["MyChurchSummaryResponseDto"];

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

// Church pulse — aggregate-only snapshot of the member's tenant.
// Designed for the dashboard header. Personal "your giving this year"
// sits last to anchor the strip in personal context.
export const MemberChurchPulseStrip = ({
	summary,
	myYearTotal,
	loading,
}: {
	summary?: Summary;
	myYearTotal: number;
	loading?: boolean;
}) => {
	const receivedNow = summary?.receivedThisMonth ?? 0;
	const receivedPrev = summary?.receivedLastMonth ?? 0;
	const monthDelta = computeDelta(receivedNow, receivedPrev);

	const activeCount = summary?.activeCampaignCount ?? 0;
	const upcomingCount = summary?.upcomingCampaignCount ?? 0;

	const memberCount = summary?.memberCount ?? 0;
	const newMembers = summary?.newMembersThisMonth ?? 0;

	const hero: StatDef = {
		key: "received",
		label: "Church received this month",
		icon: "receipt",
		value: loading ? "—" : formatCompact(receivedNow),
		caption: summary?.receivedThisMonthCount
			? `${summary.receivedThisMonthCount.toLocaleString()} gifts recorded`
			: "No gifts yet this month",
		delta: loading ? undefined : monthDelta.value,
		deltaDirection: monthDelta.dir,
		accent: true,
	};

	const small: StatDef[] = [
		{
			key: "campaigns",
			label: "Active campaigns",
			icon: "calendar",
			value: loading ? "—" : activeCount.toLocaleString(),
			caption:
				upcomingCount > 0
					? `${upcomingCount} upcoming`
					: "No upcoming campaigns",
		},
		{
			key: "members",
			label: "Church members",
			icon: "users",
			value: loading ? "—" : memberCount.toLocaleString(),
			caption:
				newMembers > 0
					? `+${newMembers} new this month`
					: "No new members this month",
		},
		{
			key: "you",
			label: "Your giving this year",
			icon: "chart",
			value: loading ? "—" : formatCompact(num(myYearTotal)),
			caption: "Total across all campaigns",
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
