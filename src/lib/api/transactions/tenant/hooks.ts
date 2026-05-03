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

// Summary KPIs + per-type / per-month breakdowns. Admin-only on the
// backend — members do not call this.
export const useTransactionSummary = (
	tenantId: string,
	months = 1,
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/transactions/summary",
		{ params: { path: { tenantId }, query: { months: String(months) } } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

export const useTransaction = (
	tenantId: string,
	id: string,
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/transactions/{id}",
		{ params: { path: { tenantId, id } } },
		{ enabled: enabled && Boolean(tenantId) && Boolean(id) },
	);
};

export const useCreateTransaction = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/transactions", "post", {
		onSuccess: () => {
			invalidateTransactions(qc, tenantId);
			invalidateCampaigns(qc, tenantId);
			invalidatePledges(qc, tenantId);
		},
	});
};

export const useUpdateTransaction = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/transactions/{id}",
		"patch",
		{ onSuccess: () => invalidateTransactions(qc, tenantId) },
	);
};

export const useDeleteTransaction = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/transactions/{id}",
		"delete",
		{ onSuccess: () => invalidateTransactions(qc, tenantId) },
	);
};
