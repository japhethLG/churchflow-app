"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Button,
	DataTableShell,
	DateRangePicker,
	type DateRangeValue,
	PageHeader,
	type StateFilterValue,
	toStateFilterFlags,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { useTransactionSummary, useTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import { openModal } from "@/lib/modals/store";
import { TransactionsSummaryCard } from "./TransactionsSummaryCard";
import { type TransactionRow, transactionColumns } from "./TransactionsTable";

type Member = components["schemas"]["MemberResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

type TransactionType = TransactionRow["type"];
type TypeFilter = "all" | TransactionType;

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

// Default range: current month. Members can clear to "all time".
const DEFAULT_RANGE: DateRangeValue = {
	from: dayjs().utc().startOf("month").format("YYYY-MM-DD"),
	to: dayjs().utc().endOf("month").format("YYYY-MM-DD"),
};

// Backend takes ISO UTC instants. We expand the inclusive `YYYY-MM-DD`
// range to [start-of-day from, end-of-day to] so the boundary days
// fully fall inside.
const toWireRange = (
	range: DateRangeValue,
): { dateFrom?: string; dateTo?: string } => ({
	dateFrom: range.from
		? dayjs.utc(range.from).startOf("day").toISOString()
		: undefined,
	dateTo: range.to ? dayjs.utc(range.to).endOf("day").toISOString() : undefined,
});

export const TransactionsListPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const [search, setSearch] = useState("");
	const [type, setType] = useState<TypeFilter>("all");
	const [range, setRange] = useState<DateRangeValue>(DEFAULT_RANGE);
	const [campaignId, setCampaignId] = useState<string>("all");
	const [state, setState] = useState<StateFilterValue>("active");
	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(20);

	// Lookup tables include tombstones for Mode-B rendering.
	const { data: campaignsData } = useCampaigns(tenantSlug, {
		includeDeleted: true,
	});
	const { data: membersData } = useMembers(tenantSlug, {
		limit: 200,
		includeDeleted: true,
	});

	const campaigns: Campaign[] = campaignsData?.items ?? [];
	const members: Member[] = membersData?.items ?? [];
	const campaignsById: Record<string, Campaign> = Object.fromEntries(
		campaigns.map((c) => [c.id, c]),
	);
	const membersById: Record<string, Member> = Object.fromEntries(
		members.map((m) => [m.id, m]),
	);

	const dateRange = toWireRange(range);
	const summary = useTransactionSummary(tenantSlug, {
		dateFrom: dateRange.dateFrom,
		dateTo: dateRange.dateTo,
	});

	const list = useTransactions(tenantSlug, {
		type: type === "all" ? undefined : type,
		campaignId: campaignId === "all" ? undefined : campaignId,
		dateFrom: dateRange.dateFrom,
		dateTo: dateRange.dateTo,
		offset,
		limit,
		...toStateFilterFlags(state),
	});

	const allItems: TransactionRow[] = list.data?.items ?? [];
	const total = list.data?.meta.total ?? 0;
	const sum = list.data?.meta.sum ?? 0;

	// Search note + reference number client-side over the current page —
	// the BE doesn't index either field.
	const visible = useMemo<TransactionRow[]>(() => {
		const q = search.trim().toLowerCase();
		if (!q) {
			return allItems;
		}
		return allItems.filter((t) =>
			`${nstr(t.note) ?? ""} ${nstr(t.referenceNumber) ?? ""}`
				.toLowerCase()
				.includes(q),
		);
	}, [allItems, search]);

	const openRecord = () => openModal("record-gift", { tenantSlug });
	const openView = (t: TransactionRow) =>
		router.push(`/${tenantSlug}/admin/transactions/${t.id}`);
	const openDelete = (t: TransactionRow) =>
		openModal("confirm-delete-transaction", {
			tenantSlug,
			transactionId: t.id,
			amountLabel: formatCurrency(t.amount),
		});
	const openRestore = (t: TransactionRow) =>
		openModal("confirm-restore-transaction", {
			tenantId: tenantSlug,
			transactionId: t.id,
			summary: `${formatCurrency(t.amount)} on ${dayjs(t.date).format("MMM D, YYYY")}`,
		});

	const columns = transactionColumns({
		handlers: {
			onView: openView,
			onEdit: openView, // detail page hosts the edit affordance
			onDelete: openDelete,
			onRestore: openRestore,
		},
		membersById,
		campaignsById,
	});

	const resetOffset = () => setOffset(0);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Ledger"
				title="Transactions"
				subtitle="Every gift recorded at this church."
				action={
					<>
						<Button variant="secondary" icon="download" disabled>
							Export
						</Button>
						<Button variant="primary" icon="plus" onClick={openRecord}>
							Record gift
						</Button>
					</>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8 space-y-4">
				<TransactionsSummaryCard
					summary={summary.data}
					loading={summary.isLoading}
				/>

				<DataTableShell<TransactionRow>
					search={{
						value: search,
						onChange: (v) => {
							setSearch(v);
							resetOffset();
						},
						placeholder: "Search note or reference #…",
					}}
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
						{
							key: "campaign",
							label: "Campaign",
							value: campaignId,
							onChange: (v) => {
								setCampaignId(v);
								resetOffset();
							},
							options: [
								{ value: "all", label: "All campaigns" },
								...campaigns.map((c) => ({ value: c.id, label: c.title })),
							],
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
						setType("all");
						setRange({});
						setCampaignId("all");
						resetOffset();
					}}
					state={{
						value: state,
						onChange: (v) => {
							setState(v);
							resetOffset();
						},
					}}
					stats={[
						{ label: "gifts", value: total },
						{ label: "total", value: formatCurrency(sum), tone: "success" },
					]}
					columns={columns}
					rows={visible}
					rowKey={(t) => t.id}
					loading={list.isLoading}
					onRowClick={openView}
					rowClassName={(t) => (t.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No gifts recorded yet"
					emptySubtitle="Record the first gift to start the giving history."
					emptyAction={
						<Button variant="primary" icon="plus" onClick={openRecord}>
							Record gift
						</Button>
					}
					pagination={{
						total,
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
