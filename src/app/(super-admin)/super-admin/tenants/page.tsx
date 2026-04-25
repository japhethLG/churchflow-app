"use client";

import { useRouter } from "next/navigation";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { PageHeader, StatCard, DataTable, Avatar, Badge, Button, RowActionsMenu, type DataTableColumn } from "@/components/primitives";
import { openModal } from "@/lib/modals/store";
import { useTenants } from "@/lib/api/tenants";
import { useAdminStats } from "@/lib/api/admin";
import { tenantLogoGradient, tenantInitials } from "@/lib/design/logo-gradient";
import type { components } from "@/lib/api";

type Tenant = components["schemas"]["TenantResponseDto"];

const formatAmount = (n: number): string  => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

const formatMonthYear = (d: Date | string): string  => {
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const AdminAvatarStack = ({
  admins,
  count,
}: {
  admins: Array<{ memberId: string; displayName: string; photoUrl: string | null }>;
  count: number;
}) => {
  if (count === 0) return <span style={{ fontSize: 12, color: S.onSurfaceMuted }}>No admins yet</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {admins.map((a, i) => (
        <span
          key={a.memberId}
          style={{ marginLeft: i > 0 ? -8 : 0, border: `2px solid ${S.surfaceContainerLowest}`, borderRadius: "50%", flexShrink: 0 }}
        >
          <Avatar name={a.displayName} src={a.photoUrl ?? undefined} size={26} />
        </span>
      ))}
      <span style={{ marginLeft: 8, fontSize: 12, color: S.onSurfaceMuted }}>
        {count} {count === 1 ? "admin" : "admins"}
      </span>
    </span>
  );
}

const TenantLogoTile = ({ name, slug }: { name: string; slug: string }) => {
  const { from, to } = tenantLogoGradient(slug);
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontSize: 13,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {tenantInitials(name)}
    </div>
  );
}

export default () => {
  const router = useRouter();
  const { data: tenantsData, isLoading } = useTenants();
  const { data: stats } = useAdminStats();

  const tenants = tenantsData?.items ?? [];

  const columns: DataTableColumn<Tenant>[] = [
    {
      key: "church",
      label: "Church",
      render: (t) => (
        <span style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>
          <TenantLogoTile name={t.name} slug={t.slug} />
          <div>
            <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
              {t.name}
              {(t as any).deletedAt && <Badge color="clay">Archived</Badge>}
            </div>
            <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>{t.slug}</div>
          </div>
        </span>
      ),
    },
    {
      key: "admins",
      label: "Admins",
      width: "220px",
      render: (t) => (
        <AdminAvatarStack
          admins={(t as any).adminsPreview ?? []}
          count={(t as any).adminCount ?? 0}
        />
      ),
    },
    {
      key: "members",
      label: "Members",
      width: "100px",
      align: "right",
      render: (t) => (
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {(t as any).memberCount ?? 0}
        </span>
      ),
    },
    {
      key: "gifts",
      label: "Gifts (MTD)",
      width: "180px",
      align: "right",
      render: (t) => (t as any).giftsMtdCount ? (
        <span>
          <span style={{ color: S.onSurfaceMuted, fontSize: 12, marginRight: 8 }}>
            {(t as any).giftsMtdCount} gifts
          </span>
          {formatAmount((t as any).giftsMtdTotal ?? 0)}
        </span>
      ) : (
        <span style={{ color: S.onSurfaceMuted }}>—</span>
      ),
    },
    {
      key: "created",
      label: "Created",
      width: "110px",
      render: (t) => <span style={{ fontSize: 13, color: S.onSurfaceMuted }}>{formatMonthYear(t.createdAt)}</span>,
    },
    {
      key: "actions",
      label: "",
      width: "48px",
      align: "right",
      overflow: "visible",
      render: (t) => {
        const isDeleted = Boolean((t as any).deletedAt);
        return (
          <RowActionsMenu
            actions={isDeleted ? [
              { label: "Restore church", onClick: () => openModal("confirm-restore-tenant", { tenantId: t.id, tenantName: t.name }) },
            ] : [
              { label: "Edit details", onClick: () => openModal("edit-tenant", { tenantId: t.id, currentName: t.name }) },
              { label: "Rename slug", onClick: () => openModal("rename-tenant-slug", { tenantId: t.id, currentSlug: t.slug }) },
              { label: "Delete church", onClick: () => openModal("confirm-delete-tenant", { tenantId: t.id, tenantName: t.name }), destructive: true, separatorBefore: true },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <PageHeader
        overline="Platform"
        title="Churches"
        subtitle="All churches on ChurchFlow. Create new ones and manage their admins."
        action={
          <Button variant="primary" onClick={() => router.push("/super-admin/tenants/new")}>
            + Create church
          </Button>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Churches"
          value={stats?.totalTenants ?? "—"}
          caption={stats ? `${stats.createdThisMonth} created this month` : undefined}
        />
        <StatCard
          label="Total admins"
          value={stats?.totalAdmins ?? "—"}
          caption="Across all churches"
        />
        <StatCard
          label="Total members"
          value={stats?.totalMembers != null ? stats.totalMembers.toLocaleString() : "—"}
          caption={stats ? `${stats.newMembersThisMonth} new this month` : undefined}
        />
        <StatCard
          label="Gifts (30d)"
          value={stats?.giftsLast30dTotal != null ? formatAmount(stats.giftsLast30dTotal) : "—"}
          caption={stats?.giftsLast30dCount != null ? `${stats.giftsLast30dCount.toLocaleString()} gifts` : undefined}
          accent
        />
      </div>

      <DataTable<Tenant>
        columns={columns}
        rows={tenants}
        rowKey={(t) => t.id}
        loading={isLoading}
        onRowClick={(t) => router.push(`/super-admin/tenants/${t.slug}`)}
        emptyTitle="No churches yet"
        emptySubtitle="Create your first church to get started."
      />
    </div>
  );
}
