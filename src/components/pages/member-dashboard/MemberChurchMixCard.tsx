"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, SectionTitle } from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { num, pct, TYPE_COLOR, TYPE_LABEL } from "../admin-shared";

type Summary = components["schemas"]["MyChurchSummaryResponseDto"];

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

// Member-side mirror of admin's TransactionsSummaryCard donut + breakdown,
// scoped to "this month" from the church-summary endpoint. Surfaces the
// type breakdown for "Church received this month" so members can see
// *how* the church's giving is composed — tithe vs offering vs mission
// vs other. Aggregate-only — never per-row reads of other members.
export const MemberChurchMixCard = ({
	summary,
	loading,
}: {
	summary?: Summary;
	loading?: boolean;
}) => {
	const total = num(summary?.receivedThisMonth);
	const count = summary?.receivedThisMonthCount ?? 0;
	const avg = count > 0 ? total / count : 0;

	const segments = (summary?.byTypeThisMonth ?? [])
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
				avg: b.count > 0 ? amount / b.count : 0,
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

	return (
		<Card>
			<SectionTitle title="Church received this month" />

			<div className="grid gap-6 lg:grid-cols-[220px_1fr]">
				<div className="grid place-items-center">
					<div className="relative size-[200px]">
						<div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
							<div>
								<div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
									Mix by type
								</div>
								<div className="mt-1 text-lg font-bold tabular-nums text-foreground">
									{formatCompact(total)}
								</div>
								{count > 0 && (
									<div className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
										{count} gifts · avg {formatCompact(avg)}
									</div>
								)}
							</div>
						</div>
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={segments.length > 0 ? segments : placeholder}
									dataKey="amount"
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={88}
									paddingAngle={1.5}
									stroke="none"
								>
									{(segments.length > 0 ? segments : placeholder).map((s) => (
										<Cell key={s.key} fill={s.color} />
									))}
								</Pie>
								<Tooltip content={<DonutTooltip />} />
							</PieChart>
						</ResponsiveContainer>
					</div>
				</div>

				{segments.length > 0 ? (
					<div className="flex flex-col">
						{/* Desktop column header — mobile uses a two-line row instead. */}
						<div className="mb-2 hidden grid-cols-[1.4fr_1fr_70px_60px] gap-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground sm:grid">
							<span>Type</span>
							<span className="text-right">Total</span>
							<span className="text-right">Gifts</span>
							<span className="text-right">Share</span>
						</div>
						<ul className="divide-y divide-border">
							{segments.map((s) => (
								<li key={s.key} className="py-2 text-sm">
									{/* Mobile → label + total on top, gifts + share below. */}
									<div className="sm:hidden">
										<div className="flex items-center justify-between gap-3">
											<div className="flex min-w-0 items-center gap-2">
												<span
													className="size-2.5 shrink-0 rounded-sm"
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
										<div className="mt-1 flex items-center justify-between pl-[1.125rem] text-xs tabular-nums text-muted-foreground">
											<span>
												{s.count} {s.count === 1 ? "gift" : "gifts"}
											</span>
											<span className="font-semibold text-foreground">
												{s.share}%
											</span>
										</div>
									</div>
									{/* Desktop → 4-column grid row. */}
									<div className="hidden grid-cols-[1.4fr_1fr_70px_60px] items-center gap-3 sm:grid">
										<div className="flex items-center gap-2">
											<span
												className="size-2.5 shrink-0 rounded-sm"
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
										<span className="text-right tabular-nums font-semibold text-foreground">
											{s.share}%
										</span>
									</div>
								</li>
							))}
						</ul>
					</div>
				) : (
					<div className="grid place-items-center text-sm text-muted-foreground">
						No giving recorded this month yet.
					</div>
				)}
			</div>
		</Card>
	);
};
