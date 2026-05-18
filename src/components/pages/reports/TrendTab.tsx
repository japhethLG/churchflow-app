"use client";

import {
	Bar,
	CartesianGrid,
	Cell,
	ComposedChart,
	Legend,
	Line,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, SectionTitle } from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { num, pct, TYPE_COLOR, TYPE_LABEL } from "../admin-shared";

type Summary = components["schemas"]["TransactionSummaryResponseDto"];

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

const monthLabel = (yyyymm: string) => {
	const [, mm] = yyyymm.split("-");
	const idx = parseInt(mm ?? "0", 10) - 1;
	return MONTH_SHORT[idx] ?? yyyymm;
};

type TooltipPayload = {
	active?: boolean;
	label?: string;
	payload?: { name: string; value: number; color: string }[];
};

const ChartTooltip = ({ active, payload, label }: TooltipPayload) => {
	if (!active || !payload?.length) {
		return null;
	}
	return (
		<div className="rounded-lg bg-card px-3 py-2 text-xs shadow-md ring-1 ring-border">
			<div className="font-medium text-foreground">{label}</div>
			{payload.map((p) => (
				<div key={p.name} className="mt-1 flex items-center gap-2">
					<span
						className="inline-block size-2 rounded-full"
						style={{ background: p.color }}
					/>
					<span className="text-muted-foreground">{p.name}</span>
					<span className="ml-auto tabular-nums text-foreground">
						{formatCurrency(p.value)}
					</span>
				</div>
			))}
		</div>
	);
};

export const TrendTab = ({
	currentSummary,
	priorYearSummary,
	loading,
}: {
	currentSummary?: Summary;
	priorYearSummary?: Summary;
	loading?: boolean;
}) => {
	const current = currentSummary?.byMonth ?? [];
	const prior = priorYearSummary?.byMonth ?? [];

	const priorByOffset = new Map<number, number>();
	for (let i = 0; i < prior.length; i += 1) {
		const m = prior[i];
		if (m) {
			priorByOffset.set(i, m.total);
		}
	}

	const data = current.map((m, i) => ({
		label: monthLabel(m.month),
		current: m.total,
		prev: priorByOffset.get(i) ?? 0,
	}));

	// Type-mix snapshot for the same window. Sorted, with per-row share +
	// average so admins can see "tithe is 64% of income at ₱1,605 per gift".
	const totalThisPeriod = num(currentSummary?.total);
	const typeSegments = (currentSummary?.byType ?? [])
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
				share: pct(amount, totalThisPeriod),
				avg: b.count > 0 ? amount / b.count : 0,
			};
		});

	const typePlaceholder = [
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

	return (
		<>
			<Card className="mb-6">
				<SectionTitle title="Month-over-month" />
				<p className="-mt-3 mb-3 text-sm text-muted-foreground">
					Current period vs. the same months one year ago.
				</p>
				{loading ? (
					<div className="grid h-[280px] place-items-center text-sm text-muted-foreground">
						Loading…
					</div>
				) : data.length === 0 ? (
					<div className="grid h-[200px] place-items-center text-sm text-muted-foreground">
						No data for this period.
					</div>
				) : (
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<ComposedChart
								data={data}
								margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
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
								/>
								<YAxis
									tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
									axisLine={false}
									tickLine={false}
									tickFormatter={(v) => formatCompact(Number(v))}
									width={56}
								/>
								<Tooltip
									content={<ChartTooltip />}
									cursor={{
										fill: "color-mix(in srgb, var(--accent) 35%, transparent)",
									}}
								/>
								<Legend
									iconType="circle"
									wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
								/>
								<Bar
									dataKey="current"
									name="This period"
									fill="var(--chart-current)"
									radius={[6, 6, 0, 0]}
									barSize={28}
								/>
								<Line
									type="monotone"
									dataKey="prev"
									name="Previous year"
									stroke="var(--chart-prior)"
									strokeWidth={2}
									strokeDasharray="4 4"
									dot={{ r: 2.5, fill: "var(--chart-prior)" }}
								/>
							</ComposedChart>
						</ResponsiveContainer>
					</div>
				)}
			</Card>

			<Card className="mb-6">
				<SectionTitle title="Where the money came from" />
				<p className="-mt-3 mb-5 text-sm text-muted-foreground">
					Mix of total received by transaction type for the selected period.
				</p>
				{typeSegments.length === 0 ? (
					<div className="py-12 text-center text-sm text-muted-foreground">
						No transactions in this range.
					</div>
				) : (
					<div className="grid items-center gap-8 lg:grid-cols-[300px_1fr]">
						<div className="grid place-items-center">
							<div className="relative size-[260px]">
								<div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
									<div>
										<div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
											Total
										</div>
										<div className="mt-1 text-2xl font-bold tabular-nums text-foreground">
											{formatCompact(totalThisPeriod)}
										</div>
										<div className="mt-0.5 text-xs text-muted-foreground">
											{currentSummary?.count ?? 0} gifts
										</div>
									</div>
								</div>
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={
												typeSegments.length > 0 ? typeSegments : typePlaceholder
											}
											dataKey="amount"
											cx="50%"
											cy="50%"
											innerRadius={78}
											outerRadius={112}
											paddingAngle={1.5}
											stroke="none"
										>
											{(typeSegments.length > 0
												? typeSegments
												: typePlaceholder
											).map((s) => (
												<Cell key={s.key} fill={s.color} />
											))}
										</Pie>
										<Tooltip
											content={({ active, payload }) => {
												if (!active || !payload?.length) {
													return null;
												}
												const d = payload[0]?.payload as
													| (typeof typeSegments)[number]
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
															<span className="ml-2 opacity-70">
																{d.share}%
															</span>
														</div>
														<div className="mt-0.5 opacity-70">
															{d.count} gifts · avg {formatCompact(d.avg)}
														</div>
													</div>
												);
											}}
										/>
									</PieChart>
								</ResponsiveContainer>
							</div>
						</div>

						<div className="flex flex-col">
							<div className="mb-2 grid grid-cols-[1.4fr_1fr_1fr_1fr_60px] gap-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
								<span>Type</span>
								<span className="text-right">Total</span>
								<span className="text-right">Gifts</span>
								<span className="text-right">Avg</span>
								<span className="text-right">Share</span>
							</div>
							<ul className="divide-y divide-border">
								{typeSegments.map((s) => (
									<li
										key={s.key}
										className="grid grid-cols-[1.4fr_1fr_1fr_1fr_60px] items-center gap-3 py-3 text-sm"
									>
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
									</li>
								))}
							</ul>
						</div>
					</div>
				)}
			</Card>
		</>
	);
};
