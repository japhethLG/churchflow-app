"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, SectionTitle } from "@/components/primitives";
import { formatCurrency } from "@/lib/format-currency";
import { ReportsPieTooltip } from "./ReportsChartTooltip";
import { ReportsHorizontalLeaderBoard } from "./ReportsHorizontalLeaderBoard";
import { ReportsLoadingPlaceholder } from "./ReportsLoadingPlaceholder";
import { type SummaryDto, TYPE_COLOR, TYPE_LABEL } from "./reports-shared";

export const ReportsByType = ({
	summary,
	loading,
}: {
	summary: SummaryDto | undefined;
	loading?: boolean;
}) => {
	if (loading || !summary) {
		return <ReportsLoadingPlaceholder />;
	}

	const total = summary.total;
	const byType = summary.byType ?? [];
	const sorted = [...byType].sort((a, b) => b.total - a.total);

	const donutData = sorted
		.filter((b) => b.total > 0)
		.map((b) => ({
			name: TYPE_LABEL[b.type],
			value: b.total,
			color: TYPE_COLOR[b.type],
			pct: total > 0 ? (b.total / total) * 100 : 0,
		}));

	const emptySlice = {
		name: "No data",
		value: 1,
		color: "var(--input)",
		pct: 0,
	};
	const pieSlices = donutData.length > 0 ? donutData : [emptySlice];

	const rankRows = sorted.map((r, i) => ({
		key: r.type,
		axisLabel: TYPE_LABEL[r.type],
		title: TYPE_LABEL[r.type],
		metric: r.total,
		amountDisplay: formatCurrency(r.total),
		fill: TYPE_COLOR[r.type],
		rank: i + 1,
		countLabel: `${r.count} gifts`,
	}));

	return (
		<div className="mb-6 grid grid-cols-[1fr_1.3fr] gap-4">
			<Card>
				<SectionTitle title="Distribution" />
				<div className="grid place-items-center py-5">
					<div className="relative size-[240px]">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={pieSlices}
									dataKey="value"
									cx="50%"
									cy="50%"
									innerRadius={70}
									outerRadius={100}
									paddingAngle={1}
									stroke="none"
								>
									{pieSlices.map((d) => (
										<Cell key={d.name} fill={d.color} />
									))}
								</Pie>
								<Tooltip content={<ReportsPieTooltip />} />
							</PieChart>
						</ResponsiveContainer>
						<div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
							<div>
								<div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
									Total
								</div>
								<div className="mt-1 text-[22px] font-semibold tabular-nums tracking-tight text-foreground">
									{formatCurrency(total)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</Card>

			<Card>
				<SectionTitle title="Ranked by type" />
				<ReportsHorizontalLeaderBoard rows={rankRows} />
			</Card>
		</div>
	);
};
