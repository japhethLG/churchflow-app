"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { PageHeader, StatCard, Badge, Button, Card } from "@/components/primitives";
import { openModal } from "@/lib/modals/store";
import { useTenant } from "@/lib/api/tenants";
import { useAdminStats } from "@/lib/api/admin";
import { tenantLogoGradient, tenantInitials } from "@/lib/design/logo-gradient";

const TenantLogoTile = ({ name, slug, size = 48 }: { name: string; slug: string; size?: number }) => {
  const { from, to } = tenantLogoGradient(slug);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontSize: size * 0.3,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {tenantInitials(name)}
    </div>
  );
}

export default ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const { data: tenant, isLoading } = useTenant(id);

  if (isLoading) {
    return (
      <div style={{ padding: "40px 0" }}>
        <div style={{ height: 32, width: 240, background: S.surfaceContainer, borderRadius: 8, marginBottom: 32 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 100, background: S.surfaceContainerLowest, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!tenant) return <div style={{ padding: 40, color: S.error }}>Church not found.</div>;

  const isDeleted = Boolean((tenant as { deletedAt?: Date | null }).deletedAt);

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <PageHeader
        overline="Platform / Churches"
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TenantLogoTile name={tenant.name} slug={tenant.slug} size={40} />
            {tenant.name}
            {isDeleted && <Badge color="clay">Archived</Badge>}
          </span>
        }
        subtitle={`/${tenant.slug}`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => router.push(`/super-admin/tenants/${id}/admins`)}>
              Manage admins
            </Button>
            {!isDeleted && (
              <Button variant="secondary" onClick={() => openModal("edit-tenant", { tenantId: tenant.id, currentName: tenant.name })}>
                Edit
              </Button>
            )}
            <div style={{ position: "relative" }}>
              {!isDeleted ? (
                <Button
                  variant="tertiary"
                  destructive
                  onClick={() => openModal("confirm-delete-tenant", { tenantId: tenant.id, tenantName: tenant.name, onDeleted: () => router.push("/super-admin/tenants") })}
                >
                  Delete
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => openModal("confirm-restore-tenant", { tenantId: tenant.id, tenantName: tenant.name })}
                >
                  Restore
                </Button>
              )}
            </div>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* About card */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.onSurfaceMuted, marginBottom: 16 }}>
            About
          </div>
          {[
            ["Slug", `/${tenant.slug}`],
            ["Currency", tenant.currency],
            ["Timezone", tenant.timezone],
            ["Created", new Date(tenant.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
            ...(isDeleted ? [["Archived", new Date((tenant as unknown as { deletedAt: Date }).deletedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })]] : []),
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: `1px solid ${S.surfaceContainer}`,
                fontSize: 14,
              }}
            >
              <span style={{ color: S.onSurfaceMuted, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
              <span style={{ color: label === "Slug" ? S.primary : S.onSurface }}>{value}</span>
            </div>
          ))}

          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openModal("rename-tenant-slug", { tenantId: tenant.id, currentSlug: tenant.slug })}
            >
              Rename slug
            </Button>
          </div>
        </Card>

        {/* Recent activity placeholder */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.onSurfaceMuted, marginBottom: 16 }}>
            Recent activity
          </div>
          <div style={{ padding: "40px 0", textAlign: "center", color: S.onSurfaceMuted, fontSize: 13 }}>
            Audit log coming soon
          </div>
        </Card>
      </div>
    </div>
  );
}
