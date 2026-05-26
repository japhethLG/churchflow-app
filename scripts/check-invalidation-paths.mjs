#!/usr/bin/env node
/**
 * Invalidation-coverage check.
 *
 * Verifies that every API path passed to `useApiQuery`/`useApiMutation`
 * across `src/lib/api/<entity>/**` is enumerated in that entity's
 * `keys.ts` `<ENTITY>_PATHS` array. A path queried but not listed in any
 * keys.ts means `invalidate<Entity>()` will silently skip it — the
 * exact class of bug caught in the stats-pages code review.
 *
 * Heuristics:
 * - Walks each `src/lib/api/<entity>/` folder.
 * - Extracts every literal `/api/v1/...` template string from .ts files.
 * - Reads `<ENTITY>_PATHS` (an `as const` array of literals) from
 *   `keys.ts`.
 * - Reports any queried path absent from the keys file.
 *
 * False positives (paths that show up in code but aren't real query
 * paths) can be opted-out via an inline `// invalidation-check: ignore`
 * on the same line.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(__dirname, "../src/lib/api");

const PATH_LITERAL = /["'`](\/api\/v1\/[^"'`\s]+)["'`]/g;

const findFiles = (dir, suffix) => {
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...findFiles(full, suffix));
		} else if (entry.name.endsWith(suffix)) {
			out.push(full);
		}
	}
	return out;
};

const collectPaths = (file) => {
	const src = fs.readFileSync(file, "utf8");
	const found = new Set();
	for (const line of src.split("\n")) {
		if (line.includes("invalidation-check: ignore")) {
			continue;
		}
		let m;
		// biome-ignore lint/suspicious/noAssignInExpressions: regex iteration
		while ((m = PATH_LITERAL.exec(line)) !== null) {
			found.add(m[1]);
		}
	}
	return found;
};

const collectListedPaths = (keysFile) => {
	const src = fs.readFileSync(keysFile, "utf8");
	const listed = new Set();
	let m;
	// biome-ignore lint/suspicious/noAssignInExpressions: regex iteration
	while ((m = PATH_LITERAL.exec(src)) !== null) {
		listed.add(m[1]);
	}
	return listed;
};

let failures = 0;
const entityDirs = fs
	.readdirSync(apiDir, { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.map((e) => path.join(apiDir, e.name));

for (const entityDir of entityDirs) {
	const keysFile = path.join(entityDir, "keys.ts");
	if (!fs.existsSync(keysFile)) {
		continue;
	}
	const listed = collectListedPaths(keysFile);

	const tsFiles = findFiles(entityDir, ".ts").filter(
		(f) => path.basename(f) !== "keys.ts" && path.basename(f) !== "index.ts",
	);
	const queried = new Set();
	for (const f of tsFiles) {
		for (const p of collectPaths(f)) {
			queried.add(p);
		}
	}

	// Only require paths whose URL segment matches this entity folder.
	// Cross-entity queries (e.g. members hooks fetching /transactions/)
	// are invalidated by the other entity's PATHS, not this one.
	const entityName = path.basename(entityDir);
	const ownsPath = (p) => {
		const segments = p.split("/");
		// Match /api/v1/<entity>/... or /api/v1/tenants/{tenantId}/<entity>/...
		// or /api/v1/tenants/{tenantId}/me/<entity>/...
		// or /api/v1/platform/<entity>/...
		return segments.some((s, i) => s === entityName && i > 2);
	};
	const missing = [...queried].filter(ownsPath).filter((p) => !listed.has(p));
	if (missing.length > 0) {
		failures += missing.length;
		const rel = path.relative(path.resolve(__dirname, ".."), entityDir);
		console.error(`\n[${rel}] paths queried but not in keys.ts:`);
		for (const p of missing) {
			console.error(`  - ${p}`);
		}
	}
}

if (failures > 0) {
	console.error(
		`\n${failures} unlisted path(s). Add to the entity's keys.ts so invalidate<Entity>() refreshes them.`,
	);
	process.exit(1);
}

console.log("All API paths are listed in their entity's keys.ts.");
