"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
	Amount,
	DataTable,
	type DataTableColumn,
	PageHeader,
	type Status,
	StatusBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { usePledge } from "@/lib/api/pledges";
import { useTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";

type Transaction = components["schemas"]["TransactionResponseDto"];

const PLEDGE_STATUS_LABEL: Record<
	components["schemas"]["PledgeResponseDto"]["status"],
	Status
> = {
	ACTIVE: "Active",
	FULFILLED: "Completed",
	CANCELLED: "Cancelled",
};

const TX_TYPE_LABEL: Record<Transaction["type"], string> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission Giving",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

const txColumns: DataTableColumn<Transaction>[] = [
	{
		key: "date",
		label: "Date",
		width: "130px",
		render: (tx) => (
			<span className="text-sm text-muted-foreground">
				{dayjs(tx.date).format("MMM D, YYYY")}
			</span>
		),
	},
	{
		key: "type",
		label: "Type",
		render: (tx) => (
			<span className="font-medium">
				{tx.type === "OTHER" && typeof tx.customType === "string"
					? tx.customType
					: TX_TYPE_LABEL[tx.type]}
			</span>
		),
	},
	{
		key: "reference",
		label: "Reference",
		render: (tx) => (
			<span className="text-sm text-muted-foreground">
				{typeof tx.referenceNumber === "string" ? tx.referenceNumber : "—"}
			</span>
		),
	},
	{
		key: "note",
		label: "Note",
		render: (tx) => (
			<span className="text-sm text-muted-foreground">
				{typeof tx.note === "string" ? tx.note : "—"}
			</span>
		),
	},
	{
		key: "amount",
		label: "Amount",
		width: "140px",
		align: "right",
		render: (tx) => <Amount value={tx.amount.toString()} />,
	},
];

export const PledgeDetailPage = () => {
	const { tenantSlug, pledgeId } = useParams<{
		tenantSlug: string;
		pledgeId: string;
	}>();

	const pledgeQ = usePledge(tenantSlug, pledgeId);
	const pledge = pledgeQ.data;

	const txQ = useTransactions(tenantSlug, { pledgeId }, Boolean(pledgeId));
	const transactions = txQ.data?.items ?? [];
	const txTotal = txQ.data?.meta.sum ?? 0;

	const membersQ = useMembers(tenantSlug, { limit: 200 });
	const member = membersQ.data?.items.find((m) => m.id === pledge?.memberId);

	const campaignsQ = useCampaigns(tenantSlug);
	const campaign = campaignsQ.data?.items.find(
		(c) => c.id === pledge?.campaignId,
	);

	const memberName = member
		? `${member.firstName} ${member.lastName}`.trim()
		: undefined;

	return (
		<div className="h-full flex flex-col">
			<div className="px-8 pt-6 pb-0">
				<Link
					href={`/${tenantSlug}/admin/pledges`}
					className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
				>
					← Pledges
				</Link>
			</div>

			<PageHeader
				className="px-8"
				title={pledgeQ.isLoading ? "Loading…" : `${memberName ?? "—"}'s pledge`}
				subtitle={campaign?.title}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8 space-y-8">
				{pledge && (
					<div className="flex flex-wrap gap-8 rounded-xl border border-border bg-card p-6">
						<div>
							<div className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
								Pledged
							</div>
							<div className="text-2xl font-semibold tabular-nums">
								{formatCurrency(pledge.pledgedAmount)}
							</div>
						</div>
						<div>
							<div className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
								Paid
							</div>
							<div className="text-2xl font-semibold tabular-nums text-green-600">
								{formatCurrency(pledge.paidAmount)}
							</div>
						</div>
						<div>
							<div className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
								Remaining
							</div>
							<div className="text-2xl font-semibold tabular-nums">
								{formatCurrency(pledge.remainingAmount)}
							</div>
						</div>
						<div>
							<div className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
								Status
							</div>
							<StatusBadge status={PLEDGE_STATUS_LABEL[pledge.status]} />
						</div>
						{typeof pledge.note === "string" && (
							<div>
								<div className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
									Note
								</div>
								<div className="text-sm">{pledge.note}</div>
							</div>
						)}
						<div>
							<div className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
								Pledged on
							</div>
							<div className="text-sm">
								{dayjs(pledge.createdAt).format("MMM D, YYYY")}
							</div>
						</div>
					</div>
				)}

				<div>
					<div className="mb-3 flex items-center justify-between">
						<h2 className="text-base font-semibold">Transactions</h2>
						{transactions.length > 0 && (
							<span className="text-sm text-muted-foreground">
								{transactions.length} payment
								{transactions.length !== 1 ? "s" : ""} ·{" "}
								<span className="font-medium text-foreground">
									{formatCurrency(txTotal)}
								</span>{" "}
								total
							</span>
						)}
					</div>
					<DataTable<Transaction>
						columns={txColumns}
						rows={transactions}
						rowKey={(tx) => tx.id}
						loading={txQ.isLoading}
						emptyTitle="No payments yet"
						emptySubtitle="Transactions linked to this pledge will appear here."
					/>
				</div>
			</div>
		</div>
	);
};
