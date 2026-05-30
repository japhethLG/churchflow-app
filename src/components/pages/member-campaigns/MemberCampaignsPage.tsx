"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
	Badge,
	type DataTableColumn,
	DataTableShell,
	ExpandableCard,
	PageHeader,
	StackedProgressBar,
	type Status,
	StatusBadge,
	useTableFilters,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useMyCampaigns } from "@/lib/api/campaigns";
import { nstr } from "@/lib/api/coerce";
import { useMyPledges } from "@/lib/api/pledges";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { daysUntil, num, pct } from "../admin-shared";
import { useMyCampaignProgressMany } from "../member-dashboard/useMyCampaignProgressMany";

type Campaign = components["schemas"]["CampaignResponseDto"];

type StatusFilter = "all" | "ACTIVE" | "DRAFT" | "COMPLETED" | "CANCELLED";

const STATUS_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "DRAFT", label: "Upcoming" },
	{ value: "COMPLETED", label: "Completed" },
	{ value: "CANCELLED", label: "Cancelled" },
];

const STATUS_MAP: Record<Campaign["status"], Status> = {
	DRAFT: "Upcoming",
	ACTIVE: "Active",
	COMPLETED: "Completed",
	CANCELLED: "Cancelled",
};

export const MemberCampaignsPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const t = useTableFilters({ search: "", status: "all" });
	const status = t.values.status as StatusFilter;
	const search = t.values.search;

	const campaignsQ = useMyCampaigns(tenantSlug);
	const campaigns = campaignsQ.data?.items ?? [];

	const pledgesQ = useMyPledges(tenantSlug);
	const pledges = pledgesQ.data?.items ?? [];

	// Member's pledged total per campaign — used to surface a small
	// "your pledge" chip in the campaign row.
	const myPledgeByCampaign = useMemo(() => {
		const map: Record<string, { active: number; total: number }> = {};
		for (const p of pledges) {
			const entry = map[p.campaignId] ?? { active: 0, total: 0 };
			entry.total += num(p.pledgedAmount);
			if (p.status === "ACTIVE") {
				entry.active += num(p.pledgedAmount);
			}
			map[p.campaignId] = entry;
		}
		return map;
	}, [pledges]);

	const filtered = useMemo(() => {
		let out = campaigns;
		if (status !== "all") {
			out = out.filter((c) => c.status === status);
		}
		const q = search.trim().toLowerCase();
		if (q) {
			out = out.filter((c) => c.title.toLowerCase().includes(q));
		}
		return out;
	}, [campaigns, status, search]);

	const visible = filtered.slice(t.offset, t.offset + t.limit);

	// Batch progress for the campaigns visible on the current page.
	const visibleIds = visible.map((c) => c.id);
	const { progressById } = useMyCampaignProgressMany(tenantSlug, visibleIds);

	// Aggregate stats — across active campaigns (using the progress map
	// for the rows we actually have data for).
	const activeCount = campaigns.filter((c) => c.status === "ACTIVE").length;
	const upcomingCount = campaigns.filter((c) => c.status === "DRAFT").length;
	const aggregate = useMemo(() => {
		let goal = 0;
		let raised = 0;
		for (const c of campaigns) {
			if (c.status !== "ACTIVE") {
				continue;
			}
			const p = progressById[c.id];
			if (!p) {
				continue;
			}
			goal += num(p.goalAmount);
			raised += num(p.raisedAmount);
		}
		return { goal, raised };
	}, [campaigns, progressById]);

	const columns: DataTableColumn<Campaign>[] = [
		{
			key: "campaign",
			label: "Campaign",
			render: (c) => {
				const description = nstr(c.description);
				const mine = myPledgeByCampaign[c.id];
				return (
					<div className="min-w-0">
						<div className="truncate text-sm font-medium text-foreground">
							{c.title}
						</div>
						{description && (
							<div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
								{description}
							</div>
						)}
						{mine && mine.active > 0 && (
							<Badge color="indigo" className="mt-1.5">
								Your pledge · {formatCurrency(mine.active, { decimals: 0 })}
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			key: "progress",
			label: "Progress",
			width: "260px",
			render: (c) => {
				const p = progressById[c.id];
				if (!p || p.goalAmount === 0) {
					return (
						<span className="text-xs text-muted-foreground">no goal set</span>
					);
				}
				const raisedPct = pct(p.raisedAmount, p.goalAmount);
				return (
					<div>
						<StackedProgressBar
							size="sm"
							total={p.goalAmount}
							segments={[
								{
									value: p.pledgedAmount,
									color:
										"color-mix(in srgb, var(--chart-current) 28%, transparent)",
									label: "Pledged",
								},
								{
									value: p.raisedAmount,
									color: "var(--chart-current)",
									label: "Raised",
								},
							]}
						/>
						<div className="mt-1 flex items-baseline justify-between text-xs">
							<span className="tabular-nums text-muted-foreground">
								{formatCompact(p.raisedAmount)} / {formatCompact(p.goalAmount)}
							</span>
							<span className="font-semibold tabular-nums text-foreground">
								{raisedPct}%
							</span>
						</div>
					</div>
				);
			},
		},
		{
			key: "deadline",
			label: "Deadline",
			width: "130px",
			render: (c) => {
				const deadline = nstr(c.deadline);
				if (!deadline) {
					return <span className="text-xs text-muted-foreground">open</span>;
				}
				const days = daysUntil(deadline);
				if (c.status === "COMPLETED" || c.status === "CANCELLED") {
					return (
						<div className="text-xs text-muted-foreground">
							{dayjs(deadline).format("MMM D, YYYY")}
						</div>
					);
				}
				const tone =
					days !== null && days < 0
						? "red"
						: days !== null && days <= 14
							? "amber"
							: "neutral";
				return (
					<div>
						<div className="text-xs text-muted-foreground">
							{dayjs(deadline).format("MMM D, YYYY")}
						</div>
						<Badge color={tone} className="mt-0.5">
							{days !== null && days < 0
								? `${Math.abs(days)}d past`
								: `${days}d left`}
						</Badge>
					</div>
				);
			},
		},
		{
			key: "status",
			label: "Status",
			width: "120px",
			render: (c) => <StatusBadge status={STATUS_MAP[c.status]} />,
		},
	];

	// Sub-`md` row → expandable card. Collapsed: title + your-pledge + status.
	// Expanded: progress (raised/goal + %), deadline.
	const renderCampaignCard = (c: Campaign) => {
		const description = nstr(c.description);
		const mine = myPledgeByCampaign[c.id];
		const p = progressById[c.id];
		const hasGoal = p && p.goalAmount > 0;
		const deadline = nstr(c.deadline);
		const days = deadline ? daysUntil(deadline) : null;
		const isClosed = c.status === "COMPLETED" || c.status === "CANCELLED";
		return (
			<ExpandableCard
				href={`/${tenantSlug}/member/campaigns/${c.id}`}
				details={[
					{
						label: "Progress",
						value: hasGoal ? (
							<span className="text-sm font-medium text-foreground tabular-nums">
								{formatCompact(p.raisedAmount)} / {formatCompact(p.goalAmount)}{" "}
								· {pct(p.raisedAmount, p.goalAmount)}%
							</span>
						) : (
							<span className="text-sm text-muted-foreground">no goal set</span>
						),
					},
					{
						label: "Deadline",
						value: !deadline ? (
							<span className="text-sm text-muted-foreground">open</span>
						) : (
							<span className="flex items-center justify-end gap-2">
								<span className="text-sm font-medium text-foreground">
									{dayjs(deadline).format("MMM D, YYYY")}
								</span>
								{!isClosed && days !== null && (
									<Badge
										color={days < 0 ? "red" : days <= 14 ? "amber" : "neutral"}
									>
										{days < 0 ? `${Math.abs(days)}d past` : `${days}d left`}
									</Badge>
								)}
							</span>
						),
					},
				]}
			>
				<div className="flex items-start gap-3">
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold tracking-tight">
							{c.title}
						</div>
						{description && (
							<div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
								{description}
							</div>
						)}
						{mine && mine.active > 0 && (
							<Badge color="indigo" className="mt-1.5">
								Your pledge · {formatCurrency(mine.active, { decimals: 0 })}
							</Badge>
						)}
					</div>
					<StatusBadge status={STATUS_MAP[c.status]} />
				</div>
			</ExpandableCard>
		);
	};

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="Campaigns"
				title="Church campaigns"
				subtitle="Browse fundraising campaigns at your church and track progress."
			/>

			<div className="overflow-auto flex-1 px-4 pb-28 md:px-8 md:pb-8">
				<DataTableShell<Campaign>
					search={t.search("Search by title…")}
					filters={[t.select("status", "Status", STATUS_OPTIONS)]}
					onClearFilters={t.clear}
					mobileCard={renderCampaignCard}
					stats={[
						{ label: "active", value: activeCount, tone: "success" },
						{ label: "upcoming", value: upcomingCount },
						{
							label: "raised / goal (active)",
							value:
								aggregate.goal > 0
									? `${formatCompact(aggregate.raised)} / ${formatCompact(aggregate.goal)}`
									: "—",
						},
					]}
					columns={columns}
					rows={visible}
					rowKey={(c) => c.id}
					loading={campaignsQ.isLoading}
					onRowClick={(c) =>
						router.push(`/${tenantSlug}/member/campaigns/${c.id}`)
					}
					emptyTitle="No campaigns yet"
					emptySubtitle="Your church hasn't started any campaigns. Check back later!"
					pagination={t.pagination(filtered.length)}
				/>
			</div>
		</div>
	);
};
