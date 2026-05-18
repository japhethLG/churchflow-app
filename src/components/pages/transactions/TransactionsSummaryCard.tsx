"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, SectionTitle } from "@/components/primitives";
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
	const avg = count > 0 ? total / count : 0;

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
			<SectionTitle title="In this filter" />

			{/* Summary row — terse, scannable, no nested cards */}
			<div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div>
					<div className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
						Total
					</div>
					<div className="mt-1 text-3xl font-bold tabular-nums text-foreground">
						{formatCurrency(total, { decimals: 0 })}
					</div>
				</div>
				<div>
					<div className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
						Gifts
					</div>
					<div className="mt-1 text-3xl font-bold tabular-nums text-foreground">
						{count.toLocaleString()}
					</div>
				</div>
				<div>
					<div className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
						Average gift
					</div>
					<div className="mt-1 text-3xl font-bold tabular-nums text-foreground">
						{count > 0 ? formatCurrency(avg, { decimals: 0 }) : "—"}
					</div>
				</div>
			</div>

			{/* Donut + per-type breakdown table */}
			<div className="grid gap-6 lg:grid-cols-[260px_1fr]">
				<div className="grid place-items-center">
					<div className="relative size-[220px]">
						<div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
							<div>
								<div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
									Mix by type
								</div>
								<div className="mt-1 text-xl font-bold tabular-nums text-foreground">
									{formatCompact(total)}
								</div>
							</div>
						</div>
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={segments.length > 0 ? segments : placeholder}
									dataKey="amount"
									cx="50%"
									cy="50%"
									innerRadius={64}
									outerRadius={94}
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
						<div className="mb-2 grid grid-cols-[1.4fr_1fr_1fr_1fr_60px] gap-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
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
									className="grid grid-cols-[1.4fr_1fr_1fr_1fr_60px] items-center gap-3 py-2.5 text-sm"
								>
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
									<span className="text-right tabular-nums text-muted-foreground">
										{formatCurrency(s.avg, { decimals: 0 })}
									</span>
									<span className="text-right tabular-nums font-semibold text-foreground">
										{s.share}%
									</span>
								</li>
							))}
						</ul>
					</div>
				) : (
					<div className="grid place-items-center text-sm text-muted-foreground">
						No transactions in this range.
					</div>
				)}
			</div>
		</Card>
	);
};
