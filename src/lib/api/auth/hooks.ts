"use client";

import { useApiQuery } from "../hooks";

// Returns the decoded Firebase token for the current request. When the user
// hasn't selected a tenant yet, tenantId/memberId/role/isSuperAdmin are
// undefined in the response. Multi-step flows (signInWithGoogle,
// switchTenant) live in `@/lib/auth/actions` — this hook is a pure read.
export function useAuthMe() {
  return useApiQuery("/api/v1/auth/me");
}
