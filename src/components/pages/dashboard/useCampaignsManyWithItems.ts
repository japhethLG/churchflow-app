"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api/client";

// Fan-out helper — fetches the CampaignWithItemsResponseDto for an
// arbitrary list of campaign ids in parallel. We use this where pledge
// surfaces need per-item deadlines to compute lifecycle correctly (item
// deadline takes precedence over campaign deadline). The list endpoint
// can't surface items today; until a bulk endpoint exists, fan-out is
// the cheapest correct path.
//
// Each query is cached individually, so adjacent surfaces re-use results.
// Acceptable for ≤ ~25 ids; if we routinely need more we should ask
// backend for a bulk endpoint.

export type ItemDeadlinesById = Record<string, string | null>;

export const useCampaignsManyWithItems = (
	tenantId: string,
	campaignIds: string[],
) => {
	// Mirrors useCampaign's init shape exactly so query-cache entries are
	// shared with the single-campaign hook (e.g. detail pages already
	// loaded the campaign).
	const results = useQueries({
		queries: campaignIds.map((id) => {
			const init = {
				params: {
					path: { tenantId, id },
					query: { includeDeleted: true, onlyDeleted: undefined },
				},
			};
			return {
				queryKey: ["/api/v1/tenants/{tenantId}/campaigns/{id}", init],
				queryFn: async () => {
					const { data, error } = await api.GET(
						"/api/v1/tenants/{tenantId}/campaigns/{id}",
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

	const itemDeadlinesById = useMemo<ItemDeadlinesById>(() => {
		const map: ItemDeadlinesById = {};
		for (const r of results) {
			const items = r.data?.items ?? [];
			for (const item of items) {
				map[item.id] = typeof item.deadline === "string" ? item.deadline : null;
			}
		}
		return map;
	}, [results]);

	const isLoading = results.some((r) => r.isLoading);

	return { itemDeadlinesById, isLoading };
};
