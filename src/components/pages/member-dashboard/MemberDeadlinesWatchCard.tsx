"use client";

import Link from "next/link";
import {
	Badge,
	Card,
	SectionTitle,
	StackedProgressBar,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCompact } from "@/lib/format-currency";
import { daysUntil, pct } from "../admin-shared";
import type { MyCampaignProgressLite } from "./useMyCampaignProgressMany";

type Campaign = components["schemas"]["CampaignResponseDto"];

// Member-side mirror of the admin DeadlineWatchCard. Surfaces active
// campaigns approaching deadline so the member can see "where can I
// still help?" at a glance. Click-through goes to the member campaign
// detail page (not the admin one).
export const MemberDeadlinesWatchCard = ({
	campaigns,
	progressById,
	tenantSlug,
	loading,
}: {
	campaigns: Campaign[];
	progressById: Record<string, MyCampaignProgressLite>;
	tenantSlug: string;
	loading?: boolean;
}) => {
	const rows = campaigns
		.filter((c) => c.status === "ACTIVE" && typeof c.deadline === "string")
		.map((c) => {
			const deadline = c.deadline as unknown as string;
			return {
				c,
				deadline,
				days: daysUntil(deadline),
				prog: progressById[c.id],
			};
		})
		.filter((x) => x.days !== null && x.days <= 30)
		.sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
		.slice(0, 5);

	return (
		<Card>
			<SectionTitle
				title="Campaigns closing soon"
				action={
					<Link
						href={`/${tenantSlug}/member/campaigns`}
						className="text-xs font-semibold text-primary hover:underline"
					>
						Browse all →
					</Link>
				}
			/>
			<p className="-mt-3 mb-3 text-sm text-muted-foreground">
				Active campaigns at your church with ≤30 days remaining.
			</p>

			{loading ? (
				<div className="py-6 text-center text-sm text-muted-foreground">
					Loading…
				</div>
			) : rows.length === 0 ? (
				<div className="py-6 text-center text-sm text-muted-foreground">
					No campaigns approaching deadline.
				</div>
			) : (
				<ul className="space-y-3.5">
					{rows.map(({ c, days, prog }) => {
						const goal = prog?.goalAmount ?? 0;
						const raised = prog?.raisedAmount ?? 0;
						const pledged = prog?.pledgedAmount ?? 0;
						const raisedPct = pct(raised, goal);
						return (
							<li key={c.id}>
								<div className="flex items-baseline justify-between gap-3">
									<Link
										href={`/${tenantSlug}/member/campaigns/${c.id}`}
										className="truncate text-sm font-medium text-foreground hover:underline"
									>
										{c.title}
									</Link>
									<Badge
										color={
											(days ?? 0) < 0
												? "red"
												: (days ?? 0) <= 7
													? "amber"
													: "neutral"
										}
									>
										{(days ?? 0) < 0
											? `${Math.abs(days ?? 0)}d past due`
											: `${days}d left`}
									</Badge>
								</div>
								<div className="mt-1 text-xs text-muted-foreground">
									{goal > 0 ? (
										<>
											{formatCompact(raised)} / {formatCompact(goal)} raised ·{" "}
											<span className="font-semibold text-foreground">
												{raisedPct}%
											</span>
										</>
									) : (
										"No goal set"
									)}
								</div>
								{goal > 0 && (
									<div className="mt-1.5">
										<StackedProgressBar
											size="xs"
											total={goal}
											segments={[
												{
													value: pledged,
													color:
														"color-mix(in srgb, var(--chart-current) 35%, transparent)",
													label: "Pledged",
												},
												{
													value: raised,
													color: "var(--chart-current)",
													label: "Raised",
												},
											]}
										/>
									</div>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</Card>
	);
};
