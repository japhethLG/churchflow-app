"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Amount,
	type DataTableColumn,
	DataTableShell,
	DateRangePicker,
	type DateRangeValue,
	DeletedLabel,
	PageHeader,
} from "@/components/primitives";
import { type TransactionType, TypeBadge } from "@/components/primitives/Badge";
import type { components } from "@/lib/api";
import { useMyCampaigns } from "@/lib/api/campaigns";
import { nstr } from "@/lib/api/coerce";
import { useMyProfile } from "@/lib/api/members";
import { useMyTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";

type Transaction = components["schemas"]["TransactionResponseDto"];

const TYPE_MAP: Record<string, TransactionType> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

type TypeFilter = "all" | Transaction["type"];

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

	const [type, setType] = useState<TypeFilter>("all");
	const [range, setRange] = useState<DateRangeValue>(DEFAULT_RANGE);
	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(20);

	// Current member (kept around for any downstream side effects)
	useMyProfile(tenantSlug);

	// Campaigns to resolve titles (member-visible). Include archived
	// campaigns so deleted references can render Mode-B (DeletedLabel)
	// instead of falling back to the em-dash placeholder.
	const campaignsQ = useMyCampaigns(tenantSlug, { includeDeleted: true });
	const campaigns = campaignsQ.data?.items ?? [];
	const campaignMap = useMemo(() => {
		return campaigns.reduce(
			(acc, c) => {
				acc[c.id] = c;
				return acc;
			},
			{} as Record<string, (typeof campaigns)[number]>,
		);
	}, [campaigns]);

	const dateFrom = range.from
		? dayjs.utc(range.from).startOf("day").toISOString()
		: undefined;
	const dateTo = range.to
		? dayjs.utc(range.to).endOf("day").toISOString()
		: undefined;

	const txQ = useMyTransactions(tenantSlug, {
		type: type === "all" ? undefined : type,
		dateFrom,
		dateTo,
		limit: 1000,
	});
	const transactions: Transaction[] = txQ.data?.items ?? [];

	const stats = useMemo(() => {
		const total = transactions.reduce((s, t) => s + Number(t.amount), 0);
		const count = transactions.length;
		const avg = count > 0 ? total / count : 0;
		return { total, count, avg };
	}, [transactions]);

	const visible = transactions.slice(offset, offset + limit);

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
			render: (t) => <TypeBadge type={TYPE_MAP[t.type] || "Other"} />,
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
			key: "ref",
			label: "Reference #",
			width: "140px",
			render: (t) => {
				const n = nstr(t.note);
				return (
					<span className="font-mono text-xs text-muted-foreground">
						{n ? n.slice(0, 10) : "—"}
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

	const resetOffset = () => setOffset(0);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="My Giving"
				title="Your giving history."
				subtitle={`Everything ${tenantSlug} has recorded for you — private, and always yours.`}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<DataTableShell<Transaction>
					filters={[
						{
							key: "type",
							label: "Type",
							value: type,
							onChange: (v) => {
								setType(v as TypeFilter);
								resetOffset();
							},
							options: TYPE_OPTIONS,
						},
					]}
					toolbar={
						<DateRangePicker
							value={range}
							onChange={(v) => {
								setRange(v);
								resetOffset();
							}}
							placeholder="Date range"
							size="sm"
							autoWidth
							clearable
						/>
					}
					onClearFilters={() => {
						setRange({});
						setType("all");
						resetOffset();
					}}
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
					rowKey={(t) => t.id}
					loading={txQ.isLoading}
					emptyTitle="No transactions found"
					emptySubtitle="Try adjusting your filters or date range."
					pagination={{
						total: transactions.length,
						offset,
						limit,
						onOffsetChange: setOffset,
						onLimitChange: setLimit,
					}}
				/>
			</div>
		</div>
	);
};
