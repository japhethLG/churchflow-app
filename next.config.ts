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

const serviceWorkerHeaders = [
	{ key: "Content-Type", value: "application/javascript; charset=utf-8" },
	{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
	{
		key: "Content-Security-Policy",
		value: "default-src 'self'; script-src 'self'",
	},
];

const nextConfig: NextConfig = {
	output: "standalone",
	typescript: {
		ignoreBuildErrors: false,
	},
	headers: async () => [
		{ source: "/:path*", headers: securityHeaders },
		// PWA: serwist serves the SW from /serwist/sw.js via a Route Handler.
		{ source: "/serwist/sw.js", headers: serviceWorkerHeaders },
	],
};

// `withSerwist` adds esbuild to `serverExternalPackages` so Turbopack
// doesn't try to bundle the native binary into the server build.
export default withSerwist(nextConfig);
