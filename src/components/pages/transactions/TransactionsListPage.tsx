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
import { useTransactionSummary, useTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import { openModal } from "@/lib/modals/store";
import { TransactionsSummaryCard } from "./TransactionsSummaryCard";
import { type TransactionRow, transactionColumns } from "./TransactionsTable";

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

const DEFAULT_RANGE: DateRangeValue = {
	from: dayjs().utc().startOf("month").format("YYYY-MM-DD"),
	to: dayjs().utc().endOf("month").format("YYYY-MM-DD"),
};

const toWireRange = (range: DateRangeValue) => ({
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

	// Campaigns drive the filter dropdown — no longer used as a lookup map
	// for row labels (each transaction now carries an embedded campaign).
	const { data: campaignsData } = useCampaigns(tenantSlug, {
		includeDeleted: true,
	});
	const campaigns: Campaign[] = campaignsData?.items ?? [];

	const wireRange = toWireRange(range);
	const stateFlags = toStateFilterFlags(state);
	const filters = {
		type: type === "all" ? undefined : type,
		campaignId: campaignId === "all" ? undefined : campaignId,
		dateFrom: wireRange.dateFrom,
		dateTo: wireRange.dateTo,
		...stateFlags,
	};

	// Summary and list now receive the same filter object so the KPI card
	// never drifts from the table.
	const summary = useTransactionSummary(tenantSlug, filters);
	const list = useTransactions(tenantSlug, {
		...filters,
		offset,
		limit,
	});

	const allItems: TransactionRow[] = list.data?.items ?? [];
	const total = list.data?.meta.total ?? 0;
	const pageSum = list.data?.meta.sum ?? 0;

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
			onEdit: openView,
			onDelete: openDelete,
			onRestore: openRestore,
		},
		tenantSlug,
	});

	const campaignFilterOptions = [
		{ value: "all", label: "All campaigns" },
		...campaigns
			.filter((c) => c.status !== "CANCELLED")
			.map((c) => ({ value: c.id, label: c.title })),
	];

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Ledger"
				title="Transactions"
				subtitle="Every gift recorded at this church."
				action={
					<>
						<Button role="secondary" icon="download" disabled>
							Export
						</Button>
						<Button role="primary" icon="plus" onClick={openRecord}>
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
							setOffset(0);
						},
						placeholder: "Search note or reference…",
					}}
					filters={[
						{
							key: "type",
							label: "Type",
							value: type,
							onChange: (v) => {
								setType(v as TypeFilter);
								setOffset(0);
							},
							options: TYPE_OPTIONS,
						},
						{
							key: "campaignId",
							label: "Campaign",
							value: campaignId,
							onChange: (v) => {
								setCampaignId(v);
								setOffset(0);
							},
							options: campaignFilterOptions,
						},
					]}
					onClearFilters={() => {
						setType("all");
						setCampaignId("all");
						setRange(DEFAULT_RANGE);
					}}
					state={{
						value: state,
						onChange: (v) => {
							setState(v);
							setOffset(0);
						},
					}}
					toolbar={
						<DateRangePicker
							value={range}
							onChange={(v) => {
								setRange(v);
								setOffset(0);
							}}
							placeholder="Date range"
							size="sm"
							autoWidth
							clearable
						/>
					}
					stats={[
						{ label: "in view", value: total },
						{
							label: "page sum",
							value: formatCurrency(pageSum, { decimals: 0 }),
						},
					]}
					columns={columns}
					rows={visible}
					rowKey={(t) => t.id}
					loading={list.isLoading}
					onRowClick={openView}
					rowClassName={(t) => (t.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No transactions in range"
					emptySubtitle="Widen the date range or record a gift to get started."
					emptyAction={
						<Button role="primary" icon="plus" onClick={openRecord}>
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
