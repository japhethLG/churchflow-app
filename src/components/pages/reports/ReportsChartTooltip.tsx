"use client";

import { formatCurrency } from "@/lib/format-currency";

type PiePayload = {
	name?: string;
	value?: number;
	pct?: number;
};

/** Recharts Pie Tooltip — avoids inline contentStyle. */
export const ReportsPieTooltip = ({
	active,
	payload,
}: {
	active?: boolean;
	payload?: readonly {
		payload?: PiePayload;
		name?: string;
		value?: number;
	}[];
}) => {
	if (!active || !payload?.length) return null;
	const entry = payload[0];
	const full = (entry.payload ?? entry) as PiePayload;
	const value =
		typeof entry.value === "number"
			? entry.value
			: typeof full.value === "number"
				? full.value
				: 0;
	const pct = typeof full.pct === "number" ? full.pct : 0;
	const name =
		(typeof entry.name === "string" ? entry.name : null) ?? full.name ?? "";

	return (
		<div className="rounded-lg border-0 bg-input px-3 py-2 text-xs shadow-md">
			<div className="font-medium text-foreground">
				{formatCurrency(value)} ({pct.toFixed(0)}%)
			</div>
			{name ? <div className="mt-0.5 text-muted-foreground">{name}</div> : null}
		</div>
	);
};

type BarRow = {
	label: string;
	total: number;
	count: number;
	isCurrentLabel?: string;
};

/** Recharts Bar Tooltip — shows total, count, and month label (+ MTD). */
export const ReportsBarTooltip = ({
	active,
	payload,
}: {
	active?: boolean;
	payload?: readonly { payload?: BarRow }[];
}) => {
	if (!active || !payload?.length) return null;
	const row = payload[0]?.payload as BarRow | undefined;
	if (!row) return null;
	const label = `${row.label}${row.isCurrentLabel ?? ""}`;

	return (
		<div className="rounded-lg border-0 bg-input px-3 py-2 text-xs shadow-md">
			<div className="tabular-nums text-foreground">
				{formatCurrency(row.total)} · {row.count} gifts
			</div>
			{label ? (
				<div className="mt-0.5 text-muted-foreground">{label}</div>
			) : null}
		</div>
	);
};
