"use client";

import { useApiQuery } from "../../hooks";

// Self intent — read-only. Members do not record transactions; the
// church's books are maintained by admins via the tenant endpoints.

export type MyTransactionsListQuery = {
	campaignId?: string;
	campaignItemId?: string;
	pledgeId?: string;
	type?:
		| "TITHE"
		| "OFFERING"
		| "MISSION_GIVING"
		| "FIRST_FRUIT"
		| "COMMITMENT"
		| "DONATION"
		| "OTHER";
	dateFrom?: string;
	dateTo?: string;
	offset?: number;
	limit?: number;
};

export const useMyTransactions = (
	tenantId: string,
	query: MyTransactionsListQuery = {},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/transactions",
		{ params: { path: { tenantId }, query } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

export const useMyTransaction = (
	tenantId: string,
	id: string,
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/transactions/{id}",
		{ params: { path: { tenantId, id } } },
		{ enabled: enabled && Boolean(tenantId) && Boolean(id) },
	);
};
