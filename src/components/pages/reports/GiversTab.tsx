"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Avatar,
	Card,
	MixBar,
	type ProgressSegment,
	SectionTitle,
	SegmentedControl,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import {
	bucketSmallSegments,
	num,
	pickCategorical,
	type TxType,
	TYPE_COLOR,
	TYPE_LABEL,
} from "../admin-shared";

type Transaction = components["schemas"]["TransactionResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

type MixMode = "type" | "campaign";

const MIX_OPTIONS = [
	{ value: "type", label: "By type" },
	{ value: "campaign", label: "By campaign" },
];

type GiverRow = {
	memberId: string;
	name: string;
	total: number;
	count: number;
	byType: Partial<Record<TxType, number>>;
	byCampaign: Record<string, number>;
	// 6 monthly amounts, oldest first → newest. Shown as mini-bars so the
	// admin sees both *consistency* (how many months had giving) and
	// *magnitude* (which months were bigger) in one glance.
	monthly: number[];
};

const buildGivers = (
	transactions: Transaction[],
	membersById: Record<string, Member>,
): GiverRow[] => {
	const startMonth = dayjs().startOf("month").subtract(5, "month");
	const byMember = new Map<string, GiverRow>();

	for (const t of transactions) {
		const mid = typeof t.memberId === "string" ? t.memberId : null;
		if (!mid) {
			continue;
		}
		const m = membersById[mid];
		const name = m
			? `${m.firstName} ${m.lastName}`.trim() || "Unnamed"
			: "Unknown";
		let row = byMember.get(mid);
		if (!row) {
			row = {
				memberId: mid,
				name,
				total: 0,
				count: 0,
				byType: {},
				byCampaign: {},
				monthly: Array.from({ length: 6 }, () => 0),
			};
			byMember.set(mid, row);
		}
		const amt = num(t.amount);
		row.total += amt;
		row.count += 1;
		row.byType[t.type] = (row.byType[t.type] ?? 0) + amt;
		const cKey = typeof t.campaignId === "string" ? t.campaignId : "__none";
		row.byCampaign[cKey] = (row.byCampaign[cKey] ?? 0) + amt;
		const monthDelta = dayjs(t.date).startOf("month").diff(startMonth, "month");
		if (monthDelta >= 0 && monthDelta <= 5) {
			row.monthly[monthDelta] = (row.monthly[monthDelta] ?? 0) + amt;
		}
	}

	return Array.from(byMember.values()).sort((a, b) => b.total - a.total);
};

// Tiny inline monthly-bars: 6 vertical bars, height ∝ that month's giving.
// On hover the parent shows a small floating tooltip with the month name +
// formatted amount; empty months show as a hairline track and read "no
// gift" in the tooltip.
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
			aria-label="Last 6 months of giving"
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
	transactions,
	membersById,
	campaignsById,
	loading,
}: {
	transactions: Transaction[];
	membersById: Record<string, Member>;
	campaignsById: Record<string, Campaign>;
	loading?: boolean;
}) => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();
	const [mode, setMode] = useState<MixMode>("type");
	const givers = useMemo(
		() => buildGivers(transactions, membersById),
		[transactions, membersById],
	);
	const top = givers.slice(0, 15);

	const periodLabels = useMemo(() => {
		const start = dayjs().startOf("month").subtract(5, "month");
		return Array.from({ length: 6 }, (_, i) =>
			start.add(i, "month").format("MMM YYYY"),
		);
	}, []);

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
				the right show the last 6 months — height is amount given that month.
			</p>

			{loading ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					Loading…
				</div>
			) : top.length === 0 ? (
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
						<span className="text-right">Last 6 months</span>
					</div>
					<ul className="divide-y divide-border">
						{top.map((g, idx) => {
							const segments: ProgressSegment[] =
								mode === "type"
									? Object.entries(g.byType)
											.map(([key, value]) => {
												const k = key as TxType;
												return {
													value,
													color: TYPE_COLOR[k],
													label: TYPE_LABEL[k],
													displayValue: formatCurrency(value, { decimals: 0 }),
												};
											})
											.sort((a, b) => num(b.value) - num(a.value))
									: bucketSmallSegments(
											Object.entries(g.byCampaign)
												.map(([key, value], i) => {
													const c = key !== "__none" && campaignsById[key];
													return {
														value,
														color: pickCategorical(i),
														label: c ? c.title : "No campaign",
														displayValue: formatCurrency(value, {
															decimals: 0,
														}),
													};
												})
												.sort((a, b) => num(b.value) - num(a.value)),
											0.02,
											(dropped) => ({
												value: dropped,
												color: "var(--chart-prior)",
												label: "Other",
												displayValue: formatCurrency(dropped, { decimals: 0 }),
											}),
										);

							// Top breakdown chips — show the largest 4 segments inline as
							// `● Label · ₱amount` so admins read amounts at a glance
							// without hovering. Remaining segments collapse into a
							// "+N more" pill with the full list in its native title.
							const TOP_CHIPS = 4;
							const visibleChips = segments.slice(0, TOP_CHIPS);
							const restChips = segments.slice(TOP_CHIPS);
							const restTitle = restChips
								.map((r) => `${r.label}: ${r.displayValue ?? ""}`)
								.join(" · ");
							const avg = g.count > 0 ? g.total / g.count : 0;

							return (
								<li
									key={g.memberId}
									className="grid grid-cols-[28px_40px_minmax(0,1fr)_110px_140px] items-start gap-3 py-3.5"
								>
									<span className="pt-1 text-xs font-semibold tabular-nums text-muted-foreground">
										#{idx + 1}
									</span>
									<div className="pt-0.5">
										<Avatar name={g.name} size={32} />
									</div>
									<div className="min-w-0">
										<div className="flex items-baseline justify-between gap-3">
											<Link
												href={`/${tenantSlug}/admin/members/${g.memberId}`}
												className="truncate text-sm font-medium text-foreground hover:underline"
											>
												{g.name}
											</Link>
											<span className="text-xs text-muted-foreground">
												{g.count} {g.count === 1 ? "gift" : "gifts"} · avg{" "}
												{formatCompact(avg)}
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
											values={g.monthly}
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
