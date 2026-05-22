import type { QueryClient } from "@tanstack/react-query";

export const TRANSACTION_PATHS = [
	"/api/v1/tenants/{tenantId}/transactions",
	"/api/v1/tenants/{tenantId}/transactions/bulk",
	"/api/v1/tenants/{tenantId}/transactions/{id}",
	"/api/v1/tenants/{tenantId}/transactions/{id}/restore",
	"/api/v1/tenants/{tenantId}/transactions/summary",
	"/api/v1/tenants/{tenantId}/me/transactions",
	"/api/v1/tenants/{tenantId}/me/transactions/{id}",
	"/api/v1/tenants/{tenantId}/me/transactions/summary",
] as const;

// Transactions are always tenant-scoped, so invalidation is scoped too:
// `invalidateTransactions(qc, tenantId)` only touches queries whose init
// had params.path.tenantId === tenantId. Pass undefined to invalidate
// transactions for every tenant (rare — e.g. sign-out).
export const invalidateTransactions = (qc: QueryClient, tenantId?: string) => {
	const set = new Set<string>(TRANSACTION_PATHS);
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
