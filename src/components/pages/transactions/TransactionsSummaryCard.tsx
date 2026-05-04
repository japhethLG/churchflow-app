"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SegmentedControl } from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCurrency } from "@/lib/format-currency";

type Summary = components["schemas"]["TransactionSummaryResponseDto"];
type ByType = components["schemas"]["TransactionSummaryByTypeDto"];

const TYPE_LABEL: Record<ByType["type"], string> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

const TYPE_COLOR: Record<ByType["type"], string> = {
	TITHE: "var(--tx-tithe)",
	OFFERING: "var(--tx-offering)",
	MISSION_GIVING: "var(--tx-mission)",
	FIRST_FRUIT: "var(--tx-first-fruit)",
	COMMITMENT: "var(--tx-commitment)",
	DONATION: "var(--tx-donation)",
	OTHER: "var(--tx-other)",
};

const PERIOD_OPTIONS = [
	{ months: 1, label: "MTD" },
	{ months: 3, label: "Last 3mo" },
	{ months: 12, label: "Last 12mo" },
];

const tooltipChrome = {
	backgroundColor: "var(--input)",
	border: "none",
	borderRadius: 8,
	fontSize: 12,
} as const;

export const TransactionsSummaryCard = ({
	summary,
	loading,
	months,
	onMonthsChange,
}: {
	summary: Summary | undefined;
	loading?: boolean;
	months: number;
	onMonthsChange: (m: number) => void;
}) => {
	if (loading || !summary) {
		return (
			<div className="mb-4 min-h-[168px] rounded-2xl border border-secondary bg-card p-6">
				<div className="flex gap-8">
					{[0, 1, 2].map((i) => (
						<div key={i}>
							<div className="mb-2 h-3 w-[60px] animate-pulse rounded bg-secondary" />
							<div className="h-7 w-[120px] animate-pulse rounded-md bg-secondary" />
						</div>
					))}
				</div>
			</div>
		);
	}

	const total = summary.total;
	const count = summary.count;
	const average = count > 0 ? total / count : 0;
	const chartData = (
		summary.byType.length > 0
			? summary.byType
			: ([{ type: "OTHER", total: 1, count: 0 }] as ByType[])
	).map((b) => ({
		name: TYPE_LABEL[b.type],
		value: b.total,
		color: TYPE_COLOR[b.type],
		pct: total > 0 ? (b.total / total) * 100 : 0,
		count: b.count,
	}));

	return (
		<div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-8 rounded-2xl border border-secondary bg-card p-6">
			<div>
				<div className="mb-[18px] flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					<span>Window</span>
					<SegmentedControl
						options={PERIOD_OPTIONS.map((o) => ({
							value: String(o.months),
							label: o.label,
						}))}
						value={String(months)}
						onChange={(v) => onMonthsChange(Number(v))}
					/>
				</div>

				<div className="grid grid-cols-[repeat(3,minmax(140px,1fr))] gap-8">
					<Kpi
						label="Total received"
						value={
							<span className="bg-[linear-gradient(135deg,var(--ring),var(--primary))] bg-clip-text text-2xl font-semibold tabular-nums tracking-tight">
								{formatCurrency(total)}
							</span>
						}
					/>
					<Kpi
						label="Gifts"
						value={
							<span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
								{count}
							</span>
						}
						caption={count === 1 ? "transaction" : "transactions"}
					/>
					<Kpi
						label="Average"
						value={
							<span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
								{formatCurrency(average)}
							</span>
						}
						caption="per gift"
					/>
				</div>
			</div>

			<div className="flex items-center gap-6">
				<div className="flex min-w-[160px] flex-col gap-2">
					{chartData.slice(0, 4).map((d) => (
						<div key={d.name} className="flex items-center gap-2 text-xs">
							<span
								className="size-2 rounded-sm shrink-0"
								style={{ backgroundColor: d.color }}
							/>
							<span className="min-w-0 flex-1 text-secondary-foreground">
								{d.name}
							</span>
							<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
								{d.pct.toFixed(0)}%
							</span>
						</div>
					))}
					{chartData.length > 4 && (
						<div className="mt-0.5 text-xs text-muted-foreground">
							+ {chartData.length - 4} more
						</div>
					)}
				</div>

				<div className="relative h-[140px] w-[140px] shrink-0">
					<div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
						<div>
							<div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Total
							</div>
							<div className="mt-0.5 text-base font-semibold tabular-nums tracking-tight text-foreground">
								{formatCurrency(total)}
							</div>
						</div>
					</div>
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={chartData}
								dataKey="value"
								cx="50%"
								cy="50%"
								innerRadius={48}
								outerRadius={68}
								paddingAngle={1}
								stroke="none"
							>
								{chartData.map((d) => (
									<Cell key={d.name} fill={d.color} />
								))}
							</Pie>
							<Tooltip
								formatter={(v, _name, ctx) => {
									const payload = (
										ctx as
											| { payload?: { name?: string; pct?: number } }
											| undefined
									)?.payload;
									const num = typeof v === "number" ? v : 0;
									return [
										`${formatCurrency(num)} (${(payload?.pct ?? 0).toFixed(0)}%)`,
										payload?.name ?? "",
									];
								}}
								contentStyle={tooltipChrome}
							/>
						</PieChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
};

const Kpi = ({
	label,
	value,
	caption,
}: {
	label: string;
	value: ReactNode;
	caption?: string;
}) => {
	return (
		<div>
			<div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				{label}
			</div>
			<div>{value}</div>
			{caption && (
				<div className="mt-1 text-xs text-muted-foreground">{caption}</div>
			)}
		</div>
	);
};
