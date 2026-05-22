"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api/client";

// Self-intent mirror of `dashboard/useCampaignsManyWithItems` — fetches
// `MyCampaignWithItemsResponseDto` per id and surfaces a map of
// `itemId → deadline | null`. Member-side pledge surfaces need this to
// resolve item-deadline-precedence in `resolvePledgeDeadline`.
//
// Query keys mirror `useMyCampaign(id, { includeDeleted: true })` exactly
// so cache entries are shared with the single-campaign hook used by
// detail pages.

export type ItemDeadlinesById = Record<string, string | null>;

export const useMyCampaignsManyWithItems = (
	tenantId: string,
	campaignIds: string[],
) => {
	const results = useQueries({
		queries: campaignIds.map((id) => {
			const init = {
				params: {
					path: { tenantId, id },
					query: { includeDeleted: true },
				},
			};
			return {
				queryKey: ["/api/v1/tenants/{tenantId}/me/campaigns/{id}", init],
				queryFn: async () => {
					const { data, error } = await api.GET(
						"/api/v1/tenants/{tenantId}/me/campaigns/{id}",
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
			for (const item of r.data?.items ?? []) {
				map[item.id] = typeof item.deadline === "string" ? item.deadline : null;
			}
		}
		return map;
	}, [results]);

	const isLoading = results.some((r) => r.isLoading);

	return { itemDeadlinesById, isLoading };
};
