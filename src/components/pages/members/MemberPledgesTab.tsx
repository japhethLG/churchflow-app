"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Badge,
	type DataTableColumn,
	DataTableShell,
	DeletedLabel,
	StackedProgressBar,
	type StateFilterValue,
	toStateFilterFlags,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { usePledges } from "@/lib/api/pledges";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import {
	LIFECYCLE_LABEL,
	num,
	type PledgeLifecycle,
	pct,
} from "../admin-shared";

type Member = components["schemas"]["MemberResponseDto"];
type Pledge = components["schemas"]["PledgeResponseDto"];

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

	// PledgeResponseDto now carries embedded member/campaign/campaign-item
	// + resolved deadline + lifecycle + daysUntil. No more FE fan-out to
	// fetch item deadlines and no more local lifecycle re-derivation.
	const { data, isLoading } = usePledges(tenantSlug, {
		memberId: member.id,
		status: status === "all" ? undefined : status,
		limit: 200,
		...toStateFilterFlags(state),
	});

	const rows: Pledge[] = data?.items ?? [];

	const agg = useMemo(() => {
		let pledged = 0;
		let paid = 0;
		let remaining = 0;
		for (const p of rows) {
			pledged += num(p.pledgedAmount);
			paid += num(p.paidAmount);
			remaining += num(p.remainingAmount);
		}
		return { pledged, paid, remaining };
	}, [rows]);

	const columns: DataTableColumn<Pledge>[] = [
		{
			key: "campaign",
			label: "Campaign",
			render: (p) => {
				const c = p.campaign;
				if (c.deletedAt) {
					return (
						<DeletedLabel
							deletedAt={c.deletedAt}
							className="text-sm font-medium"
						>
							{c.title}
						</DeletedLabel>
					);
				}
				return (
					<Link
						href={`/${tenantSlug}/admin/campaigns/${c.id}`}
						onClick={(e) => e.stopPropagation()}
						className="text-sm font-medium text-foreground hover:underline"
					>
						{c.title}
					</Link>
				);
			},
		},
		{
			key: "pledged",
			label: "Pledged",
			width: "110px",
			align: "right",
			render: (p) => (
				<span className="text-sm font-medium tabular-nums text-foreground">
					{formatCurrency(p.pledgedAmount, { decimals: 0 })}
				</span>
			),
		},
		{
			key: "paid",
			label: "Paid",
			width: "240px",
			render: (p) => {
				const fPct = pct(p.paidAmount, p.pledgedAmount);
				return (
					<div>
						<StackedProgressBar
							size="sm"
							total={p.pledgedAmount}
							segments={[
								{
									value: p.paidAmount,
									color: "var(--chart-current)",
									label: "Paid",
								},
							]}
						/>
						<div className="mt-1 flex items-baseline justify-between text-xs tabular-nums">
							<span className="text-muted-foreground">
								{formatCompact(p.paidAmount)}
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
			render: (p) => (
				<span
					className={`text-sm font-medium tabular-nums ${
						p.remainingAmount > 0 ? "text-foreground" : "text-muted-foreground"
					}`}
				>
					{formatCurrency(p.remainingAmount, { decimals: 0 })}
				</span>
			),
		},
		{
			key: "deadline",
			label: "Deadline",
			width: "110px",
			render: (p) => {
				const deadline = p.resolvedDeadline;
				const days = p.daysUntil ?? null;
				if (!deadline) {
					return <span className="text-xs text-muted-foreground">—</span>;
				}
				return (
					<div className="text-xs">
						<div className="text-muted-foreground">
							{dayjs(deadline).format("MMM D, YYYY")}
						</div>
						{days !== null && p.status === "ACTIVE" && (
							<div
								className={`tabular-nums ${
									days < 0
										? "text-(--chart-negative) font-semibold"
										: days <= 14
											? "text-(--chart-goal) font-semibold"
											: "text-muted-foreground"
								}`}
							>
								{days < 0 ? `${Math.abs(days)}d past` : `${days}d left`}
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
			render: (p) => {
				const l = p.lifecycle as PledgeLifecycle;
				return (
					<Badge color={lifecycleBadgeColor(l)}>{LIFECYCLE_LABEL[l]}</Badge>
				);
			},
		},
	];

	return (
		<DataTableShell<Pledge>
			filters={[
				{
					kind: "select",
					key: "status",
					label: "Status",
					value: status,
					onChange: (v) => setStatus(v as StatusFilter),
					options: STATUS_OPTIONS,
				},
				{ kind: "state", value: state, onChange: setState },
			]}
			onClearFilters={() => setStatus("all")}
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
			rowKey={(p) => p.id}
			loading={isLoading}
			onRowClick={(p) => router.push(`/${tenantSlug}/admin/pledges/${p.id}`)}
			rowClassName={(p) => (p.deletedAt ? "bg-muted/30" : undefined)}
			emptyTitle="No pledges yet"
			emptySubtitle="This member has not committed to any campaign yet."
		/>
	);
};
