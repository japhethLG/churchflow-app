"use client";

import type { JSX } from "react";
import {
	Bar,
	BarChart,
	Cell,
	LabelList,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

/** Row shape for {@link ReportsHorizontalLeaderBoard} — `metric` drives bar length; `amountDisplay` is the right label. */
export type LeaderBoardRowData = {
	key: string;
	axisLabel: string;
	metric: number;
	/** Formatted amount at end of bar + in tooltip */
	amountDisplay: string;
	fill: string;
	countLabel?: string;
	rank?: number;
	title?: string;
};

export const ReportsHorizontalLeaderBoard = ({
	rows,
}: {
	rows: LeaderBoardRowData[];
}) => {
	const maxVal = Math.max(...rows.map((r) => r.metric), 1);
	const height = Math.min(520, Math.max(160, rows.length * 40 + 32));

	return (
		<ResponsiveContainer width="100%" height={height}>
			<BarChart
				layout="vertical"
				data={rows}
				margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
			>
				<XAxis type="number" domain={[0, maxVal]} hide />
				<YAxis
					type="category"
					dataKey="axisLabel"
					width={190}
					tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
					tickLine={false}
					axisLine={false}
				/>
				<Tooltip
					cursor={{
						fill: "color-mix(in srgb, var(--accent) 12%, transparent)",
					}}
					content={<LeaderBoardTooltip />}
				/>
				<Bar
					dataKey="metric"
					radius={[0, 6, 6, 0]}
					maxBarSize={28}
					isAnimationActive
				>
					{rows.map((r) => (
						<Cell key={r.key} fill={r.fill} />
					))}
					<LabelList
						dataKey="amountDisplay"
						position="right"
						className="fill-foreground font-medium tabular-nums text-xs"
					/>
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
};

const LeaderBoardTooltip = ({
	active,
	payload,
}: {
	active?: boolean;
	payload?: readonly { payload?: LeaderBoardRowData }[];
}): JSX.Element | null => {
	if (!active || !payload?.length) return null;
	const row = payload[0]?.payload;
	if (!row) return null;
	const title = row.title ?? row.axisLabel;

	return (
		<div className="rounded-lg border-0 bg-input px-3 py-2 text-xs shadow-md">
			<div className="font-medium text-foreground">
				{typeof row.rank === "number" ? `#${row.rank} · ` : null}
				{title}
			</div>
			<div className="mt-1 tabular-nums text-foreground">
				{row.amountDisplay}
			</div>
			{row.countLabel ? (
				<div className="mt-1 text-muted-foreground">{row.countLabel}</div>
			) : null}
		</div>
	);
};
