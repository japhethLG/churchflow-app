"use client";

import { useRouter } from "next/navigation";
import { PageHeader, Badge, Button, Card } from "@/components/primitives";
import { openModal } from "@/lib/modals/store";
import { useTenant } from "@/lib/api/tenants";
import dayjs from "@/lib/dayjs";
import { tenantLogoGradient, tenantInitials } from "@/lib/design/logo-gradient";

const TenantLogoTile = ({
  name,
  slug,
  size = 48,
}: {
  name: string;
  slug: string;
  size?: number;
}) => {
  const { from, to } = tenantLogoGradient(slug);
  return (
    <div
      className="grid shrink-0 place-items-center rounded-[14px] font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.3,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {tenantInitials(name)}
    </div>
  );
};

export const TenantDetailPage = ({ id }: { id: string }) => {
  const router = useRouter();
  const { data: tenant, isLoading } = useTenant(id);

  if (isLoading) {
    return (
      <div className="py-10">
        <div className="mb-8 h-8 w-60 animate-pulse rounded-lg bg-secondary" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[100px] animate-pulse rounded-2xl bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-10 text-destructive">Church not found.</div>
    );
  }

  const isDeleted = Boolean((tenant as { deletedAt?: Date | null }).deletedAt);

  return (
    <div className="h-full overflow-auto">
      <PageHeader
        overline="Platform / Churches"
        title={
          <span className="inline-flex items-center gap-3">
            <TenantLogoTile name={tenant.name} slug={tenant.slug} size={40} />
            {tenant.name}
            {isDeleted && <Badge color="clay">Archived</Badge>}
          </span>
        }
        subtitle={`/${tenant.slug}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                router.push(`/super-admin/tenants/${id}/admins`)
              }
            >
              Manage admins
            </Button>
            {!isDeleted && (
              <Button
                variant="secondary"
                onClick={() =>
                  openModal("edit-tenant", {
                    tenantId: tenant.id,
                    currentName: tenant.name,
                  })
                }
              >
                Edit
              </Button>
            )}
            {!isDeleted ? (
              <Button
                variant="tertiary"
                destructive
                onClick={() =>
                  openModal("confirm-delete-tenant", {
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    onDeleted: () => router.push("/super-admin/tenants"),
                  })
                }
              >
                Delete
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() =>
                  openModal("confirm-restore-tenant", {
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                  })
                }
              >
                Restore
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            About
          </div>
          {(
            [
              ["Slug", `/${tenant.slug}`, true],
              [
                "Created",
                dayjs(tenant.createdAt).format("MMMM D, YYYY"),
                false,
              ],
              ...(isDeleted
                ? ([
                    [
                      "Archived",
                      dayjs(
                        (tenant as unknown as { deletedAt: Date }).deletedAt,
                      ).format("MMMM D, YYYY"),
                      false,
                    ],
                  ] as const)
                : []),
            ] as const
          ).map(([label, value, isSlug]) => (
            <div
              key={label}
              className="flex justify-between border-b border-border py-3 text-sm last:border-b-0"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {label}
              </span>
              <span
                className={
                  isSlug ? "text-primary" : "text-foreground"
                }
              >
                {value}
              </span>
            </div>
          ))}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                openModal("rename-tenant-slug", {
                  tenantId: tenant.id,
                  currentSlug: tenant.slug,
                })
              }
            >
              Rename slug
            </Button>
          </div>
        </Card>

        <Card>
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Recent activity
          </div>
          <div className="py-10 text-center text-[13px] text-muted-foreground">
            Audit log coming soon
          </div>
        </Card>
      </div>
    </div>
  );
};
