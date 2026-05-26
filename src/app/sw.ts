/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
	interface WorkerGlobalScope extends SerwistGlobalConfig {
		__SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
	}
}

declare const self: ServiceWorkerGlobalScope;

// defaultCache already excludes `/api/` from runtime caching, which
// matters here: Bearer-gated and session-cookie-gated responses would
// otherwise get stale and the backend's 401 handling would trigger a
// global sign-out (see proxy.ts + client.ts response middleware).
const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: defaultCache,
	fallbacks: {
		entries: [
			{
				url: "/~offline",
				matcher: ({ request }) => request.destination === "document",
			},
		],
	},
});

serwist.addEventListeners();
