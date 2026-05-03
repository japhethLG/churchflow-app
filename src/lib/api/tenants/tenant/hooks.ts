"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "../../hooks";
import { invalidateTenants } from "../keys";

// Tenant intent — admin reads and updates the church metadata for a
// specific tenant. Backend accepts UUID or slug as :tenantId.

export const useTenant = (tenantId: string, enabled = true) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}",
		{ params: { path: { tenantId } } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

export const useUpdateTenant = () => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}", "patch", {
		onSuccess: () => invalidateTenants(qc),
	});
};
