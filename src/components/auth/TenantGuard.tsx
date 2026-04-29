"use client";

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { useTenant } from "@/lib/api/tenants";

// Calls notFound() when the backend says the tenant doesn't exist (or the
// caller has no access at the API layer). Renders children optimistically
// while loading so pages can show their own skeletons — only a confirmed
// 404 trips the not-found boundary.
//
// Why a client guard: the outer [tenantSlug]/layout already enforces
// "signed in + member-or-superadmin" from the session cookie, but a
// super-admin can hit any slug — including ones that don't exist.
// The session has no list of all tenants, so the existence check has to
// hit the backend, and our backend client is currently client-only.
export const TenantGuard = ({
  tenantSlug,
  children,
}: {
  tenantSlug: string;
  children: ReactNode;
}) => {
  const { error } = useTenant(tenantSlug);
  if (error) {
    const status = (error as { statusCode?: number; status?: number }).statusCode
      ?? (error as { status?: number }).status;
    if (status === 404 || status === 403) notFound();
  }
  return <>{children}</>;
};
