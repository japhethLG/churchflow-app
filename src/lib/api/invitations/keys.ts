import type { QueryClient } from "@tanstack/react-query";
import { invalidateByPaths } from "../hooks";

export const INVITATION_PATHS: readonly string[] = [
  "/api/v1/tenants/{tenantId}/invitations",
];

export function invalidateInvitations(qc: QueryClient) {
  return invalidateByPaths(qc, INVITATION_PATHS);
}
