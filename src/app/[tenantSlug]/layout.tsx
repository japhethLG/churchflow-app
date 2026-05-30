import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { HydrateClient } from "@/lib/api/prefetch";
import { getServerQueryClient } from "@/lib/api/query-client.server";
import { serverApi } from "@/lib/api/server";
import { getSessionUser } from "@/lib/auth/server";

// Outer tenant gate. Applies to every /[tenantSlug]/* path. Three checks:
//   1. Caller is signed in.
//   2. Caller is a member of this tenant OR a super-admin.
//   3. The tenant exists (only meaningful for super-admins — non-members
//      get sent to / before this check, so they can't probe slugs).
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
		// Don't leak tenant existence to non-members — send them to
		// landing so they can switch to a tenant they actually belong to.
		redirect("/");
	}

	if (!isMember && user.isSuperAdmin) {
		// Super-admin can hit any slug, including ones that don't exist.
		// Verify before rendering so we 404 from the server instead of
		// flickering through the page shell.
		try {
			const tenantInit = {
				params: { path: { tenantId: tenantSlug } },
			};
			const { data } = await serverApi.GET(
				"/api/v1/tenants/{tenantId}",
				tenantInit,
			);
			// Reuse the validation payload instead of discarding it: seed it
			// under the exact `useTenant(slug)` key so client surfaces (e.g.
			// settings) hydrate the tenant from cache rather than refetching.
			if (data) {
				getServerQueryClient().setQueryData(
					["/api/v1/tenants/{tenantId}", tenantInit],
					data,
				);
			}
		} catch (err) {
			const status =
				err && typeof err === "object" && "status" in err
					? (err as { status: number }).status
					: 0;
			if (status === 404 || status === 403) {
				notFound();
			}
			throw err;
		}
	}

	return <HydrateClient>{children}</HydrateClient>;
};
