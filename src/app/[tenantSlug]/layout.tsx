import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { TenantGuard } from "@/components/auth/TenantGuard";
import { getSessionUser } from "@/lib/auth/server";

// Outer tenant gate. Applies to every /[tenantSlug]/* path. Two checks:
//   1. Caller is signed in.
//   2. Caller is a member of this tenant OR a super-admin.
//
// A third check — does the tenant actually exist? — runs in <TenantGuard>
// (a client component that calls the backend). It's not in this server
// layout because the session has no list of all tenants and the backend
// client is currently client-only; verifying existence here would require
// wiring server-side data fetch with auth, which we haven't done yet.
//
// Per-perspective role (admin vs member) is enforced by the inner
// (admin) / (member) group layouts.
export default async ({
	params,
	children,
}: {
	params: Promise<{ tenantSlug: string }>;
	children: ReactNode;
}) => {
	const { tenantSlug } = await params;
	const user = await getSessionUser();
	if (!user) {
		redirect("/login");
	}

	const isMember = Boolean(user.tenantMemberships[tenantSlug]);
	if (!isMember && !user.isSuperAdmin) {
		// Don't leak tenant existence to non-members — send them to landing
		// so they can switch to a tenant they actually belong to. The
		// not-found page is reserved for genuinely unknown slugs (caught
		// by TenantGuard once the backend confirms 404).
		redirect("/");
	}

	return <TenantGuard tenantSlug={tenantSlug}>{children}</TenantGuard>;
};
