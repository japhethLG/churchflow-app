"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { PageHeader, DataTable, Avatar, Badge, Button, RowActionsMenu, type DataTableColumn } from "@/components/primitives";
import { openModal } from "@/lib/modals/store";
import { useTenant } from "@/lib/api/tenants";
import { useMembers, useUpdateMember, useDeleteMember } from "@/lib/api/members";
import type { components } from "@/lib/api";

type Member = components["schemas"]["MemberResponseDto"];

export default function ManageTenantAdminsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: tenant } = useTenant(id);
  const { data: membersData, isLoading } = useMembers(id);
  
  const { mutateAsync: update } = useUpdateMember(id);
  const { mutateAsync: remove } = useDeleteMember(id);

  const members = membersData?.items ?? [];

  const columns: DataTableColumn<Member>[] = [
    {
      key: "user",
      label: "Member",
      render: (m) => {
        const name = `${m.firstName} ${m.lastName}`;
        return (
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
            <Avatar name={name} size={30} />
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{name}</div>
              {m.email && <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>{m.email as unknown as string}</div>}
            </div>
          </span>
        );
      },
    },
    {
      key: "role",
      label: "Role",
      width: "120px",
      render: (m) => (
        <Badge color={m.role === "ADMIN" ? "indigo" : "neutral"}>
          {m.role}
        </Badge>
      ),
    },
    {
      key: "joined",
      label: "Joined",
      width: "140px",
      render: (m) => (
        <span style={{ fontSize: 13, color: S.onSurfaceMuted }}>
          {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "48px",
      align: "right",
      overflow: "visible",
      render: (m) => {
        const name = `${m.firstName} ${m.lastName}`;
        return (
          <RowActionsMenu
            actions={[
              {
                label: m.role === "USER" ? "Promote to admin" : "Demote to member",
                onClick: () => update({ 
                  params: { path: { tenantId: id, id: m.id } }, 
                  body: { role: m.role === "USER" ? "ADMIN" : "USER" } 
                }),
              },
              {
                label: "Remove from church",
                destructive: true,
                separatorBefore: true,
                onClick: () =>
                  openModal("confirm-delete", {
                    title: `Remove ${name}?`,
                    message: "This will remove them from this church. Their data is preserved.",
                    confirmLabel: "Remove",
                    onConfirm: async () => {
                      await remove({ params: { path: { tenantId: id, id: m.id } } });
                    },
                  }),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <PageHeader
        overline={tenant ? `Churches / ${tenant.name}` : "Churches"}
        title="Admins"
        subtitle={tenant ? `Manage admins and members of ${tenant.name}.` : undefined}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => router.push(`/super-admin/tenants/${id}`)}>
              ← Back to church
            </Button>
            {tenant && (
              <Button
                variant="primary"
                onClick={() => openModal("invite-tenant-admin", { tenantId: tenant.id, tenantName: tenant.name })}
              >
                + Invite admin
              </Button>
            )}
          </div>
        }
      />

      <DataTable<Member>
        columns={columns}
        rows={members}
        rowKey={(m) => m.id}
        loading={isLoading}
        emptyTitle="No members yet"
      />
    </div>
  );
}
