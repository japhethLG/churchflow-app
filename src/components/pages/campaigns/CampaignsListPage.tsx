"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
	Badge,
	Button,
	type DataTableColumn,
	DataTableShell,
	ExpandableCard,
	PageHeader,
	StackedProgressBar,
	useTableFilters,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { daysUntil, num, pct } from "../admin-shared";
import { useCampaignProgressMany } from "../dashboard/useCampaignProgressMany";

type Campaign = components["schemas"]["CampaignResponseDto"];

type StatusFilter = "all" | "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

const STATUS_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "DRAFT", label: "Draft" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "COMPLETED", label: "Completed" },
	{ value: "CANCELLED", label: "Cancelled" },
];

export const CampaignsListPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const t = useTableFilters({ status: "all", state: "active", search: "" });
	const status = t.values.status as StatusFilter;
	const search = t.values.search;

	const { data, isLoading } = useCampaigns(tenantSlug, {
		offset: t.offset,
		limit: t.limit,
		...t.stateFlags(),
	});

	const all: Campaign[] = data?.items ?? [];
	const total = data?.meta.total ?? 0;
	const filtered = useMemo(() => {
		let out = all;
		if (status !== "all") {
			out = out.filter((c) => c.status === status);
		}
		if (search.trim()) {
			const q = search.trim().toLowerCase();
			out = out.filter((c) => c.title.toLowerCase().includes(q));
		}
		return out;
	}, [all, status, search]);

	// Fan-out progress for the visible rows. We keep it bounded by limiting
	// the visible page; for a tenant with >25 campaigns, paginate or ask
	// backend for a bulk endpoint.
	const visibleIds = filtered.map((c) => c.id);
	const { progressById } = useCampaignProgressMany(tenantSlug, visibleIds);

	const activeCount = all.filter((c) => c.status === "ACTIVE").length;
	const completedCount = all.filter((c) => c.status === "COMPLETED").length;

	const aggregate = useMemo(() => {
		let goal = 0;
		let pledged = 0;
		let raised = 0;
		for (const c of filtered) {
			const p = progressById[c.id];
			if (!p) {
				continue;
			}
			goal += num(p.goalAmount);
			pledged += num(p.pledgedAmount);
			raised += num(p.raisedAmount);
		}
		return { goal, pledged, raised };
	}, [filtered, progressById]);

	const columns: DataTableColumn<Campaign>[] = [
		{
			key: "campaign",
			label: "Campaign",
			render: (c) => (
				<div>
					<div className="text-sm font-medium text-foreground">{c.title}</div>
					{typeof c.description === "string" && (
						<div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
							{c.description}
						</div>
					)}
				</div>
			),
		},
		{
			key: "progress",
			label: "Progress",
			width: "280px",
			render: (c) => {
				const p = progressById[c.id];
				if (!p || p.goalAmount === 0) {
					return (
						<span className="text-xs text-muted-foreground">no goal set</span>
					);
				}
				const raisedPct = pct(p.raisedAmount, p.goalAmount);
				const pledgedPct = pct(p.pledgedAmount, p.goalAmount);
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
								<span className="ml-1 text-muted-foreground">
									· {pledgedPct}% pledged
								</span>
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
				if (typeof c.deadline !== "string") {
					return <span className="text-xs text-muted-foreground">open</span>;
				}
				const days = daysUntil(c.deadline);
				if (c.status === "COMPLETED") {
					return (
						<div className="text-xs text-muted-foreground">
							{dayjs(c.deadline).format("MMM D, YYYY")}
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
							{dayjs(c.deadline).format("MMM D, YYYY")}
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
			render: (c) => (
				<Badge
					color={
						c.status === "ACTIVE"
							? "green"
							: c.status === "COMPLETED"
								? "blue"
								: c.status === "DRAFT"
									? "neutral"
									: "red"
					}
				>
					{c.status}
				</Badge>
			),
		},
	];

	// Sub-`md` row → expandable card. Collapsed: title/description/status +
	// progress bar. Expanded: deadline (+urgency), goal, raised, pledged.
	const renderCampaignCard = (c: Campaign) => {
		const p = progressById[c.id];
		const goal = num(p?.goalAmount);
		const raised = num(p?.raisedAmount);
		const pledged = num(p?.pledgedAmount);
		const raisedPct = pct(raised, goal);
		const pledgedPct = pct(pledged, goal);
		const days = typeof c.deadline === "string" ? daysUntil(c.deadline) : null;
		const deadlineTone =
			days !== null && days < 0
				? "red"
				: days !== null && days <= 14
					? "amber"
					: "neutral";
		const statusColor =
			c.status === "ACTIVE"
				? "green"
				: c.status === "COMPLETED"
					? "blue"
					: c.status === "DRAFT"
						? "neutral"
						: "red";
		return (
			<ExpandableCard
				href={`/${tenantSlug}/admin/campaigns/${c.id}`}
				deleted={Boolean(c.deletedAt)}
				details={[
					{
						label: "Deadline",
						value:
							typeof c.deadline === "string" ? (
								<div className="flex items-center justify-end gap-2">
									<span className="text-sm font-medium text-foreground">
										{dayjs(c.deadline).format("MMM D, YYYY")}
									</span>
									{days !== null && c.status !== "COMPLETED" && (
										<Badge color={deadlineTone}>
											{days < 0 ? `${Math.abs(days)}d past` : `${days}d left`}
										</Badge>
									)}
								</div>
							) : (
								<span className="text-sm text-muted-foreground">
									Open · no deadline
								</span>
							),
					},
					{
						label: "Goal",
						value: (
							<span className="text-sm font-medium text-foreground">
								{goal > 0 ? formatCurrency(goal, { decimals: 0 }) : "—"}
							</span>
						),
					},
					{
						label: "Raised",
						value: (
							<span className="text-sm font-medium text-foreground">
								{formatCurrency(raised, { decimals: 0 })} · {raisedPct}%
							</span>
						),
					},
					{
						label: "Pledged",
						value: (
							<span className="text-sm font-medium text-foreground">
								{formatCurrency(pledged, { decimals: 0 })} · {pledgedPct}%
							</span>
						),
					},
				]}
			>
				<div className="mb-3 flex items-start justify-between gap-2.5">
					<div className="min-w-0">
						<div className="text-sm font-semibold tracking-tight">
							{c.title}
						</div>
						{typeof c.description === "string" && (
							<div className="mt-0.5 truncate text-xs text-muted-foreground">
								{c.description}
							</div>
						)}
					</div>
					<Badge color={statusColor} dot>
						{c.status}
					</Badge>
				</div>
				{goal > 0 ? (
					<>
						<StackedProgressBar
							size="sm"
							total={goal}
							segments={[
								{
									value: pledged,
									color:
										"color-mix(in srgb, var(--chart-current) 28%, transparent)",
									label: "Pledged",
								},
								{
									value: raised,
									color: "var(--chart-current)",
									label: "Raised",
								},
							]}
						/>
						<div className="mt-1.5 flex items-baseline justify-between text-xs">
							<span className="tabular-nums text-muted-foreground">
								{formatCompact(raised)} / {formatCompact(goal)}
							</span>
							<span className="font-semibold tabular-nums">
								{raisedPct}%
								<span className="ml-1 font-normal text-muted-foreground">
									· {pledgedPct}% pledged
								</span>
							</span>
						</div>
					</>
				) : (
					<span className="text-xs text-muted-foreground">no goal set</span>
				)}
			</ExpandableCard>
		);
	};

	useMobileActions(
		useMemo(
			() => [
				{
					label: "New campaign",
					icon: "plus" as const,
					onClick: () => router.push(`/${tenantSlug}/admin/campaigns/new`),
				},
			],
			[router, tenantSlug],
		),
	);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="Drives"
				title="Campaigns"
				subtitle="Goal-driven drives with pledge tracking. Click a row to drill into items."
				action={
					<Button
						role="primary"
						icon="plus"
						className="hidden md:inline-flex"
						onClick={() => router.push(`/${tenantSlug}/admin/campaigns/new`)}
					>
						New campaign
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-4 pb-28 md:px-8 md:pb-8">
				<DataTableShell<Campaign>
					search={t.search("Search by title…")}
					filters={[t.select("status", "Status", STATUS_OPTIONS), t.state()]}
					onClearFilters={t.clear}
					stats={[
						{ label: "total", value: filtered.length },
						{ label: "active", value: activeCount, tone: "success" },
						{ label: "completed", value: completedCount },
						{
							label: "raised / goal (in view)",
							value:
								aggregate.goal > 0
									? `${formatCompact(aggregate.raised)} / ${formatCompact(aggregate.goal)}`
									: "—",
						},
					]}
					columns={columns}
					mobileCard={renderCampaignCard}
					rows={filtered}
					rowKey={(c) => c.id}
					loading={isLoading}
					onRowClick={(c) =>
						router.push(`/${tenantSlug}/admin/campaigns/${c.id}`)
					}
					rowClassName={(c) => (c.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No campaigns yet"
					emptySubtitle="Create your first campaign to start tracking goals."
					emptyAction={
						<Button
							role="primary"
							icon="plus"
							onClick={() => router.push(`/${tenantSlug}/admin/campaigns/new`)}
						>
							New campaign
						</Button>
					}
					pagination={t.pagination(total)}
				/>
			</div>
		</div>
	);
};
