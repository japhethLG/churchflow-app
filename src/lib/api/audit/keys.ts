import type { QueryClient } from "@tanstack/react-query";
import { invalidateByPaths } from "../hooks";

export const AUDIT_PATHS = ["/api/v1/platform/audit"] as const;

export const invalidateAudit = (qc: QueryClient) => {
	return invalidateByPaths(qc, AUDIT_PATHS);
};
