"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "../../hooks";
import { invalidateTenants } from "../../tenants/keys";
import { invalidateAdmin } from "../keys";

// Platform intent — super-admin platform tooling. Routes are
// `/platform/stats` and `/platform/users/*` on the backend.

export const useAdminStats = () => {
	return useApiQuery("/api/v1/platform/stats");
};

export const useAdminUsers = (
	filters?: {
		search?: string;
		tenantId?: string;
		superAdminOnly?: boolean;
		skip?: number;
		take?: number;
	},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/platform/users",
		{ params: { query: filters ?? {} } },
		{ enabled },
	);
};

export const useToggleSuperAdmin = () => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/platform/users/{id}", "patch", {
		onSuccess: () => {
			invalidateAdmin(qc);
			// Tenant list shows admin counts so must be invalidated too.
			invalidateTenants(qc);
		},
	});
};
