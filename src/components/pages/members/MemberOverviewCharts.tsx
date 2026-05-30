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
import type { ProgressSegment } from "@/components/primitives";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { num } from "../admin-shared";

export type MonthlyGivingDatum = {
	key: string;
	label: string;
	labelLong: string;
	value: number;
};

// recharts charts for the admin Member Detail overview, loaded lazily by
// MemberOverviewTab so the chart library stays off the member-detail
// route's first-load JS.
export const MonthlyGivingBarChart = ({
	data,
}: {
	data: MonthlyGivingDatum[];
}) => (
	<ResponsiveContainer width="100%" height="100%">
		<RechartsBarChart
			data={data}
			barCategoryGap="22%"
			margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
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
						| { labelLong: string; value: number }
						| undefined;
					if (!d) {
						return null;
					}
					return (
						<div className="rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg">
							<div className="font-medium">{d.labelLong}</div>
							<div className="mt-0.5 tabular-nums">
								{d.value > 0
									? formatCurrency(d.value, { decimals: 0 })
									: "no gift"}
							</div>
						</div>
					);
				}}
			/>
			<Bar dataKey="value" radius={[4, 4, 0, 0]}>
				{data.map((d) => (
					<Cell
						key={d.key}
						fill={d.value > 0 ? "var(--chart-current)" : "var(--chart-track)"}
					/>
				))}
			</Bar>
		</RechartsBarChart>
	</ResponsiveContainer>
);

export const MemberMixDonut = ({
	segments,
	breakdownTotal,
}: {
	segments: ProgressSegment[];
	breakdownTotal: number;
}) => (
	<ResponsiveContainer width="100%" height="100%">
		<PieChart>
			<Pie
				data={segments}
				dataKey="value"
				cx="50%"
				cy="50%"
				innerRadius={54}
				outerRadius={80}
				paddingAngle={1.5}
				stroke="none"
			>
				{segments.map((s) => (
					<Cell key={s.label} fill={s.color} />
				))}
			</Pie>
			<Tooltip
				content={({ active, payload }) => {
					if (!active || !payload?.length) {
						return null;
					}
					const d = payload[0]?.payload as ProgressSegment | undefined;
					if (!d) {
						return null;
					}
					const share =
						breakdownTotal > 0
							? Math.round((num(d.value) / breakdownTotal) * 100)
							: 0;
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
								{d.displayValue ?? formatCurrency(d.value, { decimals: 0 })}
								<span className="ml-2 opacity-70">{share}%</span>
							</div>
						</div>
					);
				}}
			/>
		</PieChart>
	</ResponsiveContainer>
);
