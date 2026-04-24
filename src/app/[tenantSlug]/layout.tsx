import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth/server";

// Outer tenant gate. Applies to every /[tenantSlug]/* path. Only checks
// that the caller is SIGNED IN and either:
//   (a) a member of this tenant, or
//   (b) a super-admin.
//
// Per-perspective role (admin vs member) is enforced by the inner
// (admin) / (member) group layouts, so each gate does exactly one thing.
export default async function TenantLayout({
  params,
  children,
}: {
  params: Promise<{ tenantSlug: string }>;
  children: ReactNode;
}) {
  const { tenantSlug } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const isMember = Boolean(user.tenantMemberships[tenantSlug]);
  if (!isMember && !user.isSuperAdmin) {
    // Don't leak the tenant's existence — send to landing so they can
    // switch to a tenant they actually belong to.
    redirect("/");
  }

  return <>{children}</>;
}
