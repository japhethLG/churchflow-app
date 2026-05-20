"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Badge,
	Button,
	type DataTableColumn,
	DataTableShell,
	PageHeader,
	StackedProgressBar,
	type StateFilterValue,
	toStateFilterFlags,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import dayjs from "@/lib/dayjs";
import { formatCompact } from "@/lib/format-currency";
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

	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<StatusFilter>("all");
	const [state, setState] = useState<StateFilterValue>("active");
	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(20);

	const { data, isLoading } = useCampaigns(tenantSlug, {
		offset,
		limit,
		...toStateFilterFlags(state),
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

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Drives"
				title="Campaigns"
				subtitle="Goal-driven drives with pledge tracking. Click a row to drill into items."
				action={
					<Button
						role="primary"
						icon="plus"
						onClick={() => router.push(`/${tenantSlug}/admin/campaigns/new`)}
					>
						New campaign
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<DataTableShell<Campaign>
					search={{
						value: search,
						onChange: (v) => {
							setSearch(v);
							setOffset(0);
						},
						placeholder: "Search by title…",
					}}
					filters={[
						{
							key: "status",
							label: "Status",
							value: status,
							onChange: (v) => {
								setStatus(v as StatusFilter);
								setOffset(0);
							},
							options: STATUS_OPTIONS,
						},
					]}
					onClearFilters={() => {
						setStatus("all");
						setOffset(0);
					}}
					state={{
						value: state,
						onChange: (v) => {
							setState(v);
							setOffset(0);
						},
					}}
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
					pagination={{
						total,
						offset,
						limit,
						onOffsetChange: setOffset,
						onLimitChange: setLimit,
					}}
				/>
			</div>
		</div>
	);
};
