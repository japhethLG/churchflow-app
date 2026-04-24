import type { QueryClient } from "@tanstack/react-query";
import { invalidateByPaths } from "../hooks";

// No GET endpoints today, but the invalidation helper is here so callers
// don't need to know that — when a list endpoint is added later, adding it
// to INVITATION_PATHS will retroactively wire invalidation everywhere.
export const INVITATION_PATHS: readonly string[] = [];

export function invalidateInvitations(qc: QueryClient) {
  return invalidateByPaths(qc, INVITATION_PATHS);
}
