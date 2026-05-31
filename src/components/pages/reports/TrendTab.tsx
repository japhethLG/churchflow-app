"use client";

import dynamic from "next/dynamic";
import { Card, SectionTitle } from "@/components/primitives";
import type { components } from "@/lib/api";
import { num, pct, TX_TYPE_LABEL, TYPE_COLOR } from "../admin-shared";
import { TransactionMixCard } from "../TransactionMixCard";

// recharts loaded only when the trend chart actually renders.
const MonthTrendChart = dynamic(
	() => import("./MonthTrendChart").then((m) => m.MonthTrendChart),
	{
		ssr: false,
		loading: () => (
			<div className="grid h-full place-items-center text-sm text-muted-foreground">
				Loading…
			</div>
		),
	},
);

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
				label: TX_TYPE_LABEL[b.type],
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
						<MonthTrendChart data={data} />
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
