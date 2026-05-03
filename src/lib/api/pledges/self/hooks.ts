"use client";

import { useQueryClient } from "@tanstack/react-query";

import { invalidateCampaigns } from "../../campaigns/keys";
import { useApiMutation, useApiQuery } from "../../hooks";
import { invalidatePledges } from "../keys";

// Self intent — the URL prefix `/me/` declares scope. memberId is forced
// to the authenticated caller server-side; the request DTO does not even
// accept it.

export type MyPledgesListQuery = {
	campaignId?: string;
	campaignItemId?: string;
	status?: "ACTIVE" | "FULFILLED" | "CANCELLED";
	offset?: number;
	limit?: number;
};

export const useMyPledges = (
	tenantId: string,
	query: MyPledgesListQuery = {},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/pledges",
		{ params: { path: { tenantId }, query } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

export const useMyPledge = (tenantId: string, id: string, enabled = true) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/pledges/{id}",
		{ params: { path: { tenantId, id } } },
		{ enabled: enabled && Boolean(tenantId) && Boolean(id) },
	);
};

export const useCreateMyPledge = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/me/pledges", "post", {
		onSuccess: () => {
			invalidatePledges(qc, tenantId);
			invalidateCampaigns(qc, tenantId);
		},
	});
};

export const useUpdateMyPledge = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/me/pledges/{id}", "patch", {
		onSuccess: () => {
			invalidatePledges(qc, tenantId);
			invalidateCampaigns(qc, tenantId);
		},
	});
};
