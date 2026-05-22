"use client";

import { type GetQuery, useApiQuery } from "../../hooks";

// Self intent — read-only. Members do not record transactions; the
// church's books are maintained by admins via the tenant endpoints.

export type MyTransactionsListQuery = GetQuery<
	"/api/v1/tenants/{tenantId}/me/transactions",
	"get"
>;

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

export type MyTransactionSummaryQuery = GetQuery<
	"/api/v1/tenants/{tenantId}/me/transactions/summary",
	"get"
>;

// Aggregate the caller's own giving — totals, byType, byMonth — scoped
// server-side via tenant.memberId. Drives the member Insights surface.
// Independent of any pledge.status logic, so the FULFILLED-derivation
// rework can land here without touching this surface.
export const useMyTransactionSummary = (
	tenantId: string,
	query: MyTransactionSummaryQuery = {},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/transactions/summary",
		{ params: { path: { tenantId }, query } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};
