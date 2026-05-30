import { MemberDashboardPage } from "@/components/pages/member-dashboard";
import { HydrateClient, prefetchApiQuery } from "@/lib/api/prefetch";

// RSC wrapper: server-prefetch the deterministic-key queries behind the
// member dashboard's above-the-fold content — the church-pulse KPI strip
// (church summary) and the campaign list (which gates the progress fan-out)
// — so they hydrate from cache instead of waterfalling after mount.
export default async ({
	params,
}: {
	params: Promise<{ tenantSlug: string }>;
}) => {
	const { tenantSlug } = await params;
	await Promise.all([
		prefetchApiQuery("/api/v1/tenants/{tenantId}/me/church/summary", {
			params: { path: { tenantId: tenantSlug } },
		}),
		prefetchApiQuery("/api/v1/tenants/{tenantId}/me/campaigns", {
			params: {
				path: { tenantId: tenantSlug },
				query: { includeDeleted: true },
			},
		}),
	]);
	return (
		<HydrateClient>
			<MemberDashboardPage />
		</HydrateClient>
	);
};
