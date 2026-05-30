"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
	Avatar,
	Badge,
	Button,
	type DataTableColumn,
	DataTableShell,
	type DateRangeValue,
	ExpandableCard,
	PageHeader,
	StackedProgressBar,
	useTableFilters,
} from "@/components/primitives";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { usePledges } from "@/lib/api/pledges";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { openModal } from "@/lib/modals/store";
import { openSheet } from "@/lib/sheets/store";
import {
	daysUntil,
	LIFECYCLE_LABEL,
	num,
	type PledgeLifecycle,
	pct,
	pledgeLifecycle,
	resolvePledgeDeadline,
} from "../admin-shared";
import { useCampaignsManyWithItems } from "../dashboard/useCampaignsManyWithItems";

type StatusFilter = "all" | "ACTIVE" | "FULFILLED" | "CANCELLED";
type LifecycleFilter = "all" | PledgeLifecycle;

const STATUS_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "FULFILLED", label: "Fulfilled" },
	{ value: "CANCELLED", label: "Cancelled" },
];

const LIFECYCLE_OPTIONS = [
	{ value: "all", label: "All lifecycle" },
	{ value: "past-due", label: "Past due" },
	{ value: "due-soon", label: "Due soon (≤14d)" },
	{ value: "on-track", label: "On track" },
	{ value: "fulfilled", label: "Fulfilled" },
	{ value: "no-deadline", label: "No deadline" },
];

const lifecycleBadgeColor = (
	l: PledgeLifecycle,
): "green" | "red" | "amber" | "neutral" | "blue" =>
	l === "past-due"
		? "red"
		: l === "due-soon"
			? "amber"
			: l === "fulfilled"
				? "green"
				: l === "on-track"
					? "blue"
					: "neutral";

export const PledgesListPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	// URL-driven filters — sets the contract that other surfaces deep-link
	// into ("View past-due pledges" cards on Reports Pledge Dynamics).
	const t = useTableFilters(
		{
			status: "all",
			lifecycle: "all",
			state: "active",
			search: "",
			dateFrom: "",
			dateTo: "",
		},
		{ url: true },
	);
	const status = t.values.status as StatusFilter;
	const lifecycle = t.values.lifecycle as LifecycleFilter;
	const search = t.values.search;
	const range: DateRangeValue = {
		from: t.values.dateFrom || undefined,
		to: t.values.dateTo || undefined,
	};

	// The backend filters pledges by status / soft-delete only. Date-range
	// is applied client-side against `createdAt` because the API doesn't
	// take a pledge-level dateFrom/dateTo today.
	const { data, isLoading } = usePledges(tenantSlug, {
		status: status === "all" ? undefined : status,
		offset: t.offset,
		limit: t.limit,
		...t.stateFlags(),
	});

	// Joins — needed for lifecycle (campaign deadline) and member names.
	const campaignsQ = useCampaigns(tenantSlug, { includeDeleted: true });
	const membersQ = useMembers(tenantSlug, { limit: 500, includeDeleted: true });

	const campaignsById = useMemo(
		() =>
			Object.fromEntries((campaignsQ.data?.items ?? []).map((c) => [c.id, c])),
		[campaignsQ.data],
	);
	const membersById = useMemo(
		() =>
			Object.fromEntries((membersQ.data?.items ?? []).map((m) => [m.id, m])),
		[membersQ.data],
	);

	const rows = data?.items ?? [];
	const total = data?.meta.total ?? 0;

	// Item deadlines for the campaigns in view — item deadline wins over
	// campaign deadline when set (advance-deadline use case).
	const visibleCampaignIds = useMemo(() => {
		const set = new Set<string>();
		for (const p of rows) {
			if (p.campaignId) {
				set.add(p.campaignId);
			}
		}
		return Array.from(set);
	}, [rows]);
	const { itemDeadlinesById } = useCampaignsManyWithItems(
		tenantSlug,
		visibleCampaignIds,
	);

	const enriched = useMemo(() => {
		return rows.map((p) => {
			const c = campaignsById[p.campaignId];
			const deadline = resolvePledgeDeadline(p, c, itemDeadlinesById);
			return {
				p,
				deadline,
				days: daysUntil(deadline),
				lifecycle: pledgeLifecycle(
					p.pledgedAmount,
					p.paidAmount,
					p.status,
					deadline,
				),
				memberName: (() => {
					const m = membersById[p.memberId];
					return m
						? `${m.firstName} ${m.lastName}`.trim() || "Unnamed"
						: "Unknown";
				})(),
				campaignTitle: c?.title ?? "Unknown campaign",
			};
		});
	}, [rows, campaignsById, membersById, itemDeadlinesById]);

	const filtered = useMemo(() => {
		let out = enriched;
		if (lifecycle !== "all") {
			out = out.filter((r) => r.lifecycle === lifecycle);
		}
		if (range.from) {
			const from = dayjs(range.from).startOf("day");
			out = out.filter((r) => !dayjs(r.p.createdAt).isBefore(from));
		}
		if (range.to) {
			const to = dayjs(range.to).endOf("day");
			out = out.filter((r) => !dayjs(r.p.createdAt).isAfter(to));
		}
		if (search.trim()) {
			const q = search.trim().toLowerCase();
			out = out.filter(
				(r) =>
					r.memberName.toLowerCase().includes(q) ||
					r.campaignTitle.toLowerCase().includes(q),
			);
		}
		return out;
	}, [enriched, lifecycle, range.from, range.to, search]);

	// Slice aggregates — over the current filter, not just visible page.
	const agg = useMemo(() => {
		let pledged = 0;
		let paid = 0;
		let remaining = 0;
		const byLifecycle: Record<PledgeLifecycle, number> = {
			fulfilled: 0,
			"on-track": 0,
			"due-soon": 0,
			"past-due": 0,
			"no-deadline": 0,
			cancelled: 0,
		};
		for (const r of filtered) {
			pledged += num(r.p.pledgedAmount);
			paid += num(r.p.paidAmount);
			remaining += num(r.p.remainingAmount);
			byLifecycle[r.lifecycle] += 1;
		}
		return { pledged, paid, remaining, byLifecycle };
	}, [filtered]);

	const fulfillmentPct = pct(agg.paid, agg.pledged);

	const columns: DataTableColumn<(typeof enriched)[number]>[] = [
		{
			key: "member",
			label: "Member",
			render: (r) => (
				<div className="flex items-center gap-2.5">
					<Avatar name={r.memberName} size={28} />
					<div>
						<Link
							href={`/${tenantSlug}/admin/members/${r.p.memberId}`}
							onClick={(e) => e.stopPropagation()}
							className="text-sm font-medium text-foreground hover:underline"
						>
							{r.memberName}
						</Link>
						<div className="text-xs text-muted-foreground">
							<Link
								href={`/${tenantSlug}/admin/campaigns/${r.p.campaignId}`}
								onClick={(e) => e.stopPropagation()}
								className="hover:underline"
							>
								{r.campaignTitle}
							</Link>
						</div>
					</div>
				</div>
			),
		},
		{
			key: "pledged",
			label: "Pledged",
			width: "110px",
			align: "right",
			render: (r) => (
				<span className="text-sm font-medium tabular-nums text-foreground">
					{formatCurrency(r.p.pledgedAmount, { decimals: 0 })}
				</span>
			),
		},
		{
			key: "paid",
			label: "Paid",
			width: "240px",
			render: (r) => {
				const fPct = pct(r.p.paidAmount, r.p.pledgedAmount);
				return (
					<div>
						<StackedProgressBar
							size="sm"
							total={r.p.pledgedAmount}
							segments={[
								{
									value: r.p.paidAmount,
									color: "var(--chart-current)",
									label: "Paid",
								},
							]}
						/>
						<div className="mt-1 flex items-baseline justify-between text-xs tabular-nums">
							<span className="text-muted-foreground">
								{formatCompact(r.p.paidAmount)}
							</span>
							<span className="font-semibold text-foreground">{fPct}%</span>
						</div>
					</div>
				);
			},
		},
		{
			key: "remaining",
			label: "Remaining",
			width: "110px",
			align: "right",
			render: (r) => (
				<span
					className={`text-sm font-medium tabular-nums ${
						r.p.remainingAmount > 0
							? "text-foreground"
							: "text-muted-foreground"
					}`}
				>
					{formatCurrency(r.p.remainingAmount, { decimals: 0 })}
				</span>
			),
		},
		{
			key: "deadline",
			label: "Deadline",
			width: "110px",
			render: (r) => {
				if (!r.deadline) {
					return <span className="text-xs text-muted-foreground">—</span>;
				}
				return (
					<div className="text-xs">
						<div className="text-muted-foreground">
							{dayjs(r.deadline).format("MMM D, YYYY")}
						</div>
						{r.days !== null && r.p.status === "ACTIVE" && (
							<div
								className={`tabular-nums ${
									r.days < 0
										? "text-(--chart-negative) font-semibold"
										: r.days <= 14
											? "text-(--chart-goal) font-semibold"
											: "text-muted-foreground"
								}`}
							>
								{r.days < 0 ? `${Math.abs(r.days)}d past` : `${r.days}d left`}
							</div>
						)}
					</div>
				);
			},
		},
		{
			key: "lifecycle",
			label: "Lifecycle",
			width: "130px",
			render: (r) => (
				<Badge color={lifecycleBadgeColor(r.lifecycle)}>
					{LIFECYCLE_LABEL[r.lifecycle]}
				</Badge>
			),
		},
	];

	// Sub-`md` row → expandable card. Collapsed: member/campaign + pledged +
	// lifecycle + paid bar. Expanded: paid (₱+%), remaining, deadline (+days).
	const renderPledgeCard = (r: (typeof enriched)[number]) => {
		const paidPct = pct(r.p.paidAmount, r.p.pledgedAmount);
		return (
			<ExpandableCard
				href={`/${tenantSlug}/admin/pledges/${r.p.id}`}
				deleted={Boolean(r.p.deletedAt)}
				details={[
					{
						label: "Paid",
						value: (
							<span className="text-sm font-medium text-foreground">
								{formatCurrency(r.p.paidAmount, { decimals: 0 })} · {paidPct}%
							</span>
						),
					},
					{
						label: "Remaining",
						value: (
							<span
								className={`text-sm font-medium ${
									r.p.remainingAmount > 0
										? "text-foreground"
										: "text-muted-foreground"
								}`}
							>
								{formatCurrency(r.p.remainingAmount, { decimals: 0 })}
							</span>
						),
					},
					{
						label: "Deadline",
						value: (
							<div className="flex items-center justify-end gap-2">
								{r.deadline ? (
									<span className="text-sm font-medium text-foreground">
										{dayjs(r.deadline).format("MMM D, YYYY")}
									</span>
								) : (
									<span className="text-sm text-muted-foreground">—</span>
								)}
								{r.days !== null && r.p.status === "ACTIVE" && (
									<span
										className={`text-xs font-semibold tabular-nums ${
											r.days < 0
												? "text-(--chart-negative)"
												: r.days <= 14
													? "text-(--chart-goal)"
													: "text-muted-foreground"
										}`}
									>
										{r.days < 0
											? `${Math.abs(r.days)}d past`
											: `${r.days}d left`}
									</span>
								)}
							</div>
						),
					},
				]}
			>
				<div className="mb-3 flex items-center gap-3">
					<Avatar name={r.memberName} size={36} />
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold tracking-tight">
							{r.memberName}
						</div>
						<div className="truncate text-xs text-muted-foreground">
							{r.campaignTitle}
						</div>
					</div>
					<div className="flex shrink-0 flex-col items-end gap-1">
						<span className="text-[15px] font-bold tabular-nums tracking-tight">
							{formatCurrency(r.p.pledgedAmount, { decimals: 0 })}
						</span>
						<Badge color={lifecycleBadgeColor(r.lifecycle)}>
							{LIFECYCLE_LABEL[r.lifecycle]}
						</Badge>
					</div>
				</div>
				<StackedProgressBar
					size="sm"
					total={r.p.pledgedAmount}
					segments={[
						{
							value: r.p.paidAmount,
							color: "var(--chart-current)",
							label: "Paid",
						},
					]}
				/>
				<div className="mt-1.5 flex items-baseline justify-between text-xs">
					<span className="tabular-nums text-muted-foreground">
						{formatCompact(r.p.paidAmount)} paid
					</span>
					<span className="font-semibold tabular-nums">{paidPct}%</span>
				</div>
			</ExpandableCard>
		);
	};

	const hasCampaigns = (campaignsQ.data?.items.length ?? 0) > 0;
	const defaultPledgeCampaign = () => {
		const list = campaignsQ.data?.items ?? [];
		return list.find((x) => x.status === "ACTIVE") ?? list[0];
	};
	// Desktop → modal.
	const openCreatePledge = () => {
		const c = defaultPledgeCampaign();
		if (!c) {
			return;
		}
		openModal("create-pledge", {
			tenantSlug,
			campaignId: c.id,
			campaignTitle: c.title,
			items: [],
		});
	};
	// Mobile → bottom sheet (same admin/tenant intent).
	const openCreatePledgeSheet = () => {
		const c = defaultPledgeCampaign();
		if (!c) {
			return;
		}
		openSheet("pledge", {
			intent: "tenant",
			tenantSlug,
			campaignId: c.id,
			campaignTitle: c.title,
			items: [],
		});
	};

	useMobileActions(
		// Hidden until there's a campaign to pledge against (mirrors the
		// disabled state of the desktop button).
		useMemo(
			() =>
				hasCampaigns
					? [
							{
								label: "Record pledge",
								icon: "plus" as const,
								onClick: openCreatePledgeSheet,
							},
						]
					: [],
			// biome-ignore lint/correctness/useExhaustiveDependencies: openCreatePledgeSheet reads campaignsQ fresh; gate on availability
			[hasCampaigns, openCreatePledgeSheet],
		),
	);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="Commitments"
				title="Pledges"
				subtitle="Pledged · paid · remaining · lifecycle. The AR view for incoming giving."
				action={
					<Button
						role="primary"
						icon="plus"
						className="hidden md:inline-flex"
						disabled={!hasCampaigns}
						onClick={openCreatePledge}
					>
						Record pledge
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-4 pb-36 md:px-8 md:pb-8">
				<DataTableShell
					search={t.search("Search by member or campaign…")}
					filters={[
						t.select("status", "Status", STATUS_OPTIONS),
						t.select("lifecycle", "Lifecycle", LIFECYCLE_OPTIONS),
						t.state(),
						t.date("Created"),
					]}
					onClearFilters={t.clear}
					stats={[
						{ label: "in view", value: filtered.length },
						{ label: "pledged", value: formatCompact(agg.pledged) },
						{
							label: "paid",
							value: formatCompact(agg.paid),
							tone: "success",
						},
						{
							label: "remaining",
							value: formatCompact(agg.remaining),
							tone: agg.remaining > 0 ? "warning" : "neutral",
						},
						{
							label: "fulfillment",
							value: `${fulfillmentPct}%`,
						},
						{
							label: "past due",
							value: agg.byLifecycle["past-due"],
							tone: agg.byLifecycle["past-due"] > 0 ? "danger" : "neutral",
						},
					]}
					columns={columns}
					mobileCard={renderPledgeCard}
					rows={filtered}
					rowKey={(r) => r.p.id}
					loading={isLoading || campaignsQ.isLoading || membersQ.isLoading}
					onRowClick={(r) =>
						router.push(`/${tenantSlug}/admin/pledges/${r.p.id}`)
					}
					rowClassName={(r) => (r.p.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No pledges yet"
					emptySubtitle="Record a pledge to start tracking commitments."
					pagination={t.pagination(total)}
				/>
			</div>
		</div>
	);
};
