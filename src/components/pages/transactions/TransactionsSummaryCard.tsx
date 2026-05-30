"use client";

import { Card } from "@/components/primitives";
import { DonutChart } from "@/components/primitives/charts/DonutChart";
import type { components } from "@/lib/api";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { num, pct, TYPE_COLOR, TYPE_LABEL } from "../admin-shared";

type Summary = components["schemas"]["TransactionSummaryResponseDto"];

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
				{d.count} {d.count === 1 ? "gift" : "gifts"}
			</div>
		</div>
	);
};

export const TransactionsSummaryCard = ({
	summary,
	loading,
}: {
	summary?: Summary;
	loading?: boolean;
}) => {
	const total = num(summary?.total);
	const count = summary?.count ?? 0;
	// `avg` is computed server-side now — fall back to local division so
	// the placeholder/loading transition is still smooth on first paint.
	const avg = num(summary?.avg) || (count > 0 ? total / count : 0);

	const segments = (summary?.byType ?? [])
		.filter((b) => num(b.total) > 0)
		.sort((a, b) => num(b.total) - num(a.total))
		.map((b) => {
			const amount = num(b.total);
			return {
				key: b.type,
				label: TYPE_LABEL[b.type],
				color: TYPE_COLOR[b.type],
				amount,
				count: b.count,
				share: pct(amount, total),
				avg: num(b.avg) || (b.count > 0 ? amount / b.count : 0),
			};
		});

	const placeholder = [
		{
			key: "empty",
			label: "No data",
			color: "var(--chart-track)",
			amount: 1,
			count: 0,
			share: 0,
			avg: 0,
		},
	];

	if (loading) {
		return (
			<Card>
				<div className="py-8 text-center text-sm text-muted-foreground">
					Loading…
				</div>
			</Card>
		);
	}

	const donutData = segments.length > 0 ? segments : placeholder;

	return (
		<Card padding={0}>
			<div className="p-4 md:p-6">
				{/* Header */}
				<h3 className="mb-4 text-sm font-bold tracking-tight md:mb-5 md:text-base">
					Period totals{" "}
					<span className="font-normal text-muted-foreground">
						· matches filters
					</span>
				</h3>

				{/* KPIs — 3-up at every width */}
				<div className="mb-4 grid grid-cols-3 gap-3 md:mb-6 md:gap-4">
					{[
						{ label: "Total", value: formatCurrency(total, { decimals: 0 }) },
						{ label: "Gifts", value: count.toLocaleString() },
						{
							label: "Avg gift",
							value: count > 0 ? formatCurrency(avg, { decimals: 0 }) : "—",
						},
					].map((kpi) => (
						<div key={kpi.label}>
							<div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground sm:text-xs">
								{kpi.label}
							</div>
							<div className="mt-1 text-xl font-bold tabular-nums text-foreground sm:text-3xl">
								{kpi.value}
							</div>
						</div>
					))}
				</div>

				{/* Donut + per-type breakdown — side-by-side, compact on mobile */}
				<div className="flex items-center md:items-start md:gap-6">
					<div className="relative size-[124px] shrink-0 md:size-[220px]">
						<div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
							<div>
								<div className="text-[7px] font-bold uppercase tracking-[0.08em] text-muted-foreground md:text-xs">
									Mix by type
								</div>
								<div className="mt-0.5 text-sm font-bold tabular-nums text-foreground md:mt-1 md:text-xl">
									{formatCompact(total)}
								</div>
							</div>
						</div>
						<DonutChart
							data={donutData}
							innerRadius="60%"
							outerRadius="90%"
							tooltip={<DonutTooltip />}
						/>
					</div>

					{segments.length > 0 ? (
						<div className="min-w-0 flex-1">
							{/* Desktop column header */}
							<div className="mb-2 hidden grid-cols-[1.4fr_1fr_1fr_1fr_60px] gap-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground md:grid">
								<span>Type</span>
								<span className="text-right">Total</span>
								<span className="text-right">Gifts</span>
								<span className="text-right">Avg</span>
								<span className="text-right">Share</span>
							</div>
							<ul className="divide-y divide-border">
								{segments.map((s) => (
									<li
										key={s.key}
										className="flex items-center gap-2.5 py-1.5 text-[13px] md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_60px] md:gap-3 md:py-2.5 md:text-sm"
									>
										<div className="flex min-w-0 flex-1 items-center gap-2">
											<span
												className="size-2.5 shrink-0 rounded-sm"
												style={{ background: s.color }}
											/>
											<span className="truncate font-medium text-foreground">
												{s.label}
											</span>
										</div>
										{/* Mobile: compact amount */}
										<span className="tabular-nums text-muted-foreground md:hidden">
											{formatCompact(s.amount)}
										</span>
										{/* Desktop: full amount + gifts + avg */}
										<span className="hidden text-right tabular-nums font-medium text-foreground md:block">
											{formatCurrency(s.amount, { decimals: 0 })}
										</span>
										<span className="hidden text-right tabular-nums text-muted-foreground md:block">
											{s.count}
										</span>
										<span className="hidden text-right tabular-nums text-muted-foreground md:block">
											{formatCurrency(s.avg, { decimals: 0 })}
										</span>
										<span className="w-9 shrink-0 text-right tabular-nums font-semibold text-foreground md:w-auto">
											{s.share}%
										</span>
									</li>
								))}
							</ul>
						</div>
					) : (
						<div className="grid flex-1 place-items-center text-sm text-muted-foreground">
							No transactions in this range.
						</div>
					)}
				</div>
			</div>
		</Card>
	);
};
