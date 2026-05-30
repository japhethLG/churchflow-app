"use client";

import type { ComponentProps } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// Shared donut implementation behind the lazy boundary in DonutChart.tsx.
// The three "mix by type" cards (admin transactions summary, the canonical
// TransactionMixCard, and the member church-mix card) rendered structurally
// identical Pie+Cell+Tooltip subtrees — this consolidates them so recharts
// is imported in exactly one lazily-loaded module.
export type DonutSlice = {
	key: string;
	amount: number;
	color: string;
};

export type DonutChartProps = {
	data: DonutSlice[];
	innerRadius: number | string;
	outerRadius: number | string;
	paddingAngle?: number;
	// recharts Tooltip `content` — either a rendered element (<DonutTooltip/>)
	// or a render function. Optional: omit for no tooltip.
	tooltip?: ComponentProps<typeof Tooltip>["content"];
};

export const DonutChartImpl = ({
	data,
	innerRadius,
	outerRadius,
	paddingAngle = 1.5,
	tooltip,
}: DonutChartProps) => (
	<ResponsiveContainer width="100%" height="100%">
		<PieChart>
			<Pie
				data={data}
				dataKey="amount"
				cx="50%"
				cy="50%"
				innerRadius={innerRadius}
				outerRadius={outerRadius}
				paddingAngle={paddingAngle}
				stroke="none"
			>
				{data.map((s) => (
					<Cell key={s.key} fill={s.color} />
				))}
			</Pie>
			{tooltip ? <Tooltip content={tooltip} /> : null}
		</PieChart>
	</ResponsiveContainer>
);
