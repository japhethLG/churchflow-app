"use client";

import createClient, { type Middleware } from "openapi-fetch";
import { getClientAuth } from "@/lib/firebase/client";
import { toApiError } from "./errors";
import type { paths } from "./schema";

// Generated OpenAPI paths already include the `/api/v1` prefix, so baseUrl
// must be the host origin only. Override with NEXT_PUBLIC_API_BASE_URL for
// staging/prod.
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";

const authMiddleware: Middleware = {
	async onRequest({ request }) {
		const auth = getClientAuth();
		// On a hard reload, Firebase restores `currentUser` asynchronously
		// from IndexedDB. Without this await the first wave of requests
		// fires before persistence has loaded and the backend returns 401
		// "Missing bearer token" — TanStack Query's retry then masks the
		// problem on the second attempt.
		await auth.authStateReady();
		const user = auth.currentUser;
		if (user) {
			const idToken = await user.getIdToken();
			request.headers.set("Authorization", `Bearer ${idToken}`);
		}
		return request;
	},
};

// Once the backend confirms the caller is unauthenticated, both halves of
// our session are stale (Firebase client + Next session cookie). Any later
// request will produce the same 401, so kick the user out once and let
// /login re-establish both halves. The flag prevents N concurrent 401s
// from stacking N redirects.
// Public paths that own their own auth state (login form, invite-accept,
// logout). A 401 from one of those is expected (e.g. lookup of a stale
// invite token) and shouldn't bounce the visitor anywhere.
const UNAUTHENTICATED_PATHS = ["/login", "/invite", "/logout"];

let signOutInFlight = false;
const handleUnauthorized = async () => {
	if (signOutInFlight) return;
	if (typeof window === "undefined") return;
	const path = window.location.pathname;
	if (UNAUTHENTICATED_PATHS.some((p) => path.startsWith(p))) return;
	signOutInFlight = true;
	try {
		await getClientAuth().signOut();
	} catch {
		// ignore — we're redirecting anyway
	}
	try {
		await fetch("/api/auth/session", { method: "DELETE" });
	} catch {
		// ignore — cookie will be cleared on next session mint
	}
	const next = encodeURIComponent(path + window.location.search);
	window.location.href = `/login?next=${next}`;
};

// Auto-refresh the Next session cookie when the backend signals that the
// caller's custom claims just changed. Avoids the "did you forget to call
// refreshSession()?" footgun on every claim-mutating endpoint.
const handleClaimsRefreshed = async () => {
	if (typeof window === "undefined") return;
	const user = getClientAuth().currentUser;
	if (!user) return;
	try {
		const idToken = await user.getIdToken(true);
		await fetch("/api/auth/session", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ idToken }),
		});
	} catch {
		// best-effort — next refresh cycle will pick up claims eventually
	}
};

// Single response middleware. Three jobs:
//   1. Unwrap the backend's `{ success, data }` envelope.
//   2. Convert non-2xx JSON bodies into ApiError so consumers don't have
//      to guess at .status / .statusCode.
//   3. React to two cross-cutting headers:
//        - X-Claims-Refreshed: re-mint the Next session cookie.
//        - 401: sign out + redirect.
const responseMiddleware: Middleware = {
	async onResponse({ response }) {
		if (response.headers.get("X-Claims-Refreshed") === "1") {
			// fire-and-forget — don't block the response
			void handleClaimsRefreshed();
		}

		const contentType = response.headers.get("content-type") ?? "";
		const isJson = contentType.includes("application/json");

		if (!response.ok) {
			if (response.status === 401) {
				void handleUnauthorized();
			}
			let body: unknown = null;
			if (isJson) {
				try {
					body = await response.clone().json();
				} catch {
					// non-JSON or parse error — fall through with null body
				}
			}
			throw toApiError(response.status, body);
		}

		if (!isJson) return response;

		try {
			const body = await response.clone().json();
			if (
				body !== null &&
				typeof body === "object" &&
				"success" in body &&
				"data" in body &&
				body.success === true
			) {
				return new Response(JSON.stringify(body.data), {
					status: response.status,
					headers: response.headers,
				});
			}
		} catch {
			// non-JSON or parse error — return original
		}
		return response;
	},
};

export const api = createClient<paths>({ baseUrl });
api.use(authMiddleware);
api.use(responseMiddleware);
