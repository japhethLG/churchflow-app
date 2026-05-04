"use client";

import { StatCard } from "@/components/primitives";

type StatsProps = {
	total: number;
	pending: number;
	accepted: number;
	cancelled: number;
};

export const InvitationsStatsBar = ({
	total,
	pending,
	accepted,
	cancelled,
}: StatsProps) => {
	return (
		<div className="flex gap-3 overflow-x-auto pb-6">
			<StatCard
				className="flex-1 min-w-[160px]"
				label="Total sent"
				value={total}
				icon="mail"
			/>
			<StatCard
				className="flex-1 min-w-[160px]"
				label="Pending"
				value={pending}
				icon="clock"
			/>
			<StatCard
				className="flex-1 min-w-[160px]"
				label="Accepted"
				value={accepted}
				icon="check"
			/>
			<StatCard
				className="flex-1 min-w-[160px]"
				label="Expired/Cancelled"
				value={cancelled}
				icon="close"
			/>
		</div>
	);
};
