"use client";

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

const fmtDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const fullName = (m: Member | undefined): string => {
  if (!m) return "—";
  return `${m.firstName} ${m.lastName}`.trim();
};

export type TransactionsTableHandlers = {
  onView: (t: TransactionRow) => void;
  onEdit: (t: TransactionRow) => void;
  onDelete: (t: TransactionRow) => void;
};

const muted = "var(--muted-foreground)";

export const TransactionsTable = ({
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
}) => {
  const columns: DataTableColumn<TransactionRow>[] = [
    {
      key: "date",
      label: "Date",
      width: "100px",
      render: (t) => <span className="text-[13px]">{fmtDate(t.date)}</span>,
    },
    {
      key: "member",
      label: "Member",
      render: (t) => {
        const memberId = nstr(t.memberId);
        if (!memberId) {
          return (
            <span className="text-[13px] italic text-muted-foreground">Anonymous</span>
          );
        }
        const m = membersById[memberId];
        return (
          <span className="inline-flex min-w-0 items-center gap-2">
            <Avatar name={fullName(m)} size={26} />
            <span className="truncate text-sm">{fullName(m)}</span>
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
        if (!cid) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="block truncate text-[13px] text-primary">
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
        <span className="inline-flex items-center gap-1.5 text-[13px]">
          <Icon name={METHOD_ICON[t.paymentMethod]} size={13} color={muted} />
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
          <span className="font-mono text-xs text-muted-foreground">{r}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
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
            type="button"
            onClick={onCreate}
            className="cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,var(--ring),var(--primary))] px-5 py-2.5 font-inherit text-sm font-medium text-primary-foreground"
          >
            + Record gift
          </button>
        )
      }
    />
  );
};
