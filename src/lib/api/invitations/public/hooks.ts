"use client";

import { useApiMutation, useApiQuery } from "../../hooks";

// Public intent — token-based endpoints with no tenant context. `lookup`
// is fully unauthenticated; `accept` is authenticated but cross-tenant
// (the token determines which tenant the caller joins).

export const useAcceptInvitation = () => {
	return useApiMutation("/api/v1/invitations/accept", "post");
};

export const useLookupInvitation = (token: string) => {
	return useApiQuery("/api/v1/invitations/lookup", {
		params: { query: { token } },
	});
};
