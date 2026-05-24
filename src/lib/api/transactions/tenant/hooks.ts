"use client";

import { useQueryClient } from "@tanstack/react-query";

import { invalidateCampaigns } from "../../campaigns/keys";
import { type GetQuery, useApiMutation, useApiQuery } from "../../hooks";
import { invalidatePledges } from "../../pledges/keys";
import { invalidateTransactions } from "../keys";

// Tenant intent — admin-facing transaction recording / reporting hooks.

export type TransactionsListQuery = GetQuery<
	"/api/v1/tenants/{tenantId}/transactions",
	"get"
>;

export const useTransactions = (
	tenantId: string,
	query: TransactionsListQuery = {},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/transactions",
		{ params: { path: { tenantId }, query } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

export type TransactionSummaryQuery = GetQuery<
	"/api/v1/tenants/{tenantId}/transactions/summary",
	"get"
>;

// Summary KPIs + per-type / per-month breakdowns. Admin-only on the
// backend — members do not call this.
export const useTransactionSummary = (
	tenantId: string,
	query: TransactionSummaryQuery | number = {},
	enabled = true,
) => {
	const resolved: TransactionSummaryQuery =
		typeof query === "number" ? { months: query } : query;
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/transactions/summary",
		{ params: { path: { tenantId }, query: resolved } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

// Counts + totals of unattributed gifts (no member / no campaign) for
// the dashboard callout. BE filters server-side — no fetch-and-count.
export type UnattributedSummaryQuery = GetQuery<
	"/api/v1/tenants/{tenantId}/transactions/unattributed",
	"get"
>;

export const useUnattributedSummary = (
	tenantId: string,
	query: UnattributedSummaryQuery = {},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/transactions/unattributed",
		{ params: { path: { tenantId }, query } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

// Top-N givers report for the admin Reports → Givers tab. BE returns
// the per-member breakdown + monthly buckets aligned to the date range.
export type GiversReportQuery = GetQuery<
	"/api/v1/tenants/{tenantId}/transactions/reports/givers",
	"get"
>;

export const useGiversReport = (
	tenantId: string,
	query: GiversReportQuery = {},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/transactions/reports/givers",
		{ params: { path: { tenantId }, query } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

export const useTransaction = (
	tenantId: string,
	id: string,
	options: { includeDeleted?: boolean; enabled?: boolean } = {},
) => {
	const { includeDeleted, enabled = true } = options;
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/transactions/{id}",
		{
			params: {
				path: { tenantId, id },
				query: includeDeleted ? { includeDeleted: true } : undefined,
			},
		},
		{ enabled: enabled && Boolean(tenantId) && Boolean(id) },
	);
};

export const useCreateTransaction = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/transactions", "post", {
		meta: { successMessage: "Transaction recorded" },
		onSuccess: () => {
			invalidateTransactions(qc, tenantId);
			invalidateCampaigns(qc, tenantId);
			invalidatePledges(qc, tenantId);
		},
	});
};

// Atomic multi-gift entry. The backend wraps the whole batch in a Prisma
// transaction so it's all-or-nothing. Same invalidation surface as the
// single-create hook.
export const useBulkCreateTransactions = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/transactions/bulk",
		"post",
		{
			meta: {
				successMessage: (data: { items?: unknown[] }) => {
					const count = data?.items?.length ?? 0;
					return `Recorded ${count} ${count === 1 ? "gift" : "gifts"}`;
				},
			},
			onSuccess: () => {
				invalidateTransactions(qc, tenantId);
				invalidateCampaigns(qc, tenantId);
				invalidatePledges(qc, tenantId);
			},
		},
	);
};

export const useUpdateTransaction = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/transactions/{id}",
		"patch",
		{
			meta: { successMessage: "Transaction updated" },
			onSuccess: () => invalidateTransactions(qc, tenantId),
		},
	);
};

export const useDeleteTransaction = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/transactions/{id}",
		"delete",
		{
			meta: { successMessage: "Transaction deleted" },
			onSuccess: () => invalidateTransactions(qc, tenantId),
		},
	);
};

export const useRestoreTransaction = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/transactions/{id}/restore",
		"post",
		{
			meta: { successMessage: "Transaction restored" },
			onSuccess: () => {
				invalidateTransactions(qc, tenantId);
				// Pledge paid-amount aggregates depend on transactions; campaign
				// progress numbers do too. Cheap to nuke both.
				invalidatePledges(qc, tenantId);
				invalidateCampaigns(qc, tenantId);
			},
		},
	);
};
