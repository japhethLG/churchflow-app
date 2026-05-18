"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Badge,
	type DataTableColumn,
	DataTableShell,
	StackedProgressBar,
	type StateFilterValue,
	toStateFilterFlags,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { usePledges } from "@/lib/api/pledges";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import {
	daysUntil,
	LIFECYCLE_LABEL,
	num,
	type PledgeLifecycle,
	pct,
	pledgeLifecycle,
} from "../admin-shared";

type Member = components["schemas"]["MemberResponseDto"];
type Pledge = components["schemas"]["PledgeResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

type StatusFilter = "all" | "ACTIVE" | "FULFILLED" | "CANCELLED";

const STATUS_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "FULFILLED", label: "Fulfilled" },
	{ value: "CANCELLED", label: "Cancelled" },
];

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

type Row = {
	p: Pledge;
	deadline: string | null;
	days: number | null;
	lifecycle: PledgeLifecycle;
	campaign: Campaign | undefined;
};

export const MemberPledgesTab = ({
	member,
	tenantSlug,
}: {
	member: Member;
	tenantSlug: string;
}) => {
	const router = useRouter();
	const [status, setStatus] = useState<StatusFilter>("all");
	const [state, setState] = useState<StateFilterValue>("active");

	const { data, isLoading } = usePledges(tenantSlug, {
		memberId: member.id,
		status: status === "all" ? undefined : status,
		limit: 200,
		...toStateFilterFlags(state),
	});

	const campaignsQ = useCampaigns(tenantSlug, { includeDeleted: true });
	const campaignsById = useMemo(
		() =>
			Object.fromEntries((campaignsQ.data?.items ?? []).map((c) => [c.id, c])),
		[campaignsQ.data],
	);

	const rows: Row[] = useMemo(() => {
		return (data?.items ?? []).map((p) => {
			const campaign = campaignsById[p.campaignId];
			const deadline =
				typeof campaign?.deadline === "string" ? campaign.deadline : null;
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
				campaign,
			};
		});
	}, [data, campaignsById]);

	const agg = useMemo(() => {
		let pledged = 0;
		let paid = 0;
		let remaining = 0;
		for (const r of rows) {
			pledged += num(r.p.pledgedAmount);
			paid += num(r.p.paidAmount);
			remaining += num(r.p.remainingAmount);
		}
		return { pledged, paid, remaining };
	}, [rows]);

	const columns: DataTableColumn<Row>[] = [
		{
			key: "campaign",
			label: "Campaign",
			render: (r) => {
				if (!r.campaign) {
					return (
						<span className="text-sm text-muted-foreground">
							{r.p.campaignId.slice(0, 8)}…
						</span>
					);
				}
				return (
					<Link
						href={`/${tenantSlug}/admin/campaigns/${r.campaign.id}`}
						onClick={(e) => e.stopPropagation()}
						className="text-sm font-medium text-foreground hover:underline"
					>
						{r.campaign.title}
					</Link>
				);
			},
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
		<DataTableShell<Row>
			filters={[
				{
					key: "status",
					label: "Status",
					value: status,
					onChange: (v) => setStatus(v as StatusFilter),
					options: STATUS_OPTIONS,
				},
			]}
			onClearFilters={() => setStatus("all")}
			state={{ value: state, onChange: setState }}
			stats={[
				{ label: "in view", value: rows.length },
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
			]}
			columns={columns}
			rows={rows}
			rowKey={(r) => r.p.id}
			loading={isLoading || campaignsQ.isLoading}
			onRowClick={(r) => router.push(`/${tenantSlug}/admin/pledges/${r.p.id}`)}
			rowClassName={(r) => (r.p.deletedAt ? "bg-muted/30" : undefined)}
			emptyTitle="No pledges yet"
			emptySubtitle="This member has not committed to any campaign yet."
		/>
	);
};
