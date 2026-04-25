import type { QueryClient } from "@tanstack/react-query";
import { invalidateByPaths } from "../hooks";

// Every query key whose first element is one of these paths is considered
// a "tenant" query for invalidation. Keep this tight — nested resources
// (transactions, campaigns, etc.) have their own scopes.
export const TENANT_PATHS = [
  "/api/v1/tenants",
  "/api/v1/tenants/{tenantId}",
] as const;

export const invalidateTenants = (qc: QueryClient) => {
  return invalidateByPaths(qc, TENANT_PATHS);
}
