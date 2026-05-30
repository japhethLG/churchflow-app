"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
	Badge,
	DataTableShell,
	type DateRangeValue,
	DeletedLabel,
	ExpandableCard,
	PageHeader,
	StackedProgressBar,
	useTableFilters,
} from "@/components/primitives";
import { useMyCampaigns } from "@/lib/api/campaigns";
import { useMyPledges } from "@/lib/api/pledges";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import {
	daysUntil,
	LIFECYCLE_LABEL,
	num,
	type PledgeLifecycle,
	pct,
	pledgeLifecycle,
	resolvePledgeDeadline,
} from "../admin-shared";
import { useMyCampaignsManyWithItems } from "../member-dashboard/useMyCampaignsManyWithItems";
import {
	type MemberPledgeRow,
	memberPledgeColumns,
} from "./MemberPledgesTable";

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

type LifecycleTab = "active" | "past" | "all";

const TAB_OPTIONS = [
	{ value: "active", label: "Active" },
	{ value: "past", label: "Past" },
	{ value: "all", label: "All" },
];

export const MemberMyPledgesPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const t = useTableFilters({
		search: "",
		tab: "active",
		campaign: "all",
		dateFrom: "",
		dateTo: "",
	});
	const tab = t.values.tab as LifecycleTab;
	const campaignId = t.values.campaign;
	const search = t.values.search;
	const range: DateRangeValue = {
		from: t.values.dateFrom || undefined,
		to: t.values.dateTo || undefined,
	};

	// Self-scoped automatically by URL prefix.
	const pledgesQ = useMyPledges(tenantSlug, {
		dateFrom: range.from
			? dayjs.utc(range.from).startOf("day").toISOString()
			: undefined,
		dateTo: range.to
			? dayjs.utc(range.to).endOf("day").toISOString()
			: undefined,
	});
	const pledges: MemberPledgeRow[] = pledgesQ.data?.items ?? [];

	// Include archived campaigns so deleted-campaign cells can render
	// Mode-B (DeletedLabel) with the original title.
	const campaignsQ = useMyCampaigns(tenantSlug, { includeDeleted: true });
	const campaigns = campaignsQ.data?.items ?? [];
	const campaignMap = useMemo(
		() => Object.fromEntries(campaigns.map((c) => [c.id, c])),
		[campaigns],
	);

	// Item deadlines for the campaigns referenced by these pledges — item
	// deadline wins over campaign deadline when set.
	const pledgeCampaignIds = useMemo(() => {
		const set = new Set<string>();
		for (const p of pledges) {
			if (p.campaignId) {
				set.add(p.campaignId);
			}
		}
		return Array.from(set);
	}, [pledges]);
	const { itemDeadlinesById } = useMyCampaignsManyWithItems(
		tenantSlug,
		pledgeCampaignIds,
	);

	const filtered = useMemo<MemberPledgeRow[]>(() => {
		let out = pledges;
		if (tab === "active") {
			out = out.filter((p) => p.status === "ACTIVE");
		} else if (tab === "past") {
			out = out.filter(
				(p) => p.status === "FULFILLED" || p.status === "CANCELLED",
			);
		}
		if (campaignId !== "all") {
			out = out.filter((p) => p.campaignId === campaignId);
		}
		const q = search.trim().toLowerCase();
		if (q) {
			out = out.filter((p) => {
				const title = campaignMap[p.campaignId]?.title?.toLowerCase() ?? "";
				return title.includes(q);
			});
		}
		return out;
	}, [pledges, tab, campaignId, search, campaignMap]);

	const visible = filtered.slice(t.offset, t.offset + t.limit);

	// Header stats scope to the *current view*, so the numbers always
	// describe what the member is looking at.
	const stats = useMemo(() => {
		let pledged = 0;
		let paid = 0;
		let remaining = 0;
		for (const p of filtered) {
			pledged += num(p.pledgedAmount);
			paid += num(p.paidAmount);
			remaining += num(p.remainingAmount);
		}
		return {
			count: filtered.length,
			pledged,
			paid,
			remaining,
			fulfillment: pct(paid, pledged),
		};
	}, [filtered]);

	const loading = pledgesQ.isLoading || campaignsQ.isLoading;

	const columns = memberPledgeColumns({ campaignMap, itemDeadlinesById });

	// Sub-`md` row → expandable card. Collapsed: campaign + pledged amount +
	// lifecycle. Expanded: paid (%), remaining, deadline.
	const renderPledgeCard = (row: MemberPledgeRow) => {
		const campaign = campaignMap[row.campaignId];
		const campaignTitle = campaign?.title ?? "Campaign";
		const campaignDeletedAt = campaign?.deletedAt ?? null;
		const deadline = resolvePledgeDeadline(row, campaign, itemDeadlinesById);
		const lifecycle = pledgeLifecycle(
			row.pledgedAmount,
			row.paidAmount,
			row.status,
			deadline,
		);
		const days = daysUntil(deadline);
		const paid = num(row.paidAmount);
		const pledged = num(row.pledgedAmount);
		const fulfillment = pct(paid, pledged);
		return (
			<ExpandableCard
				details={[
					{
						label: "Paid",
						value: (
							<div className="w-32">
								<StackedProgressBar
									size="xs"
									total={pledged > 0 ? pledged : 1}
									segments={[
										{
											value: paid,
											color: "var(--chart-current)",
											label: "Paid",
										},
									]}
								/>
								<div className="mt-1 flex items-baseline justify-between text-xs tabular-nums">
									<span className="text-muted-foreground">
										{formatCurrency(paid, { decimals: 0 })}
									</span>
									<span className="font-semibold text-foreground">
										{fulfillment}%
									</span>
								</div>
							</div>
						),
					},
					{
						label: "Remaining",
						value: (
							<span className="text-sm font-medium text-foreground tabular-nums">
								{formatCurrency(num(row.remainingAmount))}
							</span>
						),
					},
					{
						label: "Deadline",
						value:
							days === null ? (
								<span className="text-sm text-muted-foreground">open</span>
							) : (
								<span className="text-sm font-medium text-foreground">
									{days < 0
										? `${Math.abs(days)}d past`
										: days === 0
											? "Due today"
											: `${days}d left`}
								</span>
							),
					},
				]}
			>
				<div className="flex items-start gap-3">
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold tracking-tight">
							{campaignDeletedAt ? (
								<DeletedLabel deletedAt={campaignDeletedAt}>
									{campaignTitle}
								</DeletedLabel>
							) : (
								campaignTitle
							)}
						</div>
						<div className="truncate text-xs text-muted-foreground">
							Pledged {dayjs(row.createdAt).format("ll")}
						</div>
					</div>
					<div className="flex shrink-0 flex-col items-end gap-1">
						<span className="text-sm font-bold tabular-nums tracking-tight">
							{formatCurrency(row.pledgedAmount, { decimals: 0 })}
						</span>
						<Badge color={lifecycleBadgeColor(lifecycle)}>
							{LIFECYCLE_LABEL[lifecycle]}
						</Badge>
					</div>
				</div>
			</ExpandableCard>
		);
	};

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="My pledges"
				title="Your pledges"
				subtitle="Track your commitments to church campaigns."
			/>

			<div className="overflow-auto flex-1 px-4 pb-28 md:px-8 md:pb-8">
				<DataTableShell<MemberPledgeRow>
					search={t.search("Search by campaign…")}
					filters={[
						t.select("tab", "Status", TAB_OPTIONS),
						t.select("campaign", "Campaign", [
							{ value: "all", label: "All campaigns" },
							...campaigns.map((c) => ({ value: c.id, label: c.title })),
						]),
						t.date("Date range"),
					]}
					onClearFilters={t.clear}
					mobileCard={renderPledgeCard}
					stats={[
						{ label: "pledges", value: stats.count },
						{ label: "pledged", value: formatCurrency(stats.pledged) },
						{
							label: "paid",
							value: formatCurrency(stats.paid),
							tone: "success",
						},
						{ label: "remaining", value: formatCurrency(stats.remaining) },
						{ label: "fulfillment", value: `${stats.fulfillment}%` },
					]}
					columns={columns}
					rows={visible}
					rowKey={(r) => r.id}
					loading={loading}
					onRowClick={(r) =>
						router.push(`/${tenantSlug}/member/my-pledges/${r.id}`)
					}
					emptyTitle={tab === "past" ? "No past pledges yet" : "No pledges yet"}
					emptySubtitle={
						tab === "past"
							? "Fulfilled and cancelled pledges will appear here."
							: "When you pledge to a campaign, it'll appear here."
					}
					pagination={t.pagination(filtered.length)}
				/>
			</div>
		</div>
	);
};
