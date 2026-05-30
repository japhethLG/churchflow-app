"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
	Bar,
	CartesianGrid,
	Cell,
	BarChart as RechartsBarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Avatar,
	Card,
	SectionTitle,
	StackedProgressBar,
	StatBand,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import { useMembers } from "@/lib/api/members";
import { usePledges } from "@/lib/api/pledges";
import { useTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { daysUntil, num, pct } from "../admin-shared";

type Campaign = components["schemas"]["CampaignWithItemsResponseDto"];
type Progress = components["schemas"]["CampaignProgressResponseDto"];

type Bucket = "daily" | "weekly" | "monthly";

const pickBucket = (durationDays: number): Bucket => {
	if (durationDays <= 30) {
		return "daily";
	}
	if (durationDays <= 365) {
		return "weekly";
	}
	return "monthly";
};

const bucketFormat: Record<Bucket, string> = {
	daily: "MMM D",
	weekly: "MMM D",
	monthly: "MMM YYYY",
};

const bucketUnit: Record<Bucket, dayjs.ManipulateType> = {
	daily: "day",
	weekly: "week",
	monthly: "month",
};

export const CampaignOverviewTab = ({
	campaign,
	progress,
	tenantSlug,
}: {
	campaign: Campaign;
	progress: Progress | undefined;
	tenantSlug: string;
}) => {
	const goal = num(progress?.goalAmount);
	const pledged = num(progress?.pledgedAmount);
	const raised = num(progress?.raisedAmount);
	const outstanding = Math.max(0, pledged - raised);

	const deadline = nstr(campaign.deadline);
	const daysToDeadline = daysUntil(deadline);

	// Pace projection — only when campaign is active and has a deadline.
	const pace = useMemo(() => {
		if (
			campaign.status !== "ACTIVE" ||
			daysToDeadline === null ||
			daysToDeadline < 0
		) {
			return null;
		}
		const start = dayjs(campaign.createdAt);
		const elapsedDays = Math.max(1, dayjs().diff(start, "day"));
		const dailyRate = raised / elapsedDays;
		const projected = raised + dailyRate * daysToDeadline;
		const requiredDaily =
			daysToDeadline > 0 ? Math.max(0, (goal - raised) / daysToDeadline) : 0;
		return { dailyRate, projected, requiredDaily };
	}, [campaign.status, campaign.createdAt, daysToDeadline, raised, goal]);

	// Timeline — auto-bucketed by campaign duration. We bucket the full
	// elapsed window so empty days show up as zero bars, which makes
	// quiet stretches visually obvious.
	const txQ = useTransactions(tenantSlug, {
		campaignId: campaign.id,
		limit: 500,
	});
	const txItems = txQ.data?.items ?? [];

	const timeline = useMemo(() => {
		const start = dayjs(campaign.createdAt).startOf("day");
		const end = deadline ? dayjs(deadline).endOf("day") : dayjs().endOf("day");
		const clampedEnd = end.isBefore(dayjs()) ? end : dayjs().endOf("day");
		const durationDays = Math.max(1, clampedEnd.diff(start, "day"));
		const bucket = pickBucket(durationDays);
		const unit = bucketUnit[bucket];
		const fmt = bucketFormat[bucket];
		const buckets: { label: string; value: number; iso: string }[] = [];
		let cursor = start;
		while (cursor.isBefore(clampedEnd) || cursor.isSame(clampedEnd, unit)) {
			buckets.push({
				label: cursor.format(fmt),
				value: 0,
				iso: cursor.toISOString(),
			});
			cursor = cursor.add(1, unit);
			if (buckets.length > 60) {
				break;
			}
		}
		for (const t of txItems) {
			const d = dayjs(t.date).startOf(unit);
			const idx = d.diff(start.startOf(unit), unit);
			if (idx >= 0 && idx < buckets.length) {
				const b = buckets[idx];
				if (b) {
					b.value += num(t.amount);
				}
			}
		}
		return { buckets, bucket };
	}, [campaign.createdAt, deadline, txItems]);

	// Top contributors — by paid amount toward this campaign.
	const pledgesQ = usePledges(tenantSlug, {
		campaignId: campaign.id,
		limit: 200,
	});
	const pledges = pledgesQ.data?.items ?? [];
	const membersQ = useMembers(tenantSlug, {
		limit: 500,
		includeDeleted: true,
	});
	const membersById = useMemo(
		() =>
			Object.fromEntries((membersQ.data?.items ?? []).map((m) => [m.id, m])),
		[membersQ.data],
	);

	const topContributors = useMemo(() => {
		const byMember = new Map<
			string,
			{ memberId: string; paid: number; pledged: number }
		>();
		for (const p of pledges) {
			const e = byMember.get(p.memberId) ?? {
				memberId: p.memberId,
				paid: 0,
				pledged: 0,
			};
			e.paid += num(p.paidAmount);
			e.pledged += num(p.pledgedAmount);
			byMember.set(p.memberId, e);
		}
		return Array.from(byMember.values())
			.sort((a, b) => b.paid - a.paid || b.pledged - a.pledged)
			.slice(0, 5);
	}, [pledges]);

	const description = nstr(campaign.description);

	return (
		<div className="space-y-6">
			{description && (
				<p className="text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>
			)}

			{/* Progress band */}
			<Card padding={24}>
				<StatBand
					mobileColumns={2}
					items={[
						{ label: "Goal", value: formatCompact(goal) },
						{
							label: "Raised",
							value: formatCompact(raised),
							caption: goal > 0 ? `${pct(raised, goal)}% of goal` : "",
						},
						{
							label: "Pledged",
							value: formatCompact(pledged),
							caption:
								goal > 0
									? `${pct(pledged, goal)}% of goal · ${progress?.pledgeCount ?? 0} pledges`
									: `${progress?.pledgeCount ?? 0} pledges`,
						},
						{
							label: "Outstanding",
							value: formatCompact(outstanding),
							caption:
								outstanding > 0 ? "Pledged but not paid" : "All collected",
						},
					]}
				/>
				<div className="mt-5">
					<StackedProgressBar
						size="lg"
						total={goal > 0 ? goal : Math.max(pledged, raised, 1)}
						segments={[
							{
								value: pledged,
								color:
									"color-mix(in srgb, var(--chart-current) 28%, transparent)",
								label: "Pledged",
								displayValue: formatCompact(pledged),
							},
							{
								value: raised,
								color: "var(--chart-current)",
								label: "Raised",
								displayValue: formatCompact(raised),
							},
						]}
					/>
				</div>
				{pace && goal > 0 && (
					<div className="mt-4 rounded-lg bg-muted/40 px-4 py-3 text-sm text-secondary-foreground">
						<span className="font-semibold text-foreground">
							{formatCompact(pace.dailyRate)}/day
						</span>{" "}
						current pace · projected to hit{" "}
						<span className="font-semibold text-foreground">
							{formatCompact(pace.projected)}
						</span>{" "}
						by deadline.
						{raised < goal && (
							<>
								{" "}
								Need{" "}
								<span className="font-semibold text-foreground">
									{formatCompact(pace.requiredDaily)}/day
								</span>{" "}
								to close the gap.
							</>
						)}
					</div>
				)}
			</Card>

			{/* Timeline */}
			<Card padding={24}>
				<SectionTitle
					title="When the money came in"
					action={
						<span className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
							{timeline.bucket}
						</span>
					}
				/>
				{txQ.isLoading ? (
					<div className="py-6 text-center text-sm text-muted-foreground">
						Loading…
					</div>
				) : txItems.length === 0 ? (
					<div className="py-6 text-center text-sm text-muted-foreground">
						No transactions recorded against this campaign yet.
					</div>
				) : (
					<div className="h-[220px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<RechartsBarChart
								data={timeline.buckets}
								barCategoryGap="18%"
								margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
							>
								<CartesianGrid
									vertical={false}
									strokeDasharray="3 3"
									stroke="var(--input)"
								/>
								<XAxis
									dataKey="label"
									tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
									axisLine={false}
									tickLine={false}
									interval="preserveStartEnd"
									minTickGap={24}
								/>
								<YAxis
									tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
									axisLine={false}
									tickLine={false}
									width={48}
									tickFormatter={(v) => formatCompact(Number(v))}
								/>
								<Tooltip
									cursor={{
										fill: "color-mix(in srgb, var(--accent) 18%, transparent)",
									}}
									content={({ active, payload }) => {
										if (!active || !payload?.length) {
											return null;
										}
										const d = payload[0]?.payload as
											| { label: string; value: number }
											| undefined;
										if (!d) {
											return null;
										}
										return (
											<div className="rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg">
												<div className="font-medium">{d.label}</div>
												<div className="mt-0.5 tabular-nums">
													{d.value > 0
														? formatCurrency(d.value, { decimals: 0 })
														: "no gift"}
												</div>
											</div>
										);
									}}
								/>
								<Bar dataKey="value" radius={[4, 4, 0, 0]}>
									{timeline.buckets.map((b) => (
										<Cell
											key={b.iso}
											fill={
												b.value > 0
													? "var(--chart-current)"
													: "var(--chart-track)"
											}
										/>
									))}
								</Bar>
							</RechartsBarChart>
						</ResponsiveContainer>
					</div>
				)}
			</Card>

			{/* Top contributors */}
			<Card padding={24}>
				<SectionTitle title="Top contributors" />
				{pledgesQ.isLoading || membersQ.isLoading ? (
					<div className="py-6 text-center text-sm text-muted-foreground">
						Loading…
					</div>
				) : topContributors.length === 0 ? (
					<div className="py-6 text-center text-sm text-muted-foreground">
						No pledges yet — top contributors will appear once members commit.
					</div>
				) : (
					<ul className="divide-y divide-border">
						{topContributors.map((c, idx) => {
							const m = membersById[c.memberId];
							const name = m
								? `${m.firstName} ${m.lastName}`.trim() || "Unnamed"
								: "Unknown member";
							const fulfillPct = pct(c.paid, c.pledged);
							return (
								// Fluid list row that reads well at any width: rank + avatar
								// pinned left, then a flexible column holding the name + total
								// on top and the fulfilment bar beneath. No fixed pixel
								// columns, so it never cramps on a phone.
								<li key={c.memberId} className="flex items-center gap-3 py-3">
									<span className="w-5 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
										#{idx + 1}
									</span>
									<Avatar name={name} size={32} />
									<div className="min-w-0 flex-1">
										<div className="flex items-baseline justify-between gap-3">
											<Link
												href={`/${tenantSlug}/admin/members/${c.memberId}`}
												className="truncate text-sm font-medium text-foreground hover:underline"
											>
												{name}
											</Link>
											<span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
												{formatCompact(c.paid)}
											</span>
										</div>
										<div className="mt-1.5">
											<StackedProgressBar
												size="xs"
												total={c.pledged}
												segments={[
													{
														value: c.paid,
														color: "var(--chart-current)",
														label: "Paid",
													},
												]}
											/>
											<div className="mt-1 flex items-baseline justify-between text-xs tabular-nums">
												<span className="text-muted-foreground">
													{formatCompact(c.paid)} / {formatCompact(c.pledged)}
												</span>
												<span className="font-semibold text-foreground">
													{fulfillPct}%
												</span>
											</div>
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</Card>
		</div>
	);
};
