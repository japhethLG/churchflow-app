"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "../../hooks";
import { invalidateInvitations } from "../keys";

// Tenant intent — admin issues, lists, filters, and cancels invitations.
// Public-facing lookup/accept lives under invitations/public.

export type InvitationsListQuery = {
	status?: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
	role?: "ADMIN" | "USER";
	search?: string;
	// ISO 8601 UTC, both inclusive — bracket the invitation's createdAt.
	dateFrom?: string;
	dateTo?: string;
	offset?: number;
	limit?: number;
};

export const useInvitations = (
	tenantId: string,
	query: InvitationsListQuery = {},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/invitations",
		{ params: { path: { tenantId }, query } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

export const useIssueInvitation = () => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/invitations", "post", {
		onSuccess: () => invalidateInvitations(qc),
	});
};

export const useCancelInvitation = () => {
	const qc = useQueryClient();
	return useApiMutation(
		"/api/v1/tenants/{tenantId}/invitations/{invitationId}/cancel",
		"patch",
		{ onSuccess: () => invalidateInvitations(qc) },
	);
};
