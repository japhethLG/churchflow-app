"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	DataTableShell,
	DateRangePicker,
	type DateRangeValue,
	type StateFilterValue,
	toStateFilterFlags,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { useTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import { openModal } from "@/lib/modals/store";
import {
	type TransactionRow,
	transactionColumns,
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

	const [search, setSearch] = useState("");
	const [type, setType] = useState<TypeFilter>("all");
	const [range, setRange] = useState<DateRangeValue>({});
	const [campaignId, setCampaignId] = useState<string>("all");
	const [state, setState] = useState<StateFilterValue>("active");
	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(20);

	const { data: campaignsData } = useCampaigns(tenantSlug, {
		includeDeleted: true,
	});
	const { data: membersData } = useMembers(tenantSlug, {
		limit: 500,
		includeDeleted: true,
	});

	const campaigns = campaignsData?.items ?? [];
	const members = membersData?.items ?? [];
	const campaignsById = Object.fromEntries(campaigns.map((c) => [c.id, c]));
	const membersById = Object.fromEntries(members.map((m) => [m.id, m]));

	const wireRange = toWireRange(range);

	const list = useTransactions(tenantSlug, {
		memberId: member.id,
		type: type === "all" ? undefined : type,
		campaignId: campaignId === "all" ? undefined : campaignId,
		dateFrom: wireRange.dateFrom,
		dateTo: wireRange.dateTo,
		offset,
		limit,
		...toStateFilterFlags(state),
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
		membersById,
		campaignsById,
		tenantSlug,
	});

	const campaignFilterOptions = [
		{ value: "all", label: "All campaigns" },
		...campaigns
			.filter((c) => c.status !== "CANCELLED")
			.map((c) => ({ value: c.id, label: c.title })),
	];

	return (
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
				setRange({});
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
			emptyTitle="No transactions"
			emptySubtitle="No giving recorded by this member in this range."
			pagination={{
				total,
				offset,
				limit,
				onOffsetChange: setOffset,
				onLimitChange: setLimit,
			}}
		/>
	);
};
