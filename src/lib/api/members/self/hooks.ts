"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "../../hooks";
import { invalidateMembers } from "../keys";

// Self intent — the caller's own member profile in this tenant. The
// resource is singular (one profile per caller per tenant) and lives at
// /me/profile.
//
// Replaces the legacy useMyMembership / useUpdateMyMembership hooks
// which targeted /members/me on the old backend.

export const useMyProfile = (tenantId: string, enabled = true) => {
	return useApiQuery(
		"/api/v1/tenants/{tenantId}/me/profile",
		{ params: { path: { tenantId } } },
		{ enabled: enabled && Boolean(tenantId) },
	);
};

export const useUpdateMyProfile = (tenantId: string) => {
	const qc = useQueryClient();
	return useApiMutation("/api/v1/tenants/{tenantId}/me/profile", "patch", {
		onSuccess: () => invalidateMembers(qc, tenantId),
	});
};
