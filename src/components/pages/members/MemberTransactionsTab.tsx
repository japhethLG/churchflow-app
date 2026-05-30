"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
	DataTableShell,
	type DateRangeValue,
	useTableFilters,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useTransactionSummary, useTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import { openModal } from "@/lib/modals/store";
import { num, pct, type TxType, TYPE_COLOR, TYPE_LABEL } from "../admin-shared";
import { TransactionMixCard } from "../TransactionMixCard";
import {
	type TransactionRow,
	transactionColumns,
	transactionMobileCard,
} from "../transactions/TransactionsTable";

type Member = components["schemas"]["MemberResponseDto"];

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

const toWireRange = (range: DateRangeValue) => ({
	dateFrom: range.from
		? dayjs.utc(range.from).startOf("day").toISOString()
		: undefined,
	dateTo: range.to ? dayjs.utc(range.to).endOf("day").toISOString() : undefined,
});

export const MemberTransactionsTab = ({ member }: { member: Member }) => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const t = useTableFilters({
		type: "all",
		campaignId: "all",
		state: "active",
		search: "",
		dateFrom: "",
		dateTo: "",
	});
	const type = t.values.type as TypeFilter;
	const campaignId = t.values.campaignId;
	const range: DateRangeValue = {
		from: t.values.dateFrom || undefined,
		to: t.values.dateTo || undefined,
	};

	// Campaigns drive the filter dropdown only; row labels come from the
	// embedded `campaign` on each TransactionResponseDto.
	const { data: campaignsData } = useCampaigns(tenantSlug, {
		includeDeleted: true,
	});
	const campaigns = campaignsData?.items ?? [];

	const wireRange = toWireRange(range);

	// Member-scoped summary powers the donut + table breakdown above the
	// transactions list. Tracks the date range AND the StateFilter (so the
	// summary card and the list below it agree about archived rows) but
	// ignores type/campaign so the by-type breakdown stays meaningful —
	// applying a type filter would collapse the donut to a single slice.
	const summary = useTransactionSummary(tenantSlug, {
		memberId: member.id,
		dateFrom: wireRange.dateFrom,
		dateTo: wireRange.dateTo,
		...t.stateFlags(),
	});
	const summaryData = summary.data;
	const mixTotal = num(summaryData?.total);
	const mixCount = summaryData?.count ?? 0;
	const mixSegments = useMemo(() => {
		return (summaryData?.byType ?? [])
			.filter((b) => num(b.total) > 0)
			.sort((a, b) => num(b.total) - num(a.total))
			.map((b) => {
				const amount = num(b.total);
				return {
					key: b.type,
					label: TYPE_LABEL[b.type as TxType],
					color: TYPE_COLOR[b.type as TxType],
					amount,
					count: b.count,
					share: pct(amount, mixTotal),
					avg: b.count > 0 ? amount / b.count : 0,
				};
			});
	}, [summaryData, mixTotal]);

	const list = useTransactions(tenantSlug, {
		memberId: member.id,
		type: type === "all" ? undefined : type,
		campaignId: campaignId === "all" ? undefined : campaignId,
		dateFrom: wireRange.dateFrom,
		dateTo: wireRange.dateTo,
		offset: t.offset,
		limit: t.limit,
		...t.stateFlags(),
	});

	const allItems: TransactionRow[] = list.data?.items ?? [];
	const total = list.data?.meta.total ?? 0;
	const pageSum = list.data?.meta.sum ?? 0;

	const visible = useMemo<TransactionRow[]>(() => {
		const q = t.values.search.trim().toLowerCase();
		if (!q) {
			return allItems;
		}
		return allItems.filter((tx) =>
			`${nstr(tx.note) ?? ""} ${nstr(tx.referenceNumber) ?? ""}`
				.toLowerCase()
				.includes(q),
		);
	}, [allItems, t.values.search]);

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
		<div className="space-y-4">
			<TransactionMixCard
				segments={mixSegments}
				total={mixTotal}
				count={mixCount}
				title="Where their giving went"
				subtitle="Breakdown of this member's giving by transaction type in the selected date range."
				emptyMessage={
					summary.isLoading
						? "Loading…"
						: "No giving recorded for this member in this range."
				}
			/>
			<DataTableShell<TransactionRow>
				search={t.search("Search note or reference…")}
				filters={[
					t.select("type", "Type", TYPE_OPTIONS),
					t.select("campaignId", "Campaign", campaignFilterOptions),
					t.state(),
					t.date("Date range"),
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
				mobileCard={transactionMobileCard(tenantSlug)}
				rows={visible}
				rowKey={(tx) => tx.id}
				loading={list.isLoading}
				onRowClick={openView}
				rowClassName={(tx) => (tx.deletedAt ? "bg-muted/30" : undefined)}
				emptyTitle="No transactions"
				emptySubtitle="No giving recorded by this member in this range."
				pagination={t.pagination(total)}
			/>
		</div>
	);
};
