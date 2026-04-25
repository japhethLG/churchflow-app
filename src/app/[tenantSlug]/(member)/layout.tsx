import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getSessionUser } from "@/lib/auth/server";

// Member-perspective gate. Any membership (USER or ADMIN) passes — an
// admin can flip into the member view to pledge on their own behalf.
// Super-admins without a Member row get redirected; they should act on
// tenants through /admin/* instead.
export default async ({
  params,
  children,
}: {
  params: Promise<{ tenantSlug: string }>;
  children: ReactNode;
}) => {
  const { tenantSlug } = await params;
  const user = (await getSessionUser())!; // TenantLayout guaranteed non-null

  const membership = user.tenantMemberships[tenantSlug];
  if (!membership) {
    // Super-admins should use /[slug]/admin/* for platform ops.
    redirect("/");
  }

  const memberships = Object.entries(user.tenantMemberships).map(([slug, m]) => ({
    slug,
    name: m.name,
    role: m.role,
  }));

  return (
    <AppShell
      perspective="member"
      tenantSlug={tenantSlug}
      churchName={membership.name}
      userName={user.displayName ?? user.email ?? "You"}
      userEmail={user.email ?? undefined}
      memberships={memberships}
      isSuperAdmin={user.isSuperAdmin}
    >
      {children}
    </AppShell>
  );
}
