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
import { useMyCampaigns } from "@/lib/api/campaigns";
import { useMyPledge } from "@/lib/api/pledges";
import { useMyTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";

type Transaction = components["schemas"]["MyTransactionResponseDto"];

const PLEDGE_STATUS_LABEL: Record<
	components["schemas"]["MyPledgeResponseDto"]["status"],
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

export const MemberPledgeDetailPage = () => {
	const { tenantSlug, pledgeId } = useParams<{
		tenantSlug: string;
		pledgeId: string;
	}>();

	const pledgeQ = useMyPledge(tenantSlug, pledgeId);
	const pledge = pledgeQ.data;

	const txQ = useMyTransactions(tenantSlug, { pledgeId }, Boolean(pledgeId));
	const transactions = txQ.data?.items ?? [];
	const txTotal = txQ.data?.meta.sum ?? 0;

	const campaignsQ = useMyCampaigns(tenantSlug);
	const campaign = campaignsQ.data?.items.find(
		(c) => c.id === pledge?.campaignId,
	);

	return (
		<div className="h-full flex flex-col">
			<div className="px-8 pt-6 pb-0">
				<Link
					href={`/${tenantSlug}/member/my-pledges`}
					className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
				>
					← My pledges
				</Link>
			</div>

			<PageHeader
				className="px-8"
				title={pledgeQ.isLoading ? "Loading…" : "Pledge details"}
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
						<h2 className="text-base font-semibold">Payments</h2>
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
						emptySubtitle="Payments recorded against this pledge will appear here."
					/>
				</div>
			</div>
		</div>
	);
};
