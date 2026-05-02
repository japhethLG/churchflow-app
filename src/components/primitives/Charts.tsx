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
import { cn } from "@/lib/utils";

export type BarDatum = {
	label: string;
	v: number;
	label2?: string;
	highlight?: boolean;
};

const tooltipChrome = {
	backgroundColor: "var(--input)",
	border: "none",
	borderRadius: 8,
	fontSize: 12,
} as const;

const axisMuted = { fontSize: 11, fill: "var(--muted-foreground)" };

export const BarChart = ({
	data,
	height = 220,
	gradient,
	className,
}: {
	data: BarDatum[];
	height?: number;
	gradient?: boolean;
	className?: string;
}) => (
	<div className={cn("w-full", className)} style={{ height }}>
		<ResponsiveContainer width="100%" height="100%">
			<RechartsBarChart data={data} barCategoryGap="20%">
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
				<YAxis tick={axisMuted} axisLine={false} tickLine={false} width={48} />
				<Tooltip
					contentStyle={tooltipChrome}
					cursor={{
						fill: "color-mix(in srgb, var(--accent) 27%, transparent)",
					}}
					labelFormatter={(_, payload) => {
						const datum = payload?.[0]?.payload as BarDatum | undefined;
						return datum?.label2 ?? datum?.label ?? "";
					}}
				/>
				<defs>
					<linearGradient id="primitiveBarGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="var(--ring)" stopOpacity={0.9} />
						<stop offset="100%" stopColor="var(--primary)" stopOpacity={0.7} />
					</linearGradient>
					<linearGradient
						id="primitiveBarGradientActive"
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						<stop offset="0%" stopColor="var(--ring)" />
						<stop offset="100%" stopColor="var(--primary)" />
					</linearGradient>
				</defs>
				<Bar dataKey="v" radius={[6, 6, 0, 0]}>
					{data.map((d, idx) => (
						<Cell
							key={idx}
							fill={
								d.highlight
									? "url(#primitiveBarGradientActive)"
									: gradient
										? "url(#primitiveBarGradient)"
										: "var(--input)"
							}
						/>
					))}
				</Bar>
			</RechartsBarChart>
		</ResponsiveContainer>
	</div>
);

export type DonutDatum = { v: number; color: string };

export const Donut = ({
	data,
	size = 200,
	total,
	className,
}: {
	data: DonutDatum[];
	size?: number;
	total: string;
	className?: string;
}) => {
	const sum = data.reduce((a, d) => a + d.v, 0);
	const pieData = data.map((d, i) => ({
		name: `${i}`,
		value: d.v,
		color: d.color,
	}));
	const placeholder = [{ name: "empty", value: 1, color: "var(--input)" }];

	return (
		<div
			className={cn("relative inline-block", className)}
			style={{ width: size, height: size }}
		>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={sum > 0 ? pieData : placeholder}
						dataKey="value"
						innerRadius={size / 2 - 28}
						outerRadius={size / 2 - 6}
						paddingAngle={1}
						stroke="none"
						startAngle={90}
						endAngle={-270}
					>
						{(sum > 0 ? pieData : placeholder).map((entry, idx) => (
							<Cell key={idx} fill={entry.color} />
						))}
					</Pie>
				</PieChart>
			</ResponsiveContainer>
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
				<div>
					<div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
						Total
					</div>
					<div className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-foreground">
						{total}
					</div>
				</div>
			</div>
		</div>
	);
};
