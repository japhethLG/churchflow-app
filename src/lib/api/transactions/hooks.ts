"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "../hooks";
import { invalidateTransactions } from "./keys";

export function useTransactions(tenantId: string, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/transactions",
    { params: { path: { tenantId } } },
    { enabled: enabled && Boolean(tenantId) }
  );
}

export function useTransaction(tenantId: string, id: string, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/transactions/{id}",
    { params: { path: { tenantId, id } } },
    { enabled: enabled && Boolean(tenantId) && Boolean(id) }
  );
}

export function useCreateTransaction(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/transactions", "post", {
    onSuccess: () => invalidateTransactions(qc, tenantId),
  });
}

export function useUpdateTransaction(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation(
    "/api/v1/tenants/{tenantId}/transactions/{id}",
    "patch",
    { onSuccess: () => invalidateTransactions(qc, tenantId) }
  );
}

export function useDeleteTransaction(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation(
    "/api/v1/tenants/{tenantId}/transactions/{id}",
    "delete",
    { onSuccess: () => invalidateTransactions(qc, tenantId) }
  );
}
