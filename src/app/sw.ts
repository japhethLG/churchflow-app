/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
	interface WorkerGlobalScope extends SerwistGlobalConfig {
		__SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
	}
}

declare const self: ServiceWorkerGlobalScope;

// Firebase Auth (especially signInWithRedirect) breaks if the service
// worker caches or mishandles its requests. Always go straight to the
// network — never cache — for Google/Firebase auth hosts AND our own
// self-hosted auth handler under /__/auth and /__/firebase (proxied to
// firebaseapp.com via next.config rewrites). Listed first so it wins over
// defaultCache's same-origin and cross-origin handlers.
const authPassthrough = {
	matcher: ({ url }: { url: URL }) =>
		/(^|\.)(googleapis\.com|firebaseapp\.com|google\.com|gstatic\.com|firebaseio\.com)$/.test(
			url.hostname,
		) || url.pathname.startsWith("/__/"),
	handler: new NetworkOnly(),
};

// defaultCache already excludes `/api/` from runtime caching, which
// matters here: Bearer-gated and session-cookie-gated responses would
// otherwise get stale and the backend's 401 handling would trigger a
// global sign-out (see proxy.ts + client.ts response middleware).
const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: [authPassthrough, ...defaultCache],
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
