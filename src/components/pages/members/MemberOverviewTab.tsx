"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import {
	Amount,
	Avatar,
	Badge,
	Card,
	Pressable,
	type ProgressSegment,
	SectionTitle,
	SegmentedControl,
	StatBand,
	StatusBadge,
	TypeBadge,
} from "@/components/primitives";
import type { TransactionType as BadgeType } from "@/components/primitives/Badge";
import { type components, nstr } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { usePledges } from "@/lib/api/pledges";
import { useTransactions } from "@/lib/api/transactions";
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

type Member = components["schemas"]["MemberResponseDto"];
type Transaction = components["schemas"]["TransactionResponseDto"];

type MixMode = "type" | "campaign";

const MIX_OPTIONS = [
	{ value: "type", label: "By type" },
	{ value: "campaign", label: "By campaign" },
];

const TX_BADGE_LABEL: Record<Transaction["type"], BadgeType> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

const relativeDate = (iso: string): string => {
	const d = dayjs(iso);
	const now = dayjs();
	const hours = now.diff(d, "hour", true);
	if (hours < 24) {
		return `Today · ${d.format("h:mma")}`;
	}
	if (hours < 48) {
		return "Yesterday";
	}
	if (hours < 24 * 7) {
		return `${Math.floor(hours / 24)}d ago`;
	}
	return d.format("MMM D, YYYY");
};

export const MemberOverviewTab = ({
	member,
	tenantSlug,
}: {
	member: Member;
	tenantSlug: string;
}) => {
	const router = useRouter();
	const [mixMode, setMixMode] = useState<MixMode>("type");

	// Lifetime giving — 500-row cap is preview-quality. At scale we'd want a
	// backend rollup; for typical churches this covers every transaction the
	// member has made.
	const txQ = useTransactions(tenantSlug, { memberId: member.id, limit: 500 });
	const transactions: Transaction[] = txQ.data?.items ?? [];

	const pledgesQ = usePledges(tenantSlug, { memberId: member.id, limit: 200 });
	const pledges = pledgesQ.data?.items ?? [];

	const campaignsQ = useCampaigns(tenantSlug, { includeDeleted: true });
	const campaignsById = useMemo(
		() =>
			Object.fromEntries((campaignsQ.data?.items ?? []).map((c) => [c.id, c])),
		[campaignsQ.data],
	);

	// Aggregate giving relationship — lifetime numbers.
	const lifetime = useMemo(() => {
		let total = 0;
		let firstISO: string | null = null;
		let lastISO: string | null = null;
		const byType: Partial<Record<TxType, number>> = {};
		const byCampaign: Record<string, number> = {};
		for (const t of transactions) {
			const amt = num(t.amount);
			total += amt;
			byType[t.type] = (byType[t.type] ?? 0) + amt;
			const cKey = typeof t.campaignId === "string" ? t.campaignId : "__none";
			byCampaign[cKey] = (byCampaign[cKey] ?? 0) + amt;
			if (!firstISO || dayjs(t.date).isBefore(firstISO)) {
				firstISO = t.date;
			}
			if (!lastISO || dayjs(t.date).isAfter(lastISO)) {
				lastISO = t.date;
			}
		}
		return {
			total,
			count: transactions.length,
			avg: transactions.length > 0 ? total / transactions.length : 0,
			firstISO,
			lastISO,
			byType,
			byCampaign,
		};
	}, [transactions]);

	const pledgeStats = useMemo(() => {
		const active = pledges.filter((p) => p.status === "ACTIVE").length;
		const fulfilled = pledges.filter((p) => p.status === "FULFILLED").length;
		return { active, fulfilled };
	}, [pledges]);

	// 12-month chart series + consistency caption. Each entry has both a
	// short axis label ("Mar") and a full label ("Mar 2025") for the tooltip.
	const monthly = useMemo(() => {
		const start = dayjs().startOf("month").subtract(11, "month");
		const data = Array.from({ length: 12 }, (_, i) => {
			const d = start.add(i, "month");
			return {
				label: d.format("MMM"),
				labelLong: d.format("MMM YYYY"),
				value: 0,
			};
		});
		for (const t of transactions) {
			const idx = dayjs(t.date).startOf("month").diff(start, "month");
			if (idx >= 0 && idx <= 11) {
				const slot = data[idx];
				if (slot) {
					slot.value += num(t.amount);
				}
			}
		}
		const monthsWithGiving = data.filter((d) => d.value > 0).length;
		const peakAmount = data.reduce((m, d) => Math.max(m, d.value), 0);
		const peakIdx = data.findIndex((d) => d.value === peakAmount);
		const peakMonth =
			peakAmount > 0 && peakIdx >= 0 ? data[peakIdx]?.labelLong : null;
		return { data, monthsWithGiving, peakAmount, peakMonth };
	}, [transactions]);

	// Mix segments — bucketed at 2% so the chart isn't a confetti.
	const mixSegments = useMemo<ProgressSegment[]>(() => {
		if (mixMode === "type") {
			return Object.entries(lifetime.byType)
				.map(([key, value]) => {
					const k = key as TxType;
					return {
						value,
						color: TYPE_COLOR[k],
						label: TYPE_LABEL[k],
						displayValue: formatCurrency(value, { decimals: 0 }),
					};
				})
				.sort((a, b) => num(b.value) - num(a.value));
		}
		return bucketSmallSegments(
			Object.entries(lifetime.byCampaign)
				.map(([key, value], i) => {
					const c = key !== "__none" && campaignsById[key];
					return {
						value,
						color: pickCategorical(i),
						label: c ? c.title : "No campaign",
						displayValue: formatCurrency(value, { decimals: 0 }),
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
	}, [mixMode, lifetime.byType, lifetime.byCampaign, campaignsById]);

	const recent = transactions.slice(0, 8);
	const fullName = `${member.firstName} ${member.lastName}`.trim() || "Unnamed";
	const email = nstr(member.email);
	const phone = nstr(member.phone);
	const address = nstr(member.address);

	return (
		<div className="space-y-6">
			{/* Identity strip */}
			<Card padding={24}>
				<div className="flex items-center gap-4">
					<Avatar name={fullName} size={64} />
					<div className="min-w-0 flex-1">
						<div className="text-2xl font-bold tracking-tight text-foreground">
							{fullName}
						</div>
						<div className="mt-1.5 flex flex-wrap items-center gap-2">
							<Badge color={member.role === "ADMIN" ? "indigo" : "neutral"}>
								{member.role}
							</Badge>
							<StatusBadge
								status={member.status === "ACTIVE" ? "Active" : "Inactive"}
							/>
							{!member.userId && <Badge color="clay">Unclaimed account</Badge>}
							<span className="ml-1 text-xs text-muted-foreground">
								Joined {dayjs(member.createdAt).format("MMM D, YYYY")}
							</span>
						</div>
					</div>
				</div>
			</Card>

			{/* Giving relationship */}
			<Card padding={24}>
				<SectionTitle title="Giving relationship" />
				<StatBand
					items={[
						{
							label: "Lifetime",
							value: formatCompact(lifetime.total),
							caption: txQ.isLoading ? "Loading…" : "All-time given",
						},
						{
							label: "Gifts",
							value: lifetime.count.toLocaleString(),
							caption: `Avg ${formatCompact(lifetime.avg)}`,
						},
						{
							label: "First gift",
							value: lifetime.firstISO
								? dayjs(lifetime.firstISO).format("MMM YYYY")
								: "—",
							caption: lifetime.firstISO
								? `${dayjs().diff(dayjs(lifetime.firstISO), "month")} months ago`
								: "No gifts yet",
						},
						{
							label: "Last gift",
							value: lifetime.lastISO
								? dayjs(lifetime.lastISO).format("MMM D")
								: "—",
							caption: lifetime.lastISO ? relativeDate(lifetime.lastISO) : "—",
						},
						{
							label: "Pledges",
							value: pledgeStats.active.toLocaleString(),
							caption: `${pledgeStats.fulfilled} fulfilled`,
						},
					]}
				/>
			</Card>

			{/* Last 12 months + Breakdown — side-by-side on wide screens */}
			<div className="grid gap-6 lg:grid-cols-2">
				<Card padding={24}>
					<SectionTitle title="Last 12 months" />
					<div className="h-[220px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<RechartsBarChart
								data={monthly.data}
								barCategoryGap="22%"
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
											| { labelLong: string; value: number }
											| undefined;
										if (!d) {
											return null;
										}
										return (
											<div className="rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg">
												<div className="font-medium">{d.labelLong}</div>
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
									{monthly.data.map((d) => (
										<Cell
											key={d.label}
											fill={
												d.value > 0
													? "var(--chart-current)"
													: "var(--chart-track)"
											}
										/>
									))}
								</Bar>
							</RechartsBarChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-2 text-xs text-muted-foreground">
						{monthly.monthsWithGiving > 0 ? (
							<>
								Gave in{" "}
								<span className="font-semibold text-foreground">
									{monthly.monthsWithGiving} of 12 months
								</span>
								{monthly.peakMonth && (
									<>
										{" "}
										· biggest{" "}
										<span className="font-semibold text-foreground">
											{formatCompact(monthly.peakAmount)}
										</span>{" "}
										in {monthly.peakMonth}
									</>
								)}
							</>
						) : (
							"No giving recorded in the last year."
						)}
					</div>
				</Card>

				<Card padding={24}>
					<SectionTitle
						title="Breakdown"
						action={
							<div className="w-[200px]">
								<SegmentedControl
									options={MIX_OPTIONS}
									value={mixMode}
									onChange={(v) => setMixMode(v as MixMode)}
								/>
							</div>
						}
					/>
					{mixSegments.length === 0 ? (
						<div className="grid h-[220px] place-items-center text-sm text-muted-foreground">
							No gifts to break down yet.
						</div>
					) : (
						<div className="grid items-center gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
							<div className="grid place-items-center">
								<div className="relative size-[180px]">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={mixSegments}
												dataKey="value"
												cx="50%"
												cy="50%"
												innerRadius={54}
												outerRadius={80}
												paddingAngle={1.5}
												stroke="none"
											>
												{mixSegments.map((s) => (
													<Cell key={s.label} fill={s.color} />
												))}
											</Pie>
											<Tooltip
												content={({ active, payload }) => {
													if (!active || !payload?.length) {
														return null;
													}
													const d = payload[0]?.payload as
														| ProgressSegment
														| undefined;
													if (!d) {
														return null;
													}
													const share =
														lifetime.total > 0
															? Math.round(
																	(num(d.value) / lifetime.total) * 100,
																)
															: 0;
													return (
														<div className="rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg">
															<div className="flex items-center gap-1.5 font-medium">
																<span
																	className="inline-block size-2 rounded-sm"
																	style={{ background: d.color }}
																/>
																{d.label}
															</div>
															<div className="mt-0.5 tabular-nums">
																{d.displayValue ??
																	formatCurrency(d.value, { decimals: 0 })}
																<span className="ml-2 opacity-70">
																	{share}%
																</span>
															</div>
														</div>
													);
												}}
											/>
										</PieChart>
									</ResponsiveContainer>
									<div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
										<div>
											<div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
												Lifetime
											</div>
											<div className="mt-0.5 text-base font-bold tabular-nums text-foreground">
												{formatCompact(lifetime.total)}
											</div>
										</div>
									</div>
								</div>
							</div>
							<ul className="divide-y divide-border">
								{mixSegments.map((s) => {
									const value = num(s.value);
									const share =
										lifetime.total > 0
											? Math.round((value / lifetime.total) * 100)
											: 0;
									return (
										<li
											key={s.label}
											className="grid grid-cols-[12px_minmax(0,1fr)_auto_44px] items-center gap-2.5 py-1.5 text-sm"
										>
											<span
												className="size-2.5 shrink-0 rounded-sm"
												style={{ background: s.color }}
											/>
											<span className="truncate text-foreground">
												{s.label}
											</span>
											<span className="tabular-nums text-muted-foreground">
												{s.displayValue ??
													formatCurrency(value, { decimals: 0 })}
											</span>
											<span className="text-right text-xs font-semibold tabular-nums text-foreground">
												{share}%
											</span>
										</li>
									);
								})}
							</ul>
						</div>
					)}
				</Card>
			</div>

			{/* Recent gifts */}
			<Card padding={24}>
				<SectionTitle
					title="Recent gifts"
					action={
						transactions.length > 8 ? (
							<span className="text-xs text-muted-foreground">
								Showing 8 of {transactions.length}. Open the Transactions tab to
								see all.
							</span>
						) : null
					}
				/>
				{txQ.isLoading ? (
					<div className="py-6 text-center text-sm text-muted-foreground">
						Loading…
					</div>
				) : recent.length === 0 ? (
					<div className="py-6 text-center text-sm text-muted-foreground">
						No gifts recorded yet.
					</div>
				) : (
					<ul className="divide-y divide-border">
						{recent.map((t) => {
							const campaignId = nstr(t.campaignId);
							const campaign = campaignId
								? campaignsById[campaignId]
								: undefined;
							return (
								<li key={t.id}>
									<Pressable
										onClick={() =>
											router.push(`/${tenantSlug}/admin/transactions/${t.id}`)
										}
										className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted/60"
									>
										<div className="min-w-0">
											<div className="flex items-baseline gap-2">
												<TypeBadge type={TX_BADGE_LABEL[t.type]} />
												<span className="text-xs text-muted-foreground">
													{relativeDate(t.date)}
												</span>
											</div>
											<div className="mt-0.5 text-xs text-muted-foreground">
												{campaign ? (
													<Link
														href={`/${tenantSlug}/admin/campaigns/${campaign.id}`}
														onClick={(e) => e.stopPropagation()}
														className="truncate hover:underline"
													>
														{campaign.title}
													</Link>
												) : (
													<span className="italic">No campaign</span>
												)}
											</div>
										</div>
										<Amount value={t.amount} />
									</Pressable>
								</li>
							);
						})}
					</ul>
				)}
			</Card>

			{/* Contact card — reference data, kept low */}
			{(email || phone || address) && (
				<Card padding={24}>
					<SectionTitle title="Contact" />
					<dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
						<ContactField label="Email" value={email} />
						<ContactField label="Phone" value={phone} />
						<ContactField label="Address" value={address} colspan />
					</dl>
				</Card>
			)}
		</div>
	);
};

const ContactField = ({
	label,
	value,
	colspan,
}: {
	label: string;
	value: string | null | undefined;
	colspan?: boolean;
}) => {
	return (
		<div className={colspan ? "col-span-2" : undefined}>
			<dt className="mb-0.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
				{label}
			</dt>
			<dd
				className={value ? "text-foreground" : "italic text-muted-foreground"}
			>
				{value ?? "—"}
			</dd>
		</div>
	);
};
