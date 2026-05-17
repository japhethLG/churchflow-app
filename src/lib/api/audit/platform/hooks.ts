"use client";

import { useApiQuery } from "../../hooks";
import type { components } from "../../index";

// Platform intent — read-only audit log browser for super-admins.

export type AuditEventsQuery = {
	tenantId?: string;
	entity?: string;
	entityId?: string;
	actorUid?: string;
	action?: components["schemas"]["AuditEventResponseDto"]["action"];
	// ISO 8601 UTC, both inclusive — bracket the event's createdAt.
	dateFrom?: string;
	dateTo?: string;
	offset?: number;
	limit?: number;
};

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
