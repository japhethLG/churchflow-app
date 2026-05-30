"use client";

import {
	Bar,
	CartesianGrid,
	Cell,
	BarChart as RechartsBarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";

// recharts charts for the member Insights page, loaded lazily so the chart
// library stays off the route's first-load JS (both share one chunk).

export type YearlyGivingDatum = { year: number; total: number };

export const YearlyGivingChart = ({ data }: { data: YearlyGivingDatum[] }) => (
	<ResponsiveContainer width="100%" height="100%">
		<RechartsBarChart
			data={data}
			margin={{ top: 4, right: 8, bottom: 0, left: -8 }}
		>
			<CartesianGrid
				vertical={false}
				strokeDasharray="3 3"
				stroke="var(--input)"
			/>
			<XAxis
				dataKey="year"
				tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
				axisLine={false}
				tickLine={false}
				padding={{ left: 12, right: 12 }}
			/>
			<YAxis
				tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
				axisLine={false}
				tickLine={false}
				width={48}
				tickFormatter={(v) => formatCompact(Number(v))}
			/>
			<Tooltip
				cursor={{ fill: "color-mix(in srgb, var(--accent) 18%, transparent)" }}
				content={({ active, payload }) => {
					if (!active || !payload?.length) {
						return null;
					}
					const d = payload[0]?.payload as
						| { year: number; total: number }
						| undefined;
					if (!d) {
						return null;
					}
					return (
						<div className="rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg">
							<div className="font-medium">{d.year}</div>
							<div className="mt-0.5 tabular-nums">
								{formatCurrency(d.total, { decimals: 0 })}
							</div>
						</div>
					);
				}}
			/>
			<Bar
				dataKey="total"
				radius={[4, 4, 0, 0]}
				maxBarSize={48}
				minPointSize={2}
			>
				{data.map((b) => (
					<Cell
						key={b.year}
						fill={b.total > 0 ? "var(--chart-current)" : "var(--chart-track)"}
					/>
				))}
			</Bar>
		</RechartsBarChart>
	</ResponsiveContainer>
);

export type MonthlyTotalDatum = { month: string; total: number };

export const Last12MonthsChart = ({ data }: { data: MonthlyTotalDatum[] }) => (
	<ResponsiveContainer width="100%" height="100%">
		<RechartsBarChart
			data={data}
			barCategoryGap="18%"
			margin={{ top: 4, right: 4, bottom: 0, left: -8 }}
		>
			<CartesianGrid
				vertical={false}
				strokeDasharray="3 3"
				stroke="var(--input)"
			/>
			<XAxis
				dataKey="month"
				tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
				axisLine={false}
				tickLine={false}
				tickFormatter={(v) => dayjs(`${v}-01`).format("MMM")}
				interval={0}
			/>
			<YAxis
				tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
				axisLine={false}
				tickLine={false}
				width={48}
				tickFormatter={(v) => formatCompact(Number(v))}
			/>
			<Tooltip
				cursor={{ fill: "color-mix(in srgb, var(--accent) 18%, transparent)" }}
				content={({ active, payload }) => {
					if (!active || !payload?.length) {
						return null;
					}
					const d = payload[0]?.payload as
						| { month: string; total: number }
						| undefined;
					if (!d) {
						return null;
					}
					return (
						<div className="rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg">
							<div className="font-medium">
								{dayjs(`${d.month}-01`).format("MMM YYYY")}
							</div>
							<div className="mt-0.5 tabular-nums">
								{formatCurrency(d.total, { decimals: 0 })}
							</div>
						</div>
					);
				}}
			/>
			<Bar dataKey="total" radius={[3, 3, 0, 0]}>
				{data.map((b) => (
					<Cell
						key={b.month}
						fill={b.total > 0 ? "var(--chart-current)" : "var(--chart-track)"}
					/>
				))}
			</Bar>
		</RechartsBarChart>
	</ResponsiveContainer>
);
