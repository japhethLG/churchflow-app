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
import { formatCompact, formatCurrency } from "@/lib/format-currency";

export type MonthTrendDatum = {
	label: string;
	current: number;
	prev: number;
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

// recharts month-over-month composed chart, loaded lazily by TrendTab so the
// chart library stays off the reports route's first-load JS.
export const MonthTrendChart = ({ data }: { data: MonthTrendDatum[] }) => (
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
);
