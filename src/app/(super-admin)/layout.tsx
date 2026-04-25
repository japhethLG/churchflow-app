import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getSessionUser } from "@/lib/auth/server";

// Platform-ops gate. Lives at the top level (not under [tenantSlug])
// because /super-admin/* routes manage all tenants — they're not scoped
// to any one church.
export default async ({
  children,
}: {
  children: ReactNode;
}) => {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.isSuperAdmin) redirect("/");

  const memberships = Object.entries(user.tenantMemberships).map(([slug, m]) => ({
    slug,
    name: m.name,
    role: m.role,
  }));

  return (
    <AppShell
      perspective="super"
      churchName="Platform"
      userName={user.displayName ?? user.email ?? "Super Admin"}
      userEmail={user.email ?? undefined}
      memberships={memberships}
      isSuperAdmin
    >
      {children}
    </AppShell>
  );
}
