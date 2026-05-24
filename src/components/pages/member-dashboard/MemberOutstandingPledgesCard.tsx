"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Badge,
	Card,
	Pressable,
	SectionTitle,
	StackedProgressBar,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import {
	daysUntil,
	LIFECYCLE_COLOR,
	LIFECYCLE_LABEL,
	num,
	pledgeLifecycle,
	resolvePledgeDeadline,
} from "../admin-shared";

type Pledge = components["schemas"]["MyPledgeResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

// Member-side mirror of the admin OutstandingPledgesCard. Surfaces the
// member's own pledges that are past-due, due-soon, or near deadline.
// Same composition pattern (StackedProgressBar + lifecycle badge);
// different copy + intent (this is the member's commitments, not the
// church's collectibles).
export const MemberOutstandingPledgesCard = ({
	pledges,
	campaignsById,
	itemDeadlinesById,
	tenantSlug,
	loading,
}: {
	pledges: Pledge[];
	campaignsById: Record<string, Campaign>;
	itemDeadlinesById: Record<string, string | null>;
	tenantSlug: string;
	loading?: boolean;
}) => {
	const router = useRouter();

	const enriched = pledges
		.map((p) => {
			const c = campaignsById[p.campaignId];
			const deadline = resolvePledgeDeadline(p, c, itemDeadlinesById);
			return {
				p,
				campaign: c,
				deadline,
				days: daysUntil(deadline),
				lifecycle: pledgeLifecycle(
					p.pledgedAmount,
					p.paidAmount,
					p.status,
					deadline,
				),
			};
		})
		.filter(
			(x) =>
				x.p.status === "ACTIVE" &&
				num(x.p.remainingAmount) > 0 &&
				(x.lifecycle === "past-due" ||
					x.lifecycle === "due-soon" ||
					(x.lifecycle === "on-track" &&
						(x.days ?? Number.POSITIVE_INFINITY) <= 30)),
		)
		.sort((a, b) => {
			const aPast = a.lifecycle === "past-due" ? 0 : 1;
			const bPast = b.lifecycle === "past-due" ? 0 : 1;
			if (aPast !== bPast) {
				return aPast - bPast;
			}
			const aDays = a.days ?? Number.POSITIVE_INFINITY;
			const bDays = b.days ?? Number.POSITIVE_INFINITY;
			if (aDays !== bDays) {
				return aDays - bDays;
			}
			return num(b.p.remainingAmount) - num(a.p.remainingAmount);
		})
		.slice(0, 5);

	const totalOutstanding = enriched.reduce(
		(s, x) => s + num(x.p.remainingAmount),
		0,
	);

	return (
		<Card>
			<SectionTitle
				title="Your outstanding pledges"
				action={
					<Link
						href={`/${tenantSlug}/member/my-pledges`}
						className="text-xs font-semibold text-primary hover:underline"
					>
						See all →
					</Link>
				}
			/>
			<p className="-mt-3 mb-3 text-sm text-muted-foreground">
				Past due, due-soon (≤14d), or near-deadline (≤30d).{" "}
				{enriched.length > 0 && (
					<>
						<span className="font-semibold text-foreground">
							{formatCompact(totalOutstanding)}
						</span>{" "}
						remaining across these.
					</>
				)}
			</p>

			{loading ? (
				<div className="py-6 text-center text-sm text-muted-foreground">
					Loading…
				</div>
			) : enriched.length === 0 ? (
				<div className="py-6 text-center text-sm text-muted-foreground">
					Nothing outstanding — you're caught up.
				</div>
			) : (
				<ul className="divide-y divide-border">
					{enriched.map(({ p, campaign, days, lifecycle }) => (
						<li key={p.id}>
							<Pressable
								onClick={() =>
									router.push(`/${tenantSlug}/member/my-pledges/${p.id}`)
								}
								className="flex w-full items-center gap-3 rounded-md px-1 py-2.5 text-left transition-colors hover:bg-muted/60"
							>
								<div className="min-w-0 flex-1">
									<div className="flex items-baseline justify-between gap-3">
										{campaign ? (
											<Link
												href={`/${tenantSlug}/member/campaigns/${campaign.id}`}
												onClick={(e) => e.stopPropagation()}
												className="truncate text-sm font-medium text-foreground hover:underline"
											>
												{campaign.title}
											</Link>
										) : (
											<span className="truncate text-sm font-medium text-foreground">
												Pledge
											</span>
										)}
										<span className="text-sm font-semibold tabular-nums text-foreground">
											{formatCurrency(p.remainingAmount, { decimals: 0 })}
										</span>
									</div>
									<div className="mt-0.5 flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
										<span>
											{num(p.paidAmount) > 0
												? `${formatCompact(p.paidAmount)} / ${formatCompact(p.pledgedAmount)} paid`
												: `of ${formatCompact(p.pledgedAmount)} pledged`}
										</span>
									</div>
									<div className="mt-1.5 flex items-center gap-2">
										<div className="flex-1">
											<StackedProgressBar
												size="xs"
												total={p.pledgedAmount}
												segments={[
													{
														value: p.paidAmount,
														color: "var(--chart-current)",
														label: "Paid",
													},
												]}
											/>
										</div>
										<Badge
											color={
												lifecycle === "past-due"
													? "red"
													: lifecycle === "due-soon"
														? "amber"
														: "neutral"
											}
										>
											{LIFECYCLE_LABEL[lifecycle]}
											{days !== null && (
												<>
													{" · "}
													{days < 0 ? `${Math.abs(days)}d ago` : `in ${days}d`}
												</>
											)}
										</Badge>
									</div>
								</div>
							</Pressable>
						</li>
					))}
				</ul>
			)}

			<div className="mt-3 flex flex-wrap gap-3 border-t border-border pt-3 text-[10px] text-muted-foreground">
				{(["past-due", "due-soon", "on-track"] as const).map((k) => (
					<span key={k} className="flex items-center gap-1.5">
						<span
							className="size-2 rounded-full"
							style={{ background: LIFECYCLE_COLOR[k] }}
						/>
						{LIFECYCLE_LABEL[k]}
					</span>
				))}
			</div>
		</Card>
	);
};
