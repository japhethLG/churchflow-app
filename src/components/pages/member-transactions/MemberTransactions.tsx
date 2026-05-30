"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
	Amount,
	type DataTableColumn,
	DataTableShell,
	type DateRangeValue,
	DeletedLabel,
	ExpandableCard,
	PageHeader,
	useTableFilters,
} from "@/components/primitives";
import { type TransactionType, TypeBadge } from "@/components/primitives/Badge";
import type { components } from "@/lib/api";
import { useMyCampaigns } from "@/lib/api/campaigns";
import { nstr } from "@/lib/api/coerce";
import { useMyTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import { num, pct, type TxType, TYPE_COLOR, TYPE_LABEL } from "../admin-shared";
import { TransactionMixCard } from "../TransactionMixCard";

type Transaction = components["schemas"]["TransactionResponseDto"];

const TYPE_BADGE: Record<TxType, TransactionType> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

type TypeFilter = "all" | TxType;

const TYPE_OPTIONS = [
	{ value: "all", label: "All types" },
	{ value: "TITHE", label: "Tithe" },
	{ value: "OFFERING", label: "Offering" },
	{ value: "MISSION_GIVING", label: "Mission" },
	{ value: "FIRST_FRUIT", label: "First fruit" },
	{ value: "COMMITMENT", label: "Commitment" },
	{ value: "DONATION", label: "Donation" },
	{ value: "OTHER", label: "Other" },
];

// Default to year-to-date so the page lands on the most useful slice for
// a member reviewing their giving history.
const DEFAULT_RANGE: DateRangeValue = {
	from: dayjs().utc().startOf("year").format("YYYY-MM-DD"),
	to: dayjs().utc().endOf("day").format("YYYY-MM-DD"),
};

export const MemberTransactions = ({
	campaignItemMap = {},
}: {
	campaignItemMap?: Record<string, string>;
}) => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const t = useTableFilters({
		type: "all",
		campaign: "all",
		dateFrom: DEFAULT_RANGE.from ?? "",
		dateTo: DEFAULT_RANGE.to ?? "",
	});
	const type = t.values.type as TypeFilter;
	const campaignId = t.values.campaign;
	const range: DateRangeValue = {
		from: t.values.dateFrom || undefined,
		to: t.values.dateTo || undefined,
	};

	// Campaigns to resolve titles + drive the filter dropdown. Include
	// archived so deleted references can render Mode-B (DeletedLabel).
	const campaignsQ = useMyCampaigns(tenantSlug, { includeDeleted: true });
	const campaigns = campaignsQ.data?.items ?? [];
	const campaignMap = useMemo(
		() => Object.fromEntries(campaigns.map((c) => [c.id, c])),
		[campaigns],
	);

	const dateFrom = range.from
		? dayjs.utc(range.from).startOf("day").toISOString()
		: undefined;
	const dateTo = range.to
		? dayjs.utc(range.to).endOf("day").toISOString()
		: undefined;

	// Filtered query — table + mix bar both consume this. The 12-month
	// sparkline below uses a separate query (stable trailing window).
	const txQ = useMyTransactions(tenantSlug, {
		type: type === "all" ? undefined : type,
		campaignId: campaignId === "all" ? undefined : campaignId,
		dateFrom,
		dateTo,
		limit: 1000,
	});
	const transactions: Transaction[] = txQ.data?.items ?? [];

	const stats = useMemo(() => {
		const total = transactions.reduce((s, t) => s + num(t.amount), 0);
		const count = transactions.length;
		const avg = count > 0 ? total / count : 0;
		return { total, count, avg };
	}, [transactions]);

	// Mix breakdown of the filtered transactions, by type. Shape matches
	// the shared TransactionMixCard (same donut + table used on the admin
	// reports page and the member insights page).
	const mixSegments = useMemo(() => {
		const byType = new Map<TxType, { amount: number; count: number }>();
		let total = 0;
		for (const t of transactions) {
			const cur = byType.get(t.type) ?? { amount: 0, count: 0 };
			const amount = num(t.amount);
			cur.amount += amount;
			cur.count += 1;
			byType.set(t.type, cur);
			total += amount;
		}
		return Array.from(byType.entries())
			.filter(([, v]) => v.amount > 0)
			.sort((a, b) => b[1].amount - a[1].amount)
			.map(([k, v]) => ({
				key: k,
				label: TYPE_LABEL[k],
				color: TYPE_COLOR[k],
				amount: v.amount,
				count: v.count,
				share: pct(v.amount, total),
				avg: v.count > 0 ? v.amount / v.count : 0,
			}));
	}, [transactions]);

	const visible = transactions.slice(t.offset, t.offset + t.limit);

	const columns: DataTableColumn<Transaction>[] = [
		{
			key: "date",
			label: "Date",
			width: "120px",
			render: (t) => (
				<span className="text-muted-foreground">
					{dayjs(t.date).format("MMM D, YYYY")}
				</span>
			),
		},
		{
			key: "type",
			label: "Type",
			width: "140px",
			render: (t) => <TypeBadge type={TYPE_BADGE[t.type] || "Other"} />,
		},
		{
			key: "campaign",
			label: "Campaign",
			render: (t) => {
				const cid = nstr(t.campaignId);
				const campaign = cid ? campaignMap[cid] : null;
				const title = campaign?.title ?? null;
				const deletedAt = campaign?.deletedAt ?? null;
				const itemId = nstr(t.campaignItemId);
				const itemTitle = itemId ? campaignItemMap[itemId] : null;
				return (
					<span className={title ? "text-foreground" : "text-muted-foreground"}>
						{title ? (
							deletedAt ? (
								<DeletedLabel deletedAt={deletedAt}>{title}</DeletedLabel>
							) : (
								title
							)
						) : (
							"—"
						)}
						{itemTitle && (
							<span className="ml-1 text-muted-foreground">[{itemTitle}]</span>
						)}
					</span>
				);
			},
		},
		{
			key: "reference",
			label: "Reference #",
			width: "140px",
			render: (t) => {
				const ref = nstr(t.referenceNumber);
				return (
					<span className="font-mono text-xs text-muted-foreground">
						{ref ?? "—"}
					</span>
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

	const hasMix = mixSegments.length > 0;

	// Sub-`md` row → expandable card. Collapsed: campaign + date + type +
	// amount. Expanded: reference #, full date, item.
	const renderTransactionCard = (tx: Transaction) => {
		const cid = nstr(tx.campaignId);
		const campaign = cid ? campaignMap[cid] : null;
		const title = campaign?.title ?? null;
		const deletedAt = campaign?.deletedAt ?? null;
		const itemId = nstr(tx.campaignItemId);
		const itemTitle = itemId ? campaignItemMap[itemId] : null;
		const ref = nstr(tx.referenceNumber);
		return (
			<ExpandableCard
				details={[
					{
						label: "Reference #",
						value: ref ? (
							<span className="font-mono text-xs font-medium text-foreground">
								{ref}
							</span>
						) : (
							<span className="text-sm text-muted-foreground">—</span>
						),
					},
					{
						label: "Date",
						value: (
							<span className="text-sm font-medium text-foreground">
								{dayjs(tx.date).format("MMM D, YYYY")}
							</span>
						),
					},
					...(itemTitle
						? [
								{
									label: "Item",
									value: (
										<span className="text-sm font-medium text-foreground">
											{itemTitle}
										</span>
									),
								},
							]
						: []),
				]}
			>
				<div className="flex items-center gap-3">
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold tracking-tight">
							{title ? (
								deletedAt ? (
									<DeletedLabel deletedAt={deletedAt}>{title}</DeletedLabel>
								) : (
									title
								)
							) : (
								<span className="text-muted-foreground">No campaign</span>
							)}
						</div>
						<div className="truncate text-xs text-muted-foreground">
							{dayjs(tx.date).format("MMM D, YYYY")}
						</div>
					</div>
					<div className="flex shrink-0 flex-col items-end gap-1">
						<Amount value={tx.amount} />
						<TypeBadge type={TYPE_BADGE[tx.type] || "Other"} />
					</div>
				</div>
			</ExpandableCard>
		);
	};

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="My Giving"
				title="Your giving history"
				subtitle={`Everything your church has recorded for you — private, and always yours.`}
			/>

			<div className="overflow-auto flex-1 px-4 pb-28 space-y-4 md:px-8 md:pb-8">
				{hasMix && (
					<TransactionMixCard
						segments={mixSegments}
						total={stats.total}
						count={stats.count}
						title="Where your giving went"
						subtitle="Mix of your giving by transaction type in the current view."
						emptyMessage="No transactions in the selected range."
					/>
				)}

				<DataTableShell<Transaction>
					filters={[
						t.select("type", "Type", TYPE_OPTIONS),
						t.select("campaign", "Campaign", [
							{ value: "all", label: "All campaigns" },
							...campaigns.map((c) => ({ value: c.id, label: c.title })),
						]),
						t.date("Date range"),
					]}
					onClearFilters={t.clear}
					mobileCard={renderTransactionCard}
					stats={[
						{ label: "gifts", value: stats.count },
						{
							label: "total",
							value: formatCurrency(stats.total),
							tone: "success",
						},
						{ label: "average", value: formatCurrency(stats.avg) },
					]}
					columns={columns}
					rows={visible}
					rowKey={(tx) => tx.id}
					loading={txQ.isLoading}
					emptyTitle="No transactions found"
					emptySubtitle="Try adjusting your filters or date range."
					pagination={t.pagination(transactions.length)}
				/>
			</div>
		</div>
	);
};
