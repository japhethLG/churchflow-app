"use client";

import { signOut as fbSignOut, signInWithPopup } from "firebase/auth";
import { api } from "@/lib/api/client";
import { getClientAuth, getGoogleProvider } from "@/lib/firebase/client";

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
export const signInWithGoogle = async (): Promise<SignInResult> => {
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
	if (!res.ok) {
		throw new Error("Session cookie creation failed");
	}

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
};

export const isAuthCancellationError = (err: unknown): boolean => {
	if (!err || typeof err !== "object") {
		return false;
	}
	const code = (err as { code?: string }).code;
	const message = (err as { message?: string }).message;
	return (
		code === "auth/popup-closed-by-user" ||
		code === "auth/cancelled-popup-request" ||
		(typeof message === "string" &&
			(message.includes("auth/popup-closed-by-user") ||
				message.includes("auth/cancelled-popup-request")))
	);
};

export const signOut = async (): Promise<void> => {
	await fbSignOut(getClientAuth());
	await fetch("/api/auth/session", { method: "DELETE" });
};

// Sign out from every device/tab, not just this one. Calls the backend to
// revoke all refresh tokens for the user, then performs a normal local
// signOut(). Other devices keep working until their next API call (their
// session cookie's revocation check will then fail and the global 401
// handler kicks them to /login).
export const signOutEverywhere = async (): Promise<void> => {
	const user = getClientAuth().currentUser;
	if (user) {
		const idToken = await user.getIdToken();
		const baseUrl =
			process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";
		const res = await fetch(`${baseUrl}/api/v1/auth/sign-out-everywhere`, {
			method: "POST",
			headers: { Authorization: `Bearer ${idToken}` },
		});
		if (!res.ok && res.status !== 204) {
			throw new Error("Failed to revoke sessions on backend");
		}
	}
	await signOut();
};

// Force-refresh the Firebase ID token then re-mint the Next session
// cookie. Call after any operation that changes tenant memberships or
// roles server-side (invite accepted, admin grants a role, member
// removal) so RSCs pick up the new claims without waiting ~1h for the
// token to auto-refresh.
export const refreshSession = async (): Promise<void> => {
	const user = getClientAuth().currentUser;
	if (!user) {
		return;
	}
	const idToken = await user.getIdToken(true);
	const res = await fetch("/api/auth/session", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken }),
	});
	if (!res.ok) {
		throw new Error("Session refresh failed");
	}
};
