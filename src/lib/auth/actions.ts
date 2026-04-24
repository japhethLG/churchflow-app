"use client";

import { signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { getClientAuth, getGoogleProvider } from "@/lib/firebase/client";
import { api } from "@/lib/api/client";

export type TenantMembershipSummary = {
  tenantId: string;
  slug: string;
  name: string;
  memberId: string;
  role: "ADMIN" | "USER";
};

export type SignInResult = {
  uid: string;
  isSuperAdmin: boolean;
  tenantMemberships: TenantMembershipSummary[];
};

// Google SSO → backend session exchange → Next session cookie, in that
// order.
//
// The backend /auth/session upserts the user, writes the full
// tenantMemberships custom claim (keyed by tenant slug), and returns the
// populated session. We then mint the Next cookie off a *refreshed* ID
// token so server components see the new claims immediately.
export async function signInWithGoogle(): Promise<SignInResult> {
  const auth = getClientAuth();
  const result = await signInWithPopup(auth, getGoogleProvider());
  const initialToken = await result.user.getIdToken(true);

  // 1. Backend — upsert user + write custom claims. This is @Public and
  //    verifies the token from the body.
  const { data: backendData, error: backendError } = await api.POST(
    "/api/v1/auth/session",
    { body: { idToken: initialToken } },
  );
  if (backendError || !backendData) {
    throw new Error("Backend session creation failed");
  }

  // 2. Force-refresh so the ID token includes the claims we just wrote.
  const refreshedToken = await result.user.getIdToken(true);

  // 3. Mint the Next session cookie for SSR gating.
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: refreshedToken }),
  });
  if (!res.ok) throw new Error("Session cookie creation failed");

  // Global response interceptor wraps in { success, data }; unwrap.
  const raw = backendData as unknown as {
    data?: SignInResult;
    success?: boolean;
  } & SignInResult;
  const session = raw.data ?? raw;
  return {
    uid: session.uid,
    isSuperAdmin: Boolean(session.isSuperAdmin),
    tenantMemberships: Array.isArray(session.tenantMemberships)
      ? session.tenantMemberships
      : [],
  };
}

export async function signOut(): Promise<void> {
  await fbSignOut(getClientAuth());
  await fetch("/api/auth/session", { method: "DELETE" });
}

// Force-refresh the Firebase ID token then re-mint the Next session
// cookie. Call after any operation that changes tenant memberships or
// roles server-side (invite accepted, admin grants a role, member
// removal) so RSCs pick up the new claims without waiting ~1h for the
// token to auto-refresh.
export async function refreshSession(): Promise<void> {
  const user = getClientAuth().currentUser;
  if (!user) return;
  const idToken = await user.getIdToken(true);
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("Session refresh failed");
}
