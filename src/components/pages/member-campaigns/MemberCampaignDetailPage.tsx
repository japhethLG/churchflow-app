"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
	Badge,
	Button,
	Card,
	DataTableShell,
	DeletedLabel,
	EntityRestoreBanner,
	PageHeader,
	SectionTitle,
	Sparkline,
	StackedProgressBar,
	StatBand,
	type Status,
	StatusBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useMyCampaign, useMyCampaignProgress } from "@/lib/api/campaigns";
import { nstr } from "@/lib/api/coerce";
import { useMyProfile } from "@/lib/api/members";
import { useMyPledges } from "@/lib/api/pledges";
import { useMyTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCompact } from "@/lib/format-currency";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { openModal } from "@/lib/modals/store";
import { openSheet } from "@/lib/sheets/store";
import { daysUntil, num, pct } from "../admin-shared";
import {
	MemberPledgeCard,
	type MemberPledgeRow,
	memberPledgeColumns,
} from "../member-pledges/MemberPledgesTable";

type Campaign = components["schemas"]["MyCampaignWithItemsResponseDto"];
type CampaignAsRowCampaign = components["schemas"]["CampaignResponseDto"];

const STATUS_MAP: Record<Campaign["status"], Status> = {
	DRAFT: "Upcoming",
	ACTIVE: "Active",
	COMPLETED: "Completed",
	CANCELLED: "Cancelled",
};

export const MemberCampaignDetailPage = () => {
	const router = useRouter();
	const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();

	// Members navigate into a deleted campaign from a pledge/transaction
	// reference — opt into tombstones so the page can render the read-only
	// banner instead of 404'ing.
	const campaignQ = useMyCampaign(tenantSlug, id, { includeDeleted: true });
	const campaign = campaignQ.data;
	const isDeleted = Boolean(campaign?.deletedAt);

	// Progress endpoint stays live-only by design — archived campaigns have
	// no meaningful "in flight" totals.
	const progressQ = useMyCampaignProgress(
		tenantSlug,
		id,
		Boolean(campaign) && !isDeleted,
	);

	const memberQ = useMyProfile(tenantSlug);
	const memberId = memberQ.data?.id;

	// Caller's pledges *to this campaign only*. Backend filters by caller
	// automatically — campaignId narrows further.
	const pledgesQ = useMyPledges(tenantSlug, { campaignId: id }, Boolean(id));
	const myPledges = pledgesQ.data?.items ?? [];
	const myPledged = myPledges.reduce((s, p) => s + num(p.pledgedAmount), 0);
	const myPaid = myPledges.reduce((s, p) => s + num(p.paidAmount), 0);
	const myRemaining = myPledges.reduce((s, p) => s + num(p.remainingAmount), 0);
	const myActivePledges = myPledges.filter((p) => p.status === "ACTIVE");

	// Member's own transactions to this campaign — drives the monthly
	// sparkline ("when has my giving here landed").
	const myCampaignTxQ = useMyTransactions(
		tenantSlug,
		{ campaignId: id, limit: 500 },
		Boolean(id),
	);
	const myCampaignTransactions = myCampaignTxQ.data?.items ?? [];
	const monthlySpark = useMemo(() => {
		const start = dayjs().utc().subtract(11, "month").startOf("month");
		const buckets: number[] = Array(12).fill(0);
		for (const t of myCampaignTransactions) {
			const d = dayjs(t.date).utc().startOf("month");
			const idx = d.diff(start, "month");
			if (idx >= 0 && idx < buckets.length) {
				buckets[idx] = (buckets[idx] ?? 0) + num(t.amount);
			}
		}
		return buckets;
	}, [myCampaignTransactions]);
	const hasSpark = monthlySpark.some((v) => v > 0);

	// Hoisted above the early returns so React hooks rules hold. Falls
	// back to {} when the campaign hasn't loaded yet.
	const itemDeadlinesById = useMemo<Record<string, string | null>>(() => {
		const map: Record<string, string | null> = {};
		for (const it of campaign?.items ?? []) {
			map[it.id] = typeof it.deadline === "string" ? it.deadline : null;
		}
		return map;
	}, [campaign]);

	// Mobile FAB mirrors the header's pledge CTA. Hoisted above the early
	// returns so the hook order stays stable; empty (no FAB) until the campaign
	// loads and pledging is allowed.
	useMobileActions(
		useMemo(() => {
			if (!campaign || isDeleted || !memberId) {
				return [];
			}
			const past =
				campaign.status === "COMPLETED" || campaign.status === "CANCELLED";
			if (past) {
				return [];
			}
			return [
				{
					label:
						myActivePledges.length > 0 ? "Add another pledge" : "Make a pledge",
					icon: "plus" as const,
					onClick: () =>
						openSheet("pledge", {
							intent: "self",
							tenantSlug,
							campaignId: campaign.id,
							campaignTitle: campaign.title,
							items: campaign.items
								.filter((it) => !it.deletedAt)
								.map((it) => ({ ...it, deletedBy: null })),
						}),
				},
			];
		}, [campaign, isDeleted, memberId, myActivePledges, tenantSlug]),
	);

	if (campaignQ.isLoading) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-4 pt-5 md:px-8 md:pt-0"
					overline="Campaigns"
					title="Loading…"
					subtitle="Fetching campaign details…"
				/>
				<div className="overflow-auto flex-1 px-4 pb-36 md:px-8 md:pb-8">
					<div className="h-60 rounded-2xl bg-secondary animate-pulse" />
				</div>
			</div>
		);
	}

	if (campaignQ.error || !campaign) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-4 pt-5 md:px-8 md:pt-0"
					back={{
						href: `/${tenantSlug}/member/campaigns`,
						label: "Campaigns",
					}}
					title="Not found"
					subtitle="This campaign may have been removed."
				/>
			</div>
		);
	}

	const items = campaign.items;
	const description = nstr(campaign.description);
	const deadline = nstr(campaign.deadline);
	const days = daysUntil(deadline);

	const itemProgressById = new Map(
		(progressQ.data?.items ?? []).map((p) => [p.itemId, p]),
	);

	const goal = num(progressQ.data?.goalAmount ?? 0);
	const raised = num(progressQ.data?.raisedAmount ?? 0);
	const pledged = num(progressQ.data?.pledgedAmount ?? 0);
	const goalPct = pct(raised, goal);

	const past =
		campaign.status === "COMPLETED" || campaign.status === "CANCELLED";
	const canPledge = !isDeleted && !past && memberId;

	const openPledgeModal = () => {
		openModal("member-pledge", {
			tenantSlug,
			campaignId: campaign.id,
			campaignTitle: campaign.title,
			items: items
				.filter((it) => !it.deletedAt)
				.map((it) => ({
					...it,
					deletedBy: null,
				})),
		});
	};

	// Deadline urgency badge — only when active.
	const deadlineBadge = (() => {
		if (!deadline || campaign.status !== "ACTIVE" || days === null) {
			return null;
		}
		if (days < 0) {
			return { color: "red" as const, text: `${Math.abs(days)}d past due` };
		}
		if (days <= 14) {
			return { color: "amber" as const, text: `Due in ${days}d` };
		}
		return { color: "neutral" as const, text: `${days}d left` };
	})();

	const subtitle = (
		<span className="inline-flex flex-wrap items-center gap-2">
			<StatusBadge status={STATUS_MAP[campaign.status]} />
			{deadline ? (
				<span className="text-xs text-muted-foreground">
					Deadline · {dayjs(deadline).format("MMM D, YYYY")}
				</span>
			) : (
				<span className="text-xs text-muted-foreground">Open-ended</span>
			)}
			{deadlineBadge && (
				<Badge color={deadlineBadge.color}>{deadlineBadge.text}</Badge>
			)}
		</span>
	);

	// memberPledgeColumns expects PledgeResponseDto + campaign map. The
	// /me/* pledge shape only drops `deletedBy` — every column we use is
	// shared. Cast the rows + provide a single-entry campaign map.
	const tenantCampaignMap: Record<string, CampaignAsRowCampaign> = {
		[campaign.id]: campaign as unknown as CampaignAsRowCampaign,
	};
	const itemTitleMap: Record<string, string> = Object.fromEntries(
		items.map((it) => [it.id, it.title]),
	);
	const pledgeColumns = memberPledgeColumns({
		campaignMap: tenantCampaignMap,
		campaignItemMap: itemTitleMap,
		itemDeadlinesById,
	}).filter((col) => col.key !== "campaign");

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				back={{ href: `/${tenantSlug}/member/campaigns`, label: "Campaigns" }}
				title={
					isDeleted ? (
						<DeletedLabel deletedAt={campaign.deletedAt}>
							{campaign.title}
						</DeletedLabel>
					) : (
						campaign.title
					)
				}
				subtitle={subtitle}
				action={
					canPledge ? (
						<Button
							role="primary"
							onClick={openPledgeModal}
							className="hidden md:inline-flex"
						>
							{myActivePledges.length > 0
								? "Add another pledge"
								: "Make a pledge"}
						</Button>
					) : undefined
				}
			/>

			<div className="overflow-auto flex-1 px-4 pb-36 space-y-4 md:px-8 md:pb-8">
				{isDeleted && (
					<EntityRestoreBanner
						entityLabel="Campaign"
						deletedAt={campaign.deletedAt}
						memberVariant
					/>
				)}

				<Card padding={24}>
					{description && (
						<p className="mb-4 text-sm leading-relaxed text-muted-foreground">
							{description}
						</p>
					)}
					<StatBand
						mobileColumns={2}
						items={[
							{ label: "Goal", value: formatCompact(goal) },
							{
								label: "Raised",
								value: formatCompact(raised),
								caption: goal > 0 ? `${goalPct}% of goal` : "",
							},
							{
								label: "Pledged",
								value: formatCompact(pledged),
								caption:
									progressQ.data?.pledgeCount !== undefined
										? `${progressQ.data.pledgeCount} pledges`
										: "",
							},
							{
								label: "Your pledged",
								value: formatCompact(myPledged),
								caption:
									myPaid > 0 ? `${formatCompact(myPaid)} paid` : undefined,
							},
						]}
					/>
					{!isDeleted && (
						<div className="mt-5">
							<StackedProgressBar
								size="lg"
								total={goal > 0 ? goal : Math.max(pledged, raised, 1)}
								segments={[
									{
										value: pledged,
										color:
											"color-mix(in srgb, var(--chart-current) 28%, transparent)",
										label: "Pledged",
										displayValue: formatCompact(pledged),
									},
									{
										value: raised,
										color: "var(--chart-current)",
										label: "Raised",
										displayValue: formatCompact(raised),
									},
								]}
							/>
						</div>
					)}
				</Card>

				{hasSpark && (
					<Card padding={20}>
						<SectionTitle title="Your giving to this campaign" />
						<div className="flex items-end justify-between gap-4">
							<div>
								<div className="text-2xl font-semibold tabular-nums">
									{formatCompact(monthlySpark.reduce((s, v) => s + v, 0))}
								</div>
								<div className="mt-0.5 text-xs text-muted-foreground">
									Last 12 months
								</div>
							</div>
							<Sparkline
								data={monthlySpark}
								width={220}
								height={56}
								tone="current"
								title="Your monthly giving to this campaign, last 12 months"
							/>
						</div>
					</Card>
				)}

				{items.length > 0 && (
					<Card padding={24}>
						<SectionTitle title="Campaign items" />
						<div className="flex flex-col gap-3">
							{items.map((item) => {
								const itemProgress = itemProgressById.get(item.id);
								const target = num(item.targetAmount);
								const itemRaised = num(itemProgress?.raisedAmount ?? 0);
								const itemPledged = num(itemProgress?.pledgedAmount ?? 0);
								const itemDeleted = Boolean(item.deletedAt);
								return (
									<div key={item.id} className="flex flex-col">
										<div className="mb-1 flex items-center justify-between text-sm">
											<span className="font-medium text-foreground">
												{itemDeleted ? (
													<DeletedLabel deletedAt={item.deletedAt}>
														{item.title}
													</DeletedLabel>
												) : (
													item.title
												)}
											</span>
											<span className="tabular-nums text-muted-foreground">
												{formatCompact(itemRaised)} / {formatCompact(target)}
											</span>
										</div>
										{!isDeleted && !itemDeleted && target > 0 && (
											<StackedProgressBar
												size="xs"
												total={target}
												segments={[
													{
														value: itemPledged,
														color:
															"color-mix(in srgb, var(--chart-current) 28%, transparent)",
														label: "Pledged",
													},
													{
														value: itemRaised,
														color: "var(--chart-current)",
														label: "Raised",
													},
												]}
											/>
										)}
									</div>
								);
							})}
						</div>
					</Card>
				)}

				<div>
					<SectionTitle
						title="Your pledges"
						action={
							myPledges.length > 0 ? (
								<div className="flex flex-wrap gap-1.5">
									<Badge color="indigo">
										Pledged {formatCompact(myPledged)}
									</Badge>
									<Badge color="green">Paid {formatCompact(myPaid)}</Badge>
									{myRemaining > 0 && (
										<Badge color="gray">
											Remaining {formatCompact(myRemaining)}
										</Badge>
									)}
								</div>
							) : undefined
						}
					/>
					<DataTableShell<MemberPledgeRow>
						columns={pledgeColumns}
						mobileCard={(p) => (
							<MemberPledgeCard
								row={p}
								campaignMap={tenantCampaignMap}
								itemDeadlinesById={itemDeadlinesById}
								href={`/${tenantSlug}/member/my-pledges/${p.id}`}
								showCampaign={false}
							/>
						)}
						rows={myPledges as unknown as MemberPledgeRow[]}
						rowKey={(p) => p.id}
						loading={pledgesQ.isLoading}
						onRowClick={(p) =>
							router.push(`/${tenantSlug}/member/my-pledges/${p.id}`)
						}
						emptyTitle="No pledges yet"
						emptySubtitle="When you pledge to this campaign, your commitments will appear here."
					/>
				</div>
			</div>
		</div>
	);
};
