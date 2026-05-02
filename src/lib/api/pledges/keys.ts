import type { QueryClient } from "@tanstack/react-query";

export const PLEDGE_PATHS = [
	"/api/v1/tenants/{tenantId}/pledges",
	"/api/v1/tenants/{tenantId}/pledges/{id}",
] as const;

export const invalidatePledges = (qc: QueryClient, tenantId?: string) => {
	const set = new Set<string>(PLEDGE_PATHS);
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
