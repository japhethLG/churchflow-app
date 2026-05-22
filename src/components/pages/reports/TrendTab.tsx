"use client";

import {
	Bar,
	CartesianGrid,
	ComposedChart,
	Legend,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, SectionTitle } from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { num, pct, TYPE_COLOR, TYPE_LABEL } from "../admin-shared";
import { TransactionMixCard } from "../TransactionMixCard";

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

			<TransactionMixCard
				className="mb-6"
				segments={typeSegments}
				total={totalThisPeriod}
				count={currentSummary?.count ?? 0}
			/>
		</>
	);
};
