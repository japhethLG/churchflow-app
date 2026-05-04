"use client";

import {
	Bar,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	BarChart as RechartsBarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, Pressable, SectionTitle } from "@/components/primitives";
import type { components } from "@/lib/api";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { cn } from "@/lib/utils";

type Summary = components["schemas"]["TransactionSummaryResponseDto"];
type ByType = components["schemas"]["TransactionSummaryByTypeDto"];
type ByMonth = components["schemas"]["TransactionSummaryByMonthDto"];

const TYPE_LABEL: Record<ByType["type"], string> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

/** CSS variables — Recharts consumes these in SVG / stroke */
const TYPE_COLOR: Record<ByType["type"], string> = {
	TITHE: "var(--tx-tithe)",
	OFFERING: "var(--tx-offering)",
	MISSION_GIVING: "var(--tx-mission)",
	FIRST_FRUIT: "var(--tx-first-fruit)",
	COMMITMENT: "var(--tx-commitment)",
	DONATION: "var(--tx-donation)",
	OTHER: "var(--tx-other)",
};

const MONTH_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

type PeriodOption = { months: number; label: string };
const PERIOD_OPTIONS: PeriodOption[] = [
	{ months: 1, label: "30d" },
	{ months: 3, label: "90d" },
	{ months: 12, label: "YTD" },
];

const tooltipChrome = {
	backgroundColor: "var(--input)",
	border: "none",
	borderRadius: 8,
	fontSize: 12,
} as const;

const axisMuted = { fontSize: 11, fill: "var(--muted-foreground)" };

export const DashboardCharts = ({
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
			<div className="mb-6 grid grid-cols-[1.5fr_1fr] gap-4">
				{[0, 1].map((i) => (
					<Card key={i}>
						<div className="mb-4 h-4 w-[120px] animate-pulse rounded bg-secondary" />
						<div className="h-[200px] animate-pulse rounded-lg bg-secondary opacity-50" />
					</Card>
				))}
			</div>
		);
	}

	const total = summary.total;
	const byMonth: ByMonth[] = summary.byMonth ?? [];
	const byType: ByType[] = summary.byType ?? [];

	const now = dayjs();
	const currentMonth = now.format("YYYY-MM");
	const barData = byMonth.map((m) => {
		const [, mm] = m.month.split("-");
		const monthIdx = parseInt(mm, 10) - 1;
		return {
			label: MONTH_SHORT[monthIdx] ?? m.month,
			total: m.total,
			isCurrent: m.month === currentMonth,
		};
	});

	const donutData = byType
		.filter((b) => b.total > 0)
		.map((b) => ({
			name: TYPE_LABEL[b.type],
			value: b.total,
			color: TYPE_COLOR[b.type],
			pct: total > 0 ? (b.total / total) * 100 : 0,
		}))
		.sort((a, b) => b.value - a.value);

	const donutPlaceholder = [
		{ name: "No data", value: 1, color: "var(--input)" },
	];

	return (
		<div className="mb-6 grid grid-cols-[1.5fr_1fr] gap-4">
			<Card>
				<div className="mb-2 flex items-center justify-between">
					<SectionTitle title="Monthly trend" />
					<div className="flex gap-1 rounded-full bg-muted p-1">
						{PERIOD_OPTIONS.map((opt) => (
							<Pressable
								key={opt.months}
								onClick={() => onMonthsChange(opt.months)}
								className={cn(
									"rounded-full px-3 py-1 font-inherit text-xs font-medium transition-[box-shadow,background,color]",
									months === opt.months
										? "bg-card text-foreground shadow-sm"
										: "border-none bg-transparent text-muted-foreground",
								)}
							>
								{opt.label}
							</Pressable>
						))}
					</div>
				</div>
				{barData.length > 0 ? (
					<div className="h-[240px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<RechartsBarChart data={barData} barCategoryGap="20%">
								<CartesianGrid
									vertical={false}
									strokeDasharray="3 3"
									stroke="var(--input)"
								/>
								<XAxis
									dataKey="label"
									tick={axisMuted}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									tick={axisMuted}
									axisLine={false}
									tickLine={false}
									tickFormatter={(v) => formatCompact(v)}
									width={50}
								/>
								<Tooltip
									formatter={(v) => [`${formatCompact(Number(v))}`, "Total"]}
									contentStyle={tooltipChrome}
									cursor={{
										fill: "color-mix(in srgb, var(--accent) 27%, transparent)",
									}}
								/>
								<defs>
									<linearGradient
										id="dashBarGradient"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="0%"
											stopColor="var(--ring)"
											stopOpacity={0.9}
										/>
										<stop
											offset="100%"
											stopColor="var(--primary)"
											stopOpacity={0.7}
										/>
									</linearGradient>
									<linearGradient
										id="dashBarGradientActive"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="0%" stopColor="var(--ring)" />
										<stop offset="100%" stopColor="var(--primary)" />
									</linearGradient>
								</defs>
								<Bar dataKey="total" radius={[6, 6, 0, 0]}>
									{barData.map((entry, idx) => (
										<Cell
											key={idx}
											fill={
												entry.isCurrent
													? "url(#dashBarGradientActive)"
													: "url(#dashBarGradient)"
											}
										/>
									))}
								</Bar>
							</RechartsBarChart>
						</ResponsiveContainer>
					</div>
				) : (
					<div className="grid h-[220px] place-items-center text-sm text-muted-foreground">
						No data for this period
					</div>
				)}
			</Card>

			<Card>
				<SectionTitle title="Income breakdown" />
				<div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center">
					<div className="relative mx-auto h-[200px] w-[200px] shrink-0 lg:mx-0">
						<div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
							<div>
								<div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
									Total
								</div>
								<div className="mt-0.5 text-xl font-bold tracking-tight tabular-nums">
									{formatCompact(total)}
								</div>
							</div>
						</div>
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={donutData.length > 0 ? donutData : donutPlaceholder}
									dataKey="value"
									cx="50%"
									cy="50%"
									innerRadius={65}
									outerRadius={90}
									paddingAngle={2}
									stroke="none"
								>
									{(donutData.length > 0 ? donutData : donutPlaceholder).map(
										(d) => (
											<Cell
												key={d.name}
												fill={d.color}
												className="transition-opacity hover:opacity-80 outline-none"
											/>
										),
									)}
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
									wrapperStyle={{ zIndex: 10 }}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>

					<div className="flex min-w-0 flex-1 flex-col gap-1.5">
						{donutData.map((x) => (
							<div
								key={x.name}
								className="group relative overflow-hidden rounded-lg border border-transparent transition-all hover:border-border hover:bg-muted/30"
							>
								{/* Subtle progress background */}
								<div
									className="absolute inset-y-0 left-0 opacity-[0.1] transition-opacity group-hover:opacity-[0.1]"
									style={{ backgroundColor: x.color, width: `${x.pct}%` }}
								/>

								<div className="relative flex items-center justify-between px-3 py-2 text-sm">
									<div className="flex min-w-0 items-center gap-3">
										<div
											className="size-2.5 shrink-0 rounded-full shadow-sm"
											style={{ backgroundColor: x.color }}
										/>
										<span className="truncate font-medium text-foreground/90">
											{x.name}
										</span>
									</div>
									<div className="flex items-center gap-4 tabular-nums">
										<span className="text-xs text-muted-foreground/70">
											{formatCompact(x.value)}
										</span>
										<span className="w-8 text-right font-bold text-foreground">
											{x.pct.toFixed(0)}%
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</Card>
		</div>
	);
};
