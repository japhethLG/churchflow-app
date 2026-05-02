import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout";
import { getSessionUser } from "@/lib/auth/server";

// Admin-perspective gate. Lives under [tenantSlug] so TenantLayout has
// already verified membership / super-admin. This layout narrows further
// to ADMIN role, and renders the admin-flavour AppShell.
//
// Super-admins who don't have a Member row in this tenant fall through
// to the admin view too (they're platform owners acting on the tenant's
// data). If a super-admin *does* have a USER membership, though, they
// get sent to the member view — their explicit role takes precedence.
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

	if (membership) {
		if (membership.role !== "ADMIN") {
			redirect(`/${tenantSlug}/member/dashboard`);
		}
	} else if (!user.isSuperAdmin) {
		redirect("/");
	}

	const memberships = Object.entries(user.tenantMemberships).map(
		([slug, m]) => ({
			slug,
			name: m.name,
			role: m.role,
		}),
	);

	return (
		<AppShell
			perspective="admin"
			tenantSlug={tenantSlug}
			churchName={membership?.name ?? tenantSlug}
			userName={user.displayName ?? user.email ?? "You"}
			userEmail={user.email ?? undefined}
			memberships={memberships}
			isSuperAdmin={user.isSuperAdmin}
		>
			{children}
		</AppShell>
	);
};
