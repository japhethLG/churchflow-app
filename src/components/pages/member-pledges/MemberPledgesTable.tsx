"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";
import { DataTable, type DataTableColumn } from "@/components/primitives/DataTable";
import { Badge, StatusBadge, type Status } from "@/components/primitives/Badge";
import type { components } from "@/lib/api";

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
  campaignItemMap = {},
  currencySymbol,
}: {
  rows: Pledge[];
  loading?: boolean;
  campaignMap: Record<string, Campaign>;
  campaignItemMap?: Record<string, string>;
  currencySymbol: string;
}) => {
  const columns: DataTableColumn<Pledge>[] = [
    {
      key: "campaign",
      label: "Campaign",
      render: (row) => {
        const campaignTitle = campaignMap[row.campaignId]?.title ?? "Campaign";
        const itemTitle = row.campaignItemId ? campaignItemMap[row.campaignItemId as any] : null;
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 500, color: S.onSurface }}>
              {campaignTitle}
              {itemTitle && (
                <span style={{ color: S.onSurfaceMuted, marginLeft: 4 }}>
                  [{itemTitle}]
                </span>
              )}
            </span>
            <span style={{ fontSize: 12, color: S.onSurfaceMuted }}>
              Pledged {new Date(row.createdAt).toLocaleDateString()}
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
        <span style={{ fontWeight: 600, color: S.onSurface, fontVariantNumeric: "tabular-nums" }}>
          {currencySymbol}{Number(row.pledgedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
}
