"use client";

import { useQueryClient } from "@tanstack/react-query";

import { invalidateCampaigns } from "../../campaigns/keys";
import { useApiMutation, useApiQuery } from "../../hooks";
import { invalidatePledges } from "../../pledges/keys";
import { invalidateTransactions } from "../keys";

// Tenant intent — admin-facing transaction recording / reporting hooks.

export type TransactionsListQuery = {
	memberId?: string;
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
	// 3-state archive filter — see members/tenant/hooks for encoding.
	includeDeleted?: boolean;
	onlyDeleted?: boolean;
};

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

export type TransactionSummaryQuery = {
	// Either supply an explicit ISO 8601 UTC range (both inclusive, both
	// optional), or `months` for a rolling window. The range takes
	// precedence when both are present.
	dateFrom?: string;
	dateTo?: string;
	months?: number;
};

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
