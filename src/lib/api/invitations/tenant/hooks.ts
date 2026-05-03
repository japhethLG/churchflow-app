"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "../../hooks";
import { invalidateInvitations } from "../keys";

// Tenant intent — admin issues, lists, and cancels pending invitations.
// Public-facing lookup/accept lives under invitations/public.

export const useInvitations = (tenantId: string, enabled = true) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/invitations",
		{ params: { path: { tenantId } } },
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
