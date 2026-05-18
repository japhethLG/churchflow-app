"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api/client";
import type { CampaignProgressLite } from "./DeadlineWatchCard";

// Fan-out helper — fetches CampaignProgress for an arbitrary list of
// campaign ids in parallel. Returns a record keyed by id. Each query is
// cached individually, so adjacent surfaces (Deadline Watch, Campaigns
// list) share results without re-fetching.
//
// Acceptable for ≤ ~25 ids; if we routinely need more we should ask
// backend for a bulk endpoint.
export const useCampaignProgressMany = (
	tenantId: string,
	campaignIds: string[],
) => {
	const results = useQueries({
		queries: campaignIds.map((id) => ({
			queryKey: [
				"/api/v1/tenants/{tenantId}/campaigns/{id}/progress",
				{ params: { path: { tenantId, id } } },
			],
			queryFn: async () => {
				const { data, error } = await api.GET(
					"/api/v1/tenants/{tenantId}/campaigns/{id}/progress",
					{ params: { path: { tenantId, id } } },
				);
				if (error) {
					throw error;
				}
				return data;
			},
			enabled: Boolean(tenantId) && Boolean(id),
		})),
	});

	const progressById = useMemo(() => {
		const map: Record<string, CampaignProgressLite> = {};
		results.forEach((r, idx) => {
			const id = campaignIds[idx];
			if (id && r.data) {
				map[id] = {
					goalAmount: r.data.goalAmount,
					pledgedAmount: r.data.pledgedAmount,
					raisedAmount: r.data.raisedAmount,
				};
			}
		});
		return map;
	}, [results, campaignIds]);

	const isLoading = results.some((r) => r.isLoading);

	return { progressById, isLoading };
};
