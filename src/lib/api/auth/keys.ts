import type { QueryClient } from "@tanstack/react-query";
import { invalidateByPaths } from "../hooks";

export const AUTH_PATHS = ["/api/v1/auth/me"] as const;

export const invalidateAuth = (qc: QueryClient) => {
  return invalidateByPaths(qc, AUTH_PATHS);
}
