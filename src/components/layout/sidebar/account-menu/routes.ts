import type { Perspective } from "../types";

export const profileHrefFor = (
	perspective: Perspective,
	tenantSlug?: string,
): string =>
	perspective === "super"
		? "/super-admin/profile"
		: perspective === "admin"
			? `/${tenantSlug}/admin/profile`
			: `/${tenantSlug}/member/profile`;
