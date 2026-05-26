import type { QueryClient } from "@tanstack/react-query";
import { invalidateByPaths } from "../hooks";

export const INVITATION_PATHS: readonly string[] = [
	"/api/v1/tenants/{tenantId}/invitations",
	"/api/v1/tenants/{tenantId}/invitations/{invitationId}/cancel",
	// Public token flows — listed for completeness even though the
	// predicate is tenant-scoped and won't match these query keys; future
	// public-cache features (e.g. an admin-visible accept-history view)
	// can rely on the path set being authoritative.
	"/api/v1/invitations/accept",
	"/api/v1/invitations/lookup",
];

export const invalidateInvitations = (qc: QueryClient) => {
	return invalidateByPaths(qc, INVITATION_PATHS);
};
