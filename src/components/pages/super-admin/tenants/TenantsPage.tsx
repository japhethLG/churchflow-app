"use client";

import { useRouter } from "next/navigation";
import { PageHeader, StatCard, DataTable, Avatar, AvatarStack, Badge, Button, RowActionsMenu, type DataTableColumn } from "@/components/primitives";
import { openModal } from "@/lib/modals/store";
import { useTenants } from "@/lib/api/tenants";
import { useAdminStats } from "@/lib/api/admin";
import { tenantLogoGradient, tenantInitials } from "@/lib/design/logo-gradient";
import type { components } from "@/lib/api/schema";

type Tenant = components["schemas"]["TenantResponseDto"];

const formatAmount = (n: number): string  => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

const formatMonthYear = (d: Date | string): string  => {
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const TenantLogoTile = ({ name, slug }: { name: string; slug: string }) => {
  const { from, to } = tenantLogoGradient(slug);
  return (
    <div
      className="grid size-9 shrink-0 place-items-center rounded-xl text-[13px] font-semibold text-white"
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {tenantInitials(name)}
    </div>
  );
}

export const TenantsPage = () => {
  const router = useRouter();
  const { data: tenantsData, isLoading } = useTenants();
  const { data: stats } = useAdminStats();

  const tenants = tenantsData?.items ?? [];

  const columns: DataTableColumn<Tenant>[] = [
    {
      key: "church",
      label: "Church",
      render: (t) => (
        <span className="inline-flex items-center gap-3">
          <TenantLogoTile name={t.name} slug={t.slug} />
          <div>
            <div className="flex items-center gap-2 font-medium">
              {t.name}
              {(t as any).deletedAt && <Badge color="clay">Archived</Badge>}
            </div>
            <div className="text-[11px] text-muted-foreground">{t.slug}</div>
          </div>
        </span>
      ),
    },
    {
      key: "admins",
      label: "Admins",
      width: "220px",
      render: (t) => (
        <AvatarStack
          members={(t as any).adminsPreview ?? []}
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
        <span className="tabular-nums">
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
          <span className="mr-2 text-xs text-muted-foreground">
            {(t as any).giftsMtdCount} gifts
          </span>
          {formatAmount((t as any).giftsMtdTotal ?? 0)}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    },
    {
      key: "created",
      label: "Created",
      width: "110px",
      render: (t) => <span className="text-sm text-muted-foreground">{formatMonthYear(t.createdAt)}</span>,
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
    <div className="h-full overflow-auto">
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

      <div className="mb-6 grid grid-cols-4 gap-4">
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
};
