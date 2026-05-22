"use client";

import { useQueryClient } from "@tanstack/react-query";

import { type GetQuery, useApiMutation, useApiQuery } from "../../hooks";
import { invalidateCampaigns } from "../keys";

// Tenant intent — admin-facing campaign management hooks.

export type CampaignsListQuery = GetQuery<
	"/api/v1/tenants/{tenantId}/campaigns",
	"get"
>;

export const useCampaigns = (
	tenantId: string,
	query: CampaignsListQuery = {},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/campaigns",
		{ params: { path: { tenantId }, query } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

// Returns a campaign with its items embedded. Pass `includeDeleted` to
// fetch an archived campaign (banner detail view) AND surface archived
// items in the "Removed items" section. Pass `onlyDeleted` to filter
// items to tombstones only.
export const useCampaign = (
	tenantId: string,
	id: string,
	options: {
		includeDeleted?: boolean;
		onlyDeleted?: boolean;
		enabled?: boolean;
	} = {},
) => {
	const { includeDeleted, onlyDeleted, enabled = true } = options;
	const query =
		includeDeleted || onlyDeleted ? { includeDeleted, onlyDeleted } : undefined;
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/campaigns/{id}",
		{ params: { path: { tenantId, id }, query } },
		{ enabled: enabled && Boolean(tenantId) && Boolean(id) },
	);
};

// Cascade preview for the restore confirmation modal. Returns a record
// of child-model → count (e.g. `{ CampaignItem: 12 }`). Empty when the
// campaign has no cascaded descendants.
export const useCampaignRestorePreview = (
	tenantId: string,
	id: string,
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/campaigns/{id}/restore-preview",
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

export const useRestoreCampaignItem = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/campaigns/{id}/items/{itemId}/restore",
		"post",
		{ onSuccess: () => invalidateCampaigns(qc, tenantId) },
	);
};
