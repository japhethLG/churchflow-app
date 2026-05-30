"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
	Card,
	ConsistencyDots,
	PageHeader,
	SectionTitle,
	StackedProgressBar,
	StatBand,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useMyCampaigns } from "@/lib/api/campaigns";
import { useMyProfile } from "@/lib/api/members";
import { useMyPledges } from "@/lib/api/pledges";
import {
	useMyTransactionSummary,
	useMyTransactions,
} from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCompact } from "@/lib/format-currency";
import { num, pct, type TxType, TYPE_COLOR, TYPE_LABEL } from "../admin-shared";
import { TransactionMixCard } from "../TransactionMixCard";

// recharts charts loaded lazily so the chart library stays off this route's
// first-load JS (both resolve the same chunk).
const YearlyGivingChart = dynamic(
	() => import("./MemberInsightsCharts").then((m) => m.YearlyGivingChart),
	{ ssr: false, loading: () => null },
);
const Last12MonthsChart = dynamic(
	() => import("./MemberInsightsCharts").then((m) => m.Last12MonthsChart),
	{ ssr: false, loading: () => null },
);

type Pledge = components["schemas"]["PledgeResponseDto"];

// Aggregate per-campaign sums for the "Top campaigns I've given to" list.
// Driven by the caller's pledges (provides both pledged and paid totals
// at the pledge level; remainingAmount is derived). Pledge.status flows
// through the backend's read-time derivation — if that derivation logic
// changes later, the counts here update automatically without touching
// this file.
const topCampaignsFromPledges = (
	pledges: Pledge[],
	campaignTitles: Record<string, string>,
	limit: number,
): Array<{
	campaignId: string;
	title: string;
	pledged: number;
	paid: number;
}> => {
	const map = new Map<
		string,
		{ campaignId: string; title: string; pledged: number; paid: number }
	>();
	for (const p of pledges) {
		const entry = map.get(p.campaignId) ?? {
			campaignId: p.campaignId,
			title: campaignTitles[p.campaignId] ?? "Campaign",
			pledged: 0,
			paid: 0,
		};
		entry.pledged += num(p.pledgedAmount);
		entry.paid += num(p.paidAmount);
		map.set(p.campaignId, entry);
	}
	return Array.from(map.values())
		.sort((a, b) => b.paid - a.paid || b.pledged - a.pledged)
		.slice(0, limit);
};

export const MemberInsightsPage = () => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const memberQ = useMyProfile(tenantSlug);

	// 5-year window — gives enough months for YoY plus the 12-month
	// sparkline and consistency dots. Backend bound max is 60.
	const summaryQ = useMyTransactionSummary(tenantSlug, { months: 60 });
	const summary = summaryQ.data;

	// Recent + first/last gift detection — limit covers the typical
	// member's history. If a member has >2000 lifetime gifts the lifetime
	// total here will undercount, but byMonth from summary remains
	// authoritative for trend.
	const txQ = useMyTransactions(tenantSlug, { limit: 2000 });
	const transactions = txQ.data?.items ?? [];

	const pledgesQ = useMyPledges(tenantSlug, { includeDeleted: true });
	const pledges: Pledge[] = useMemo(
		() => (pledgesQ.data?.items ?? []) as unknown as Pledge[],
		[pledgesQ.data],
	);

	const campaignsQ = useMyCampaigns(tenantSlug, { includeDeleted: true });
	const campaignTitles = useMemo(() => {
		const map: Record<string, string> = {};
		for (const c of campaignsQ.data?.items ?? []) {
			map[c.id] = c.title;
		}
		return map;
	}, [campaignsQ.data]);

	const lifetimeTotal = num(summary?.total);
	const lifetimeCount = summary?.count ?? 0;
	const avgGift = lifetimeCount > 0 ? lifetimeTotal / lifetimeCount : 0;

	// First / last gift dates come from the transactions list (summary's
	// byMonth doesn't carry day-level dates).
	const firstGiftDate = useMemo(() => {
		if (transactions.length === 0) {
			return null;
		}
		return transactions
			.map((t) => dayjs(t.date))
			.reduce((earliest, d) => (d.isBefore(earliest) ? d : earliest));
	}, [transactions]);
	const lastGiftDate = useMemo(() => {
		if (transactions.length === 0) {
			return null;
		}
		return transactions
			.map((t) => dayjs(t.date))
			.reduce((latest, d) => (d.isAfter(latest) ? d : latest));
	}, [transactions]);

	// Pledge dynamics — drives the "follow-through" card below. Active
	// pledges aren't "closed" yet, so they're excluded from the
	// follow-through rate. The rate answers "of the pledges I've finished,
	// how often did I complete them?"
	const pledgeDynamics = useMemo(() => {
		// Tombstones distort lifetime totals; exclude them from amounts but
		// surface the count separately.
		const live = pledges.filter((p) => !p.deletedAt);
		const deletedCount = pledges.length - live.length;

		let pledged = 0;
		let paid = 0;
		const counts = { ACTIVE: 0, FULFILLED: 0, CANCELLED: 0 };
		for (const p of live) {
			pledged += num(p.pledgedAmount);
			paid += num(p.paidAmount);
			if (
				p.status === "ACTIVE" ||
				p.status === "FULFILLED" ||
				p.status === "CANCELLED"
			) {
				counts[p.status] += 1;
			}
		}
		const outstanding = Math.max(0, pledged - paid);
		const closed = counts.FULFILLED + counts.CANCELLED;
		const followThrough = closed > 0 ? (counts.FULFILLED / closed) * 100 : null;

		return {
			pledged,
			paid,
			outstanding,
			counts,
			deletedCount,
			closed,
			followThrough,
			total: live.length,
		};
	}, [pledges]);
	const activePledges = pledgeDynamics.counts.ACTIVE;
	const fulfilledPledges = pledgeDynamics.counts.FULFILLED;

	// Year-over-year: bucket byMonth into calendar years for the last 5.
	const yearlyTotals = useMemo(() => {
		const startYear = dayjs().utc().subtract(4, "year").year();
		const map: Record<number, number> = {};
		for (let y = startYear; y <= dayjs().year(); y++) {
			map[y] = 0;
		}
		for (const m of summary?.byMonth ?? []) {
			const y = dayjs(`${m.month}-01`).year();
			if (y in map) {
				map[y] = (map[y] ?? 0) + num(m.total);
			}
		}
		return Object.entries(map)
			.sort(([a], [b]) => Number(a) - Number(b))
			.map(([y, total]) => ({ year: Number(y), total }));
	}, [summary]);

	// 12-month sparkline (and consistency dots) — derive from byMonth.
	const last12 = useMemo(() => {
		const start = dayjs().utc().subtract(11, "month").startOf("month");
		const buckets: { month: string; total: number }[] = [];
		for (let i = 0; i < 12; i++) {
			const m = start.add(i, "month");
			buckets.push({ month: m.format("YYYY-MM"), total: 0 });
		}
		const totalsByMonth = new Map(
			(summary?.byMonth ?? []).map((m) => [m.month, num(m.total)]),
		);
		for (const b of buckets) {
			b.total = totalsByMonth.get(b.month) ?? 0;
		}
		return buckets;
	}, [summary]);
	const consistencyValues = last12.map((b) => b.total > 0);
	const monthsWithActivity = consistencyValues.filter(Boolean).length;
	const last12Total = last12.reduce((s, b) => s + b.total, 0);
	const biggestMonth = useMemo(() => {
		if (last12.length === 0) {
			return null;
		}
		return last12.reduce((best, b) => (b.total > best.total ? b : best));
	}, [last12]);

	// Type mix — lifetime, from summary.byType. Shape matches the shared
	// TransactionMixCard (same donut + table used on the admin reports page).
	const mixSegments = useMemo(() => {
		return (summary?.byType ?? [])
			.filter((b) => num(b.total) > 0)
			.sort((a, b) => num(b.total) - num(a.total))
			.map((b) => {
				const amount = num(b.total);
				return {
					key: b.type,
					label: TYPE_LABEL[b.type as TxType],
					color: TYPE_COLOR[b.type as TxType],
					amount,
					count: b.count,
					share: pct(amount, lifetimeTotal),
					avg: b.count > 0 ? amount / b.count : 0,
				};
			});
	}, [summary, lifetimeTotal]);

	const topCampaigns = useMemo(
		() => topCampaignsFromPledges(pledges, campaignTitles, 5),
		[pledges, campaignTitles],
	);

	const firstName = memberQ.data?.firstName ?? "there";
	const loading = summaryQ.isLoading || txQ.isLoading || campaignsQ.isLoading;

	// When the caller's profile 404s, their Firebase claims still carry a
	// memberId that no longer points at a live Member row (e.g. an admin
	// soft-deleted the row, or it was reissued on merge). Pledges and
	// transactions then filter by that dead id and return empty arrays —
	// the UI would otherwise silently show "no data" with no recourse.
	const profileMissing = memberQ.isError && !memberQ.isLoading;

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="Insights"
				title={`Your giving, ${firstName}`}
				subtitle="A long view of your generosity — by year, by month, by type, and by campaign."
			/>

			<div className="overflow-auto flex-1 px-4 pb-36 space-y-4 md:px-8 md:pb-8">
				{profileMissing && (
					<div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
						<div className="font-medium">
							Your member profile in this church can't be found.
						</div>
						<div className="mt-1 text-xs">
							Your session still points at a member record that no longer exists
							(likely archived by an admin). Sign out and back in to refresh —
							or ask your church admin to restore your record.
						</div>
					</div>
				)}

				<h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
					<span>Your giving</span>
					<span className="h-px flex-1 bg-border" aria-hidden />
				</h2>

				<Card padding={24}>
					<StatBand
						mobileColumns={2}
						items={[
							{ label: "Lifetime", value: formatCompact(lifetimeTotal) },
							{ label: "Gifts", value: lifetimeCount.toLocaleString() },
							{
								label: "Avg gift",
								value: lifetimeCount > 0 ? formatCompact(avgGift) : "—",
							},
							{
								label: "First gift",
								value: firstGiftDate ? firstGiftDate.format("MMM YYYY") : "—",
							},
							{
								label: "Last gift",
								value: lastGiftDate ? lastGiftDate.format("MMM D, YYYY") : "—",
							},
						]}
					/>
				</Card>

				<div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
					<Card padding={24} className="flex flex-col">
						<SectionTitle title="Year over year" />
						{yearlyTotals.every((y) => y.total === 0) ? (
							<div className="py-6 text-sm text-muted-foreground">
								No giving recorded in the last 5 years.
							</div>
						) : (
							<div className="min-h-[220px] flex-1 w-full">
								<YearlyGivingChart data={yearlyTotals} />
							</div>
						)}
					</Card>

					<Card padding={24}>
						<SectionTitle title="Last 12 months" />
						<div className="mb-3 flex items-baseline justify-between gap-4">
							<div className="text-2xl font-semibold tabular-nums">
								{formatCompact(last12Total)}
							</div>
							<div className="text-xs text-muted-foreground">
								{monthsWithActivity} of 12 months active
							</div>
						</div>
						{last12.every((b) => b.total === 0) ? (
							<div className="py-6 text-sm text-muted-foreground">
								No giving recorded in the last 12 months.
							</div>
						) : (
							<div className="h-[180px] w-full">
								<Last12MonthsChart data={last12} />
							</div>
						)}
						<div className="mt-3">
							<ConsistencyDots
								values={consistencyValues}
								size="sm"
								periodLabels={last12.map((b) =>
									dayjs(`${b.month}-01`).format("MMM YYYY"),
								)}
							/>
						</div>
						{biggestMonth && biggestMonth.total > 0 && (
							<div className="mt-3 text-xs text-muted-foreground">
								Biggest month:{" "}
								<span className="font-medium text-foreground">
									{dayjs(`${biggestMonth.month}-01`).format("MMM YYYY")}
								</span>{" "}
								·{" "}
								<span className="font-medium text-foreground tabular-nums">
									{formatCompact(biggestMonth.total)}
								</span>
							</div>
						)}
					</Card>
				</div>

				<TransactionMixCard
					segments={mixSegments}
					total={lifetimeTotal}
					count={lifetimeCount}
					title="Where your giving went"
					subtitle="Mix of your total giving by transaction type, lifetime."
					emptyMessage={loading ? "Loading…" : "No giving recorded yet."}
				/>

				<Card padding={24}>
					<SectionTitle title="Top campaigns you've supported" />
					{topCampaigns.length === 0 ? (
						<div className="py-4 text-sm text-muted-foreground">
							{loading
								? "Loading…"
								: "You haven't pledged to any campaigns yet."}
						</div>
					) : (
						<ul className="divide-y divide-border">
							{topCampaigns.map((c) => {
								const fulfillment = pct(c.paid, c.pledged);
								return (
									<li key={c.campaignId}>
										<Link
											href={`/${tenantSlug}/member/campaigns/${c.campaignId}`}
											className="-mx-2 flex flex-col gap-2 rounded-md px-2 py-3 transition-colors hover:bg-muted/60 sm:grid sm:grid-cols-[minmax(0,1fr)_200px_100px] sm:items-center sm:gap-4"
										>
											<span className="truncate text-sm font-medium text-foreground">
												{c.title}
											</span>
											<div>
												<StackedProgressBar
													size="xs"
													total={c.pledged > 0 ? c.pledged : 1}
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
														{fulfillment}%
													</span>
												</div>
											</div>
											<span className="text-right text-sm font-semibold tabular-nums text-foreground">
												{formatCompact(c.paid)}
											</span>
										</Link>
									</li>
								);
							})}
						</ul>
					)}
				</Card>

				<div className="pt-2">
					<h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
						<span>
							Your pledges
							{activePledges + fulfilledPledges > 0 && (
								<span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/80">
									· {activePledges} active · {fulfilledPledges} fulfilled
								</span>
							)}
						</span>
						<span className="h-px flex-1 bg-border" aria-hidden />
					</h2>
				</div>

				<Card padding={24}>
					<SectionTitle title="Pledge fulfillment" />
					{pledgeDynamics.total === 0 ? (
						<div className="py-4 text-sm text-muted-foreground">
							{loading ? "Loading…" : "You haven't made any pledges yet."}
						</div>
					) : (
						<div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
							<div>
								<div className="grid grid-cols-3 gap-4">
									<div>
										<div className="text-xs uppercase tracking-wide text-muted-foreground">
											Pledged
										</div>
										<div className="mt-0.5 text-xl font-semibold tabular-nums">
											{formatCompact(pledgeDynamics.pledged)}
										</div>
									</div>
									<div>
										<div className="text-xs uppercase tracking-wide text-muted-foreground">
											Paid
										</div>
										<div className="mt-0.5 text-xl font-semibold tabular-nums text-[color:var(--chart-positive)]">
											{formatCompact(pledgeDynamics.paid)}
										</div>
									</div>
									<div>
										<div className="text-xs uppercase tracking-wide text-muted-foreground">
											Outstanding
										</div>
										<div className="mt-0.5 text-xl font-semibold tabular-nums">
											{formatCompact(pledgeDynamics.outstanding)}
										</div>
									</div>
								</div>
								<div className="mt-4">
									<StackedProgressBar
										size="sm"
										total={
											pledgeDynamics.pledged > 0 ? pledgeDynamics.pledged : 1
										}
										segments={[
											{
												value: pledgeDynamics.paid,
												color: "var(--chart-positive)",
												label: "Paid",
											},
										]}
									/>
									<div className="mt-1.5 flex items-baseline justify-between text-xs tabular-nums">
										<span className="text-muted-foreground">
											{pct(pledgeDynamics.paid, pledgeDynamics.pledged)}% paid
										</span>
										<span className="text-muted-foreground">
											{formatCompact(pledgeDynamics.outstanding)} to go
										</span>
									</div>
								</div>
							</div>

							<div className="lg:border-l lg:border-border lg:pl-6">
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Follow-through rate
								</div>
								<div className="mt-0.5 flex items-baseline gap-2">
									<span className="text-2xl font-semibold tabular-nums">
										{pledgeDynamics.followThrough === null
											? "—"
											: `${Math.round(pledgeDynamics.followThrough)}%`}
									</span>
									{pledgeDynamics.closed > 0 && (
										<span className="text-xs text-muted-foreground">
											of {pledgeDynamics.closed} closed
										</span>
									)}
								</div>
								<p className="mt-1 text-xs text-muted-foreground">
									{pledgeDynamics.followThrough === null
										? "No pledges closed yet — your active ones are still in motion."
										: `${pledgeDynamics.counts.FULFILLED} fulfilled · ${pledgeDynamics.counts.CANCELLED} cancelled.`}
								</p>
								<ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
									<li className="inline-flex items-center gap-1.5">
										<span className="inline-block size-2 rounded-sm bg-[color:var(--chart-current)]" />
										<span className="text-muted-foreground">Active</span>
										<span className="font-medium tabular-nums text-foreground">
											{pledgeDynamics.counts.ACTIVE}
										</span>
									</li>
									<li className="inline-flex items-center gap-1.5">
										<span className="inline-block size-2 rounded-sm bg-[color:var(--chart-positive)]" />
										<span className="text-muted-foreground">Fulfilled</span>
										<span className="font-medium tabular-nums text-foreground">
											{pledgeDynamics.counts.FULFILLED}
										</span>
									</li>
									<li className="inline-flex items-center gap-1.5">
										<span className="inline-block size-2 rounded-sm bg-[color:var(--chart-track)]" />
										<span className="text-muted-foreground">Cancelled</span>
										<span className="font-medium tabular-nums text-foreground">
											{pledgeDynamics.counts.CANCELLED}
										</span>
									</li>
									{pledgeDynamics.deletedCount > 0 && (
										<li className="inline-flex items-center gap-1.5">
											<span className="inline-block size-2 rounded-sm bg-muted" />
											<span className="text-muted-foreground">Deleted</span>
											<span className="font-medium tabular-nums text-foreground">
												{pledgeDynamics.deletedCount}
											</span>
										</li>
									)}
								</ul>
							</div>
						</div>
					)}
				</Card>
			</div>
		</div>
	);
};
