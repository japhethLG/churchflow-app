"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { PageHeader, DataTable, Avatar, Badge, Button, RowActionsMenu, type DataTableColumn } from "@/components/primitives";
import { openModal } from "@/lib/modals/store";
import { useAdminStats, useAdminUsers } from "@/lib/api/admin";
import { useTenants } from "@/lib/api/tenants";

type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: Record<string, never> | null;
  isSuperAdmin: boolean;
  memberships: Array<{
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    memberId: string;
    role: "ADMIN" | "USER";
  }>;
  createdAt: string;
};

export default function SuperAdminAdminsPage() {
  const [search, setSearch] = useState("");
  const [tenantFilter, setTenantFilter] = useState("");
  const [superAdminOnly, setSuperAdminOnly] = useState(false);

  const { data: stats } = useAdminStats();
  const { data: tenantsData } = useTenants();
  const tenants = tenantsData?.items ?? [];

  const { data: usersData, isLoading } = useAdminUsers({
    search: search || undefined,
    tenantId: tenantFilter || undefined,
    superAdminOnly: superAdminOnly || undefined,
  });

  const users = (usersData?.items ?? []) as AdminUser[];

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: "user",
      label: "User",
      render: (u) => (
        <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
          <Avatar name={u.displayName} src={(u.photoUrl as string | undefined) ?? undefined} size={32} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{u.displayName}</div>
            <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>{u.email}</div>
          </div>
        </span>
      ),
    },
    {
      key: "churches",
      label: "Churches",
      render: (u) => {
        const adminMemberships = u.memberships.filter((m) => m.role === "ADMIN");
        return (
          <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {adminMemberships.length === 0 ? (
              <span style={{ fontSize: 12, color: S.onSurfaceMuted }}>No churches</span>
            ) : (
              adminMemberships.map((m) => (
                <Badge key={m.tenantId} color="indigo">{m.tenantName}</Badge>
              ))
            )}
          </span>
        );
      },
    },
    {
      key: "superAdmin",
      label: "Super admin",
      width: "120px",
      align: "center",
      render: (u) => u.isSuperAdmin ? (
        <Badge color="indigo">Super admin</Badge>
      ) : (
        <span style={{ color: S.onSurfaceMuted, fontSize: 13 }}>—</span>
      ),
    },
    {
      key: "joined",
      label: "Joined",
      width: "130px",
      render: (u) => (
        <span style={{ fontSize: 13, color: S.onSurfaceMuted }}>
          {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "48px",
      align: "right",
      overflow: "visible",
      render: (u) => (
        <RowActionsMenu
          actions={[
            {
              label: u.isSuperAdmin ? "Demote from super admin" : "Promote to super admin",
              onClick: () =>
                openModal("confirm-toggle-super-admin", {
                  userId: u.id,
                  userName: u.displayName,
                  currentIsSuperAdmin: u.isSuperAdmin,
                }),
              destructive: u.isSuperAdmin,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <PageHeader
        overline="Platform"
        title="Admins"
        subtitle="Everyone with admin access across all churches."
        action={
          <Button variant="primary" onClick={() => openModal("invite-admin-global", {})}>
            + Invite admin
          </Button>
        }
      />

      {/* KPI pills */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <div
          style={{
            padding: "6px 14px",
            borderRadius: 9999,
            background: S.surfaceContainerHigh,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ color: S.onSurfaceMuted }}>Super admins:</span>
          <span style={{ fontWeight: 600, color: S.onSurface }}>{stats?.superAdmins ?? "—"}</span>
        </div>
        <div
          style={{
            padding: "6px 14px",
            borderRadius: 9999,
            background: S.surfaceContainerHigh,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ color: S.onSurfaceMuted }}>Tenant admins:</span>
          <span style={{ fontWeight: 600, color: S.onSurface }}>{stats?.totalAdmins ?? "—"}</span>
        </div>
        {!isLoading && (
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 9999,
              background: S.surfaceContainerHigh,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ color: S.onSurfaceMuted }}>Showing:</span>
            <span style={{ fontWeight: 600, color: S.onSurface }}>{usersData?.total ?? 0}</span>
          </div>
        )}
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          style={{
            flex: "1 1 240px",
            minWidth: 200,
            maxWidth: 320,
            padding: "9px 14px",
            borderRadius: 10,
            border: `1.5px solid ${S.outlineVariant}`,
            fontSize: 13,
            fontFamily: "inherit",
            background: S.surfaceContainerLow,
            color: S.onSurface,
          }}
        />
        <select
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
          style={{
            padding: "9px 14px",
            borderRadius: 10,
            border: `1.5px solid ${S.outlineVariant}`,
            fontSize: 13,
            fontFamily: "inherit",
            background: S.surfaceContainerLow,
            color: tenantFilter ? S.onSurface : S.onSurfaceMuted,
            cursor: "pointer",
          }}
        >
          <option value="">All churches</option>
          {tenants
            .filter((t) => !(t as { deletedAt?: Date | null }).deletedAt)
            .map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
        </select>
        <button
          onClick={() => setSuperAdminOnly((v) => !v)}
          style={{
            padding: "9px 16px",
            borderRadius: 10,
            border: `1.5px solid ${superAdminOnly ? S.primary : S.outlineVariant}`,
            fontSize: 13,
            fontFamily: "inherit",
            background: superAdminOnly ? S.primaryFixed : S.surfaceContainerLow,
            color: superAdminOnly ? S.primary : S.onSurfaceMuted,
            cursor: "pointer",
            fontWeight: superAdminOnly ? 600 : 400,
          }}
        >
          Super admins only
        </button>
      </div>

      <DataTable<AdminUser>
        columns={columns}
        rows={users}
        rowKey={(u) => u.id}
        loading={isLoading}
        emptyTitle="No admin users yet"
        emptySubtitle={search || tenantFilter || superAdminOnly ? "No users match the current filters." : "Invite your first admin to get started."}
      />
    </div>
  );
}
