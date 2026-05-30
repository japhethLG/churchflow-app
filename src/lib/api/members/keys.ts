import type { QueryClient } from "@tanstack/react-query";

export const MEMBER_PATHS = [
	"/api/v1/tenants/{tenantId}/members",
	"/api/v1/tenants/{tenantId}/members/{id}",
	"/api/v1/tenants/{tenantId}/members/{id}/restore",
	"/api/v1/tenants/{tenantId}/members/{id}/summary",
	"/api/v1/tenants/{tenantId}/members/{id}/merge",
	"/api/v1/tenants/{tenantId}/members/{id}/merge-preview",
	"/api/v1/tenants/{tenantId}/members/giving-trend",
	"/api/v1/tenants/{tenantId}/me/profile",
] as const;

export const invalidateMembers = (qc: QueryClient, tenantId?: string) => {
	const set = new Set<string>(MEMBER_PATHS);
	return qc.invalidateQueries({
		predicate: (q) => {
			const [path, init] = q.queryKey as [
				unknown,
				{ params?: { path?: { tenantId?: string } } } | undefined,
			];
			if (typeof path !== "string" || !set.has(path)) {
				return false;
			}
			if (tenantId && init?.params?.path?.tenantId !== tenantId) {
				return false;
			}
			return true;
		},
	});
};
