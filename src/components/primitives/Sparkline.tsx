"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export type SparklineProps = {
	data: number[];
	width?: number;
	height?: number;
	// Drives line color. "current" uses the primary accent. "muted" is for
	// secondary rows. "positive" / "negative" carry sentiment.
	tone?: "current" | "muted" | "positive" | "negative";
	className?: string;
	// Optional semantic note for screen readers. Sparklines are decorative
	// glance-tools; pair them with the row's primary numeric column for
	// the accessible value.
	title?: string;
};

const TONE_COLOR: Record<NonNullable<SparklineProps["tone"]>, string> = {
	current: "var(--chart-current)",
	muted: "var(--chart-prior)",
	positive: "var(--chart-positive)",
	negative: "var(--chart-negative)",
};

export const Sparkline = ({
	data,
	width = 96,
	height = 28,
	tone = "current",
	className,
	title,
}: SparklineProps) => {
	if (data.length === 0) {
		return (
			<div
				className={cn(
					"flex items-center justify-center text-xs text-muted-foreground",
					className,
				)}
				style={{ width, height }}
				title={title ?? "no data"}
			>
				—
			</div>
		);
	}

	const points = data.map((v, i) => ({ i, v }));
	const color = TONE_COLOR[tone];
	const gradientId = `sparkline-${tone}`;

	return (
		<div
			className={cn("inline-block", className)}
			style={{ width, height }}
			title={title}
		>
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart
					data={points}
					margin={{ top: 1, right: 1, bottom: 1, left: 1 }}
				>
					<defs>
						<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={color} stopOpacity={0.32} />
							<stop offset="100%" stopColor={color} stopOpacity={0} />
						</linearGradient>
					</defs>
					<Area
						type="monotone"
						dataKey="v"
						stroke={color}
						strokeWidth={1.5}
						fill={`url(#${gradientId})`}
						isAnimationActive={false}
						dot={false}
						activeDot={false}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
};
