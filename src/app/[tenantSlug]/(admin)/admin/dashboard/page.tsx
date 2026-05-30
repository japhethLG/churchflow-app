import { AdminDashboardPage } from "@/components/pages/dashboard";
import { HydrateClient, prefetchApiQuery } from "@/lib/api/prefetch";

// RSC wrapper: server-prefetch the deterministic-key queries the dashboard
// fires on mount (the campaign list, which also gates the deadline-watch
// progress batch) so they hydrate from cache instead of waterfalling after
// the client mounts. Time-windowed summaries stay client-fetched (their key
// depends on a client-computed dayjs window) and are smoothed by the loading
// skeleton + keepPreviousData.
export default async ({
	params,
}: {
	params: Promise<{ tenantSlug: string }>;
}) => {
	const { tenantSlug } = await params;
	await prefetchApiQuery("/api/v1/tenants/{tenantId}/campaigns", {
		params: { path: { tenantId: tenantSlug }, query: {} },
	});
	return (
		<HydrateClient>
			<AdminDashboardPage />
		</HydrateClient>
	);
};
