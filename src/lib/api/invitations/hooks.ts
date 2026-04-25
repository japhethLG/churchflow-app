"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "../hooks";
import { invalidateInvitations } from "./keys";

export function useInvitations(tenantId: string, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/invitations",
    { params: { path: { tenantId } } },
    { enabled: enabled && Boolean(tenantId) },
  );
}

export function useIssueInvitation() {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/invitations", "post", {
    onSuccess: () => invalidateInvitations(qc),
  });
}

export function useCancelInvitation() {
  const qc = useQueryClient();
  return useApiMutation(
    "/api/v1/tenants/{tenantId}/invitations/{invitationId}/cancel",
    "patch",
    { onSuccess: () => invalidateInvitations(qc) },
  );
}

export function useAcceptInvitation() {
  return useApiMutation("/api/v1/invitations/accept", "post");
}

export function useLookupInvitation(token: string) {
  return useApiQuery("/api/v1/invitations/lookup", {
    params: { query: { token } },
  });
}
