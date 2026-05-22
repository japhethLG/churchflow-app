"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, SectionTitle, StatBand } from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { buildFilterUrl } from "@/lib/url-filters";
import {
	daysUntil,
	LIFECYCLE_COLOR,
	LIFECYCLE_LABEL,
	num,
	type PledgeLifecycle,
	pct,
	pledgeLifecycle,
	resolvePledgeDeadline,
} from "../admin-shared";
import { useCampaignsManyWithItems } from "../dashboard/useCampaignsManyWithItems";

type Pledge = components["schemas"]["PledgeResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

const BUCKETS: PledgeLifecycle[] = [
	"on-track",
	"due-soon",
	"past-due",
	"no-deadline",
];

type DonutTooltipPayload = {
	active?: boolean;
	payload?: {
		payload: {
			label: string;
			amount: number;
			count: number;
			color: string;
			share: number;
		};
	}[];
};

const DonutTooltip = ({ active, payload }: DonutTooltipPayload) => {
	if (!active || !payload?.length) {
		return null;
	}
	const d = payload[0]?.payload;
	if (!d) {
		return null;
	}
	return (
		<div className="rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg">
			<div className="flex items-center gap-1.5 font-medium">
				<span
					className="inline-block size-2 rounded-sm"
					style={{ background: d.color }}
				/>
				{d.label}
			</div>
			<div className="mt-0.5 tabular-nums">
				{formatCurrency(d.amount, { decimals: 0 })}
				<span className="ml-2 opacity-70">{d.share}%</span>
			</div>
			<div className="mt-0.5 opacity-70">
				{d.count} {d.count === 1 ? "pledge" : "pledges"}
			</div>
		</div>
	);
};

export const PledgeDynamicsTab = ({
	pledges,
	campaignsById,
	loading,
}: {
	pledges: Pledge[];
	campaignsById: Record<string, Campaign>;
	loading?: boolean;
}) => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();
	const pledgesHref = `/${tenantSlug}/admin/pledges`;

	// Item deadline takes precedence over campaign deadline — fan out item
	// metadata for the unique campaigns referenced by the pledges in view.
	const pledgeCampaignIds = useMemo(() => {
		const set = new Set<string>();
		for (const p of pledges) {
			if (p.campaignId) {
				set.add(p.campaignId);
			}
		}
		return Array.from(set);
	}, [pledges]);
	const { itemDeadlinesById } = useCampaignsManyWithItems(
		tenantSlug,
		pledgeCampaignIds,
	);

	const enriched = useMemo(
		() =>
			pledges.map((p) => {
				const c = campaignsById[p.campaignId];
				const deadline = resolvePledgeDeadline(p, c, itemDeadlinesById);
				return {
					p,
					deadline,
					days: daysUntil(deadline),
					lifecycle: pledgeLifecycle(
						p.pledgedAmount,
						p.paidAmount,
						p.status,
						deadline,
					),
				};
			}),
		[pledges, campaignsById, itemDeadlinesById],
	);

	const active = enriched.filter((r) => r.p.status === "ACTIVE");
	const fulfilled = enriched.filter((r) => r.p.status === "FULFILLED");
	const cancelled = enriched.filter((r) => r.p.status === "CANCELLED");

	const totalPledged = enriched.reduce((s, r) => s + num(r.p.pledgedAmount), 0);
	const totalPaid = enriched.reduce((s, r) => s + num(r.p.paidAmount), 0);
	const totalRemaining = enriched.reduce(
		(s, r) => s + num(r.p.remainingAmount),
		0,
	);
	const fulfillmentPct = pct(totalPaid, totalPledged);

	// Aging is computed against active pledges' OUTSTANDING amount — the
	// thing that's still owed. Fulfilled / cancelled excluded.
	const agingByBucket = useMemo(() => {
		const buckets: Record<PledgeLifecycle, { amount: number; count: number }> =
			{
				fulfilled: { amount: 0, count: 0 },
				"on-track": { amount: 0, count: 0 },
				"due-soon": { amount: 0, count: 0 },
				"past-due": { amount: 0, count: 0 },
				"no-deadline": { amount: 0, count: 0 },
				cancelled: { amount: 0, count: 0 },
			};
		for (const r of active) {
			buckets[r.lifecycle].amount += num(r.p.remainingAmount);
			buckets[r.lifecycle].count += 1;
		}
		return buckets;
	}, [active]);

	const totalActiveOutstanding = BUCKETS.reduce(
		(s, k) => s + agingByBucket[k].amount,
		0,
	);

	const donutSegments = BUCKETS.map((b) => {
		const amount = agingByBucket[b].amount;
		const count = agingByBucket[b].count;
		return {
			key: b,
			label: LIFECYCLE_LABEL[b],
			color: LIFECYCLE_COLOR[b],
			amount,
			count,
			share:
				totalActiveOutstanding > 0
					? Math.round((amount / totalActiveOutstanding) * 100)
					: 0,
		};
	});

	const placeholder = [
		{
			key: "empty",
			label: "No active pledges",
			color: "var(--chart-track)",
			amount: 1,
			count: 0,
			share: 0,
		},
	];

	const cancellationRate = pct(
		cancelled.length,
		enriched.filter((r) => r.p.status !== "ACTIVE").length || 1,
	);

	return (
		<>
			<Card className="mb-6">
				<SectionTitle title="Pledge fulfillment" />
				<StatBand
					size="md"
					items={[
						{
							label: "Pledged",
							value: formatCompact(totalPledged),
							caption: `${enriched.length} pledges`,
						},
						{
							label: "Paid",
							value: formatCompact(totalPaid),
							caption: `${fulfillmentPct}% of pledged`,
						},
						{
							label: "Outstanding",
							value: formatCompact(totalRemaining),
							caption: `${active.length} active pledges`,
						},
						{
							label: "Cancellation rate",
							value: `${cancellationRate}%`,
							caption: "Cancelled vs. closed (fulfilled + cancelled)",
						},
					]}
				/>
			</Card>

			<Card className="mb-6">
				<SectionTitle title="Active-pledge aging" />
				<p className="-mt-3 mb-4 text-sm text-muted-foreground">
					Outstanding amount split by lifecycle. Click a bucket to view those
					pledges.
				</p>
				{loading ? (
					<div className="py-12 text-center text-sm text-muted-foreground">
						Loading…
					</div>
				) : active.length === 0 ? (
					<div className="py-12 text-center text-sm text-muted-foreground">
						No active pledges in scope.
					</div>
				) : (
					<div className="grid items-center gap-6 lg:grid-cols-[280px_1fr]">
						{/* Donut */}
						<div className="grid place-items-center">
							<div className="relative size-[240px]">
								<div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
									<div>
										<div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
											Outstanding
										</div>
										<div className="mt-1 text-2xl font-bold tabular-nums text-foreground">
											{formatCompact(totalActiveOutstanding)}
										</div>
										<div className="mt-0.5 text-xs text-muted-foreground">
											{active.length}{" "}
											{active.length === 1 ? "pledge" : "pledges"}
										</div>
									</div>
								</div>
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={
												totalActiveOutstanding > 0 ? donutSegments : placeholder
											}
											dataKey="amount"
											cx="50%"
											cy="50%"
											innerRadius={70}
											outerRadius={100}
											paddingAngle={1.5}
											stroke="none"
										>
											{(totalActiveOutstanding > 0
												? donutSegments
												: placeholder
											).map((s) => (
												<Cell key={s.key} fill={s.color} />
											))}
										</Pie>
										<Tooltip content={<DonutTooltip />} />
									</PieChart>
								</ResponsiveContainer>
							</div>
						</div>

						{/* Clickable bucket cards */}
						<div className="grid grid-cols-2 gap-3">
							{donutSegments.map((s) => (
								<Link
									key={s.key}
									href={buildFilterUrl(pledgesHref, {
										lifecycle: s.key,
										status: "ACTIVE",
									})}
									className="group block rounded-lg border border-border p-4 transition-colors hover:border-primary hover:bg-accent/40"
								>
									<div className="flex items-center gap-2">
										<span
											className="size-2.5 rounded-full"
											style={{ background: s.color }}
										/>
										<span className="text-sm font-semibold text-foreground">
											{s.label}
										</span>
										<span className="ml-auto text-xs text-muted-foreground group-hover:text-primary">
											View →
										</span>
									</div>
									<div className="mt-2 flex items-baseline gap-2">
										<span className="text-2xl font-bold tabular-nums text-foreground">
											{formatCompact(s.amount)}
										</span>
										<span className="text-sm text-muted-foreground">
											{s.share}%
										</span>
									</div>
									<div className="mt-0.5 text-xs text-muted-foreground">
										{s.count} {s.count === 1 ? "pledge" : "pledges"}
									</div>
								</Link>
							))}
						</div>
					</div>
				)}
			</Card>

			<Card className="mb-6">
				<SectionTitle title="Status breakdown" />
				<StatBand
					size="md"
					items={[
						{
							label: "Active",
							value: active.length.toLocaleString(),
							caption: formatCurrency(
								active.reduce((s, r) => s + num(r.p.pledgedAmount), 0),
								{ decimals: 0 },
							),
						},
						{
							label: "Fulfilled",
							value: fulfilled.length.toLocaleString(),
							caption: formatCurrency(
								fulfilled.reduce((s, r) => s + num(r.p.pledgedAmount), 0),
								{ decimals: 0 },
							),
						},
						{
							label: "Cancelled",
							value: cancelled.length.toLocaleString(),
							caption: formatCurrency(
								cancelled.reduce((s, r) => s + num(r.p.pledgedAmount), 0),
								{ decimals: 0 },
							),
						},
					]}
				/>
			</Card>
		</>
	);
};
