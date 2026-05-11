import type { ReactNode } from "react";
import {
	LandingFooter,
	LandingNavbar,
	type LandingNavbarUser,
} from "@/components/pages/landing";
import { getSessionUser } from "@/lib/auth/server";

// Shared chrome for /privacy and /terms. Reuses the public LandingNavbar
// (which handles both signed-in and guest states) so visitors can jump
// straight back to the marketing surface or their dashboard.
export default async ({ children }: { children: ReactNode }) => {
	const user = await getSessionUser();

	let navbarUser: LandingNavbarUser | null = null;
	if (user) {
		const memberships = Object.entries(user.tenantMemberships).map(
			([slug, m]) => ({ slug, name: m.name, role: m.role }),
		);
		const adminMembership = memberships.find((m) => m.role === "ADMIN");
		const fallbackMembership = memberships[0];
		const perspective = user.isSuperAdmin
			? "super"
			: adminMembership
				? "admin"
				: "member";
		const tenantSlug =
			perspective === "admin"
				? adminMembership?.slug
				: perspective === "member"
					? fallbackMembership?.slug
					: undefined;
		navbarUser = {
			userName: user.displayName ?? user.email ?? "Account",
			userEmail: user.email ?? undefined,
			memberships,
			isSuperAdmin: user.isSuperAdmin,
			perspective,
			tenantSlug,
		};
	}

	return (
		<div className="flex min-h-screen flex-col bg-background font-sans antialiased">
			{/* Legal pages live on their own URLs, so the landing
			    anchor links (#features, #faq, …) wouldn't resolve here
			    — hide them to avoid broken navigation. */}
			<LandingNavbar user={navbarUser} showNavItems={false} />
			<main className="flex-1 pt-16">{children}</main>
			<LandingFooter />
		</div>
	);
};
