"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "../hooks";
import { invalidateCampaigns } from "./keys";

// Campaigns

export function useCampaigns(tenantId: string, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/campaigns",
    { params: { path: { tenantId } } },
    { enabled: enabled && Boolean(tenantId) }
  );
}

// Returns a campaign with its items embedded.
export function useCampaign(tenantId: string, id: string, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/campaigns/{id}",
    { params: { path: { tenantId, id } } },
    { enabled: enabled && Boolean(tenantId) && Boolean(id) }
  );
}

// Live progress: per-item pledged/raised + campaign-level totals.
// Recomputed server-side on every read, so no extra invalidation needed
// beyond the campaign-paths set.
export function useCampaignProgress(tenantId: string, id: string, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/campaigns/{id}/progress",
    { params: { path: { tenantId, id } } },
    { enabled: enabled && Boolean(tenantId) && Boolean(id) }
  );
}

export function useCreateCampaign(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/campaigns", "post", {
    onSuccess: () => invalidateCampaigns(qc, tenantId),
  });
}

export function useUpdateCampaign(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/campaigns/{id}", "patch", {
    onSuccess: () => invalidateCampaigns(qc, tenantId),
  });
}

export function useDeleteCampaign(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/campaigns/{id}", "delete", {
    onSuccess: () => invalidateCampaigns(qc, tenantId),
  });
}

// Campaign items (nested under a campaign)

export function useAddCampaignItem(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation(
    "/api/v1/tenants/{tenantId}/campaigns/{id}/items",
    "post",
    { onSuccess: () => invalidateCampaigns(qc, tenantId) }
  );
}

export function useUpdateCampaignItem(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation(
    "/api/v1/tenants/{tenantId}/campaigns/{id}/items/{itemId}",
    "patch",
    { onSuccess: () => invalidateCampaigns(qc, tenantId) }
  );
}

export function useDeleteCampaignItem(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation(
    "/api/v1/tenants/{tenantId}/campaigns/{id}/items/{itemId}",
    "delete",
    { onSuccess: () => invalidateCampaigns(qc, tenantId) }
  );
}
