import "server-only";
import { cookies } from "next/headers";
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

export const getSessionUser = async (): Promise<SessionUser | null>  => {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
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
  } catch {
    return null;
  }
}

const normaliseMemberships = (
  raw: unknown,
): Record<string, TenantMembership>  => {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, TenantMembership> = {};
  for (const [slug, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const entry = value as Record<string, unknown>;
    const memberId = typeof entry.memberId === "string" ? entry.memberId : undefined;
    const role = entry.role === "ADMIN" || entry.role === "USER" ? entry.role : undefined;
    const name = typeof entry.name === "string" ? entry.name : slug;
    if (memberId && role) {
      out[slug] = { memberId, role, name };
    }
  }
  return out;
}

// Tenant a user can act in today. Returns null if they don't belong.
// Super-admins are not implicitly members of every tenant — they use
// /super-admin/* for platform-ops and need a real Member row to act
// as admin/member of a specific church.
export const getMembership = (
  user: SessionUser,
  tenantSlug: string,
): TenantMembership | null  => {
  return user.tenantMemberships[tenantSlug] ?? null;
}
