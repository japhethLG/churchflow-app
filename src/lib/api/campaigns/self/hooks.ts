"use client";

import { useApiQuery } from "../../hooks";

// Self intent — read-only access to campaigns visible to any member.
// Member-facing dashboards and the pledge flow use these hooks; admin
// management surfaces use the tenant hooks.

export type MyCampaignsListQuery = {
	status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
	// ISO 8601 UTC, both inclusive — bracket the campaign's createdAt.
	dateFrom?: string;
	dateTo?: string;
	offset?: number;
	limit?: number;
	includeDeleted?: boolean;
	onlyDeleted?: boolean;
};

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
