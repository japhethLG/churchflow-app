"use client";

import { Badge } from "@/components/primitives/Badge";
import type { DataTableColumn } from "@/components/primitives/DataTable";
import { DeletedLabel } from "@/components/primitives/DeletedLabel";
import { StackedProgressBar } from "@/components/primitives/StackedProgressBar";
import type { components } from "@/lib/api";
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

export type MemberPledgeRow = components["schemas"]["MyPledgeResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

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

export const memberPledgeColumns = ({
	campaignMap,
	campaignItemMap,
	itemDeadlinesById,
}: {
	campaignMap: Record<string, Campaign>;
	campaignItemMap?: Record<string, string>;
	itemDeadlinesById: Record<string, string | null>;
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
				const campaign = campaignMap[row.campaignId];
				const deadline = resolvePledgeDeadline(
					row,
					campaign,
					itemDeadlinesById,
				);
				const lifecycle = pledgeLifecycle(
					row.pledgedAmount,
					row.paidAmount,
					row.status,
					deadline,
				);
				const days = daysUntil(deadline);
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
