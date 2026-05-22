"use client";

import { useQueryClient } from "@tanstack/react-query";

import { invalidateCampaigns } from "../../campaigns/keys";
import { type GetQuery, useApiMutation, useApiQuery } from "../../hooks";
import { invalidatePledges } from "../keys";

// Tenant intent — admin-facing pledge management hooks. Members consume
// the self-intent variants (useMyPledges, etc.) which scope to the
// caller automatically.

export type PledgesListQuery = GetQuery<
	"/api/v1/tenants/{tenantId}/pledges",
	"get"
>;

export const usePledges = (
	tenantId: string,
	query: PledgesListQuery = {},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/pledges",
		{ params: { path: { tenantId }, query } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

export const usePledge = (
	tenantId: string,
	id: string,
	options: { includeDeleted?: boolean; enabled?: boolean } = {},
) => {
	const { includeDeleted, enabled = true } = options;
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/pledges/{id}",
		{
			params: {
				path: { tenantId, id },
				query: includeDeleted ? { includeDeleted: true } : undefined,
			},
		},
		{ enabled: enabled && Boolean(tenantId) && Boolean(id) },
	);
};

export const useCreatePledge = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/pledges", "post", {
		onSuccess: () => {
			invalidatePledges(qc, tenantId);
			invalidateCampaigns(qc, tenantId);
		},
	});
};

export const useUpdatePledge = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/pledges/{id}", "patch", {
		onSuccess: () => {
			invalidatePledges(qc, tenantId);
			invalidateCampaigns(qc, tenantId);
		},
	});
};

export const useDeletePledge = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/pledges/{id}", "delete", {
		onSuccess: () => {
			invalidatePledges(qc, tenantId);
			invalidateCampaigns(qc, tenantId);
		},
	});
};

export const useRestorePledge = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/pledges/{id}/restore",
		"post",
		{
			onSuccess: () => {
				invalidatePledges(qc, tenantId);
				invalidateCampaigns(qc, tenantId);
			},
		},
	);
};
