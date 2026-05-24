"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
	Avatar,
	Card,
	DeletedLabel,
	MixBar,
	type ProgressSegment,
	SectionTitle,
	SegmentedControl,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { num, pickCategorical, TYPE_COLOR, TYPE_LABEL } from "../admin-shared";

type Report = components["schemas"]["GiversReportResponseDto"];

type MixMode = "type" | "campaign";

const MIX_OPTIONS = [
	{ value: "type", label: "By type" },
	{ value: "campaign", label: "By campaign" },
];

// Tiny inline monthly-bars — one bar per month in the report's `months`
// list, height ∝ amount. Bar count matches the selected date range.
const MonthlyBars = ({
	values,
	periodLabels,
	highlight,
}: {
	values: number[];
	periodLabels: string[];
	highlight: string;
}) => {
	const [hovered, setHovered] = useState<number | null>(null);
	const max = Math.max(...values, 1);
	const hoveredValue = hovered != null ? values[hovered] : undefined;
	const hoveredLabel = hovered != null ? periodLabels[hovered] : undefined;

	return (
		<figure
			aria-label="Monthly giving in the selected range"
			className="relative m-0"
			onMouseLeave={() => setHovered(null)}
		>
			<div className="flex h-9 items-end justify-end gap-[3px]">
				{values.map((v, i) => {
					const heightPct = v > 0 ? Math.max(8, (v / max) * 100) : 4;
					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: stable by period index
							key={i}
							role="img"
							aria-label={
								periodLabels[i]
									? `${periodLabels[i]}: ${v > 0 ? formatCurrency(v, { decimals: 0 }) : "no gift"}`
									: undefined
							}
							className="relative h-full w-2.5 cursor-pointer rounded-sm bg-(--chart-track) transition-opacity"
							style={{
								opacity: hovered != null && hovered !== i ? 0.5 : 1,
							}}
							onMouseEnter={() => setHovered(i)}
						>
							<div
								className="absolute bottom-0 left-0 right-0 rounded-sm"
								style={{
									height: `${heightPct}%`,
									background: v > 0 ? highlight : "transparent",
								}}
							/>
						</div>
					);
				})}
			</div>

			{hovered != null && (
				<div
					className="pointer-events-none absolute right-0 z-20 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg"
					style={{ bottom: "calc(100% + 6px)" }}
				>
					<div className="font-medium">{hoveredLabel}</div>
					<div className="mt-0.5 tabular-nums">
						{hoveredValue && hoveredValue > 0
							? formatCurrency(hoveredValue, { decimals: 0 })
							: "no gift"}
					</div>
				</div>
			)}
		</figure>
	);
};

export const GiversTab = ({
	report,
	loading,
}: {
	report?: Report;
	loading?: boolean;
}) => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();
	const [mode, setMode] = useState<MixMode>("type");

	const items = report?.items ?? [];
	const months = report?.months ?? [];
	const periodLabels = months.map((m) => dayjs(`${m}-01`).format("MMM YYYY"));

	return (
		<Card className="mb-6">
			<SectionTitle
				title="Top givers"
				action={
					<div className="w-[260px]">
						<SegmentedControl
							options={MIX_OPTIONS}
							value={mode}
							onChange={(v) => setMode(v as MixMode)}
						/>
					</div>
				}
			/>
			<p className="-mt-3 mb-5 text-sm text-muted-foreground">
				Each bar shows what a giver gave to (hover for details). Mini bars on
				the right show monthly giving across the selected range.
			</p>

			{loading ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					Loading…
				</div>
			) : items.length === 0 ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					No identified givers in this window.
				</div>
			) : (
				<>
					<div className="mb-2 grid grid-cols-[28px_40px_minmax(0,1fr)_110px_120px] gap-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
						<span>#</span>
						<span />
						<span>Giver · mix</span>
						<span className="text-right">Total</span>
						<span className="text-right">Monthly</span>
					</div>
					<ul className="divide-y divide-border">
						{items.map((g, idx) => {
							const name =
								`${g.memberFirstName} ${g.memberLastName}`.trim() || "Unnamed";
							const isDeleted = Boolean(g.memberDeletedAt);
							const segments: ProgressSegment[] =
								mode === "type"
									? g.byType
											.map((b) => ({
												value: b.amount,
												color: TYPE_COLOR[b.type],
												label: TYPE_LABEL[b.type],
												displayValue: formatCurrency(b.amount, {
													decimals: 0,
												}),
											}))
											.sort((a, b) => num(b.value) - num(a.value))
									: g.byCampaign.map((c, i) => ({
											value: c.amount,
											color: pickCategorical(i),
											label: c.campaignTitle,
											displayValue: formatCurrency(c.amount, { decimals: 0 }),
										}));

							const TOP_CHIPS = 4;
							const visibleChips = segments.slice(0, TOP_CHIPS);
							const restChips = segments.slice(TOP_CHIPS);
							const restTitle = restChips
								.map((r) => `${r.label}: ${r.displayValue ?? ""}`)
								.join(" · ");
							const monthlyValues = g.monthlyTotals.map((m) => m.amount);

							return (
								<li
									key={g.memberId}
									className="grid grid-cols-[28px_40px_minmax(0,1fr)_110px_140px] items-start gap-3 py-3.5"
								>
									<span className="pt-1 text-xs font-semibold tabular-nums text-muted-foreground">
										#{idx + 1}
									</span>
									<div className="pt-0.5">
										<Avatar name={name} size={32} />
									</div>
									<div className="min-w-0">
										<div className="flex items-baseline justify-between gap-3">
											{isDeleted ? (
												<DeletedLabel
													deletedAt={g.memberDeletedAt}
													className="truncate text-sm font-medium"
												>
													{name}
												</DeletedLabel>
											) : (
												<Link
													href={`/${tenantSlug}/admin/members/${g.memberId}`}
													className="truncate text-sm font-medium text-foreground hover:underline"
												>
													{name}
												</Link>
											)}
											<span className="text-xs text-muted-foreground">
												{g.count} {g.count === 1 ? "gift" : "gifts"} · avg{" "}
												{formatCompact(g.avg)}
											</span>
										</div>
										<div className="mt-1.5">
											<MixBar segments={segments} size="lg" />
										</div>
										<ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
											{visibleChips.map((s) => (
												<li key={s.label} className="flex items-center gap-1.5">
													<span
														className="size-2 shrink-0 rounded-sm"
														style={{ background: s.color }}
													/>
													<span className="text-foreground">{s.label}</span>
													<span className="tabular-nums text-muted-foreground">
														{s.displayValue ??
															formatCurrency(s.value, { decimals: 0 })}
													</span>
												</li>
											))}
											{restChips.length > 0 && (
												<li
													className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground"
													title={restTitle}
												>
													+{restChips.length} more
												</li>
											)}
										</ul>
									</div>
									<span className="pt-1 text-right text-sm font-semibold tabular-nums text-foreground">
										{formatCompact(g.total)}
									</span>
									<div className="flex justify-end pt-1">
										<MonthlyBars
											values={monthlyValues}
											periodLabels={periodLabels}
											highlight="var(--chart-current)"
										/>
									</div>
								</li>
							);
						})}
					</ul>
				</>
			)}
		</Card>
	);
};
