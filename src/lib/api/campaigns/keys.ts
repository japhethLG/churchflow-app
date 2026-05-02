import type { QueryClient } from "@tanstack/react-query";

// Campaigns own their items (nested routes). When anything about a
// campaign or its items changes, invalidate the whole set for that
// tenant — campaign detail returns items embedded, so partial
// invalidation is not worth the added bookkeeping.
export const CAMPAIGN_PATHS = [
	"/api/v1/tenants/{tenantId}/campaigns",
	"/api/v1/tenants/{tenantId}/campaigns/{id}",
	"/api/v1/tenants/{tenantId}/campaigns/{id}/items",
	"/api/v1/tenants/{tenantId}/campaigns/{id}/items/{itemId}",
] as const;

export const invalidateCampaigns = (qc: QueryClient, tenantId?: string) => {
	const set = new Set<string>(CAMPAIGN_PATHS);
	return qc.invalidateQueries({
		predicate: (q) => {
			const [path, init] = q.queryKey as [
				unknown,
				{ params?: { path?: { tenantId?: string } } } | undefined,
			];
			if (typeof path !== "string" || !set.has(path)) return false;
			if (tenantId && init?.params?.path?.tenantId !== tenantId) return false;
			return true;
		},
	});
};
