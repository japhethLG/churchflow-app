"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
	Amount,
	Badge,
	Button,
	Card,
	type DataTableColumn,
	DataTableShell,
	DeletedLabel,
	EntityRestoreBanner,
	PageActionsMenu,
	PageHeader,
	StackedProgressBar,
	StatBand,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { usePledge } from "@/lib/api/pledges";
import { useTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { openModal } from "@/lib/modals/store";
import {
	daysUntil,
	LIFECYCLE_LABEL,
	num,
	type PledgeLifecycle,
	pct,
	pledgeLifecycle,
} from "../admin-shared";

type Transaction = components["schemas"]["TransactionResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

const TX_TYPE_LABEL: Record<Transaction["type"], string> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission Giving",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

const lifecycleBadgeColor = (
	l: PledgeLifecycle,
): "green" | "red" | "amber" | "neutral" | "blue" => {
	if (l === "past-due") {
		return "red";
	}
	if (l === "due-soon") {
		return "amber";
	}
	if (l === "fulfilled") {
		return "green";
	}
	if (l === "on-track") {
		return "blue";
	}
	return "neutral";
};

const buildTxColumns = ({
	tenantSlug,
	campaign,
}: {
	tenantSlug: string;
	campaign: Campaign | undefined;
}): DataTableColumn<Transaction>[] => [
	{
		key: "date",
		label: "Date",
		width: "120px",
		render: (tx) => (
			<span className="text-sm text-muted-foreground">
				{dayjs(tx.date).format("MMM D, YYYY")}
			</span>
		),
	},
	{
		key: "type",
		label: "Type",
		width: "140px",
		render: (tx) => (
			<span className="text-sm font-medium">
				{tx.type === "OTHER" && typeof tx.customType === "string"
					? tx.customType
					: TX_TYPE_LABEL[tx.type]}
			</span>
		),
	},
	{
		key: "campaign",
		label: "Campaign",
		render: (tx) => {
			if (!campaign) {
				return <span className="text-sm text-muted-foreground">—</span>;
			}
			const itemId = nstr(tx.campaignItemId);
			const item =
				itemId && "items" in campaign
					? (
							campaign as Campaign & {
								items?: { id: string; title: string }[];
							}
						).items?.find((it) => it.id === itemId)
					: undefined;
			const isDeleted = Boolean(campaign.deletedAt);
			return (
				<div className="min-w-0">
					{isDeleted ? (
						<DeletedLabel
							deletedAt={campaign.deletedAt}
							className="block truncate text-sm"
						>
							{campaign.title}
						</DeletedLabel>
					) : (
						<Link
							href={`/${tenantSlug}/admin/campaigns/${campaign.id}`}
							onClick={(e) => e.stopPropagation()}
							className="block truncate text-sm text-primary hover:underline"
						>
							{campaign.title}
						</Link>
					)}
					{item && (
						<div className="mt-0.5 truncate text-xs text-muted-foreground">
							Earmarked to {item.title}
						</div>
					)}
				</div>
			);
		},
	},
	{
		key: "reference",
		label: "Reference",
		width: "120px",
		render: (tx) => (
			<span className="font-mono text-xs text-muted-foreground">
				{nstr(tx.referenceNumber) ?? "—"}
			</span>
		),
	},
	{
		key: "amount",
		label: "Amount",
		width: "120px",
		align: "right",
		render: (tx) => <Amount value={tx.amount.toString()} />,
	},
];

export const PledgeDetailPage = () => {
	const router = useRouter();
	const { tenantSlug, pledgeId } = useParams<{
		tenantSlug: string;
		pledgeId: string;
	}>();

	const pledgeQ = usePledge(tenantSlug, pledgeId, { includeDeleted: true });
	const pledge = pledgeQ.data;

	const txQ = useTransactions(tenantSlug, { pledgeId }, Boolean(pledgeId));
	const transactions = txQ.data?.items ?? [];
	const txTotal = txQ.data?.meta.sum ?? 0;

	const membersQ = useMembers(tenantSlug, {
		limit: 200,
		includeDeleted: true,
	});
	const member = membersQ.data?.items.find((m) => m.id === pledge?.memberId);

	const campaignsQ = useCampaigns(tenantSlug, { includeDeleted: true });
	const campaign = campaignsQ.data?.items.find(
		(c) => c.id === pledge?.campaignId,
	);

	const memberName = member
		? `${member.firstName} ${member.lastName}`.trim()
		: undefined;
	const memberDeleted = Boolean(member?.deletedAt);
	const campaignDeleted = Boolean(campaign?.deletedAt);
	const pledgeDeleted = Boolean(pledge?.deletedAt);
	// Parent guard — when the campaign tombstone is set, gift-recording and
	// pledge edits are off-limits (the campaign's books are closed).
	const parentBlocked = campaignDeleted || memberDeleted;

	const deadline =
		typeof campaign?.deadline === "string" ? campaign.deadline : null;
	const days = daysUntil(deadline);
	const lifecycle: PledgeLifecycle | null = pledge
		? pledgeLifecycle(
				pledge.pledgedAmount,
				pledge.paidAmount,
				pledge.status,
				deadline,
			)
		: null;
	const fulfillmentPct = pledge
		? pct(pledge.paidAmount, pledge.pledgedAmount)
		: 0;

	const canRecordPayment =
		Boolean(pledge) &&
		!pledgeDeleted &&
		!parentBlocked &&
		pledge?.status === "ACTIVE" &&
		num(pledge.remainingAmount) > 0;

	const canEdit = Boolean(pledge) && !pledgeDeleted && !parentBlocked;

	const openRecordPayment = () => {
		if (!pledge) {
			return;
		}
		openModal("record-gift", {
			tenantSlug,
			defaultMemberId: pledge.memberId,
			defaultCampaignId: pledge.campaignId,
			defaultPledgeId: pledge.id,
		});
	};

	const openEdit = () => {
		if (!pledge) {
			return;
		}
		openModal("edit-pledge", { tenantSlug, pledge });
	};
	const openDelete = () => {
		if (!pledge) {
			return;
		}
		openModal("confirm-delete-pledge", { tenantSlug, pledgeId: pledge.id });
	};

	const daysCaption =
		days === null
			? "No deadline set"
			: days < 0
				? `${Math.abs(days)}d past`
				: days === 0
					? "Due today"
					: `${days}d left`;

	const txColumns = buildTxColumns({ tenantSlug, campaign });

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				back={{ href: `/${tenantSlug}/admin/pledges`, label: "Pledges" }}
				title={
					pledgeQ.isLoading ? (
						"Loading…"
					) : memberDeleted ? (
						<span className="inline-flex items-center gap-2">
							<DeletedLabel deletedAt={member?.deletedAt} hidePill>
								{memberName ?? "—"}
							</DeletedLabel>
							<span>'s pledge</span>
						</span>
					) : (
						`${memberName ?? "—"}'s pledge`
					)
				}
				subtitle={
					campaign?.title ? (
						<span className="inline-flex items-center gap-2">
							{campaignDeleted ? (
								<DeletedLabel deletedAt={campaign.deletedAt}>
									{campaign.title}
								</DeletedLabel>
							) : (
								<span>{campaign.title}</span>
							)}
							{lifecycle && lifecycle !== "cancelled" && (
								<Badge color={lifecycleBadgeColor(lifecycle)}>
									{LIFECYCLE_LABEL[lifecycle]}
									{days !== null && pledge?.status === "ACTIVE" && (
										<> · {daysCaption}</>
									)}
								</Badge>
							)}
						</span>
					) : undefined
				}
				action={
					pledge && !pledgeDeleted ? (
						<>
							<Button
								variant="primary"
								icon="plus"
								onClick={openRecordPayment}
								disabled={!canRecordPayment}
								title={
									campaignDeleted
										? "Campaign is archived — payments can't be recorded against it."
										: memberDeleted
											? "Member is archived — payments can't be recorded."
											: undefined
								}
							>
								Record payment
							</Button>
							<PageActionsMenu
								actions={[
									...(canEdit
										? [{ label: "Edit pledge", onClick: openEdit }]
										: []),
									{
										label: "Delete pledge",
										onClick: openDelete,
										destructive: true,
										separatorBefore: canEdit,
									},
								]}
							/>
						</>
					) : null
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8 space-y-6">
				{pledgeDeleted && pledge && (
					<EntityRestoreBanner
						entityLabel="Pledge"
						deletedAt={pledge.deletedAt}
						onRestore={() =>
							openModal("confirm-restore-pledge", {
								tenantId: tenantSlug,
								pledgeId: pledge.id,
								memberName: memberName ?? "this member",
							})
						}
					/>
				)}

				{pledge && (
					<Card padding={24}>
						<StatBand
							items={[
								{
									label: "Pledged",
									value: formatCurrency(pledge.pledgedAmount, { decimals: 0 }),
									caption: `Made ${dayjs(pledge.createdAt).format("MMM D, YYYY")}`,
								},
								{
									label: "Paid",
									value: (
										<span className="text-(--chart-current)">
											{formatCurrency(pledge.paidAmount, { decimals: 0 })}
										</span>
									),
									caption: `${transactions.length} payment${transactions.length === 1 ? "" : "s"}`,
								},
								{
									label: "Remaining",
									value: formatCurrency(pledge.remainingAmount, {
										decimals: 0,
									}),
									caption: `${fulfillmentPct}% fulfilled`,
								},
								{
									label: "Deadline",
									value:
										deadline !== null
											? dayjs(deadline).format("MMM D, YYYY")
											: "—",
									caption: daysCaption,
								},
							]}
						/>

						<div className="mt-5">
							<StackedProgressBar
								size="md"
								total={pledge.pledgedAmount}
								segments={[
									{
										value: pledge.paidAmount,
										color: "var(--chart-current)",
										label: "Paid",
										displayValue: formatCurrency(pledge.paidAmount, {
											decimals: 0,
										}),
									},
								]}
							/>
						</div>

						{nstr(pledge.note) && (
							<div className="mt-5 rounded-lg bg-muted/40 px-4 py-3 text-sm text-secondary-foreground">
								<div className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
									Note
								</div>
								{nstr(pledge.note)}
							</div>
						)}
					</Card>
				)}

				<div>
					<div className="mb-3 flex items-baseline justify-between">
						<h2 className="text-base font-semibold">Payments</h2>
						{transactions.length > 0 && (
							<span className="text-sm text-muted-foreground">
								{transactions.length} payment
								{transactions.length !== 1 ? "s" : ""} ·{" "}
								<span className="font-medium text-foreground">
									{formatCompact(txTotal)}
								</span>{" "}
								total
							</span>
						)}
					</div>
					<DataTableShell<Transaction>
						columns={txColumns}
						rows={transactions}
						rowKey={(tx) => tx.id}
						loading={txQ.isLoading}
						onRowClick={(tx) =>
							router.push(`/${tenantSlug}/admin/transactions/${tx.id}`)
						}
						rowClassName={(tx) => (tx.deletedAt ? "bg-muted/30" : undefined)}
						emptyTitle="No payments yet"
						emptySubtitle={
							canRecordPayment
								? "Click Record payment to log a gift toward this pledge."
								: "Transactions linked to this pledge will appear here."
						}
					/>
				</div>
			</div>
		</div>
	);
};
