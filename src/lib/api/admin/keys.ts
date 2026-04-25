import type { QueryClient } from "@tanstack/react-query";
import { invalidateByPaths } from "../hooks";

export const ADMIN_PATHS = [
  "/api/v1/admin/stats",
  "/api/v1/admin/users",
  "/api/v1/admin/users/{id}",
] as const;

export const invalidateAdmin = (qc: QueryClient) => {
  return invalidateByPaths(qc, ADMIN_PATHS);
}
