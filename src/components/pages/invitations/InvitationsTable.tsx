"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";
import { DataTable, type DataTableColumn } from "@/components/primitives/DataTable";
import { Badge, StatusBadge, type Status } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import type { components } from "@/lib/api";

type Invitation = components["schemas"]["InvitationResponseDto"];

const STATUS_MAP: Record<Invitation["status"], Status> = {
  PENDING: "Pending",
  ACCEPTED: "Completed",
  EXPIRED: "Cancelled",
  CANCELLED: "Cancelled",
};

export function InvitationsTable({
  rows,
  loading,
  tenantId,
  onCancel,
}: {
  rows: Invitation[];
  loading?: boolean;
  tenantId: string;
  onCancel: (inv: Invitation) => void;
}) {
  const columns: DataTableColumn<Invitation>[] = [
    {
      key: "email",
      label: "Recipient",
      render: (row) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 500, color: S.onSurface }}>{row.email}</span>
          <span style={{ fontSize: 12, color: S.onSurfaceMuted }}>
            Sent {new Date(row.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      width: "120px",
      render: (row) => (
        <Badge color={row.role === "ADMIN" ? "indigo" : "neutral"}>
          {row.role === "ADMIN" ? "Admin" : "Member"}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "140px",
      render: (row) => <StatusBadge status={STATUS_MAP[row.status]} />,
    },
    {
      key: "expires",
      label: "Expires",
      width: "120px",
      render: (row) => {
        if (row.status !== "PENDING") return <span style={{ color: S.onSurfaceMuted }}>—</span>;
        const expires = new Date(row.expiresAt);
        const now = new Date();
        const diff = expires.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        return (
          <span style={{ color: days < 3 ? S.error : S.onSurfaceVariant }}>
            {days <= 0 ? "Expired" : `${days}d left`}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "",
      width: "100px",
      align: "right",
      render: (row) => (
        row.status === "PENDING" ? (
          <Button
            variant="tertiary"
            size="sm"
            destructive
            onClick={() => onCancel(row)}
          >
            Cancel
          </Button>
        ) : null
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      loading={loading}
      emptyTitle="No invitations"
      emptySubtitle="Invite members or admins to join your church."
    />
  );
}
