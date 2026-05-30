import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "./constants";

export type TenantRole = "ADMIN" | "USER";

export type TenantMembership = {
	memberId: string;
	role: TenantRole;
	name: string; // tenant display name
};

// Decoded from the session cookie. Shape mirrors the backend's AuthUser —
// see church-app-backend/src/infrastructure/firebase-auth/types/auth-user.type.ts.
//
// There is NO "activeTenantId" on this type: the URL (/[tenantSlug]/…) is
// the source of truth for which tenant a request targets. Layouts look up
// tenantMemberships[tenantSlug] to gate role access.
export type SessionUser = {
	uid: string;
	email: string | null;
	displayName: string | null;
	picture: string | null;
	isSuperAdmin: boolean;
	tenantMemberships: Record<string, TenantMembership>;
};

// Returns null in two distinct cases — distinguishable via server logs:
//   - "no cookie": the visitor isn't signed in (expected on /login etc.).
//   - "verification failed": the cookie exists but Admin SDK rejected it
//     (expired, revoked, tampered, JWKS unreachable). Logged with the
//     reason code so an incident is distinguishable from normal expiry.
//
// Wrapped in React `cache()` so the per-request memo collapses the multiple
// nested-layout calls ([tenantSlug] gate + the (admin)/(member) gate) into a
// SINGLE verification per render instead of one Firebase round-trip each.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
	const store = await cookies();
	const cookie = store.get(SESSION_COOKIE_NAME)?.value;
	if (!cookie) {
		return null;
	}

	try {
		// checkRevoked=false: verify the cookie signature locally against
		// Google's cached public keys (no network) on this hot navigation
		// gate. Revocation is still enforced on every data request by the
		// backend's FirebaseAuthGuard, so a revoked session can render an
		// empty shell at most until its next API call 401s — without paying
		// a Firebase round-trip on every page navigation.
		const decoded = await adminAuth.verifySessionCookie(cookie, false);
		const claims = decoded as typeof decoded & {
			isSuperAdmin?: boolean;
			tenantMemberships?: Record<string, unknown>;
			name?: string;
			picture?: string;
		};
		return {
			uid: decoded.uid,
			email: decoded.email ?? null,
			displayName: claims.name ?? null,
			picture: claims.picture ?? null,
			isSuperAdmin: Boolean(claims.isSuperAdmin),
			tenantMemberships: normaliseMemberships(claims.tenantMemberships),
		};
	} catch (err) {
		const reason =
			err && typeof err === "object" && "code" in err
				? String((err as { code: unknown }).code)
				: err instanceof Error
					? err.message
					: "unknown";
		// Distinct log line from "no cookie" so spikes in verification
		// failures (revocation lag, JWKS outage) are visible in logs.
		console.warn(
			`[auth] session-cookie verification failed: ${reason}. ` +
				`The visitor will be redirected to /login.`,
		);
		return null;
	}
});

const normaliseMemberships = (
	raw: unknown,
): Record<string, TenantMembership> => {
	if (!raw || typeof raw !== "object") {
		return {};
	}
	const out: Record<string, TenantMembership> = {};
	for (const [slug, value] of Object.entries(raw as Record<string, unknown>)) {
		if (!value || typeof value !== "object") {
			continue;
		}
		const entry = value as Record<string, unknown>;
		const memberId =
			typeof entry.memberId === "string" ? entry.memberId : undefined;
		const role =
			entry.role === "ADMIN" || entry.role === "USER" ? entry.role : undefined;
		const name = typeof entry.name === "string" ? entry.name : slug;
		if (memberId && role) {
			out[slug] = { memberId, role, name };
		}
	}
	return out;
};

// Tenant a user can act in today. Returns null if they don't belong.
// Super-admins are not implicitly members of every tenant — they use
// /super-admin/* for platform-ops and need a real Member row to act
// as admin/member of a specific church.
export const getMembership = (
	user: SessionUser,
	tenantSlug: string,
): TenantMembership | null => {
	return user.tenantMemberships[tenantSlug] ?? null;
};
