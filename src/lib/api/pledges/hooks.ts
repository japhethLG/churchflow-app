"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "../hooks";
import { invalidatePledges } from "./keys";

export function usePledges(tenantId: string, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/pledges",
    { params: { path: { tenantId } } },
    { enabled: enabled && Boolean(tenantId) }
  );
}

export function usePledge(tenantId: string, id: string, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/pledges/{id}",
    { params: { path: { tenantId, id } } },
    { enabled: enabled && Boolean(tenantId) && Boolean(id) }
  );
}

export function useCreatePledge(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/pledges", "post", {
    onSuccess: () => invalidatePledges(qc, tenantId),
  });
}

export function useUpdatePledge(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/pledges/{id}", "patch", {
    onSuccess: () => invalidatePledges(qc, tenantId),
  });
}

export function useDeletePledge(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/pledges/{id}", "delete", {
    onSuccess: () => invalidatePledges(qc, tenantId),
  });
}
