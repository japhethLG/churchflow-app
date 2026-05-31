"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
	Button,
	DataTableShell,
	type DateRangeValue,
	PageHeader,
	useTableFilters,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useTransactionSummary, useTransactions } from "@/lib/api/transactions";
import { TRANSACTION_TYPE_FILTER_OPTIONS } from "@/lib/constants/transaction";
import dayjs, { dateRangeToWire, formatUtcDate } from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { openModal } from "@/lib/modals/store";
import { openSheet } from "@/lib/sheets/store";
import { TransactionsSummaryCard } from "./TransactionsSummaryCard";
import {
	type TransactionRow,
	transactionColumns,
	transactionMobileCard,
} from "./TransactionsTable";

type Campaign = components["schemas"]["CampaignResponseDto"];

type TransactionType = TransactionRow["type"];
type TypeFilter = "all" | TransactionType;

const DEFAULT_RANGE: DateRangeValue = {
	from: dayjs().utc().startOf("month").format("YYYY-MM-DD"),
	to: dayjs().utc().endOf("month").format("YYYY-MM-DD"),
};

export const TransactionsListPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const t = useTableFilters({
		type: "all",
		campaignId: "all",
		state: "active",
		search: "",
		dateFrom: DEFAULT_RANGE.from ?? "",
		dateTo: DEFAULT_RANGE.to ?? "",
	});
	const type = t.values.type as TypeFilter;
	const campaignId = t.values.campaignId;
	const search = t.values.search;
	const range: DateRangeValue = {
		from: t.values.dateFrom || undefined,
		to: t.values.dateTo || undefined,
	};

	// Campaigns drive the filter dropdown — no longer used as a lookup map
	// for row labels (each transaction now carries an embedded campaign).
	const { data: campaignsData } = useCampaigns(tenantSlug, {
		includeDeleted: true,
	});
	const campaigns: Campaign[] = campaignsData?.items ?? [];

	const wireRange = dateRangeToWire(range);
	const filters = {
		type: type === "all" ? undefined : type,
		campaignId: campaignId === "all" ? undefined : campaignId,
		dateFrom: wireRange.dateFrom,
		dateTo: wireRange.dateTo,
		...t.stateFlags(),
	};

	// Summary and list now receive the same filter object so the KPI card
	// never drifts from the table.
	const summary = useTransactionSummary(tenantSlug, filters);
	const list = useTransactions(tenantSlug, {
		...filters,
		offset: t.offset,
		limit: t.limit,
	});

	const allItems: TransactionRow[] = list.data?.items ?? [];
	const total = list.data?.meta.total ?? 0;
	const pageSum = list.data?.meta.sum ?? 0;

	const visible = useMemo<TransactionRow[]>(() => {
		const q = search.trim().toLowerCase();
		if (!q) {
			return allItems;
		}
		return allItems.filter((tx) =>
			`${nstr(tx.note) ?? ""} ${nstr(tx.referenceNumber) ?? ""}`
				.toLowerCase()
				.includes(q),
		);
	}, [allItems, search]);

	const openRecord = () => openModal("record-gift", { tenantSlug });

	// Mobile: record a gift via the bottom-sheet flow (the desktop button uses
	// the modal). Replaces the old global record-gift FAB now that the bottom
	// nav carries a Transactions tab instead.
	useMobileActions(
		useMemo(
			() => [
				{
					label: "Record gift",
					icon: "plus" as const,
					onClick: () => openSheet("record-gift", { tenantSlug }),
				},
			],
			[tenantSlug],
		),
	);

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
			summary: `${formatCurrency(t.amount)} on ${formatUtcDate(t.date, "MMM D, YYYY")}`,
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

	const renderTransactionCard = transactionMobileCard(tenantSlug);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="Ledger"
				title="Transactions"
				subtitle="Every gift recorded at this church."
				action={
					<>
						<Button
							role="secondary"
							icon="download"
							disabled
							className="hidden md:inline-flex"
						>
							Export
						</Button>
						<Button
							role="primary"
							icon="plus"
							onClick={openRecord}
							className="hidden md:inline-flex"
						>
							Record gift
						</Button>
					</>
				}
			/>

			<div className="overflow-auto flex-1 px-4 pb-36 space-y-4 md:px-8 md:pb-8">
				<TransactionsSummaryCard
					summary={summary.data}
					loading={summary.isLoading}
				/>

				<DataTableShell<TransactionRow>
					search={t.search("Search note or reference…")}
					filters={[
						t.select("type", "Type", TRANSACTION_TYPE_FILTER_OPTIONS),
						t.select("campaignId", "Campaign", campaignFilterOptions),
						t.state(),
						t.date("Period"),
					]}
					onClearFilters={t.clear}
					stats={[
						{ label: "in view", value: total },
						{
							label: "page sum",
							value: formatCurrency(pageSum, { decimals: 0 }),
						},
					]}
					columns={columns}
					mobileCard={renderTransactionCard}
					rows={visible}
					rowKey={(tx) => tx.id}
					loading={list.isLoading}
					onRowClick={openView}
					rowClassName={(tx) => (tx.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No transactions in range"
					emptySubtitle="Widen the date range or record a gift to get started."
					emptyAction={
						<Button role="primary" icon="plus" onClick={openRecord}>
							Record gift
						</Button>
					}
					pagination={t.pagination(total)}
				/>
			</div>
		</div>
	);
};
