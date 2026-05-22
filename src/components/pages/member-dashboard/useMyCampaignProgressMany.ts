"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api/client";

export type MyCampaignProgressLite = {
	goalAmount: number;
	pledgedAmount: number;
	raisedAmount: number;
	pledgeCount: number;
};

// Self-intent mirror of `dashboard/useCampaignProgressMany`. Fans out
// `/me/campaigns/{id}/progress` for an arbitrary list of ids. Each query
// is cached individually so cards / lists / dashboards share results.
//
// Acceptable for ≤ ~25 ids — same constraint as the admin helper. A
// `/me/campaigns/progress` batch endpoint would replace this.

export const useMyCampaignProgressMany = (
	tenantId: string,
	campaignIds: string[],
) => {
	const results = useQueries({
		queries: campaignIds.map((id) => {
			const init = { params: { path: { tenantId, id } } };
			return {
				queryKey: [
					"/api/v1/tenants/{tenantId}/me/campaigns/{id}/progress",
					init,
				],
				queryFn: async () => {
					const { data, error } = await api.GET(
						"/api/v1/tenants/{tenantId}/me/campaigns/{id}/progress",
						init,
					);
					if (error) {
						throw error;
					}
					return data;
				},
				enabled: Boolean(tenantId) && Boolean(id),
			};
		}),
	});

	const progressById = useMemo(() => {
		const map: Record<string, MyCampaignProgressLite> = {};
		results.forEach((r, idx) => {
			const id = campaignIds[idx];
			if (id && r.data) {
				map[id] = {
					goalAmount: r.data.goalAmount,
					pledgedAmount: r.data.pledgedAmount,
					raisedAmount: r.data.raisedAmount,
					pledgeCount: r.data.pledgeCount,
				};
			}
		});
		return map;
	}, [results, campaignIds]);

	const isLoading = results.some((r) => r.isLoading);

	return { progressById, isLoading };
};
