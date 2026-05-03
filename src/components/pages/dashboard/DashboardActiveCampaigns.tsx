"use client";

import Link from "next/link";
import { Card, SectionTitle, StatusBadge } from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCompact } from "@/lib/format-currency";

type Campaign = components["schemas"]["CampaignResponseDto"];

type CampaignWithProgress = Campaign & {
	goalAmount?: number;
	raisedAmount?: number;
};

const STATUS_MAP: Record<
	Campaign["status"],
	"Active" | "Upcoming" | "Completed" | "Cancelled"
> = {
	DRAFT: "Upcoming",
	ACTIVE: "Active",
	COMPLETED: "Completed",
	CANCELLED: "Cancelled",
};

export const DashboardActiveCampaigns = ({
	campaigns,
	progressMap,
	loading,
	tenantSlug,
}: {
	campaigns: Campaign[];
	progressMap: Record<
		string,
		{ goalAmount: number; raisedAmount: number; pledgedAmount: number }
	>;
	loading?: boolean;
	tenantSlug: string;
}) => {
	if (loading) {
		return (
			<Card>
				<SectionTitle title="Active campaigns" />
				{[0, 1, 2].map((i) => (
					<div key={i} className="flex items-center gap-3 px-2 py-3">
						<div className="h-12 w-12 shrink-0 rounded-xl bg-secondary" />
						<div className="min-w-0 flex-1">
							<div className="mb-1.5 h-3.5 w-[140px] rounded bg-secondary" />
							<div className="h-1.5 rounded bg-secondary" />
						</div>
					</div>
				))}
			</Card>
		);
	}

	const visible = campaigns
		.filter((c) => c.status === "ACTIVE" || c.status === "DRAFT")
		.slice(0, 5);

	return (
		<Card>
			<SectionTitle
				title="Active campaigns"
				action={
					<Link
						href={`/${tenantSlug}/admin/campaigns`}
						className="text-sm font-medium text-primary"
					>
						View all →
					</Link>
				}
			/>
			{visible.length === 0 ? (
				<div className="py-8 text-center text-sm text-muted-foreground">
					No active campaigns.
				</div>
			) : (
				visible.map((c) => {
					const progress = progressMap[c.id];
					const goal = progress?.goalAmount ?? 0;
					const raised = progress?.raisedAmount ?? 0;
					const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

					return (
						<Link
							key={c.id}
							href={`/${tenantSlug}/admin/campaigns/${c.id}`}
							className="block text-inherit no-underline"
						>
							<div className="flex cursor-pointer items-center gap-3.5 rounded-[10px] px-2 py-3 transition-colors duration-150 hover:bg-muted">
								<div className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent">
									<span className="text-sm font-semibold tabular-nums text-primary">
										{pct.toFixed(0)}%
									</span>
								</div>
								<div className="min-w-0 flex-1">
									<div className="mb-1.5 flex items-center gap-2">
										<span className="truncate text-sm font-medium text-foreground">
											{c.title}
										</span>
										<StatusBadge status={STATUS_MAP[c.status]} />
									</div>
									<div className="h-1.5 overflow-hidden rounded-[3px] bg-muted">
										<div
											className="h-full rounded-[3px] bg-[linear-gradient(90deg,var(--ring),var(--primary))] transition-[width] duration-500 ease-out"
											style={{ width: `${pct}%` }}
										/>
									</div>
									<div className="mt-1 flex justify-between text-xs text-muted-foreground">
										<span>{formatCompact(raised)} raised</span>
										{goal > 0 && <span>Goal: {formatCompact(goal)}</span>}
									</div>
								</div>
							</div>
						</Link>
					);
				})
			)}
		</Card>
	);
};
