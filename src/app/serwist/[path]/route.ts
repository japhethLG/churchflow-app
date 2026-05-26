import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

// A precache revision lets Serwist version the offline fallback so a new
// deploy invalidates stale precached responses. `git rev-parse HEAD`
// fits because the build pipeline always has access to git; fall back
// to a random UUID otherwise.
const revision =
	spawnSync("git", ["rev-parse", "HEAD"], {
		encoding: "utf-8",
	}).stdout?.trim() || crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
	createSerwistRoute({
		swSrc: "src/app/sw.ts",
		additionalPrecacheEntries: [{ url: "/~offline", revision }],
		useNativeEsbuild: true,
	});
