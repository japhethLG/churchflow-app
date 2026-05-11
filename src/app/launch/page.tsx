import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";

// Post-login fanout. Used to live in /page.tsx, but `/` is now the
// public landing page that anyone (signed-in or not) can visit, so the
// "decide where the user belongs" logic moved here. The login button
// pushes /launch after sign-in; tenant redirects elsewhere in the app
// also target /launch when they need to "send the user home."
export default async () => {
	const user = await getSessionUser();

	if (!user) {
		redirect("/login");
	}

	if (user.isSuperAdmin) {
		redirect("/super-admin/tenants");
	}

	const memberships = Object.entries(user.tenantMemberships);

	if (memberships.length === 0) {
		redirect("/select-church");
	}

	if (memberships.length > 1) {
		redirect("/select-church");
	}

	const [slug, membership] = memberships[0];
	redirect(
		membership.role === "ADMIN"
			? `/${slug}/admin/dashboard`
			: `/${slug}/member/dashboard`,
	);
};
