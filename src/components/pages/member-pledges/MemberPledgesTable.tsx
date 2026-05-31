"use client";

import { Badge } from "@/components/primitives/Badge";
import type { DataTableColumn } from "@/components/primitives/DataTable";
import { DeletedLabel } from "@/components/primitives/DeletedLabel";
import { ExpandableCard } from "@/components/primitives/ExpandableCard";
import { StackedProgressBar } from "@/components/primitives/StackedProgressBar";
import type { components } from "@/lib/api";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import {
	LIFECYCLE_LABEL,
	lifecycleBadgeColor,
	num,
	type PledgeLifecycle,
	pct,
} from "../admin-shared";

export type MemberPledgeRow = components["schemas"]["MyPledgeResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

export const memberPledgeColumns = ({
	campaignMap,
	campaignItemMap,
}: {
	campaignMap: Record<string, Campaign>;
	campaignItemMap?: Record<string, string>;
}): DataTableColumn<MemberPledgeRow>[] => {
	const itemMap = campaignItemMap ?? {};
	return [
		{
			key: "campaign",
			label: "Campaign",
			render: (row) => {
				const campaign = campaignMap[row.campaignId];
				const campaignTitle = campaign?.title ?? "Campaign";
				const campaignDeletedAt = campaign?.deletedAt ?? null;
				const itemKey =
					typeof row.campaignItemId === "string" ? row.campaignItemId : null;
				const itemTitle = itemKey ? itemMap[itemKey] : null;
				return (
					<div className="flex flex-col">
						<span className="font-medium text-foreground">
							{campaignDeletedAt ? (
								<DeletedLabel deletedAt={campaignDeletedAt}>
									{campaignTitle}
								</DeletedLabel>
							) : (
								campaignTitle
							)}
							{itemTitle && (
								<span className="ml-1 text-muted-foreground">
									[{itemTitle}]
								</span>
							)}
						</span>
						<span className="text-xs text-muted-foreground">
							Pledged {dayjs(row.createdAt).format("ll")}
						</span>
					</div>
				);
			},
		},
		{
			key: "pledged",
			label: "Pledged",
			width: "120px",
			align: "right",
			render: (row) => (
				<span className="font-semibold tabular-nums text-foreground">
					{formatCurrency(row.pledgedAmount)}
				</span>
			),
		},
		{
			key: "paid",
			label: "Paid",
			width: "200px",
			render: (row) => {
				const paid = num(row.paidAmount);
				const pledged = num(row.pledgedAmount);
				const fulfillment = pct(paid, pledged);
				return (
					<div>
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
				);
			},
		},
		{
			key: "remaining",
			label: "Remaining",
			width: "120px",
			align: "right",
			render: (row) => {
				const remaining = num(row.remainingAmount);
				return (
					<span
						className={
							remaining === 0
								? "tabular-nums text-muted-foreground"
								: "font-semibold tabular-nums text-foreground"
						}
					>
						{formatCurrency(remaining)}
					</span>
				);
			},
		},
		{
			key: "lifecycle",
			label: "Status",
			width: "140px",
			render: (row) => {
				// Deadline / lifecycle / days come computed server-side on the
				// pledge response now — no item-deadline fan-out needed.
				const lifecycle = row.lifecycle as PledgeLifecycle;
				const days = row.daysUntil ?? null;
				const daysCaption =
					days === null
						? null
						: days < 0
							? `${Math.abs(days)}d past`
							: days === 0
								? "Due today"
								: `${days}d left`;
				return (
					<div className="flex flex-col gap-0.5">
						<Badge color={lifecycleBadgeColor(lifecycle)}>
							{LIFECYCLE_LABEL[lifecycle]}
						</Badge>
						{daysCaption && lifecycle !== "fulfilled" && (
							<span className="text-xs text-muted-foreground">
								{daysCaption}
							</span>
						)}
					</div>
				);
			},
		},
	];
};

// Sub-`md` counterpart to a pledge row. Collapsed: campaign (or date) +
// pledged amount + lifecycle. Expanded: paid (%), remaining, deadline.
// Shared by the My-pledges list and the campaign-detail "Your pledges" table.
export const MemberPledgeCard = ({
	row,
	campaignMap,
	href,
	showCampaign = true,
}: {
	row: MemberPledgeRow;
	campaignMap: Record<string, Campaign>;
	href?: string;
	showCampaign?: boolean;
}) => {
	const campaign = campaignMap[row.campaignId];
	const campaignTitle = campaign?.title ?? "Campaign";
	const campaignDeletedAt = campaign?.deletedAt ?? null;
	// Deadline / lifecycle / days come computed server-side on the pledge.
	const lifecycle = row.lifecycle as PledgeLifecycle;
	const days = row.daysUntil ?? null;
	const paid = num(row.paidAmount);
	const pledged = num(row.pledgedAmount);
	const fulfillment = pct(paid, pledged);
	return (
		<ExpandableCard
			href={href}
			details={[
				{
					label: "Paid",
					value: (
						<div className="w-32">
							<StackedProgressBar
								size="xs"
								total={pledged > 0 ? pledged : 1}
								segments={[
									{ value: paid, color: "var(--chart-current)", label: "Paid" },
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
						{showCampaign ? (
							campaignDeletedAt ? (
								<DeletedLabel deletedAt={campaignDeletedAt}>
									{campaignTitle}
								</DeletedLabel>
							) : (
								campaignTitle
							)
						) : (
							`Pledged ${dayjs(row.createdAt).format("MMM D, YYYY")}`
						)}
					</div>
					{showCampaign && (
						<div className="truncate text-xs text-muted-foreground">
							Pledged {dayjs(row.createdAt).format("ll")}
						</div>
					)}
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
