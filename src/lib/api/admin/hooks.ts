"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "../hooks";
import { invalidateAdmin } from "./keys";
import { invalidateTenants } from "../tenants/keys";

export function useAdminStats() {
  return useApiQuery("/api/v1/admin/stats");
}

export function useAdminUsers(
  filters?: {
    search?: string;
    tenantId?: string;
    superAdminOnly?: boolean;
    skip?: number;
    take?: number;
  },
  enabled = true,
) {
  return useApiQuery(
    "/api/v1/admin/users",
    { params: { query: filters ?? {} } },
    { enabled },
  );
}

export function useToggleSuperAdmin() {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/admin/users/{id}", "patch", {
    onSuccess: () => {
      invalidateAdmin(qc);
      // Tenant list shows admin counts so must be invalidated too
      invalidateTenants(qc);
    },
  });
}
