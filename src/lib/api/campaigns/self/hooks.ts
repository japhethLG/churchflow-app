"use client";

import { useApiQuery } from "../../hooks";

// Self intent — read-only access to campaigns visible to any member.
// Member-facing dashboards and the pledge flow use these hooks; admin
// management surfaces use the tenant hooks.

export const useMyCampaigns = (tenantId: string, enabled = true) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/campaigns",
		{ params: { path: { tenantId } } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

export const useMyCampaign = (
	tenantId: string,
	id: string,
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/campaigns/{id}",
		{ params: { path: { tenantId, id } } },
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
