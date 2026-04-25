"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "../hooks";
import { invalidateTransactions } from "./keys";

export type TransactionsListQuery = {
  memberId?: string;
  campaignId?: string;
  campaignItemId?: string;
  pledgeId?: string;
  type?: "TITHE" | "OFFERING" | "MISSION_GIVING" | "FIRST_FRUIT" | "COMMITMENT" | "DONATION" | "OTHER";
  dateFrom?: string;
  dateTo?: string;
  offset?: number;
  limit?: number;
};

export function useTransactions(tenantId: string, query: TransactionsListQuery = {}, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/transactions",
    { params: { path: { tenantId }, query } },
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
