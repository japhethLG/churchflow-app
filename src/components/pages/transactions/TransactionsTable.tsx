"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";
import {
  Amount,
  Avatar,
  DataTable,
  Icon,
  RowActionsMenu,
  TypeBadge,
  type DataTableColumn,
  type DataTablePagination,
  type IconName,
  type TransactionType as BadgeType,
} from "@/components/primitives";
import { nstr, type components } from "@/lib/api";

export type TransactionRow = components["schemas"]["TransactionResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

const TYPE_BADGE_LABEL: Record<TransactionRow["type"], BadgeType> = {
  TITHE: "Tithe",
  OFFERING: "Offering",
  MISSION_GIVING: "Mission",
  FIRST_FRUIT: "First Fruit",
  COMMITMENT: "Commitment",
  DONATION: "Donation",
  OTHER: "Other",
};

const METHOD_ICON: Record<TransactionRow["paymentMethod"], IconName> = {
  CASH: "cash",
  CHECK: "check_rect",
  BANK_TRANSFER: "bank",
  ONLINE: "link",
  MOBILE_MONEY: "phone",
  OTHER: "dots",
};

const METHOD_LABEL: Record<TransactionRow["paymentMethod"], string> = {
  CASH: "Cash",
  CHECK: "Check",
  BANK_TRANSFER: "Bank",
  ONLINE: "Online",
  MOBILE_MONEY: "Mobile",
  OTHER: "Other",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fullName(m: Member | undefined): string {
  if (!m) return "—";
  return `${m.firstName} ${m.lastName}`.trim();
}

export type TransactionsTableHandlers = {
  onView: (t: TransactionRow) => void;
  onEdit: (t: TransactionRow) => void;
  onDelete: (t: TransactionRow) => void;
};

export function TransactionsTable({
  rows,
  loading,
  pagination,
  membersById,
  campaignsById,
  handlers,
  onCreate,
}: {
  rows: TransactionRow[] | undefined;
  loading?: boolean;
  pagination?: DataTablePagination;
  membersById: Record<string, Member>;
  campaignsById: Record<string, Campaign>;
  handlers: TransactionsTableHandlers;
  onCreate?: () => void;
}) {
  const columns: DataTableColumn<TransactionRow>[] = [
    {
      key: "date",
      label: "Date",
      width: "100px",
      render: (t) => <span style={{ fontSize: 13 }}>{fmtDate(t.date)}</span>,
    },
    {
      key: "member",
      label: "Member",
      render: (t) => {
        const memberId = nstr(t.memberId);
        if (!memberId) {
          return <span style={{ color: S.onSurfaceMuted, fontStyle: "italic", fontSize: 13 }}>Anonymous</span>;
        }
        const m = membersById[memberId];
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Avatar name={fullName(m)} size={26} />
            <span style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {fullName(m)}
            </span>
          </span>
        );
      },
    },
    {
      key: "type",
      label: "Type",
      width: "130px",
      render: (t) => <TypeBadge type={TYPE_BADGE_LABEL[t.type]} />,
    },
    {
      key: "campaign",
      label: "Campaign",
      width: "180px",
      render: (t) => {
        const cid = nstr(t.campaignId);
        if (!cid) return <span style={{ color: S.onSurfaceMuted }}>—</span>;
        return (
          <span style={{ color: S.primary, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
            {campaignsById[cid]?.title ?? "Campaign"}
          </span>
        );
      },
    },
    {
      key: "method",
      label: "Method",
      width: "120px",
      render: (t) => (
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 13 }}>
          <Icon name={METHOD_ICON[t.paymentMethod]} size={13} color={S.onSurfaceMuted} />
          {METHOD_LABEL[t.paymentMethod]}
        </span>
      ),
    },
    {
      key: "ref",
      label: "Ref #",
      width: "100px",
      render: (t) => {
        const r = nstr(t.referenceNumber);
        return r ? (
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: S.onSurfaceMuted }}>{r}</span>
        ) : (
          <span style={{ color: S.onSurfaceMuted }}>—</span>
        );
      },
    },
    {
      key: "amt",
      label: "Amount",
      width: "120px",
      align: "right",
      render: (t) => <Amount value={Number(t.amount).toFixed(2)} />,
    },
    {
      key: "actions",
      label: "",
      width: "48px",
      align: "right",
      overflow: "visible",
      render: (t) => (
        <RowActionsMenu
          actions={[
            { label: "View details", onClick: () => handlers.onView(t) },
            { label: "Edit", onClick: () => handlers.onEdit(t), separatorBefore: true },
            { label: "Delete", onClick: () => handlers.onDelete(t), destructive: true, separatorBefore: true },
          ]}
        />
      ),
    },
  ];

  return (
    <DataTable<TransactionRow>
      columns={columns}
      rows={rows}
      rowKey={(t) => t.id}
      loading={loading}
      pagination={pagination}
      onRowClick={(t) => handlers.onView(t)}
      emptyTitle="No gifts recorded yet"
      emptySubtitle="Record the first gift to start the giving history."
      emptyAction={
        onCreate && (
          <button
            onClick={onCreate}
            style={{
              padding: "10px 20px",
              borderRadius: 9999,
              background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            + Record gift
          </button>
        )
      }
    />
  );
}
