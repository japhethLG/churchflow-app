"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";
import {
  Amount,
  Avatar,
  DataTable,
  RowActionsMenu,
  StatusBadge,
  type DataTableColumn,
  type DataTablePagination,
  type Status,
} from "@/components/primitives";
import type { components } from "@/lib/api";

export type PledgeRow = components["schemas"]["PledgeResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];

const STATUS_LABEL: Record<PledgeRow["status"], Status> = {
  ACTIVE: "Active",
  FULFILLED: "Completed",
  CANCELLED: "Cancelled",
};

function fullName(m: Member | undefined): string {
  if (!m) return "Unknown member";
  return `${m.firstName} ${m.lastName}`.trim();
}

export type PledgesTableHandlers = {
  onEdit: (p: PledgeRow) => void;
  onDelete: (p: PledgeRow) => void;
  onOpenCampaign: (campaignId: string) => void;
};

export function PledgesTable({
  rows,
  loading,
  pagination,
  membersById,
  campaignsById,
  handlers,
}: {
  rows: PledgeRow[] | undefined;
  loading?: boolean;
  pagination?: DataTablePagination;
  membersById: Record<string, Member>;
  campaignsById: Record<string, Campaign>;
  handlers: PledgesTableHandlers;
}) {
  const columns: DataTableColumn<PledgeRow>[] = [
    {
      key: "member",
      label: "Member",
      render: (p) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Avatar name={fullName(membersById[p.memberId])} size={28} />
          <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fullName(membersById[p.memberId])}
          </span>
        </span>
      ),
    },
    {
      key: "campaign",
      label: "Campaign",
      render: (p) => {
        const c = campaignsById[p.campaignId];
        if (!c) return <span style={{ color: S.onSurfaceMuted }}>—</span>;
        return (
          <span
            style={{ color: S.primary, cursor: "pointer", fontWeight: 500 }}
            onClick={(e) => {
              e.stopPropagation();
              handlers.onOpenCampaign(c.id);
            }}
          >
            {c.title}
          </span>
        );
      },
    },
    {
      key: "amount",
      label: "Pledged",
      width: "140px",
      align: "right",
      render: (p) => <Amount value={p.pledgedAmount.toString()} />,
    },
    {
      key: "status",
      label: "Status",
      width: "120px",
      render: (p) => <StatusBadge status={STATUS_LABEL[p.status]} />,
    },
    {
      key: "created",
      label: "Pledged on",
      width: "130px",
      render: (p) => (
        <span style={{ fontSize: 13, color: S.onSurfaceMuted }}>
          {new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "48px",
      align: "right",
      overflow: "visible",
      render: (p) => (
        <RowActionsMenu
          actions={[
            { label: "View campaign", onClick: () => handlers.onOpenCampaign(p.campaignId) },
            { label: "Edit", onClick: () => handlers.onEdit(p), separatorBefore: true },
            { label: "Delete", onClick: () => handlers.onDelete(p), destructive: true, separatorBefore: true },
          ]}
        />
      ),
    },
  ];

  return (
    <DataTable<PledgeRow>
      columns={columns}
      rows={rows}
      rowKey={(p) => p.id}
      loading={loading}
      pagination={pagination}
      emptyTitle="No pledges yet"
      emptySubtitle="When members commit to a campaign, those pledges show up here."
    />
  );
}
