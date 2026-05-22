"use client";

import { type GetQuery, useApiQuery } from "../../hooks";

// Platform intent — read-only audit log browser for super-admins.

export type AuditEventsQuery = GetQuery<"/api/v1/platform/audit", "get">;

export const useAuditEvents = (
	filters: AuditEventsQuery = {},
	enabled = true,
) => {
	return useApiQuery(
		"/api/v1/platform/audit",
		{ params: { query: filters } },
		{ enabled },
	);
};
