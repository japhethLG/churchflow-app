"use client";

import { type GetQuery, useApiQuery } from "../../hooks";

// Self intent — read-only access to campaigns visible to any member.
// Member-facing dashboards and the pledge flow use these hooks; admin
// management surfaces use the tenant hooks.

export type MyCampaignsListQuery = GetQuery<
	"/api/v1/tenants/{tenantId}/me/campaigns",
	"get"
>;

export const useMyCampaigns = (
	tenantId: string,
	query: MyCampaignsListQuery = {},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/campaigns",
		{ params: { path: { tenantId }, query } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

// Batch progress for many campaigns (member view). Mirrors the tenant
// useCampaignsProgressBatch — replaces the member dashboard / campaigns-list
// fan-out of N individual /me/campaigns/:id/progress calls with one request.
export const useMyCampaignsProgressBatch = (
	tenantId: string,
	campaignIds: string[],
	enabled = true,
) => {
	const ids = [...campaignIds].sort().join(",");
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/campaigns/progress/batch",
		{ params: { path: { tenantId }, query: { ids } } },
		{ enabled: enabled && Boolean(tenantId) && campaignIds.length > 0 },
	);
};

export const useMyCampaign = (
	tenantId: string,
	id: string,
	options: { includeDeleted?: boolean; enabled?: boolean } = {},
) => {
	const { includeDeleted, enabled = true } = options;
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/campaigns/{id}",
		{
			params: {
				path: { tenantId, id },
				query: includeDeleted ? { includeDeleted: true } : undefined,
			},
		},
		{ enabled: enabled && Boolean(tenantId) && Boolean(id) },
	);
};

export const useMyCampaignProgress = (
	tenantId: string,
	id: string,
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/campaigns/{id}/progress",
		{ params: { path: { tenantId, id } } },
		{ enabled: enabled && Boolean(tenantId) && Boolean(id) },
	);
};
