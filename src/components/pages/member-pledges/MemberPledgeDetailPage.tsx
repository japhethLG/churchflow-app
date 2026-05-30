"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
	Amount,
	Badge,
	Card,
	type DataTableColumn,
	DataTableShell,
	DeletedLabel,
	EntityRestoreBanner,
	ExpandableCard,
	PageHeader,
	SectionTitle,
	StackedProgressBar,
	StatBand,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import { useMyCampaign } from "@/lib/api/campaigns";
import { useMyPledge } from "@/lib/api/pledges";
import { useMyTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import {
	daysUntil,
	LIFECYCLE_LABEL,
	num,
	type PledgeLifecycle,
	pct,
	pledgeLifecycle,
	resolvePledgeDeadline,
} from "../admin-shared";

type Transaction = components["schemas"]["MyTransactionResponseDto"];

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

// Payments table with a running-remaining column — gives the member a
// tangible sense of "after this payment, how much do I still owe?".
const buildTxColumns = (
	pledgedAmount: number,
	// Ordered oldest → newest so the running balance below is correct.
	chronological: Transaction[],
): DataTableColumn<Transaction>[] => {
	const remainingByTxId = new Map<string, number>();
	let running = pledgedAmount;
	for (const tx of chronological) {
		running = Math.max(0, running - num(tx.amount));
		remainingByTxId.set(tx.id, running);
	}
	return [
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
					{nstr(tx.referenceNumber) ?? "—"}
				</span>
			),
		},
		{
			key: "note",
			label: "Note",
			render: (tx) => (
				<span className="text-sm text-muted-foreground">
					{nstr(tx.note) ?? "—"}
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
		{
			key: "remaining",
			label: "Remaining after",
			width: "140px",
			align: "right",
			render: (tx) => {
				const r = remainingByTxId.get(tx.id) ?? 0;
				return (
					<span className="tabular-nums text-muted-foreground">
						{formatCurrency(r, { decimals: 0 })}
					</span>
				);
			},
		},
	];
};

export const MemberPledgeDetailPage = () => {
	const { tenantSlug, pledgeId } = useParams<{
		tenantSlug: string;
		pledgeId: string;
	}>();

	const pledgeQ = useMyPledge(tenantSlug, pledgeId, { includeDeleted: true });
	const pledge = pledgeQ.data;
	const pledgeArchived = Boolean(pledge?.deletedAt);

	const txQ = useMyTransactions(tenantSlug, { pledgeId }, Boolean(pledgeId));
	const transactions = txQ.data?.items ?? [];
	const txTotal = txQ.data?.meta.sum ?? 0;

	// Switched from useMyCampaigns().find() to useMyCampaign(...) so items
	// (and per-item deadlines) come along for resolvePledgeDeadline.
	const campaignQ = useMyCampaign(tenantSlug, pledge?.campaignId ?? "", {
		includeDeleted: true,
		enabled: Boolean(pledge?.campaignId),
	});
	const campaign = campaignQ.data;
	const campaignArchived = Boolean(campaign?.deletedAt);

	const itemDeadlinesById = useMemo<Record<string, string | null>>(() => {
		const map: Record<string, string | null> = {};
		for (const item of campaign?.items ?? []) {
			map[item.id] = typeof item.deadline === "string" ? item.deadline : null;
		}
		return map;
	}, [campaign]);

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

	const pledgedAmount = pledge ? num(pledge.pledgedAmount) : 0;
	const paidAmount = pledge ? num(pledge.paidAmount) : 0;
	const remainingAmount = pledge ? num(pledge.remainingAmount) : 0;
	const fulfillmentPct = pct(paidAmount, pledgedAmount);

	// Pace: how much per week to fulfill by the deadline. Skip when the
	// pledge is closed (fulfilled/cancelled) or has no remaining balance.
	const pace = useMemo(() => {
		if (
			!pledge ||
			pledge.status !== "ACTIVE" ||
			remainingAmount <= 0 ||
			days === null ||
			days < 0
		) {
			return null;
		}
		// Days remaining inclusive of today — give at least 1 to avoid /0.
		const d = Math.max(1, days);
		return {
			perDay: remainingAmount / d,
			perWeek: (remainingAmount / d) * 7,
			daysLeft: d,
		};
	}, [pledge, remainingAmount, days]);

	// Pledge item title — show what the pledge is funding when the pledge
	// is item-scoped (campaign items can carry advance deadlines).
	const itemTitle = useMemo(() => {
		const itemId =
			pledge && typeof pledge.campaignItemId === "string"
				? pledge.campaignItemId
				: null;
		if (!itemId) {
			return null;
		}
		const item = campaign?.items.find((it) => it.id === itemId);
		return item?.title ?? null;
	}, [pledge, campaign]);

	const chronologicalTx = useMemo(
		() =>
			[...transactions].sort(
				(a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
			),
		[transactions],
	);
	const txColumns = useMemo(
		() => buildTxColumns(pledgedAmount, chronologicalTx),
		[pledgedAmount, chronologicalTx],
	);

	// Running balance after each payment — mirrors the desktop "Remaining after"
	// column so the mobile card can surface the same number.
	const remainingByTxId = useMemo(() => {
		const map = new Map<string, number>();
		let running = pledgedAmount;
		for (const tx of chronologicalTx) {
			running = Math.max(0, running - num(tx.amount));
			map.set(tx.id, running);
		}
		return map;
	}, [pledgedAmount, chronologicalTx]);

	// Sub-`md` payment row → expandable card. Collapsed: type + date + amount.
	// Expanded: reference, remaining-after, note.
	const renderPaymentCard = (tx: Transaction) => {
		const typeLabel =
			tx.type === "OTHER" && typeof tx.customType === "string"
				? tx.customType
				: TX_TYPE_LABEL[tx.type];
		const ref = nstr(tx.referenceNumber);
		const note = nstr(tx.note);
		const remaining = remainingByTxId.get(tx.id) ?? 0;
		return (
			<ExpandableCard
				details={[
					{
						label: "Reference",
						value: ref ? (
							<span className="font-mono text-xs font-medium text-foreground">
								{ref}
							</span>
						) : (
							<span className="text-sm text-muted-foreground">—</span>
						),
					},
					{
						label: "Remaining after",
						value: (
							<span className="text-sm font-medium text-foreground tabular-nums">
								{formatCurrency(remaining, { decimals: 0 })}
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
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold tracking-tight">
							{typeLabel}
						</div>
						<div className="text-xs text-muted-foreground">
							{dayjs(tx.date).format("MMM D, YYYY")}
						</div>
					</div>
					<span className="shrink-0 text-sm font-bold tabular-nums">
						<Amount value={tx.amount.toString()} />
					</span>
				</div>
			</ExpandableCard>
		);
	};

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				back={{
					href: `/${tenantSlug}/member/my-pledges`,
					label: "My pledges",
				}}
				title={pledgeQ.isLoading ? "Loading…" : "Pledge details"}
				subtitle={
					campaign ? (
						<span className="inline-flex flex-wrap items-center gap-2">
							{campaignArchived ? (
								<DeletedLabel deletedAt={campaign.deletedAt}>
									{campaign.title}
								</DeletedLabel>
							) : (
								campaign.title
							)}
							{itemTitle && (
								<span className="text-muted-foreground">· {itemTitle}</span>
							)}
							{lifecycle && lifecycle !== "fulfilled" && (
								<Badge color={lifecycleBadgeColor(lifecycle)}>
									{LIFECYCLE_LABEL[lifecycle]}
									{days !== null && (
										<>
											{" · "}
											{days < 0
												? `${Math.abs(days)}d past`
												: days === 0
													? "today"
													: `${days}d left`}
										</>
									)}
								</Badge>
							)}
						</span>
					) : undefined
				}
			/>

			<div className="overflow-auto flex-1 px-4 pb-28 space-y-6 md:px-8 md:pb-8">
				{pledge && (pledgeArchived || campaignArchived) && (
					<EntityRestoreBanner
						entityLabel={pledgeArchived ? "Pledge" : "Campaign"}
						deletedAt={
							pledgeArchived ? pledge.deletedAt : (campaign?.deletedAt ?? null)
						}
						memberVariant
					/>
				)}

				{pledge && pledge.status === "FULFILLED" && (
					<Card
						padding={20}
						className="border-[color-mix(in_srgb,var(--chart-positive)_30%,transparent)] bg-[color-mix(in_srgb,var(--chart-positive)_8%,var(--card))]"
					>
						<div className="text-sm font-semibold text-foreground">
							Fully paid · thank you
						</div>
						<div className="mt-1 text-xs text-muted-foreground">
							This pledge is complete — every gift you committed has been
							received.
						</div>
					</Card>
				)}

				{pledge && pledge.status === "CANCELLED" && (
					<Card padding={20} className="bg-muted/40">
						<div className="text-sm font-semibold text-foreground">
							Pledge cancelled
						</div>
						<div className="mt-1 text-xs text-muted-foreground">
							This commitment is no longer active. You can pledge to this
							campaign again from its page.
						</div>
					</Card>
				)}

				{pledge && (
					<Card padding={24}>
						<StatBand
							mobileColumns={2}
							items={[
								{ label: "Pledged", value: formatCompact(pledgedAmount) },
								{
									label: "Paid",
									value: formatCompact(paidAmount),
									caption:
										pledgedAmount > 0 ? `${fulfillmentPct}% of pledged` : "",
								},
								{
									label: "Remaining",
									value: formatCompact(remainingAmount),
								},
								{
									label: "Pledged on",
									value: dayjs(pledge.createdAt).format("MMM D, YYYY"),
								},
							]}
						/>
						<div className="mt-5">
							<StackedProgressBar
								size="lg"
								total={pledgedAmount > 0 ? pledgedAmount : 1}
								segments={[
									{
										value: paidAmount,
										color: "var(--chart-positive)",
										label: "Paid",
										displayValue: formatCompact(paidAmount),
									},
								]}
							/>
						</div>
						{pace && deadline && (
							<div className="mt-4 rounded-lg bg-muted/40 px-4 py-3 text-sm text-secondary-foreground">
								To fulfill by{" "}
								<span className="font-semibold text-foreground">
									{dayjs(deadline).format("MMM D, YYYY")}
								</span>{" "}
								({pace.daysLeft}d), give about{" "}
								<span className="font-semibold text-foreground">
									{formatCompact(pace.perWeek)}/week
								</span>{" "}
								({formatCompact(pace.perDay)}/day).
							</div>
						)}
						{nstr(pledge.note) && (
							<div className="mt-4 text-sm text-muted-foreground">
								<span className="font-medium text-foreground">Note:</span>{" "}
								{nstr(pledge.note)}
							</div>
						)}
					</Card>
				)}

				<div>
					<SectionTitle
						title="Payments"
						action={
							transactions.length > 0 ? (
								<span className="text-sm text-muted-foreground">
									{transactions.length} payment
									{transactions.length !== 1 ? "s" : ""} ·{" "}
									<span className="font-medium text-foreground">
										{formatCurrency(txTotal)}
									</span>{" "}
									total
								</span>
							) : undefined
						}
					/>
					<DataTableShell<Transaction>
						columns={txColumns}
						mobileCard={renderPaymentCard}
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
