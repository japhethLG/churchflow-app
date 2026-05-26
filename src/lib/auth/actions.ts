"use client";

import {
	signOut as fbSignOut,
	getRedirectResult,
	signInWithPopup,
	signInWithRedirect,
	type User,
} from "firebase/auth";
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

// True when the app is running as an installed PWA / TWA (Android APK)
// rather than a normal browser tab. `signInWithPopup` can't complete in a
// Trusted Web Activity — the popup window can't message its credential back
// to the opener through the Custom Tab sandbox — so we fall back to a
// full-page redirect there. A top-level redirect is unaffected by Chrome's
// third-party storage partitioning, so it works even with a cross-origin
// Firebase authDomain.
const isStandaloneLaunch = (): boolean => {
	if (typeof window === "undefined") {
		return false;
	}
	return (
		window.matchMedia?.("(display-mode: standalone)").matches ||
		// iOS Safari home-screen apps
		(window.navigator as unknown as { standalone?: boolean }).standalone ===
			true ||
		// Android TWA launches the page with an android-app:// referrer
		document.referrer.startsWith("android-app://")
	);
};

// Given a freshly authenticated Firebase user, exchange the ID token for a
// backend session (upserts the user + writes the tenantMemberships custom
// claim) then mint the Next session cookie off a *refreshed* token so server
// components see the new claims immediately. Shared by the popup and
// redirect sign-in paths.
const completeSignIn = async (user: User): Promise<SignInResult> => {
	const initialToken = await user.getIdToken(true);

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
	const refreshedToken = await user.getIdToken(true);

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

// Google SSO → backend session exchange → Next session cookie.
//
// In a browser tab this resolves with the session. In a standalone/TWA
// launch it kicks off a full-page redirect and resolves `null` as the page
// is already navigating away — the result is finalized by
// `completeRedirectSignIn()` after the redirect returns.
export const signInWithGoogle = async (): Promise<SignInResult | null> => {
	const auth = getClientAuth();
	if (isStandaloneLaunch()) {
		await signInWithRedirect(auth, getGoogleProvider());
		return null;
	}
	const result = await signInWithPopup(auth, getGoogleProvider());
	return completeSignIn(result.user);
};

// Call on mount of any page that initiates sign-in. After a redirect
// sign-in returns, this finalizes the credential and runs the backend
// exchange + cookie mint. Returns `null` (a no-op) when no redirect is
// pending, so it's safe to call on every load.
export const completeRedirectSignIn =
	async (): Promise<SignInResult | null> => {
		const result = await getRedirectResult(getClientAuth());
		if (!result?.user) {
			return null;
		}
		return completeSignIn(result.user);
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
