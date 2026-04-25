"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "../hooks";
import { invalidateTenants } from "./keys";

// Backend accepts either a UUID or a slug in :tenantId (see TenantGuard).
// Callers pass whichever is more convenient — frontend URLs carry the
// slug, so most call sites pass the slug straight through.

export function useTenants() {
  return useApiQuery("/api/v1/tenants");
}

export function useTenant(tenantId: string, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/{tenantId}",
    { params: { path: { tenantId } } },
    { enabled: enabled && Boolean(tenantId) },
  );
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants", "post", {
    onSuccess: () => invalidateTenants(qc),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}", "patch", {
    onSuccess: () => invalidateTenants(qc),
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}", "delete", {
    onSuccess: () => invalidateTenants(qc),
  });
}

// Slug rename is super-admin only. Keep it separate from generic update
// so the UI can ask for explicit confirmation (it invalidates URLs that
// point at the old slug).
export function useRenameTenantSlug() {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/slug", "patch", {
    onSuccess: () => invalidateTenants(qc),
  });
}

export function useRestoreTenant() {
  const qc = useQueryClient();
  return useApiMutation("/api/v1/tenants/{tenantId}/restore", "post", {
    onSuccess: () => invalidateTenants(qc),
  });
}

export function useSlugSuggestion(name: string, enabled = true) {
  return useApiQuery(
    "/api/v1/tenants/slug-suggestion",
    { params: { query: { name } } },
    { enabled: enabled && name.length >= 3, staleTime: 30_000 },
  );
}
