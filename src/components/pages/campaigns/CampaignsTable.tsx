"use client";

import {
  Amount,
  Badge,
  DataTable,
  RowActionsMenu,
  StatusBadge,
  type DataTableColumn,
  type DataTablePagination,
  type Status,
} from "@/components/primitives";
import { nstr, type components } from "@/lib/api";

export type CampaignRow = components["schemas"]["CampaignResponseDto"];

export type CampaignsTableHandlers = {
  onView: (c: CampaignRow) => void;
  onEdit: (c: CampaignRow) => void;
  onCancel: (c: CampaignRow) => void;
  onDelete: (c: CampaignRow) => void;
};

const STATUS_LABEL: Record<CampaignRow["status"], Status> = {
  DRAFT: "Pending",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const fmtDeadline = (d: string | null): string => {
  if (!d) return "Open-ended";
  const date = new Date(d);
  const now = Date.now();
  const days = Math.ceil((date.getTime() - now) / 86_400_000);
  const fmt = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  if (days < 0) return `${fmt} · past`;
  if (days === 0) return `${fmt} · today`;
  if (days <= 30) return `${fmt} · ${days}d left`;
  return fmt;
};

export const CampaignsTable = ({
  rows,
  loading,
  pagination,
  handlers,
  onCreate,
}: {
  rows: CampaignRow[] | undefined;
  loading?: boolean;
  pagination?: DataTablePagination;
  handlers: CampaignsTableHandlers;
  onCreate?: () => void;
}) => {
  const columns: DataTableColumn<CampaignRow>[] = [
    {
      key: "title",
      label: "Campaign",
      render: (c) => (
        <span className="inline-flex min-w-0 flex-col gap-1">
          <span className="truncate font-medium">{c.title}</span>
          {nstr(c.description) && (
            <span className="truncate text-xs text-muted-foreground">{nstr(c.description)}</span>
          )}
        </span>
      ),
    },
    {
      key: "deadline",
      label: "Deadline",
      width: "200px",
      render: (c) => (
        <span className="text-[13px] text-muted-foreground">{fmtDeadline(nstr(c.deadline))}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "130px",
      render: (c) => <StatusBadge status={STATUS_LABEL[c.status]} />,
    },
    {
      key: "created",
      label: "Created",
      width: "130px",
      render: (c) => (
        <span className="text-[13px] text-muted-foreground">
          {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "48px",
      align: "right",
      overflow: "visible",
      render: (c) => {
        const canCancel = c.status === "ACTIVE" || c.status === "DRAFT";
        const actions = [
          { label: "View", onClick: () => handlers.onView(c) },
          { label: "Edit", onClick: () => handlers.onEdit(c) },
          ...(canCancel
            ? [
                {
                  label: "Cancel campaign",
                  onClick: () => handlers.onCancel(c),
                  separatorBefore: true,
                },
              ]
            : []),
          {
            label: "Delete",
            onClick: () => handlers.onDelete(c),
            destructive: true,
            separatorBefore: !canCancel,
          },
        ];
        return <RowActionsMenu actions={actions} />;
      },
    },
  ];

  return (
    <DataTable<CampaignRow>
      columns={columns}
      rows={rows}
      rowKey={(c) => c.id}
      loading={loading}
      pagination={pagination}
      onRowClick={(c) => handlers.onView(c)}
      emptyTitle="No campaigns yet"
      emptySubtitle="Start a fundraising campaign to track pledges and gifts."
      emptyAction={
        onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,var(--ring),var(--primary))] px-5 py-2.5 font-inherit text-sm font-medium text-primary-foreground"
          >
            + New campaign
          </button>
        )
      }
    />
  );
};
