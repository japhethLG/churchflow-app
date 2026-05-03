"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "../../hooks";
import { invalidateCampaigns } from "../keys";

// Tenant intent — admin-facing campaign management hooks.

export const useCampaigns = (tenantId: string, enabled = true) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/campaigns",
		{ params: { path: { tenantId } } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

// Returns a campaign with its items embedded.
export const useCampaign = (tenantId: string, id: string, enabled = true) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/campaigns/{id}",
		{ params: { path: { tenantId, id } } },
		{ enabled: enabled && Boolean(tenantId) && Boolean(id) },
	);
};

// Live progress: per-item pledged/raised + campaign-level totals.
// Recomputed server-side on every read, so no extra invalidation needed
// beyond the campaign-paths set.
export const useCampaignProgress = (
	tenantId: string,
	id: string,
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/campaigns/{id}/progress",
		{ params: { path: { tenantId, id } } },
		{ enabled: enabled && Boolean(tenantId) && Boolean(id) },
	);
};

export const useCreateCampaign = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/campaigns", "post", {
		onSuccess: () => invalidateCampaigns(qc, tenantId),
	});
};

export const useUpdateCampaign = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/campaigns/{id}", "patch", {
		onSuccess: () => invalidateCampaigns(qc, tenantId),
	});
};

export const useDeleteCampaign = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/campaigns/{id}", "delete", {
		onSuccess: () => invalidateCampaigns(qc, tenantId),
	});
};

export const useRestoreCampaign = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/campaigns/{id}/restore",
		"post",
		{ onSuccess: () => invalidateCampaigns(qc, tenantId) },
	);
};

// Campaign items (nested under a campaign)

export const useAddCampaignItem = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/campaigns/{id}/items",
		"post",
		{ onSuccess: () => invalidateCampaigns(qc, tenantId) },
	);
};

export const useUpdateCampaignItem = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/campaigns/{id}/items/{itemId}",
		"patch",
		{ onSuccess: () => invalidateCampaigns(qc, tenantId) },
	);
};

export const useDeleteCampaignItem = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/campaigns/{id}/items/{itemId}",
		"delete",
		{ onSuccess: () => invalidateCampaigns(qc, tenantId) },
	);
};
