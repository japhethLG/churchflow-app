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
import { formatCompact, formatCurrency } from "@/lib/format-currency";

export type CampaignTimelineBucket = {
	label: string;
	value: number;
	iso: string;
};

// recharts "when the money came in" bar chart, loaded lazily by
// CampaignOverviewTab so the chart library stays off the campaign-detail
// route's first-load JS.
export const CampaignTimelineChart = ({
	buckets,
}: {
	buckets: CampaignTimelineBucket[];
}) => (
	<ResponsiveContainer width="100%" height="100%">
		<RechartsBarChart
			data={buckets}
			barCategoryGap="18%"
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
				interval="preserveStartEnd"
				minTickGap={24}
			/>
			<YAxis
				tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
				axisLine={false}
				tickLine={false}
				width={48}
				tickFormatter={(v) => formatCompact(Number(v))}
			/>
			<Tooltip
				cursor={{
					fill: "color-mix(in srgb, var(--accent) 18%, transparent)",
				}}
				content={({ active, payload }) => {
					if (!active || !payload?.length) {
						return null;
					}
					const d = payload[0]?.payload as
						| { label: string; value: number }
						| undefined;
					if (!d) {
						return null;
					}
					return (
						<div className="rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg">
							<div className="font-medium">{d.label}</div>
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
				{buckets.map((b) => (
					<Cell
						key={b.iso}
						fill={b.value > 0 ? "var(--chart-current)" : "var(--chart-track)"}
					/>
				))}
			</Bar>
		</RechartsBarChart>
	</ResponsiveContainer>
);
