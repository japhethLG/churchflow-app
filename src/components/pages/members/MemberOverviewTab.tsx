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
	type DataTableColumn,
	DataTableShell,
	DeletedLabel,
	type ProgressSegment,
	SectionTitle,
	SegmentedControl,
	StatBand,
	StatusBadge,
	TypeBadge,
} from "@/components/primitives";
import type { TransactionType as BadgeType } from "@/components/primitives/Badge";
import { type components, nstr } from "@/lib/api";
import { useMemberSummary } from "@/lib/api/members";
import { useTransactionSummary, useTransactions } from "@/lib/api/transactions";
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

	// Aggregate stats — replaces the previous 500-row fetch + JS reduce,
	// which silently truncated for members with long lifetime histories.
	const summaryQ = useMemberSummary(tenantSlug, member.id);

	// 12-month chart data + by-type breakdown — server-side groupBy.
	const last12From = dayjs()
		.utc()
		.startOf("month")
		.subtract(11, "month")
		.toISOString();
	const last12To = dayjs().utc().endOf("month").toISOString();
	const last12Q = useTransactionSummary(tenantSlug, {
		memberId: member.id,
		dateFrom: last12From,
		dateTo: last12To,
	});

	// Recent gifts strip — only the 8 most-recent rows. The by-campaign
	// breakdown comes from the server-side summary (uncapped), so we no
	// longer need to fan out a wide list query.
	const txListQ = useTransactions(tenantSlug, {
		memberId: member.id,
		limit: 8,
	});
	const transactions: Transaction[] = txListQ.data?.items ?? [];

	const summary = summaryQ.data;
	const lifetimeTotal = summary?.lifetimeGiving ?? 0;
	const lifetimeCount = summary?.transactionCount ?? 0;
	const lifetimeAvg = summary?.avgGift ?? 0;
	const firstISO = summary?.firstGiftDate ?? null;
	const lastISO = summary?.lastGiftDate ?? null;
	const activePledgesCount = summary?.activePledgesCount ?? 0;
	const fulfilledPledgesCount = summary?.fulfilledPledgesCount ?? 0;

	// By-type from the last-12-months summary. For a "lifetime breakdown"
	// we'd want a no-date summary, but the 12-month window matches the
	// chart users are looking at and is more actionable than all-time.
	const byTypeMap = useMemo<Partial<Record<TxType, number>>>(() => {
		const out: Partial<Record<TxType, number>> = {};
		for (const b of last12Q.data?.byType ?? []) {
			out[b.type] = b.total;
		}
		return out;
	}, [last12Q.data]);

	// By-campaign breakdown comes straight from the server-side summary —
	// 12-month window matches the donut/chart above and is uncapped,
	// unlike the previous "iterate over a 2000-row list" approach.
	const byCampaign = useMemo(() => {
		return (last12Q.data?.byCampaign ?? [])
			.filter((b) => num(b.total) > 0)
			.map((b) => ({
				amount: num(b.total),
				title: b.campaignTitle,
				deletedAt: b.campaignDeletedAt ?? null,
			}));
	}, [last12Q.data]);

	// 12-month chart series + consistency caption — values come from the
	// BE byMonth aggregation. Skeleton of 12 buckets so empty months show.
	const monthly = useMemo(() => {
		const start = dayjs().utc().startOf("month").subtract(11, "month");
		const skel = Array.from({ length: 12 }, (_, i) => {
			const d = start.add(i, "month");
			return {
				key: d.format("YYYY-MM"),
				label: d.format("MMM"),
				labelLong: d.format("MMM YYYY"),
				value: 0,
			};
		});
		const byKey = new Map(skel.map((s) => [s.key, s] as const));
		for (const b of last12Q.data?.byMonth ?? []) {
			const slot = byKey.get(b.month);
			if (slot) {
				slot.value = b.total;
			}
		}
		const monthsWithGiving = skel.filter((d) => d.value > 0).length;
		const peakAmount = skel.reduce((m, d) => Math.max(m, d.value), 0);
		const peakIdx = skel.findIndex((d) => d.value === peakAmount);
		const peakMonth =
			peakAmount > 0 && peakIdx >= 0 ? skel[peakIdx]?.labelLong : null;
		return { data: skel, monthsWithGiving, peakAmount, peakMonth };
	}, [last12Q.data]);

	const mixSegments = useMemo<ProgressSegment[]>(() => {
		if (mixMode === "type") {
			return Object.entries(byTypeMap)
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
			byCampaign.map((c, i) => ({
				value: c.amount,
				color: pickCategorical(i),
				label: c.title,
				displayValue: formatCurrency(c.amount, { decimals: 0 }),
			})),
			0.02,
			(dropped) => ({
				value: dropped,
				color: "var(--chart-prior)",
				label: "Other",
				displayValue: formatCurrency(dropped, { decimals: 0 }),
			}),
		);
	}, [mixMode, byTypeMap, byCampaign]);

	const breakdownTotal = mixSegments.reduce((s, x) => s + num(x.value), 0);

	const recent = transactions.slice(0, 8);

	const recentGiftColumns: DataTableColumn<Transaction>[] = [
		{
			key: "date",
			label: "Date",
			width: "140px",
			render: (t) => (
				<span className="text-sm text-muted-foreground">
					{relativeDate(t.date)}
				</span>
			),
		},
		{
			key: "type",
			label: "Type",
			width: "130px",
			render: (t) => <TypeBadge type={TX_BADGE_LABEL[t.type]} />,
		},
		{
			key: "campaign",
			label: "Campaign",
			render: (t) => {
				const c = t.campaign;
				if (!c) {
					return (
						<span className="text-sm italic text-muted-foreground">
							No campaign
						</span>
					);
				}
				if (c.deletedAt) {
					return (
						<DeletedLabel
							deletedAt={c.deletedAt}
							className="block truncate text-sm"
						>
							{c.title}
						</DeletedLabel>
					);
				}
				return (
					<Link
						href={`/${tenantSlug}/admin/campaigns/${c.id}`}
						onClick={(e) => e.stopPropagation()}
						className="block truncate text-sm text-primary hover:underline"
					>
						{c.title}
					</Link>
				);
			},
		},
		{
			key: "amount",
			label: "Amount",
			width: "120px",
			align: "right",
			render: (t) => <Amount value={t.amount} />,
		},
	];

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
							value: formatCompact(lifetimeTotal),
							caption: summaryQ.isLoading ? "Loading…" : "All-time given",
						},
						{
							label: "Gifts",
							value: lifetimeCount.toLocaleString(),
							caption: `Avg ${formatCompact(lifetimeAvg)}`,
						},
						{
							label: "First gift",
							value: firstISO ? dayjs(firstISO).format("MMM YYYY") : "—",
							caption: firstISO
								? `${dayjs().diff(dayjs(firstISO), "month")} months ago`
								: "No gifts yet",
						},
						{
							label: "Last gift",
							value: lastISO ? dayjs(lastISO).format("MMM D") : "—",
							caption: lastISO ? relativeDate(lastISO) : "—",
						},
						{
							label: "Pledges",
							value: activePledgesCount.toLocaleString(),
							caption: `${fulfilledPledgesCount} fulfilled`,
						},
					]}
				/>
			</Card>

			{/* Last 12 months + Breakdown */}
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
											key={d.key}
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
						title="Breakdown (last 12 months)"
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
														breakdownTotal > 0
															? Math.round(
																	(num(d.value) / breakdownTotal) * 100,
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
												Total
											</div>
											<div className="mt-0.5 text-base font-bold tabular-nums text-foreground">
												{formatCompact(breakdownTotal)}
											</div>
										</div>
									</div>
								</div>
							</div>
							<ul className="divide-y divide-border">
								{mixSegments.map((s) => {
									const value = num(s.value);
									const share =
										breakdownTotal > 0
											? Math.round((value / breakdownTotal) * 100)
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
			<div>
				<div className="mb-3 flex items-baseline justify-between px-1">
					<h2 className="text-base font-semibold">Recent gifts</h2>
					{lifetimeCount > 8 && (
						<span className="text-xs text-muted-foreground">
							Showing 8 of {lifetimeCount}. Open the Transactions tab to see
							all.
						</span>
					)}
				</div>
				<DataTableShell<Transaction>
					columns={recentGiftColumns}
					rows={recent}
					rowKey={(t) => t.id}
					loading={txListQ.isLoading}
					loadingRows={5}
					onRowClick={(t) =>
						router.push(`/${tenantSlug}/admin/transactions/${t.id}`)
					}
					rowClassName={(t) => (t.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No gifts recorded yet"
				/>
			</div>

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
