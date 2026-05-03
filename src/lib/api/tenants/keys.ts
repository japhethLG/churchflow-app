import type { QueryClient } from "@tanstack/react-query";
import { invalidateByPaths } from "../hooks";

// Every query key whose first element is one of these paths is considered
// a "tenant" query for invalidation. Keep this tight — nested resources
// (transactions, campaigns, etc.) have their own scopes.
export const TENANT_PATHS = [
	"/api/v1/platform/tenants",
	"/api/v1/platform/tenants/{tenantId}",
	"/api/v1/platform/tenants/{tenantId}/restore",
	"/api/v1/platform/tenants/{tenantId}/slug",
	"/api/v1/platform/tenants/slug-suggestion",
	"/api/v1/tenants/{tenantId}",
	"/api/v1/tenants/{tenantId}/me/church",
] as const;

export const invalidateTenants = (qc: QueryClient) => {
	return invalidateByPaths(qc, TENANT_PATHS);
};
