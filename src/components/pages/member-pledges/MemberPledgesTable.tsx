"use client";

import { type Status, StatusBadge } from "@/components/primitives/Badge";
import type { DataTableColumn } from "@/components/primitives/DataTable";
import { DeletedLabel } from "@/components/primitives/DeletedLabel";
import type { components } from "@/lib/api";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";

export type MemberPledgeRow = components["schemas"]["PledgeResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

const STATUS_MAP: Record<MemberPledgeRow["status"], Status> = {
	ACTIVE: "Active",
	FULFILLED: "Completed",
	CANCELLED: "Cancelled",
};

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
			width: "140px",
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
			width: "140px",
			align: "right",
			render: (row) => (
				<span
					className={
						row.paidAmount === 0
							? "tabular-nums text-muted-foreground"
							: "font-semibold tabular-nums text-foreground"
					}
				>
					{formatCurrency(row.paidAmount)}
				</span>
			),
		},
		{
			key: "status",
			label: "Status",
			width: "140px",
			render: (row) => <StatusBadge status={STATUS_MAP[row.status]} />,
		},
	];
};
