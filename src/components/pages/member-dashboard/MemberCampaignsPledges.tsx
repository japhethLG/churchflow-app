"use client";

import Link from "next/link";
import {
	Badge,
	Card,
	SectionTitle,
	StatusBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { nstr } from "@/lib/api/coerce";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";

type Campaign = components["schemas"]["CampaignResponseDto"];
type Pledge = components["schemas"]["PledgeResponseDto"];

const PLEDGE_STATUS_MAP: Record<
	Pledge["status"],
	"Active" | "Completed" | "Cancelled"
> = {
	ACTIVE: "Active",
	FULFILLED: "Completed",
	CANCELLED: "Cancelled",
};

export const MemberCampaignsPledges = ({
	campaigns,
	pledges,
	progressMap,
	loading,
	tenantSlug,
	memberId: _memberId,
}: {
	campaigns: Campaign[];
	pledges: Pledge[];
	progressMap: Record<
		string,
		{ goalAmount: number; raisedAmount: number; pledgedAmount: number }
	>;
	loading?: boolean;
	tenantSlug: string;
	memberId?: string;
}) => {
	if (loading) {
		return (
			<Card>
				<SectionTitle title="Campaigns & pledges" />
				{[0, 1, 2].map((i) => (
					<div key={i} className="mb-2 flex gap-3.5 p-3">
						<div className="h-[60px] w-[58px] shrink-0 rounded-[10px] bg-secondary" />
						<div className="flex-1">
							<div className="mb-2 h-3.5 w-40 rounded bg-secondary" />
							<div className="h-1.5 rounded bg-secondary" />
						</div>
					</div>
				))}
			</Card>
		);
	}

	const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
	const activePledges = pledges.filter((p) => p.status === "ACTIVE");

	const pledgeByCampaign: Record<string, Pledge[]> = {};
	for (const p of activePledges) {
		if (!pledgeByCampaign[p.campaignId]) {
			pledgeByCampaign[p.campaignId] = [];
		}
		pledgeByCampaign[p.campaignId].push(p);
	}

	return (
		<Card>
			<SectionTitle
				title="Campaigns & pledges"
				action={
					<Link
						href={`/${tenantSlug}/member/campaigns`}
						className="text-[13px] font-medium text-primary"
					>
						Browse campaigns →
					</Link>
				}
			/>

			{activeCampaigns.length === 0 && activePledges.length === 0 ? (
				<div className="py-8 text-center text-sm text-muted-foreground">
					<div className="mb-2 text-[32px]">🎯</div>
					No active campaigns right now.
				</div>
			) : (
				<div className="flex flex-col gap-2.5">
					{activeCampaigns.map((c) => {
						const progress = progressMap[c.id];
						const goal = progress?.goalAmount ?? 0;
						const raised = progress?.raisedAmount ?? 0;
						const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
						const myPledges = pledgeByCampaign[c.id] ?? [];
						const myPledgeTotal = myPledges.reduce(
							(s, p) => s + Number(p.pledgedAmount),
							0,
						);
						const description = nstr(c.description);
						const deadline = nstr(c.deadline);

						return (
							<Link
								key={c.id}
								href={`/${tenantSlug}/member/campaigns`}
								className="text-inherit no-underline"
							>
								<div className="rounded-xl bg-muted p-3.5 transition-colors duration-150 hover:bg-secondary">
									<div className="mb-2 flex items-center gap-2">
										<span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-foreground">
											{c.title}
										</span>
										<StatusBadge status="Active" />
									</div>

									{description && (
										<div className="mb-2.5 truncate text-xs leading-snug text-muted-foreground">
											{description}
										</div>
									)}

									{goal > 0 && (
										<>
											<div className="mb-1.5 h-1.5 overflow-hidden rounded-[3px] bg-card">
												<div
													className="h-full rounded-[3px] bg-[linear-gradient(90deg,var(--ring),var(--primary))] transition-[width] duration-500 ease-out"
													style={{ width: `${pct}%` }}
												/>
											</div>
											<div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
												<span>{formatCompact(raised)} raised</span>
												<span>Goal: {formatCompact(goal)}</span>
											</div>
										</>
									)}

									<div className="mt-1 flex flex-wrap gap-1.5">
										{myPledgeTotal > 0 ? (
											<Badge color="indigo">
												Your pledge: {formatCurrency(myPledgeTotal)}
											</Badge>
										) : (
											<Badge color="neutral">No pledge yet</Badge>
										)}
										{deadline && (
											<Badge color="gray">
												Ends {dayjs(deadline).format("MMM D")}
											</Badge>
										)}
									</div>
								</div>
							</Link>
						);
					})}

					{activePledges
						.filter((p) => !activeCampaigns.some((c) => c.id === p.campaignId))
						.slice(0, 3)
						.map((p) => (
							<div
								key={p.id}
								className="flex items-center gap-2.5 rounded-[10px] bg-muted px-3.5 py-3"
							>
								<div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-tertiary/10">
									<span className="text-base">📝</span>
								</div>
								<div className="min-w-0 flex-1">
									<div className="text-[13px] font-medium text-foreground">
										Pledge: {formatCurrency(p.pledgedAmount)}
									</div>
									<div className="mt-0.5 text-[11px] text-muted-foreground">
										Campaign ID: {p.campaignId.slice(0, 8)}…
									</div>
								</div>
								<StatusBadge status={PLEDGE_STATUS_MAP[p.status]} />
							</div>
						))}
				</div>
			)}
		</Card>
	);
};
