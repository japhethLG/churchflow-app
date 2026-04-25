"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "../hooks";
import { invalidatePledges } from "./keys";
import { invalidateCampaigns } from "../campaigns/keys";

export type PledgesListQuery = {
  campaignId?: string;
  campaignItemId?: string;
  memberId?: string;
  status?: "ACTIVE" | "FULFILLED" | "CANCELLED";
  offset?: number;
  limit?: number;
};

export function usePledges(tenantId: string, query: PledgesListQuery = {}, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/pledges",
    { params: { path: { tenantId }, query } },
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
    onSuccess: () => {
      invalidatePledges(qc, tenantId);
      // Pledged totals are a campaign-progress aggregate.
      invalidateCampaigns(qc, tenantId);
    },
  });
}

export function useUpdatePledge(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/pledges/{id}", "patch", {
    onSuccess: () => {
      invalidatePledges(qc, tenantId);
      // Pledged totals are a campaign-progress aggregate.
      invalidateCampaigns(qc, tenantId);
    },
  });
}

export function useDeletePledge(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/pledges/{id}", "delete", {
    onSuccess: () => {
      invalidatePledges(qc, tenantId);
      // Pledged totals are a campaign-progress aggregate.
      invalidateCampaigns(qc, tenantId);
    },
  });
}
