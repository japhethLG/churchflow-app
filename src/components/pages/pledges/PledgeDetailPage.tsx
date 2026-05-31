"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
	Amount,
	Badge,
	Button,
	Card,
	type DataTableColumn,
	DataTableShell,
	DeletedLabel,
	EntityRestoreBanner,
	ExpandableCard,
	PageActionsMenu,
	PageHeader,
	StackedProgressBar,
	StatBand,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import { useCampaign } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { usePledge } from "@/lib/api/pledges";
import { useTransactions } from "@/lib/api/transactions";
import dayjs, { formatUtcDate } from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { openModal } from "@/lib/modals/store";
import {
	daysUntil,
	LIFECYCLE_LABEL,
	num,
	type PledgeLifecycle,
	pct,
	pledgeLifecycle,
	resolvePledgeDeadline,
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
				{formatUtcDate(tx.date, "MMM D, YYYY")}
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

	const campaignQ = useCampaign(tenantSlug, pledge?.campaignId ?? "", {
		includeDeleted: true,
		enabled: Boolean(pledge?.campaignId),
	});
	const campaign = campaignQ.data;
	const itemDeadlinesById = useMemo<Record<string, string | null>>(() => {
		const map: Record<string, string | null> = {};
		for (const item of campaign?.items ?? []) {
			map[item.id] = typeof item.deadline === "string" ? item.deadline : null;
		}
		return map;
	}, [campaign]);

	const memberName = member
		? `${member.firstName} ${member.lastName}`.trim()
		: undefined;
	const memberDeleted = Boolean(member?.deletedAt);
	const campaignDeleted = Boolean(campaign?.deletedAt);
	const pledgeDeleted = Boolean(pledge?.deletedAt);
	// Parent guard — when the campaign tombstone is set, gift-recording and
	// pledge edits are off-limits (the campaign's books are closed).
	const parentBlocked = campaignDeleted || memberDeleted;

	const deadline = pledge
		? resolvePledgeDeadline(pledge, campaign, itemDeadlinesById)
		: null;
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

	// Mobile FAB — the page's primary action. Only when a payment can actually
	// be recorded; edit/delete stay in the header kebab on every viewport.
	useMobileActions(
		useMemo(
			() =>
				canRecordPayment && pledge
					? [
							{
								label: "Record payment",
								icon: "plus" as const,
								onClick: () =>
									openModal("record-gift", {
										tenantSlug,
										defaultMemberId: pledge.memberId,
										defaultCampaignId: pledge.campaignId,
										defaultPledgeId: pledge.id,
									}),
							},
						]
					: [],
			[canRecordPayment, pledge, tenantSlug],
		),
	);

	// Sub-`md` payment row → card linking to the transaction detail page.
	const renderPaymentCard = (tx: Transaction) => {
		const itemId = nstr(tx.campaignItemId);
		const item = itemId
			? campaign?.items?.find((it) => it.id === itemId)
			: undefined;
		const typeLabel =
			tx.type === "OTHER" && typeof tx.customType === "string"
				? tx.customType
				: TX_TYPE_LABEL[tx.type];
		return (
			<ExpandableCard
				href={`/${tenantSlug}/admin/transactions/${tx.id}`}
				deleted={Boolean(tx.deletedAt)}
				details={[
					{
						label: "Reference",
						value: (
							<span className="font-mono text-xs font-medium text-foreground">
								{nstr(tx.referenceNumber) ?? "—"}
							</span>
						),
					},
					...(item
						? [
								{
									label: "Earmarked to",
									value: (
										<span className="text-sm font-medium text-foreground">
											{item.title}
										</span>
									),
								},
							]
						: []),
				]}
			>
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold text-foreground">
							{typeLabel}
						</div>
						<div className="text-xs text-muted-foreground">
							{formatUtcDate(tx.date, "MMM D, YYYY")}
						</div>
					</div>
					<span className="shrink-0 text-[15px] font-bold tabular-nums tracking-tight">
						{formatCurrency(tx.amount, { decimals: 0 })}
					</span>
				</div>
			</ExpandableCard>
		);
	};

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
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
								role="primary"
								icon="plus"
								onClick={openRecordPayment}
								disabled={!canRecordPayment}
								className="hidden md:inline-flex"
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

			<div className="overflow-auto flex-1 px-4 pb-36 space-y-6 md:px-8 md:pb-8">
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
							mobileColumns={2}
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
											? formatUtcDate(deadline, "MMM D, YYYY")
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
						mobileCard={renderPaymentCard}
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
