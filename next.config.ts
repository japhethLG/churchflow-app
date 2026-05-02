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

const nextConfig: NextConfig = {
	typescript: {
		ignoreBuildErrors: false,
	},
	headers: async () => [
		{
			source: "/:path*",
			headers: securityHeaders,
		},
	],
};

export default nextConfig;
