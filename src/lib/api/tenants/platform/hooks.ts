"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "../../hooks";
import { invalidateTenants } from "../keys";

// Platform intent — super-admin platform management. Lives at
// /platform/tenants/* on the backend.

export type TenantsListQuery = {
	// 3-state archive filter — see members/tenant/hooks for encoding.
	includeDeleted?: boolean;
	onlyDeleted?: boolean;
};

export const useTenants = (query: TenantsListQuery = {}) => {
	const hasFilter = query.includeDeleted || query.onlyDeleted;
	return useApiQuery(
		"/api/v1/platform/tenants",
		hasFilter ? { params: { query } } : undefined,
	);
};

export const useCreateTenant = () => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/platform/tenants", "post", {
		onSuccess: () => invalidateTenants(qc),
	});
};

export const useDeleteTenant = () => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/platform/tenants/{tenantId}", "delete", {
		onSuccess: () => invalidateTenants(qc),
	});
};

// Slug rename is super-admin only — kept separate from generic update so
// the UI can ask for explicit confirmation (it invalidates URLs that
// point at the old slug).
export const useRenameTenantSlug = () => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/platform/tenants/{tenantId}/slug", "patch", {
		onSuccess: () => invalidateTenants(qc),
	});
};

export const useRestoreTenant = () => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/platform/tenants/{tenantId}/restore", "post", {
		onSuccess: () => invalidateTenants(qc),
	});
};

export const useSlugSuggestion = (name: string, enabled = true) => {
	return useApiQuery(
		"/api/v1/platform/tenants/slug-suggestion",
		{ params: { query: { name } } },
		{ enabled: enabled && name.length >= 3, staleTime: 30_000 },
	);
};
