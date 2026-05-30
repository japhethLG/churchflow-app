"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, SectionTitle, StatBand } from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { buildFilterUrl } from "@/lib/url-filters";
import {
	LIFECYCLE_COLOR,
	LIFECYCLE_LABEL,
	type PledgeLifecycle,
} from "../admin-shared";

type Report = components["schemas"]["PledgesReportResponseDto"];

// Aging buckets we render in the donut. cancelled / fulfilled are NOT
// part of "active outstanding" — they belong to the status breakdown
// below. no-deadline is included because those pledges have outstanding
// amounts that aren't time-bound but still need attention.
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
	report,
	loading,
}: {
	report?: Report;
	loading?: boolean;
}) => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();
	const pledgesHref = `/${tenantSlug}/admin/pledges`;

	const totalPledged = report?.totalPledged ?? 0;
	const totalPaid = report?.totalPaid ?? 0;
	const totalRemaining = report?.totalRemaining ?? 0;
	const fulfillmentPct = report ? Math.round(report.fulfillmentPct * 100) : 0;
	const totalCount = report?.totalCount ?? 0;

	const statusBy = new Map(
		(report?.statusBreakdown ?? []).map((s) => [s.status, s]),
	);
	const active = statusBy.get("ACTIVE");
	const fulfilled = statusBy.get("FULFILLED");
	const cancelled = statusBy.get("CANCELLED");

	type AgingBucket = NonNullable<Report["aging"]>[number];
	const agingByBucket = new Map<string, AgingBucket>(
		(report?.aging ?? []).map((b) => [b.lifecycle as string, b]),
	);
	const totalActiveOutstanding = (report?.aging ?? []).reduce(
		(s, b) => s + b.outstanding,
		0,
	);

	const donutSegments = BUCKETS.map((b) => {
		const bucket = agingByBucket.get(b);
		const amount = bucket?.outstanding ?? 0;
		const count = bucket?.count ?? 0;
		const share = bucket ? Math.round(bucket.share * 100) : 0;
		return {
			key: b,
			label: LIFECYCLE_LABEL[b],
			color: LIFECYCLE_COLOR[b],
			amount,
			count,
			share,
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

	return (
		<>
			<Card className="mb-6">
				<SectionTitle title="Pledge fulfillment (cohort starting in range)" />
				<p className="-mt-3 mb-4 text-sm text-muted-foreground">
					Of pledges created in the selected range, how much has been delivered
					and how much remains.
				</p>
				<StatBand
					size="md"
					mobileColumns={3}
					items={[
						{
							label: "Pledged",
							value: formatCompact(totalPledged),
							caption: `${totalCount} pledges`,
						},
						{
							label: "Paid",
							value: formatCompact(totalPaid),
							caption: `${fulfillmentPct}% of pledged`,
						},
						{
							label: "Outstanding",
							value: formatCompact(totalRemaining),
							caption: `${active?.count ?? 0} active pledges`,
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
				) : !active || active.count === 0 ? (
					<div className="py-12 text-center text-sm text-muted-foreground">
						No active pledges in scope.
					</div>
				) : (
					<div className="grid items-center gap-6 lg:grid-cols-[280px_1fr]">
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
											{active.count} {active.count === 1 ? "pledge" : "pledges"}
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
					mobileColumns={3}
					items={[
						{
							label: "Active",
							value: (active?.count ?? 0).toLocaleString(),
							caption: formatCurrency(active?.pledged ?? 0, { decimals: 0 }),
						},
						{
							label: "Fulfilled",
							value: (fulfilled?.count ?? 0).toLocaleString(),
							caption: formatCurrency(fulfilled?.pledged ?? 0, {
								decimals: 0,
							}),
						},
						{
							label: "Cancelled",
							value: (cancelled?.count ?? 0).toLocaleString(),
							caption: formatCurrency(cancelled?.pledged ?? 0, {
								decimals: 0,
							}),
						},
					]}
				/>
			</Card>
		</>
	);
};
