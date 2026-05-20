"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Avatar,
	Badge,
	Button,
	type DataTableColumn,
	DataTableShell,
	RowActionsMenu,
	StackedProgressBar,
	type StateFilterValue,
	toStateFilterFlags,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useMembers } from "@/lib/api/members";
import { usePledges } from "@/lib/api/pledges";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { openModal } from "@/lib/modals/store";
import {
	daysUntil,
	LIFECYCLE_LABEL,
	num,
	type PledgeLifecycle,
	pct,
	pledgeLifecycle,
} from "../admin-shared";

type Campaign = components["schemas"]["CampaignWithItemsResponseDto"];
type Pledge = components["schemas"]["PledgeResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];

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
	member: Member | undefined;
};

export const CampaignPledgesTab = ({
	campaign,
	tenantSlug,
	parentDeleted,
}: {
	campaign: Campaign;
	tenantSlug: string;
	parentDeleted: boolean;
}) => {
	const router = useRouter();
	const [status, setStatus] = useState<StatusFilter>("all");
	const [state, setState] = useState<StateFilterValue>("active");

	const { data, isLoading } = usePledges(tenantSlug, {
		campaignId: campaign.id,
		status: status === "all" ? undefined : status,
		limit: 200,
		...toStateFilterFlags(state),
	});
	const membersQ = useMembers(tenantSlug, {
		limit: 500,
		includeDeleted: true,
	});
	const membersById = useMemo(
		() =>
			Object.fromEntries((membersQ.data?.items ?? []).map((m) => [m.id, m])),
		[membersQ.data],
	);

	const deadline =
		typeof campaign.deadline === "string" ? campaign.deadline : null;

	const rows: Row[] = useMemo(() => {
		return (data?.items ?? []).map((p) => ({
			p,
			deadline,
			days: daysUntil(deadline),
			lifecycle: pledgeLifecycle(
				p.pledgedAmount,
				p.paidAmount,
				p.status,
				deadline,
			),
			member: membersById[p.memberId],
		}));
	}, [data, deadline, membersById]);

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

	const openCreate = () =>
		openModal("create-pledge", {
			tenantSlug,
			campaignId: campaign.id,
			campaignTitle: campaign.title,
			items: campaign.items,
		});
	const openEdit = (p: Pledge) =>
		openModal("edit-pledge", { tenantSlug, pledge: p });
	const openDelete = (p: Pledge) =>
		openModal("confirm-delete-pledge", { tenantSlug, pledgeId: p.id });
	const openRestore = (p: Pledge, memberName: string) =>
		openModal("confirm-restore-pledge", {
			tenantId: tenantSlug,
			pledgeId: p.id,
			memberName,
		});

	const columns: DataTableColumn<Row>[] = [
		{
			key: "member",
			label: "Member",
			render: (r) => {
				const name = r.member
					? `${r.member.firstName} ${r.member.lastName}`.trim() || "Unnamed"
					: "Unknown";
				return (
					<div className="flex items-center gap-2.5">
						<Avatar name={name} size={28} />
						<Link
							href={`/${tenantSlug}/admin/members/${r.p.memberId}`}
							onClick={(e) => e.stopPropagation()}
							className="text-sm font-medium text-foreground hover:underline"
						>
							{name}
						</Link>
					</div>
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
			key: "pledged-on",
			label: "Pledged on",
			width: "110px",
			render: (r) => (
				<span className="text-xs text-muted-foreground">
					{dayjs(r.p.createdAt).format("MMM D, YYYY")}
				</span>
			),
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
		{
			key: "actions",
			label: "",
			width: "48px",
			align: "right",
			overflow: "visible",
			render: (r) => {
				const memberName = r.member
					? `${r.member.firstName} ${r.member.lastName}`.trim() || "this member"
					: "this member";
				return (
					<RowActionsMenu
						actions={
							r.p.deletedAt
								? [
										{
											label: "Restore",
											onClick: () => openRestore(r.p, memberName),
										},
									]
								: parentDeleted
									? []
									: [
											{ label: "Edit", onClick: () => openEdit(r.p) },
											{
												label: "Delete",
												onClick: () => openDelete(r.p),
												destructive: true,
												separatorBefore: true,
											},
										]
						}
					/>
				);
			},
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button
					role="primary"
					icon="plus"
					onClick={openCreate}
					disabled={parentDeleted}
				>
					Add pledge
				</Button>
			</div>
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
				loading={isLoading || membersQ.isLoading}
				onRowClick={(r) =>
					router.push(`/${tenantSlug}/admin/pledges/${r.p.id}`)
				}
				rowClassName={(r) => (r.p.deletedAt ? "bg-muted/30" : undefined)}
				emptyTitle="No pledges yet"
				emptySubtitle="Add a pledge to track a member's commitment toward this campaign."
			/>
		</div>
	);
};
