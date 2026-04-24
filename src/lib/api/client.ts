"use client";

import createClient, { type Middleware } from "openapi-fetch";
import { getClientAuth } from "@/lib/firebase/client";
import type { paths } from "./schema";

// Generated OpenAPI paths already include the `/api/v1` prefix, so baseUrl
// must be the host origin only. Override with NEXT_PUBLIC_API_BASE_URL for
// staging/prod.
const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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

export const api = createClient<paths>({ baseUrl });
api.use(authMiddleware);
