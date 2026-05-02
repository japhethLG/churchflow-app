"use client";

import { type Status, StatusBadge } from "@/components/primitives/Badge";
import {
	DataTable,
	type DataTableColumn,
} from "@/components/primitives/DataTable";
import type { components } from "@/lib/api";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";

type Pledge = components["schemas"]["PledgeResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

const STATUS_MAP: Record<Pledge["status"], Status> = {
	ACTIVE: "Active",
	FULFILLED: "Completed",
	CANCELLED: "Cancelled",
};

export const MemberPledgesTable = ({
	rows,
	loading,
	campaignMap,
	campaignItemMap,
}: {
	rows: Pledge[];
	loading?: boolean;
	campaignMap: Record<string, Campaign>;
	campaignItemMap?: Record<string, string>;
}) => {
	const itemMap = campaignItemMap ?? {};
	const columns: DataTableColumn<Pledge>[] = [
		{
			key: "campaign",
			label: "Campaign",
			render: (row) => {
				const campaignTitle = campaignMap[row.campaignId]?.title ?? "Campaign";
				const itemKey =
					typeof row.campaignItemId === "string" ? row.campaignItemId : null;
				const itemTitle = itemKey ? itemMap[itemKey] : null;
				return (
					<div className="flex flex-col">
						<span className="font-medium text-foreground">
							{campaignTitle}
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
			key: "amount",
			label: "Amount",
			width: "140px",
			align: "right",
			render: (row) => (
				<span className="font-semibold tabular-nums text-foreground">
					{formatCurrency(row.pledgedAmount)}
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

	return (
		<DataTable
			columns={columns}
			rows={rows}
			rowKey={(r) => r.id}
			loading={loading}
			emptyTitle="No pledges found"
			emptySubtitle="You haven't made any pledges to church campaigns yet."
		/>
	);
};
