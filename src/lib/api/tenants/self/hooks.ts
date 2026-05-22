"use client";

import { useApiQuery } from "../../hooks";

// Self intent — the caller's view of their church profile. Read-only.
// Use this from member-facing pages (header greetings, dashboards).
// Admin settings pages use the tenant intent (useTenant + useUpdateTenant).

export const useMyChurch = (tenantId: string, enabled = true) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/church",
		{ params: { path: { tenantId } } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

// Aggregate church pulse for the member dashboard. Sums + counts only —
// never per-row reads of other members' transactions / pledges.
export const useMyChurchSummary = (tenantId: string, enabled = true) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/church/summary",
		{ params: { path: { tenantId } } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};
