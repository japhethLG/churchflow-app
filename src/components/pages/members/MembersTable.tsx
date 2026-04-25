"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";
import {
  Avatar,
  Badge,
  DataTable,
  Icon,
  RowActionsMenu,
  StatusBadge,
  type DataTableColumn,
  type DataTablePagination,
} from "@/components/primitives";
import type { components } from "@/lib/api";

export type MemberRow = components["schemas"]["MemberResponseDto"];

export type MembersTableHandlers = {
  onView: (m: MemberRow) => void;
  onEdit: (m: MemberRow) => void;
  onDelete: (m: MemberRow) => void;
  // Send a sign-in invite that links to this temp member on accept.
  // Only offered for unlinked rows.
  onClaimInvite: (m: MemberRow) => void;
  // Open the merge modal with this member as the keeper.
  onMerge: (m: MemberRow) => void;
};

function fullName(m: MemberRow): string {
  return `${m.firstName} ${m.lastName}`.trim();
}

function MemberCell({ m }: { m: MemberRow }) {
  const isLinked = Boolean(m.userId);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <Avatar name={fullName(m)} size={32} />
      <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {fullName(m)}
      </span>
      {!isLinked && <Badge color="clay">temp</Badge>}
    </span>
  );
}

function plainStr(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function MembersTable({
  rows,
  loading,
  pagination,
  handlers,
  onAdd,
}: {
  rows: MemberRow[] | undefined;
  loading?: boolean;
  pagination?: DataTablePagination;
  handlers: MembersTableHandlers;
  onAdd?: () => void;
}) {
  const columns: DataTableColumn<MemberRow>[] = [
    { key: "member", label: "Member", render: (m) => <MemberCell m={m} /> },
    {
      key: "email",
      label: "Email",
      width: "240px",
      render: (m) => {
        const v = plainStr(m.email);
        return <span style={{ color: S.onSurfaceMuted }}>{v ?? "—"}</span>;
      },
    },
    {
      key: "phone",
      label: "Phone",
      width: "150px",
      render: (m) => {
        const v = plainStr(m.phone);
        return <span style={{ color: S.onSurfaceMuted }}>{v ?? "—"}</span>;
      },
    },
    {
      key: "role",
      label: "Role",
      width: "100px",
      render: (m) => <Badge color={m.role === "ADMIN" ? "indigo" : "neutral"}>{m.role}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      width: "110px",
      render: (m) => <StatusBadge status={m.status === "ACTIVE" ? "Active" : "Inactive"} />,
    },
    {
      key: "linked",
      label: "Linked",
      width: "80px",
      align: "center",
      render: (m) =>
        m.userId ? (
          <Icon name="check" size={18} color={S.primary} />
        ) : (
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              display: "inline-block",
              background: S.surfaceContainerHigh,
            }}
          />
        ),
    },
    {
      key: "actions",
      label: "",
      width: "48px",
      align: "right",
      overflow: "visible",
      render: (m) => {
        const isTemp = !m.userId;
        const actions = [
          { label: "View profile", onClick: () => handlers.onView(m) },
          { label: "Edit", onClick: () => handlers.onEdit(m) },
          ...(isTemp
            ? [
                {
                  label: "Send sign-in invite",
                  onClick: () => handlers.onClaimInvite(m),
                  separatorBefore: true,
                },
              ]
            : []),
          {
            label: "Merge with another…",
            onClick: () => handlers.onMerge(m),
            separatorBefore: !isTemp,
          },
          {
            label: "Remove",
            onClick: () => handlers.onDelete(m),
            destructive: true,
            separatorBefore: true,
          },
        ];
        return <RowActionsMenu actions={actions} />;
      },
    },
  ];

  return (
    <DataTable<MemberRow>
      columns={columns}
      rows={rows}
      rowKey={(m) => m.id}
      loading={loading}
      pagination={pagination}
      onRowClick={(m) => handlers.onView(m)}
      emptyTitle="No members yet"
      emptySubtitle="Add or invite your first member to get started."
      emptyAction={
        onAdd && (
          <button
            onClick={onAdd}
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
            + Add member
          </button>
        )
      }
    />
  );
}
