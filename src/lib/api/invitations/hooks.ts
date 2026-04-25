"use client";

import { useApiMutation, useApiQuery } from "../hooks";

export function useIssueInvitation() {
  return useApiMutation("/api/v1/tenants/{tenantId}/invitations", "post");
}

export function useAcceptInvitation() {
  return useApiMutation("/api/v1/invitations/accept", "post");
}

export function useLookupInvitation(token: string) {
  return useApiQuery("/api/v1/invitations/lookup", {
    params: { query: { token } },
  });
}
