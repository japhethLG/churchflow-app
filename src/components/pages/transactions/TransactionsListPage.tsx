"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
	Avatar,
	type TransactionType as BadgeTypeLabel,
	Button,
	DataTableShell,
	type DateRangeValue,
	ExpandableCard,
	Icon,
	PageHeader,
	TypeBadge,
	useTableFilters,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useTransactionSummary, useTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { openModal } from "@/lib/modals/store";
import { openSheet } from "@/lib/sheets/store";
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

// DTO type → TypeBadge display label (mirrors TransactionsTable).
const TYPE_BADGE_LABEL: Record<TransactionType, BadgeTypeLabel> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

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

	const wireRange = toWireRange(range);
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

	// Sub-`md` row → expandable card. Collapsed: member/anonymous + date·campaign
	// + type + amount. Expanded: campaign, reference #, full date, note.
	const renderTransactionCard = (t: TransactionRow) => {
		const m = t.member;
		const name = m ? `${m.firstName} ${m.lastName}`.trim() : "";
		const campaignTitle = t.campaign?.title ?? null;
		const ref = nstr(t.referenceNumber);
		const note = nstr(t.note);
		return (
			<ExpandableCard
				href={`/${tenantSlug}/admin/transactions/${t.id}`}
				deleted={Boolean(t.deletedAt)}
				details={[
					{
						label: "Campaign",
						value: campaignTitle ? (
							<span className="text-sm font-medium text-primary">
								{campaignTitle}
							</span>
						) : (
							<span className="text-sm text-muted-foreground">—</span>
						),
					},
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
								{dayjs(t.date).format("MMM D, YYYY")}
							</span>
						),
					},
					...(note
						? [
								{
									label: "Note",
									value: (
										<span className="text-sm font-medium text-foreground">
											{note}
										</span>
									),
								},
							]
						: []),
				]}
			>
				<div className="flex items-center gap-3">
					{m ? (
						<Avatar name={name} size={36} />
					) : (
						<div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
							<Icon name="user" size={17} />
						</div>
					)}
					<div className="min-w-0 flex-1">
						<div
							className={`truncate text-sm font-semibold tracking-tight ${
								m ? "" : "italic text-muted-foreground"
							}`}
						>
							{m ? name : "Anonymous"}
						</div>
						<div className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
							<span>{dayjs(t.date).format("MMM D")}</span>
							<span className="size-0.5 rounded-full bg-muted-foreground" />
							<span className="truncate">{campaignTitle ?? "No campaign"}</span>
						</div>
					</div>
					<div className="flex shrink-0 flex-col items-end gap-1">
						<span className="text-[15px] font-bold tabular-nums tracking-tight">
							{formatCurrency(t.amount, { decimals: 0 })}
						</span>
						<TypeBadge type={TYPE_BADGE_LABEL[t.type]} />
					</div>
				</div>
			</ExpandableCard>
		);
	};

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
						t.select("type", "Type", TYPE_OPTIONS),
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
