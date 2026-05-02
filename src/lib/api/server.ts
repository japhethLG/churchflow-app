import "server-only";
import { cookies } from "next/headers";
import createClient, { type Middleware } from "openapi-fetch";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { toApiError } from "./errors";
import type { paths } from "./schema";

// Server-side openapi-fetch client for use in Server Components and route
// handlers. Forwards the user's HTTP-only session cookie to the backend
// using the "SessionCookie" auth scheme — the FirebaseAuthGuard verifies
// it via Admin SDK's verifySessionCookie. RSCs cannot read an ID token
// (it's stored client-side only), and we don't want to mint one
// server-side just to call our own backend.
//
// Use from RSCs to pre-render dashboards with data instead of waterfalling
// on the client. The client middleware (api/client.ts) is still the right
// choice for interactive components — keep both.

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";

const sessionCookieMiddleware: Middleware = {
	async onRequest({ request }) {
		const store = await cookies();
		const cookie = store.get(SESSION_COOKIE_NAME)?.value;
		if (cookie) {
			request.headers.set("Authorization", `SessionCookie ${cookie}`);
		}
		return request;
	},
};

const responseMiddleware: Middleware = {
	async onResponse({ response }) {
		const contentType = response.headers.get("content-type") ?? "";
		const isJson = contentType.includes("application/json");

		if (!response.ok) {
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

export const serverApi = createClient<paths>({
	baseUrl,
	// Cookie forwarding does the auth — no need to share Next's fetch
	// cache across users.
	cache: "no-store",
});
serverApi.use(sessionCookieMiddleware);
serverApi.use(responseMiddleware);
