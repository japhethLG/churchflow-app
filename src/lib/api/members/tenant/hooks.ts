"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "../../hooks";
import { invalidateMembers } from "../keys";

// Tenant intent — admin-facing member management hooks. The caller's own
// member profile lives on the self intent (useMyProfile / useUpdateMyProfile).

export type MembersListQuery = {
	status?: "ACTIVE" | "INACTIVE";
	search?: string;
	offset?: number;
	limit?: number;
	// 3-state archive filter — FE encodes as:
	//   Active   → both flags omitted (default)
	//   Deleted  → onlyDeleted: true
	//   All      → includeDeleted: true
	includeDeleted?: boolean;
	onlyDeleted?: boolean;
};

export const useMembers = (
	tenantId: string,
	query: MembersListQuery = {},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/members",
		{ params: { path: { tenantId }, query } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

export const useMember = (
	tenantId: string,
	memberId: string,
	options: { includeDeleted?: boolean; enabled?: boolean } = {},
) => {
	const { includeDeleted, enabled = true } = options;
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/members/{id}",
		{
			params: {
				path: { tenantId, id: memberId },
				query: includeDeleted ? { includeDeleted: true } : undefined,
			},
		},
		{ enabled: enabled && Boolean(tenantId) && Boolean(memberId) },
	);
};

export const useCreateMember = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/members", "post", {
		onSuccess: () => invalidateMembers(qc, tenantId),
	});
};

export const useUpdateMember = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/members/{id}", "patch", {
		onSuccess: () => invalidateMembers(qc, tenantId),
	});
};

export const useDeleteMember = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/members/{id}", "delete", {
		onSuccess: () => invalidateMembers(qc, tenantId),
	});
};

export const useRestoreMember = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/members/{id}/restore",
		"post",
		{ onSuccess: () => invalidateMembers(qc, tenantId) },
	);
};

export const useMergeMembersPreview = (
	tenantId: string,
	keepId: string,
	dropId: string,
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/members/{id}/merge-preview",
		{ params: { path: { tenantId, id: keepId }, query: { dropId } } },
		{
			enabled:
				enabled && Boolean(tenantId) && Boolean(keepId) && Boolean(dropId),
		},
	);
};

export const useMergeMembers = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/members/{id}/merge",
		"post",
		{
			onSuccess: () => {
				invalidateMembers(qc, tenantId);
				// Transactions and pledges got reassigned; nuke their caches too.
				qc.invalidateQueries({
					predicate: (q) => {
						const k0 = (q.queryKey as unknown[])[0];
						return (
							k0 === "/api/v1/tenants/{tenantId}/transactions" ||
							k0 === "/api/v1/tenants/{tenantId}/pledges" ||
							k0 === "/api/v1/tenants/{tenantId}/me/transactions" ||
							k0 === "/api/v1/tenants/{tenantId}/me/pledges"
						);
					},
				});
			},
		},
	);
};
