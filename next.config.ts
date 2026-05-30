import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

// Static security headers. Per-request CSP (with nonce) lives in proxy.ts
// because the nonce has to change every request.
const securityHeaders = [
	{
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	},
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
	},
];

// PWA icons (and the logo) are static, rarely-changing brand assets that
// live under /public, so Next only gives them a short default Cache-Control.
// Pin them to a year + immutable so repeat visits / installed-app launches
// serve them from cache instead of revalidating each navigation.
const immutableAssetHeaders = [
	{ key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

const serviceWorkerHeaders = [
	{ key: "Content-Type", value: "application/javascript; charset=utf-8" },
	{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
	{
		// This CSP governs the service worker's OWN fetches, not the page's.
		// `connect-src https:` is required: the SW fetches cross-origin for
		// runtime caching (fonts/images) and passes Firebase Auth requests
		// through. Without it, the SW can only fetch same-origin and Google
		// auth calls fail with auth/network-request-failed.
		key: "Content-Security-Policy",
		value: "default-src 'self'; connect-src 'self' https:; script-src 'self'",
	},
];

// Self-host Firebase Auth's handler so signInWithRedirect is first-party.
// When NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is set to our own domain, the SDK
// hits /__/auth/* and /__/firebase/* on our origin; these rewrites proxy
// them to the project's firebaseapp.com. First-party storage means
// getRedirectResult() can read the credential after the redirect returns
// (it can't when the handler runs on the cross-origin firebaseapp.com —
// Chrome partitions its storage). Required for login inside the TWA/APK.
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseAuthHost = firebaseProjectId
	? `${firebaseProjectId}.firebaseapp.com`
	: undefined;

const nextConfig: NextConfig = {
	output: "standalone",
	typescript: {
		ignoreBuildErrors: false,
	},
	// Auto-memoize the client-heavy UI (data-dense list/dashboard pages) so
	// re-renders don't recompute on every state change. Runs via a Babel
	// plugin that Next applies only to React files through an SWC pre-pass.
	reactCompiler: true,
	experimental: {
		// Reuse a just-visited dynamic route segment's RSC payload for 30s on
		// forward re-navigation instead of refetching it (default is 0s). The
		// group-level loading.tsx makes those segments prefetchable, so this
		// turns a sidebar round-trip back into an instant client-cache hit.
		staleTimes: { dynamic: 30, static: 180 },
	},
	// Allow next/image to optimize the remote profile photos rendered by the
	// Avatar primitive (Google account avatars). Optimized + WebP/AVIF +
	// same-origin /_next/image SWR caching instead of full-size cross-origin
	// fetches. Hosts mirror the img-src allowlist in proxy.ts.
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "lh3.googleusercontent.com" },
			{ protocol: "https", hostname: "*.googleusercontent.com" },
		],
	},
	headers: async () => [
		{ source: "/:path*", headers: securityHeaders },
		// PWA: serwist serves the SW from /serwist/sw.js via a Route Handler.
		{ source: "/serwist/sw.js", headers: serviceWorkerHeaders },
		// Long-lived immutable caching for PWA icons + logo.
		{ source: "/icons/:path*", headers: immutableAssetHeaders },
		{ source: "/logo.png", headers: immutableAssetHeaders },
	],
	rewrites: async () =>
		firebaseAuthHost
			? [
					{
						source: "/__/auth/:path*",
						destination: `https://${firebaseAuthHost}/__/auth/:path*`,
					},
					{
						source: "/__/firebase/:path*",
						destination: `https://${firebaseAuthHost}/__/firebase/:path*`,
					},
				]
			: [],
};

// `withSerwist` adds esbuild to `serverExternalPackages` so Turbopack
// doesn't try to bundle the native binary into the server build.
export default withSerwist(nextConfig);
