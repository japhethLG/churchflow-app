"use client";

import { Amount, StatCard } from "@/components/primitives";
import { TypeBadge } from "@/components/primitives/Badge";
import dayjs from "@/lib/dayjs";

type Transaction = {
	type: string;
	amount: number;
	date: string;
};

const TYPE_LABEL: Record<string, string> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

export const MemberKpiStrip = ({
	transactions,
	loading,
}: {
	transactions: Transaction[];
	loading?: boolean;
}) => {
	if (loading) {
		return (
			<div className="mb-6 grid grid-cols-3 gap-4">
				{[0, 1, 2].map((i) => (
					<StatCard key={i} label="Loading…" value="" caption="" />
				))}
			</div>
		);
	}

	const now = dayjs();
	const monthStart = now.startOf("month");
	const yearStart = now.startOf("year");

	const thisMonth = transactions.filter((t) =>
		dayjs(t.date).isSameOrAfter(monthStart),
	);
	const thisYear = transactions.filter((t) =>
		dayjs(t.date).isSameOrAfter(yearStart),
	);

	const monthTotal = thisMonth.reduce((s, t) => s + Number(t.amount), 0);
	const yearTotal = thisYear.reduce((s, t) => s + Number(t.amount), 0);

	// Most recent gift
	const sorted = [...transactions].sort(
		(a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
	);
	const recent = sorted[0];
	const recentDays = recent ? now.diff(dayjs(recent.date), "day") : null;

	const recentCaption = recent
		? (() => {
				const typeLabel = TYPE_LABEL[recent.type] ?? recent.type;
				const daysText =
					recentDays === 0
						? "Today"
						: recentDays === 1
							? "Yesterday"
							: `${recentDays}d ago`;
				return (
					<span className="inline-flex items-center gap-2">
						<TypeBadge type={typeLabel as "Tithe"} /> {daysText}
					</span>
				);
			})()
		: "No gifts yet";

	return (
		<div className="mb-6 grid grid-cols-3 gap-4">
			<StatCard
				label="Your giving this month"
				value={<Amount value={monthTotal} size="display" />}
				caption={`${thisMonth.length} gift${thisMonth.length !== 1 ? "s" : ""} recorded`}
			/>
			<StatCard
				label="Your giving this year"
				value={<Amount value={yearTotal} size="display" />}
				caption={`Fiscal year started January`}
			/>
			<StatCard
				label="Most recent gift"
				value={
					recent ? (
						<Amount value={recent.amount} size="display" />
					) : (
						<span className="text-5xl font-semibold text-muted-foreground">
							—
						</span>
					)
				}
				caption={recentCaption}
			/>
		</div>
	);
};
