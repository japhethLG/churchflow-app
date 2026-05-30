"use client";

import { Card, SectionTitle } from "@/components/primitives";
import { DonutChart } from "@/components/primitives/charts/DonutChart";
import { formatCompact, formatCurrency } from "@/lib/format-currency";

// Per-type slice of the donut + table. Callers derive these from whichever
// transactions source they have (admin summary endpoint, self summary
// endpoint, or a locally-filtered list).
export type TransactionMixSegment = {
	key: string;
	label: string;
	color: string;
	amount: number;
	count: number;
	share: number;
	avg: number;
};

// Single canonical "by-transaction-type" donut + table card. Shared across
// the admin reports trend tab, the member insights page, and the member
// transactions page so the surface stays uniform.
export const TransactionMixCard = ({
	segments,
	total,
	count,
	title = "Where the money came from",
	subtitle = "Mix of total received by transaction type for the selected period.",
	emptyMessage = "No transactions in this range.",
	className,
}: {
	segments: TransactionMixSegment[];
	total: number;
	count: number;
	title?: string;
	subtitle?: string;
	emptyMessage?: string;
	className?: string;
}) => {
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
	const isEmpty = segments.length === 0;
	const chartData = isEmpty ? placeholder : segments;

	return (
		<Card className={className}>
			<SectionTitle title={title} />
			<p className="-mt-3 mb-5 text-sm text-muted-foreground">{subtitle}</p>
			{isEmpty ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					{emptyMessage}
				</div>
			) : (
				<div className="grid items-center gap-8 lg:grid-cols-[300px_1fr]">
					<div className="grid place-items-center">
						<div className="relative size-[240px] sm:size-[260px]">
							<div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
								<div>
									<div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
										Total
									</div>
									<div className="mt-1 text-2xl font-bold tabular-nums text-foreground">
										{formatCompact(total)}
									</div>
									<div className="mt-0.5 text-xs text-muted-foreground">
										{count} gifts
									</div>
								</div>
							</div>
							<DonutChart
								data={chartData}
								innerRadius={78}
								outerRadius={112}
								tooltip={({ active, payload }) => {
									if (!active || !payload?.length) {
										return null;
									}
									const d = payload[0]?.payload as
										| TransactionMixSegment
										| undefined;
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
												{d.count} gifts · avg {formatCompact(d.avg)}
											</div>
										</div>
									);
								}}
							/>
						</div>
					</div>

					<div className="flex flex-col">
						{/* Desktop column header — hidden on mobile, which uses a
						    two-line-per-row layout instead of a 5-wide grid. */}
						<div className="mb-2 hidden grid-cols-[1.4fr_1fr_1fr_1fr_60px] gap-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground sm:grid">
							<span>Type</span>
							<span className="text-right">Total</span>
							<span className="text-right">Gifts</span>
							<span className="text-right">Avg</span>
							<span className="text-right">Share</span>
						</div>
						<ul className="divide-y divide-border">
							{segments.map((s) => (
								<li key={s.key} className="py-3 text-sm">
									{/* Mobile → label + total on top, gifts·avg + share below. */}
									<div className="sm:hidden">
										<div className="flex items-center justify-between gap-3">
											<div className="flex min-w-0 items-center gap-2">
												<span
													className="size-3 shrink-0 rounded-sm"
													style={{ background: s.color }}
												/>
												<span className="truncate font-medium text-foreground">
													{s.label}
												</span>
											</div>
											<span className="shrink-0 tabular-nums font-semibold text-foreground">
												{formatCurrency(s.amount, { decimals: 0 })}
											</span>
										</div>
										<div className="mt-1 flex items-center justify-between pl-5 text-xs tabular-nums text-muted-foreground">
											<span>
												{s.count} {s.count === 1 ? "gift" : "gifts"} · avg{" "}
												{formatCurrency(s.avg, { decimals: 0 })}
											</span>
											<span className="font-semibold text-foreground">
												{s.share}%
											</span>
										</div>
									</div>
									{/* Desktop → 5-column grid row. */}
									<div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_60px] items-center gap-3 sm:grid">
										<div className="flex items-center gap-2">
											<span
												className="size-3 shrink-0 rounded-sm"
												style={{ background: s.color }}
											/>
											<span className="font-medium text-foreground">
												{s.label}
											</span>
										</div>
										<span className="text-right tabular-nums font-medium text-foreground">
											{formatCurrency(s.amount, { decimals: 0 })}
										</span>
										<span className="text-right tabular-nums text-muted-foreground">
											{s.count}
										</span>
										<span className="text-right tabular-nums text-muted-foreground">
											{formatCurrency(s.avg, { decimals: 0 })}
										</span>
										<span className="text-right tabular-nums font-semibold text-foreground">
											{s.share}%
										</span>
									</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			)}
		</Card>
	);
};
