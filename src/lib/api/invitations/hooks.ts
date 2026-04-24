"use client";

import { useApiMutation } from "../hooks";

export function useIssueInvitation() {
  return useApiMutation("/api/v1/tenants/{tenantId}/invitations", "post");
}

export function useAcceptInvitation() {
  return useApiMutation("/api/v1/invitations/accept", "post");
}
