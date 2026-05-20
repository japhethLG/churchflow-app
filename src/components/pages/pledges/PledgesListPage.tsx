"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Avatar,
	Badge,
	Button,
	type DataTableColumn,
	DataTableShell,
	DateRangePicker,
	type DateRangeValue,
	PageHeader,
	StackedProgressBar,
	type StateFilterValue,
	toStateFilterFlags,
} from "@/components/primitives";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { usePledges } from "@/lib/api/pledges";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { openModal } from "@/lib/modals/store";
import { useUrlFilters } from "@/lib/url-filters";
import {
	daysUntil,
	LIFECYCLE_LABEL,
	num,
	type PledgeLifecycle,
	pct,
	pledgeLifecycle,
} from "../admin-shared";

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
	const [filters, setFilters] = useUrlFilters({
		status: "all",
		lifecycle: "all",
		state: "active",
		search: "",
		dateFrom: "",
		dateTo: "",
	});
	const status = filters.status as StatusFilter;
	const lifecycle = filters.lifecycle as LifecycleFilter;
	const state = filters.state as StateFilterValue;
	const search = filters.search;
	const range: DateRangeValue = {
		from: filters.dateFrom || undefined,
		to: filters.dateTo || undefined,
	};

	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(20);

	// The backend filters pledges by status / soft-delete only. Date-range
	// is applied client-side against `createdAt` because the API doesn't
	// take a pledge-level dateFrom/dateTo today.
	const { data, isLoading } = usePledges(tenantSlug, {
		status: status === "all" ? undefined : status,
		offset,
		limit,
		...toStateFilterFlags(state),
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

	const enriched = useMemo(() => {
		return rows.map((p) => {
			const c = campaignsById[p.campaignId];
			const deadline = typeof c?.deadline === "string" ? c.deadline : null;
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
	}, [rows, campaignsById, membersById]);

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

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Commitments"
				title="Pledges"
				subtitle="Pledged · paid · remaining · lifecycle. The AR view for incoming giving."
				action={
					<Button
						role="primary"
						icon="plus"
						disabled={(campaignsQ.data?.items.length ?? 0) === 0}
						onClick={() => {
							const list = campaignsQ.data?.items ?? [];
							const c = list.find((x) => x.status === "ACTIVE") ?? list[0];
							if (!c) {
								return;
							}
							openModal("create-pledge", {
								tenantSlug,
								campaignId: c.id,
								campaignTitle: c.title,
								items: [],
							});
						}}
					>
						Record pledge
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<DataTableShell
					search={{
						value: search,
						onChange: (v) => {
							setFilters({ search: v });
							setOffset(0);
						},
						placeholder: "Search by member or campaign…",
					}}
					filters={[
						{
							key: "status",
							label: "Status",
							value: status,
							onChange: (v) => {
								setFilters({ status: v });
								setOffset(0);
							},
							options: STATUS_OPTIONS,
						},
						{
							key: "lifecycle",
							label: "Lifecycle",
							value: lifecycle,
							onChange: (v) => {
								setFilters({ lifecycle: v });
								setOffset(0);
							},
							options: LIFECYCLE_OPTIONS,
						},
					]}
					onClearFilters={() =>
						setFilters({
							status: "all",
							lifecycle: "all",
							dateFrom: "",
							dateTo: "",
						})
					}
					state={{
						value: state,
						onChange: (v) => {
							setFilters({ state: v });
							setOffset(0);
						},
					}}
					toolbar={
						<DateRangePicker
							value={range}
							onChange={(v) => {
								setFilters({
									dateFrom: v.from ?? "",
									dateTo: v.to ?? "",
								});
								setOffset(0);
							}}
							placeholder="Created"
							size="sm"
							autoWidth
							clearable
						/>
					}
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
					rows={filtered}
					rowKey={(r) => r.p.id}
					loading={isLoading || campaignsQ.isLoading || membersQ.isLoading}
					onRowClick={(r) =>
						router.push(`/${tenantSlug}/admin/pledges/${r.p.id}`)
					}
					rowClassName={(r) => (r.p.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No pledges yet"
					emptySubtitle="Record a pledge to start tracking commitments."
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
