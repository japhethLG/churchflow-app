"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "../hooks";
import { invalidateMembers } from "./keys";

export type MembersListQuery = {
  status?: "ACTIVE" | "INACTIVE";
  search?: string;
  offset?: number;
  limit?: number;
};

export function useMembers(tenantId: string, query: MembersListQuery = {}, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/members",
    { params: { path: { tenantId }, query } },
    { enabled: enabled && Boolean(tenantId) },
  );
}

export function useMember(tenantId: string, memberId: string, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/members/{id}",
    { params: { path: { tenantId, id: memberId } } },
    { enabled: enabled && Boolean(tenantId) && Boolean(memberId) },
  );
}

export function useMyMembership(tenantId: string, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/members/me",
    { params: { path: { tenantId } } },
    { enabled: enabled && Boolean(tenantId) },
  );
}

export function useCreateMember(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/members", "post", {
    onSuccess: () => invalidateMembers(qc, tenantId),
  });
}

// Self-update — narrower than the admin path. Used by the welcome
// onboarding flow and the member's profile page.
export function useUpdateMyMembership(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/members/me", "patch", {
    onSuccess: () => invalidateMembers(qc, tenantId),
  });
}

export function useUpdateMember(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/members/{id}", "patch", {
    onSuccess: () => invalidateMembers(qc, tenantId),
  });
}

export function useDeleteMember(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/members/{id}", "delete", {
    onSuccess: () => invalidateMembers(qc, tenantId),
  });
}

export function useMergeMembersPreview(
  tenantId: string,
  keepId: string,
  dropId: string,
  enabled = true,
) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}/members/{id}/merge-preview",
    { params: { path: { tenantId, id: keepId }, query: { dropId } } },
    { enabled: enabled && Boolean(tenantId) && Boolean(keepId) && Boolean(dropId) },
  );
}

export function useMergeMembers(tenantId: string) {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/members/{id}/merge", "post", {
    onSuccess: () => {
      invalidateMembers(qc, tenantId);
      // Transactions and pledges got reassigned; nuke their caches too.
      qc.invalidateQueries({
        predicate: (q) => {
          const k0 = (q.queryKey as unknown[])[0];
          return (
            k0 === "/api/v1/tenants/{tenantId}/transactions" ||
            k0 === "/api/v1/tenants/{tenantId}/pledges"
          );
        },
      });
    },
  });
}
