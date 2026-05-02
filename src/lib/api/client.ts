"use client";

import createClient, { type Middleware } from "openapi-fetch";
import { getClientAuth } from "@/lib/firebase/client";
import type { paths } from "./schema";

// Generated OpenAPI paths already include the `/api/v1` prefix, so baseUrl
// must be the host origin only. Override with NEXT_PUBLIC_API_BASE_URL for
// staging/prod.
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";

const authMiddleware: Middleware = {
	async onRequest({ request }) {
		const user = getClientAuth().currentUser;
		if (user) {
			const idToken = await user.getIdToken();
			request.headers.set("Authorization", `Bearer ${idToken}`);
		}
		return request;
	},
};

// The backend's GlobalResponseInterceptor wraps every response as
// { success: true, data: <actual payload> }. Unwrap it here so that
// openapi-fetch callers receive the raw DTO shape that the schema describes.
const unwrapMiddleware: Middleware = {
	async onResponse({ response }) {
		const contentType = response.headers.get("content-type") ?? "";
		if (!contentType.includes("application/json")) return response;
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
api.use(unwrapMiddleware);
